import type { AnyObject, NormalizedRow, SyncConfig } from "prostgles-types";
import { WAL } from "prostgles-types/dist/WAL";
import type { createSyncDataStore } from "./createSyncDataStore";
import type { createSyncStateUtils } from "./createSyncStateUtils";
import type {
  $UpdateOpts,
  ItemUpdate,
  ItemUpdated,
  MultiChangeListener,
  MultiSyncHandles,
  SingleChangeListener,
  SingleSyncHandles,
  SubscriptionMulti,
  SubscriptionSingle,
  SyncDataItem,
} from "./SyncedTable";

export const createSyncSubscriptionManager = (
  { id_fields, synced_field }: Omit<SyncConfig, "channelName">,
  store: ReturnType<typeof createSyncDataStore>,
  stateUtils: ReturnType<typeof createSyncStateUtils>,
  upsert: (items: ItemUpdate[], from_server?: boolean) => Promise<void>,
) => {
  let multiSubscriptions: SubscriptionMulti[] = [];
  let singleSubscriptions: SubscriptionSingle[] = [];

  const unsubscribe = (onChange: SingleChangeListener | MultiChangeListener) => {
    singleSubscriptions = singleSubscriptions.filter((s) => s._onChange !== onChange);
    multiSubscriptions = multiSubscriptions.filter((s) => s._onChange !== onChange);
    return "ok";
  };
  const { state, onDebug } = stateUtils;
  /**
   * Notifies multi subs with ALL data + deltas. Attaches handles on data if required
   * @param newData -> updates. Must include id_fields + updates
   */
  const _notifySubscribers = (changes: Pick<ItemUpdated, "idObj" | "newItem" | "delta">[] = []) => {
    if (!state.isSynced) {
      onDebug({ command: "notifySubscribers", data: [], info: "not synced yet" });
      return;
    } else {
      onDebug({ command: "notifySubscribers", data: changes });
    }

    /* Deleted items (changes = []) do not trigger singleSubscriptions notify because it might break things */
    const items: AnyObject[] = [],
      deltas: AnyObject[] = [],
      ids: AnyObject[] = [];
    changes.map(({ idObj, newItem, delta }) => {
      /* Single subs do not care about the filter */
      singleSubscriptions
        .filter((s) => store.matchesIdObj(s.idObj, idObj))
        .map(async (s) => {
          try {
            await s.notify(newItem, delta);
          } catch (e) {
            console.error("SyncedTable failed to notify: ", e);
          }
        });

      /* Preparing data for multi subs */
      if (store.matchesFilter(newItem)) {
        items.push(newItem);
        deltas.push(delta);
        ids.push(idObj);
      }
    });

    if (multiSubscriptions.length) {
      const allItems: AnyObject[] = [],
        allDeltas: AnyObject[] = [];
      store.getItems().map((d) => {
        allItems.push({ ...d });
        const dIdx = items.findIndex((_d) => store.matchesIdObj(d, _d));
        allDeltas.push(deltas[dIdx]!);
      });

      /* Multisubs must not forget about the original filter */
      multiSubscriptions.map(async (s) => {
        try {
          await s.notify(allItems, allDeltas);
        } catch (e) {
          console.error("SyncedTable failed to notify: ", e);
        }
      });
    }
  };

  const notifyWal = new WAL({
    id_fields,
    synced_field,
    batch_size: Infinity,
    throttle: 5,
    onSend: async (_, fullItems) => {
      _notifySubscribers(
        fullItems.map((d) => ({
          delta: store.getDelta(d.initial ?? {}, d.current),
          idObj: store.getIdObj(d.current),
          newItem: d.current,
        })),
      );
    },
  });

  const _delete = async (item: AnyObject, from_server = false) => {
    const idObj = store.getIdObj(item);
    store.setItem(idObj, true, true);
    if (!from_server) {
      await stateUtils.tableHandler.delete?.(idObj);
    }
    _notifySubscribers();
    return true;
  };

  const getMultiSyncSubscription = ({
    onChange,
    handlesOnData,
  }: {
    onChange: MultiChangeListener<AnyObject>;
    handlesOnData: boolean;
  }) => {
    const handles: MultiSyncHandles<AnyObject> = {
      $unsync: () => {
        return unsubscribe(onChange);
      },
      getItems: () => {
        return store.getItems();
      },
      $upsert: (newData) => {
        if (!(newData as any)) {
          throw "No data provided for upsert";
        }

        const prepareOne = (d: AnyObject) => {
          return {
            idObj: store.getIdObj(d),
            delta: d,
          };
        };

        if (Array.isArray(newData)) {
          upsert(newData.map((d) => prepareOne(d)));
        } else {
          upsert([prepareOne(newData)]);
        }
      },
    };

    const sub: SubscriptionMulti<AnyObject> = {
      _onChange: onChange,
      handlesOnData,
      handles,
      notify: (_allItems, _allDeltas) => {
        let allItems = [..._allItems];
        const allDeltas = [..._allDeltas];
        if (handlesOnData) {
          allItems = allItems.map((item, i) => {
            const getItem = (d: AnyObject | undefined, idObj: Partial<AnyObject>) => ({
              ...d,
              ...makeSingleSyncHandles(idObj, onChange),
              $get: () => getItem(store.getItem(idObj), idObj),
              $find: (idObject: Partial<AnyObject>) => getItem(store.getItem(idObject), idObject),
              $update: (newData: AnyObject, opts: $UpdateOpts): Promise<void> => {
                return upsert([{ idObj, delta: newData, opts }]);
              },
              $delete: async (): Promise<boolean> => {
                return _delete(idObj);
              },
              $cloneMultiSync: (onChange: MultiChangeListener) => sync(onChange, handlesOnData),
            });
            const idObj = store.getIdObj(item) as Partial<AnyObject>;
            return getItem(item, idObj);
          });
        }
        return onChange(allItems, allDeltas);
      },
    };

    return { sub, handles };
  };

  const sync = <T extends AnyObject = AnyObject>(
    onChange: MultiChangeListener<T>,
    handlesOnData = true,
  ): MultiSyncHandles<T> => {
    const { sub, handles } = getMultiSyncSubscription.bind(this)({
      onChange: onChange as MultiChangeListener<AnyObject>,
      handlesOnData,
    });

    multiSubscriptions.push(sub as any);
    setTimeout(() => {
      const items = store.getItems<T>();
      sub.notify(items, items);
    }, 0);
    return Object.freeze({ ...handles });
  };

  const makeSingleSyncHandles = <T extends AnyObject = AnyObject, Full extends boolean = false>(
    idObj: Partial<T>,
    onChange: SingleChangeListener<T, Full> | MultiChangeListener<T>,
  ): SingleSyncHandles<T, Full> => {
    const handles: SingleSyncHandles<T, Full> = {
      $get: () => store.getItem<NormalizedRow<T>>(idObj),
      $find: (idObject) => store.getItem<NormalizedRow<T>>(idObject),
      $unsync: () => {
        return unsubscribe(onChange as SingleChangeListener | MultiChangeListener);
      },
      $delete: () => {
        return _delete(idObj);
      },
      $update: (newData, opts) => {
        /* DROPPED SYNC BUG */
        if (!singleSubscriptions.length && !multiSubscriptions.length) {
          console.warn("No sync listeners");
        }
        return upsert([{ idObj, delta: newData, opts }]);
      },
      $cloneSync: (onChange) => syncOne<T, Full>(idObj, onChange),
      // TODO: add clone sync hook
      // $useCloneSync: () => {
      //   const handles = this.syncOne<T, Full>(idObj, item => {
      //     setItem()
      //   });
      //   return handles.$unsync;
      // },
      $cloneMultiSync: (onChange) => sync(onChange, true),
    };

    return handles;
  };

  /**
   * Returns a sync handler to a specific record within the SyncedTable instance
   * @param idObj object containing the target id_fields properties
   * @param onChange change listener <(item: object, delta: object) => any >
   * @param handlesOnData If true then $update, $delete and $unsync handles will be added on the data item. True by default;
   */
  const syncOne = <T extends AnyObject = AnyObject, Full extends boolean = false>(
    idObj: Partial<T>,
    onChange: SingleChangeListener<T, Full>,
    handlesOnData = true,
  ): SingleSyncHandles<T, Full> => {
    const handles = makeSingleSyncHandles<T, Full>(idObj, onChange);
    const sub: SubscriptionSingle<T, Full> = {
      _onChange: onChange,
      idObj,
      handlesOnData,
      handles,
      notify: (data, delta) => {
        const newData = { ...data } as unknown as SyncDataItem<T, { handlesOnData: Full }>;

        if (handlesOnData) {
          newData.$get = handles.$get;
          newData.$find = handles.$find;
          newData.$update = handles.$update;
          newData.$delete = handles.$delete;
          newData.$unsync = handles.$unsync;
          newData.$cloneSync = handles.$cloneSync as any;
        }
        return onChange(newData, delta);
      },
    };

    singleSubscriptions.push(sub as SubscriptionSingle);

    setTimeout(() => {
      const existingData = handles.$get();
      if (existingData) {
        sub.notify(existingData, existingData as any);
      }
    }, 0);

    return Object.freeze({ ...handles });
  };

  return {
    sync,
    syncOne,
    notifyWal,
  };
};
