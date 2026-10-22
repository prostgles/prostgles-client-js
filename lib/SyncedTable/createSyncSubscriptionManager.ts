import type { AnyObject, NormalizedRow, SyncConfig } from "prostgles-types";
import { WAL } from "prostgles-types/dist/WAL";
import type { createSyncDataStore } from "./createSyncDataStore";
import type { createSyncStateUtils } from "./createSyncStateUtils";
import {
  quickClone,
  type $UpdateOpts,
  type ItemUpdate,
  type ItemUpdated,
  type MultiChangeListener,
  type MultiSyncHandles,
  type OnErrorHandler,
  type SingleChangeListener,
  type SingleSyncHandles,
  type SubscriptionMulti,
  type SubscriptionSingle,
  type SyncDataItem,
} from "./SyncedTable";

export const createSyncSubscriptionManager = (
  syncConfig: Omit<SyncConfig, "channelName">,
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
        .filter((s) => Object.entries(s.idObj).every(([field, value]) => newItem[field] === value))
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

  const createNotifyWal = () =>
    new WAL({
      ...syncConfig,
      batch_size: Infinity,
      throttle: 5,
      onSend: async (_, fullItems) => {
        if (state.error) return;
        _notifySubscribers(
          fullItems.map((d) => ({
            delta: store.getDelta(d.initial ?? {}, d.current),
            idObj: store.getIdObj(d.current),
            newItem: d.current,
          })),
        );
      },
    });
  let notifyWal = createNotifyWal();

  const reset = (nextSyncConfig: typeof syncConfig) => {
    syncConfig = nextSyncConfig;
    clearTimeout(notifyWal.isSendingTimeout);
    clearTimeout(notifyWal.willDeleteHistory);
    notifyWal = createNotifyWal();
  };

  const _delete = async (item: AnyObject, from_server = false) => {
    if (state.error) throw state.error;
    const idObj = store.getIdObj(store.getItem(item) ?? item);
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
    onError,
  }: {
    onChange: MultiChangeListener<AnyObject>;
    handlesOnData: boolean;
    onError: OnErrorHandler | undefined;
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
          return upsert(newData.map((d) => prepareOne(d)));
        } else {
          return upsert([prepareOne(newData)]);
        }
      },
    };

    const sub: SubscriptionMulti<AnyObject> = {
      _onChange: onChange,
      onError,
      handlesOnData,
      handles,
      notify: (_allItems, _allDeltas) => {
        let allItems = quickClone(_allItems);
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
              $cloneMultiSync: (onChange: MultiChangeListener, onError?: OnErrorHandler) =>
                sync(onChange, handlesOnData, onError),
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
    onError?: OnErrorHandler,
  ): MultiSyncHandles<T> => {
    if (state.error) throw state.error;
    const { sub, handles } = getMultiSyncSubscription.bind(this)({
      onChange: onChange as MultiChangeListener<AnyObject>,
      handlesOnData,
      onError,
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
        return upsert([{ idObj, delta: quickClone(newData), opts }]);
      },
      $cloneSync: (onChange, onError) => syncOne<T, Full>(idObj, onChange, undefined, onError),
      // TODO: add clone sync hook
      // $useCloneSync: () => {
      //   const handles = this.syncOne<T, Full>(idObj, item => {
      //     setItem()
      //   });
      //   return handles.$unsync;
      // },
      $cloneMultiSync: (onChange, onError) => sync(onChange, true, onError),
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
    onError?: OnErrorHandler,
  ): SingleSyncHandles<T, Full> => {
    if (state.error) throw state.error;
    const handles = makeSingleSyncHandles<T, Full>(idObj, onChange);
    const sub: SubscriptionSingle<T, Full> = {
      _onChange: onChange,
      onError,
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
    get notifyWal() {
      return notifyWal;
    },
    reset,
    notifyError: (error: unknown) => {
      for (const subscription of [...singleSubscriptions, ...multiSubscriptions]) {
        try {
          subscription.onError?.(error);
        } catch (callbackError) {
          console.error("Sync error callback failed:", callbackError);
        }
      }
    },
    notifyCurrentData: () => _notifySubscribers(),
  };
};
