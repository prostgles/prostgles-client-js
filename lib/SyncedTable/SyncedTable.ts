import type {
  AnyObject,
  ClientSyncHandles,
  ClientSyncInfo,
  EqualityFilter,
  FieldFilter,
  NormalizedRow,
  SyncBatchParams,
  TableHandler,
  WALItem,
} from "prostgles-types";
import {
  getKeys,
  getSyncChannelName,
  isDefined,
  isEmpty,
  isEqual,
  isObject,
  WAL,
} from "prostgles-types";
import type { DBHandlerClient, SyncDebugEvent } from "../prostgles";
import { getMultiSyncSubscription } from "./getMultiSyncSubscription";

const hasWnd = typeof window !== "undefined";

type OmittedSyncProps = "onDebug" | "name" | "filter" | "db" | "onError";

export type SyncOptions = Partial<Omit<SyncedTableOptions, OmittedSyncProps>> & {
  select?: FieldFilter;
  handlesOnData?: boolean;
};
export type SyncOneOptions = Partial<Omit<SyncedTableOptions, OmittedSyncProps>> & {
  handlesOnData?: boolean;
};

export type OnErrorHandler = (error: any) => void;

/**
 * Creates a local synchronized table
 */
export type OnChange<T extends Record<string, unknown>, Opts extends SyncOptions> = (
  data: SyncDataItem<T, Opts>[],
  delta?: Partial<T>[],
) => any;

export type SyncHandler<T> = {
  $unsync: () => void;
  $upsert: (newData: T[]) => void | Promise<void>;
  getItems: () => T[];
};

export type Sync<T extends AnyObject = AnyObject> = <TD extends T, Opts extends SyncOptions>(
  basicFilter: EqualityFilter<TD>,
  options: SyncOptions,
  onChange: OnChange<TD, Opts>,
  onError?: OnErrorHandler,
) => Promise<SyncHandler<TD>>;

export type OnchangeOne<T extends Record<string, unknown>, Opts extends SyncOptions> = (
  data: SyncDataItem<NormalizedRow<T>, Opts>,
  delta?: Partial<NormalizedRow<T>>,
) => void | Promise<void>;

/**
 * Creates a local synchronized record
 */
export type SyncOne<T extends AnyObject = AnyObject> = <TD extends T, Opts extends SyncOptions>(
  basicFilter: Partial<TD>,
  options: Opts,
  onChange: OnchangeOne<TD, Opts>,
  onError?: OnErrorHandler,
) => Promise<SingleSyncHandles<TD, Opts["handlesOnData"]>>;

export type SyncBatchRequest = {
  from_synced?: string | number;
  to_synced?: string | number;
  offset: number;
  limit: number;
};

export type ItemUpdate = {
  idObj: AnyObject;
  delta: AnyObject;
  opts?: $UpdateOpts;
};
export type ItemUpdated = ItemUpdate & {
  oldItem: any;
  newItem: any;
  status: "inserted" | "updated" | "deleted" | "unchanged";
  from_server: boolean;
};

export type CloneSync<T extends AnyObject, Full extends boolean | undefined> = (
  onChange: SingleChangeListener<T, Full>,
  onError?: (error: any) => void,
) => SingleSyncHandles<T, Full>;

export type CloneMultiSync<T extends AnyObject> = (
  onChange: MultiChangeListener<T>,
  onError?: (error: any) => void,
) => MultiSyncHandles<T>;

export type $UpdateOpts = {
  deepMerge: boolean;
};
type DeepPartial<T> =
  T extends Array<any> ? T
  : T extends object ?
    {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

/**
 * CRUD handles added if initialised with handlesOnData = true
 */
export type SingleSyncHandles<
  T extends AnyObject = AnyObject,
  Full extends boolean | undefined = false,
> = {
  $get: () => NormalizedRow<T> | undefined;
  $find: (idObj: Partial<NormalizedRow<T>>) => NormalizedRow<T> | undefined;
  $unsync: () => void;
  $delete: () => void;
  $update: <OPTS extends $UpdateOpts>(
    newData: OPTS extends { deepMerge: true } ? DeepPartial<T> : Partial<T>,
    opts?: OPTS,
  ) => Promise<void>;
  $cloneSync: CloneSync<T, Full>;
  $cloneMultiSync: CloneMultiSync<T>;
};

type PickFieldFilterFields<T extends AnyObject, F extends SyncOptions["select"]> =
  F extends "" ? Record<string, never>
  : F extends Record<string, 1> ? Pick<T, keyof F & string>
  : F extends Record<string, 0> ? Omit<T, keyof F>
  : T;

export type SyncDataItem<
  T extends AnyObject,
  Opts extends Pick<SyncOptions, "handlesOnData" | "select">,
> = PickFieldFilterFields<NormalizedRow<T>, Opts["select"]> &
  (Opts["handlesOnData"] extends true ? SingleSyncHandles<NormalizedRow<T>, Opts["handlesOnData"]>
  : Partial<SingleSyncHandles<NormalizedRow<T>, Opts["handlesOnData"]>>);

export type MultiSyncHandles<T extends AnyObject> = {
  $unsync: () => void;
  $upsert: (newData: NormalizedRow<T>[]) => any;
  getItems: () => AnyObject[];
};

export type SubscriptionSingle<T extends AnyObject = AnyObject, Full extends boolean = false> = {
  _onChange: SingleChangeListener<T, Full>;
  notify: (data: T, delta?: DeepPartial<T>) => T;
  idObj: Partial<T>;
  handlesOnData?: boolean;
  handles?: SingleSyncHandles<T, Full>;
};
export type SubscriptionMulti<T extends AnyObject = AnyObject> = {
  _onChange: MultiChangeListener<T>;
  notify: (data: T[], delta: DeepPartial<T>[]) => T[];
  idObj?: Partial<T>;
  handlesOnData?: boolean;
  handles?: MultiSyncHandles<T>;
};

export type MultiChangeListener<T extends AnyObject = AnyObject> = (
  items: NormalizedRow<T>[],
  delta: DeepPartial<T>[],
) => any;
export type SingleChangeListener<
  T extends AnyObject = AnyObject,
  Full extends boolean | undefined = false,
> = (item: SyncDataItem<T, { handlesOnData: Full }>, delta?: DeepPartial<T>) => any;

export type SyncedTableOptions = {
  /**
   * Table name
   */
  name: string;

  /**
   * Basic filter
   */
  filter?: EqualityFilter<AnyObject>;

  /**
   * Data change listener.
   * Called on first sync and every time the data changes
   */
  onChange?: MultiChangeListener;
  onError?: OnErrorHandler;
  db: DBHandlerClient | Partial<DBHandlerClient>;

  select?: "*" | AnyObject;

  onReady: () => void;
  onDebug?: (event: SyncDebugEvent, tbl: SyncedTable) => Promise<void> | void;
};

export type DbTableSync = {
  unsync: () => void;
  syncData: (data?: AnyObject[], deleted?: AnyObject[], cb?: (err?: any) => void) => void;
};

export class SyncedTable {
  db: DBHandlerClient | Partial<DBHandlerClient>;
  name: string;
  select?: "*" | AnyObject;
  filter?: EqualityFilter<AnyObject>;
  id_fields: string[];
  synced_field: string;
  throttle = 100;
  batch_size = 50;

  columns: { name: string; data_type: string }[] = [];

  wal?: WAL;

  notifyWal?: WAL;

  _multiSubscriptions: SubscriptionMulti[] = [];
  _singleSubscriptions: SubscriptionSingle[] = [];

  /**
   * add debug mode to fix sudden no data and sync listeners bug
   */
  set multiSubscriptions(mSubs: SubscriptionMulti[]) {
    this._multiSubscriptions = mSubs.slice(0);
  }
  get multiSubscriptions(): SubscriptionMulti[] {
    return this._multiSubscriptions;
  }

  set singleSubscriptions(sSubs: SubscriptionSingle[]) {
    this._singleSubscriptions = sSubs.slice(0);
  }
  get singleSubscriptions(): SubscriptionSingle[] {
    return this._singleSubscriptions;
  }

  dbSync?: DbTableSync;
  itemsMap = new Map<string, AnyObject>();
  isSynced = false;
  onError: SyncedTableOptions["onError"];
  onDebug?: (
    evt: Omit<SyncDebugEvent, "type" | "tableName" | "channelName" | "syncedTable">,
  ) => Promise<void> | void;

  constructor({
    name,
    filter = {},
    onReady,
    onDebug,
    db,
    select = "*",
    onError,
  }: SyncedTableOptions) {
    this.name = name;
    this.filter = filter;
    this.select = select;

    if (onDebug) {
      this.onDebug = (evt) =>
        onDebug(
          {
            ...evt,
            type: "sync",
            tableName: name,
            channelName: getSyncChannelName({ filter, select, tableName: name }),
            syncedTable: this,
          },
          this,
        );
      this.onDebug({ command: "create", data: { name, filter, select } });
    }

    const tableHandler = db[name];
    if (!tableHandler) throw `${name} table not found in db`;
    this.db = db;

    const { _sync, _syncInfo } = tableHandler;
    if (!_sync || !_syncInfo) throw `${name} table does not support sync`;
    const { id_fields, synced_field, throttle = 100, batch_size = 50 } = _syncInfo;
    if (!id_fields.length || !synced_field) throw "id_fields/synced_field missing";
    this.id_fields = id_fields;
    this.synced_field = synced_field;
    this.batch_size = batch_size;
    this.throttle = throttle;

    this.multiSubscriptions = [];
    this.singleSubscriptions = [];

    this.onError =
      onError ||
      function (err) {
        console.error("Sync internal error: ", err);
      };

    const onSyncRequest: ClientSyncHandles["onSyncRequest"] = (syncBatchParams) => {
        let clientSyncInfo: ClientSyncInfo = { c_lr: undefined, c_fr: undefined, c_count: 0 };

        const batch = this.getBatch(syncBatchParams);
        if (batch.length) {
          clientSyncInfo = {
            c_fr: this.getRowSyncObj(batch[0]!),
            c_lr: this.getRowSyncObj(batch[batch.length - 1]!),
            c_count: batch.length,
          };
        }

        this.onDebug?.({ command: "onUpdates", data: { syncBatchParams, batch, clientSyncInfo } });
        return clientSyncInfo;
      },
      onPullRequest = async (syncBatchParams: SyncBatchParams) => {
        // if(this.getDeleted().length){
        //     await this.syncDeleted();
        // }
        const data = this.getBatch(syncBatchParams);
        await this.onDebug?.({ command: "onPullRequest", data: { syncBatchParams, data } });
        return { data };
      },
      onUpdates: ClientSyncHandles["onUpdates"] = async (onUpdatesParams) => {
        await this.onDebug?.({ command: "onUpdates", data: { onUpdatesParams } });
        if ("err" in onUpdatesParams && onUpdatesParams.err) {
          this.onError?.(onUpdatesParams.err);
        } else if ("isSynced" in onUpdatesParams && onUpdatesParams.isSynced && !this.isSynced) {
          this.isSynced = onUpdatesParams.isSynced;
          const items = this.getItems().map((d) => ({ ...d }));
          this.setItems([]);
          const updateItems = items.map((d) => ({
            idObj: this.getIdObj(d),
            delta: { ...d },
          }));
          await this.upsert(updateItems, true);
        } else if ("data" in onUpdatesParams) {
          /* Delta left empty so we can prepare it here */
          const updateItems = onUpdatesParams.data.map((d) => {
            return {
              idObj: this.getIdObj(d),
              delta: d,
            };
          });
          await this.upsert(updateItems, true);
        } else {
          console.error("Unexpected onUpdates");
        }

        return true;
      };

    const opts = {
      id_fields,
      synced_field,
      throttle,
    };

    _sync(filter, { select }, { onSyncRequest, onPullRequest, onUpdates }).then(
      (s: DbTableSync) => {
        this.dbSync = s;

        function confirmExit() {
          return "Data may be lost. Are you sure?";
        }

        /**
         * Some syncs can be read only. Any changes are local
         */
        this.wal = new WAL({
          ...opts,
          batch_size,
          onSendStart: () => {
            if (hasWnd) window.onbeforeunload = confirmExit;
          },
          onSend: async (data, walData) => {
            const _data = walData.map((d) => d.current);
            if (!_data.length) return [];
            return this.dbSync!.syncData(data);
          }, //, deletedData);,
          onSendEnd: () => {
            if (hasWnd) window.onbeforeunload = null;
          },
        });

        this.notifyWal = new WAL({
          ...opts,
          batch_size: Infinity,
          throttle: 5,
          onSend: async (items, fullItems) => {
            this._notifySubscribers(
              fullItems.map((d) => ({
                delta: this.getDelta(d.initial ?? {}, d.current),
                idObj: this.getIdObj(d.current),
                newItem: d.current,
              })),
            );
          },
        });

        onReady();
      },
    );

    if (tableHandler.getColumns) {
      tableHandler.getColumns().then((cols) => {
        this.columns = cols;
      });
    }
  }

  static create(opts: Omit<SyncedTableOptions, "onReady">): Promise<SyncedTable> {
    return new Promise((resolve, reject) => {
      try {
        const res = new SyncedTable({
          ...opts,
          onReady: () => {
            setTimeout(() => {
              resolve(res);
            }, 0);
          },
          onError: (err) => {
            console.error("Sync internal error: ", err);
            reject(err);
          },
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Returns a sync handler to all records within the SyncedTable instance
   * @param onChange change listener <(items: object[], delta: object[]) => any >
   * @param handlesOnData If true then $upsert and $unsync handles will be added on each data item. True by default;
   */
  sync<T extends AnyObject = AnyObject>(
    onChange: MultiChangeListener<T>,
    handlesOnData = true,
  ): MultiSyncHandles<T> {
    const { sub, handles } = getMultiSyncSubscription.bind(this)({
      onChange: onChange as MultiChangeListener<AnyObject>,
      handlesOnData,
    });

    this.multiSubscriptions.push(sub as any);
    setTimeout(() => {
      const items = this.getItems<T>();
      sub.notify(items, items);
    }, 0);
    return Object.freeze({ ...handles });
  }

  makeSingleSyncHandles<T extends AnyObject = AnyObject, Full extends boolean = false>(
    idObj: Partial<T>,
    onChange: SingleChangeListener<T, Full> | MultiChangeListener<T>,
  ): SingleSyncHandles<T, Full> {
    const handles: SingleSyncHandles<T, Full> = {
      $get: () => this.getItem<NormalizedRow<T>>(idObj),
      $find: (idObject) => this.getItem<NormalizedRow<T>>(idObject),
      $unsync: () => {
        return this.unsubscribe(onChange as SingleChangeListener | MultiChangeListener);
      },
      $delete: () => {
        return this.delete(idObj);
      },
      $update: (newData, opts) => {
        /* DROPPED SYNC BUG */
        if (!this.singleSubscriptions.length && !this.multiSubscriptions.length) {
          console.warn("No sync listeners");
        }
        return this.upsert([{ idObj, delta: newData, opts }]);
      },
      $cloneSync: (onChange) => this.syncOne<T, Full>(idObj, onChange),
      // TODO: add clone sync hook
      // $useCloneSync: () => {
      //   const handles = this.syncOne<T, Full>(idObj, item => {
      //     setItem()
      //   });
      //   return handles.$unsync;
      // },
      $cloneMultiSync: (onChange) => this.sync(onChange, true),
    };

    return handles;
  }

  /**
   * Returns a sync handler to a specific record within the SyncedTable instance
   * @param idObj object containing the target id_fields properties
   * @param onChange change listener <(item: object, delta: object) => any >
   * @param handlesOnData If true then $update, $delete and $unsync handles will be added on the data item. True by default;
   */
  syncOne<T extends AnyObject = AnyObject, Full extends boolean = false>(
    idObj: Partial<T>,
    onChange: SingleChangeListener<T, Full>,
    handlesOnData = true,
  ): SingleSyncHandles<T, Full> {
    const handles = this.makeSingleSyncHandles<T, Full>(idObj, onChange);
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

    this.singleSubscriptions.push(sub as any);

    setTimeout(() => {
      const existingData = handles.$get();
      if (existingData) {
        sub.notify(existingData, existingData as any);
      }
    }, 0);

    return Object.freeze({ ...handles });
  }

  /**
   * Notifies multi subs with ALL data + deltas. Attaches handles on data if required
   * @param newData -> updates. Must include id_fields + updates
   */
  _notifySubscribers = (changes: Pick<ItemUpdated, "idObj" | "newItem" | "delta">[] = []) => {
    if (!this.isSynced) {
      this.onDebug?.({ command: "notifySubscribers", data: [], info: "not synced yet" });
      return;
    } else {
      this.onDebug?.({ command: "notifySubscribers", data: changes });
    }

    /* Deleted items (changes = []) do not trigger singleSubscriptions notify because it might break things */
    const items: AnyObject[] = [],
      deltas: AnyObject[] = [],
      ids: AnyObject[] = [];
    changes.map(({ idObj, newItem, delta }) => {
      /* Single subs do not care about the filter */
      this.singleSubscriptions
        .filter((s) => this.matchesIdObj(s.idObj, idObj))
        .map(async (s) => {
          try {
            await s.notify(newItem, delta);
          } catch (e) {
            console.error("SyncedTable failed to notify: ", e);
          }
        });

      /* Preparing data for multi subs */
      if (this.matchesFilter(newItem)) {
        items.push(newItem);
        deltas.push(delta);
        ids.push(idObj);
      }
    });

    if (this.multiSubscriptions.length) {
      const allItems: AnyObject[] = [],
        allDeltas: AnyObject[] = [];
      this.getItems().map((d) => {
        allItems.push({ ...d });
        const dIdx = items.findIndex((_d) => this.matchesIdObj(d, _d));
        allDeltas.push(deltas[dIdx]!);
      });

      /* Multisubs must not forget about the original filter */
      this.multiSubscriptions.map(async (s) => {
        try {
          await s.notify(allItems, allDeltas);
        } catch (e) {
          console.error("SyncedTable failed to notify: ", e);
        }
      });
    }
  };

  unsubscribe = (onChange: SingleChangeListener | MultiChangeListener) => {
    this.singleSubscriptions = this.singleSubscriptions.filter((s) => s._onChange !== onChange);
    this.multiSubscriptions = this.multiSubscriptions.filter((s) => s._onChange !== onChange);
    return "ok";
  };

  getIdStr(d: AnyObject) {
    return this.id_fields
      .sort()
      .map((key) => `${d[key] || ""}`)
      .join(".");
  }
  getIdObj(d: AnyObject) {
    const res: AnyObject = {};
    this.id_fields.sort().map((key) => {
      res[key] = d[key];
    });
    return res;
  }
  getRowSyncObj(d: AnyObject): AnyObject {
    const res: AnyObject = {};
    [this.synced_field, ...this.id_fields].sort().map((key) => {
      res[key] = d[key];
    });
    return res;
  }

  unsync = () => {
    this.dbSync?.unsync();
  };

  destroy = () => {
    this.unsync();
    this.multiSubscriptions = [];
    this.singleSubscriptions = [];
    this.itemsMap.clear();
  };

  matchesFilter(item: AnyObject | undefined) {
    return Boolean(
      item &&
        (!this.filter ||
          isEmpty(this.filter) ||
          !Object.keys(this.filter).find((k) => this.filter![k] !== item[k])),
    );
  }
  matchesIdObj(a: AnyObject | undefined, b: AnyObject | undefined) {
    return Boolean(a && b && !this.id_fields.sort().find((k) => a[k] !== b[k]));
  }

  // TODO:  offline-first deletes if allow_delete = true
  // setDeleted(idObj, fullArray){
  //     let deleted: object[] = [];

  //     if(fullArray) deleted = fullArray;
  //     else {
  //         deleted = this.getDeleted();
  //         deleted.push(idObj);
  //     }
  //     if(hasWnd) window.localStorage.setItem(this.name + "_$$psql$$_deleted", <any>deleted);
  // }
  // getDeleted(){
  //     const delStr = if(hasWnd) window.localStorage.getItem(this.name + "_$$psql$$_deleted") || '[]';
  //     return JSON.parse(delStr);
  // }
  // syncDeleted = async () => {
  //     try {
  //         await Promise.all(this.getDeleted().map(async idObj => {
  //             return this.db[this.name].delete(idObj);
  //         }));
  //         this.setDeleted(null, []);
  //         return true;
  //     } catch(e){
  //         throw e;
  //     }
  // }

  /**
   * Returns properties that are present in {n} and are different to {o}
   * @param o current full data item
   * @param n new data item
   */
  getDelta(o: AnyObject, n: AnyObject): AnyObject {
    if (isEmpty(o)) return { ...n };
    return Object.fromEntries(
      Object.entries({ ...n })
        .filter(([k]) => !this.id_fields.includes(k))
        .map(([k, v]) => {
          if (!isEqual(v, o[k])) {
            const vClone =
              isObject(v) ? { ...v }
              : Array.isArray(v) ? v.slice(0)
              : v;
            return [k, vClone];
          }
        })
        .filter(isDefined),
    );
  }

  deleteAll() {
    this.getItems().map((d) => this.delete(d));
  }

  get tableHandler(): Pick<TableHandler, "update" | "updateBatch" | "delete"> | undefined {
    const tblHandler = this.db[this.name];
    if (tblHandler?.update && tblHandler.updateBatch) {
      return tblHandler as any;
    }

    return undefined;
  }

  delete = async (item: AnyObject, from_server = false) => {
    const idObj = this.getIdObj(item);
    this.setItem(idObj, true, true);
    if (!from_server && this.tableHandler?.delete) {
      await this.tableHandler.delete(idObj);
    }
    this._notifySubscribers();
    return true;
  };

  /**
   * Ensures that all object keys match valid column names
   */
  checkItemCols = (item: AnyObject) => {
    if (this.columns.length) {
      const badCols = Object.keys({ ...item }).filter(
        (k) => !this.columns.find((c) => c.name === k),
      );
      if (badCols.length) {
        throw `Unexpected columns in sync item update: ` + badCols.join(", ");
      }
    }
  };

  /**
   * Upserts data locally -> notify subs -> sends to server if required
   * synced_field is populated if data is not from server
   * @param items <{ idObj: object, delta: object }[]> Data items that changed
   * @param from_server : <boolean> If false then updates will be sent to server
   */
  upsert = async (items: ItemUpdate[], from_server = false): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if ((!items || !items.length) && !from_server) throw "No data provided for upsert";

    /* If data has been deleted then wait for it to sync with server before continuing */
    // if(from_server && this.getDeleted().length){
    //     await this.syncDeleted();
    // }

    const results: ItemUpdated[] = [];
    let status: ItemUpdated["status"];
    const walItems: WALItem[] = [];
    await Promise.all(
      items.map(async (item, i) => {
        // let d = { ...item.idObj, ...item.delta };
        const idObj = { ...item.idObj };
        let delta = { ...item.delta };

        /* Convert undefined to null because:
          1) JSON.stringify drops these keys
          2) Postgres does not have undefined
      */
        Object.keys(delta).map((k) => {
          if (delta[k] === undefined) delta[k] = null;
        });

        if (!from_server) {
          this.checkItemCols({ ...item.delta, ...item.idObj });
        }

        const oldItem = this.getItem(idObj);

        /* Calc delta if missing or if from server */
        if ((from_server || isEmpty(delta)) && !isEmpty(oldItem)) {
          delta = this.getDelta(oldItem || {}, delta);
        }

        /* Add synced if local update */
        /** Will need to check client clock shift */
        if (!from_server) {
          delta[this.synced_field] = Date.now();
        }

        let newItem = { ...oldItem, ...delta, ...idObj };
        if (oldItem && !from_server) {
          /**
           * Merge deep
           */
          if (item.opts?.deepMerge) {
            newItem = mergeDeep({ ...oldItem, ...idObj }, { ...delta });
          }
        }

        /* Update existing -> Expecting delta */
        if (oldItem) {
          status =
            oldItem[this.synced_field] < newItem[this.synced_field] ? "updated" : "unchanged";

          /* Insert new item */
        } else {
          status = "inserted";
        }

        this.setItem(newItem);

        // if(!status) throw "changeInfo status missing"
        const changeInfo: ItemUpdated = { idObj, delta, oldItem, newItem, status, from_server };

        // const idStr = this.getIdStr(idObj);
        /* IF Local updates then Keep any existing oldItem to revert to the earliest working item */
        if (!from_server) {
          /* Patch server data if necessary and update separately to account for errors */
          // let updatedWithPatch = false;
          // if(this.columns && this.columns.length && (this.patchText || this.patchJSON)){
          //     // const jCols = this.columns.filter(c => c.data_type === "json")
          //     const txtCols = this.columns.filter(c => c.data_type === "text");
          //     if(this.patchText && txtCols.length && this.db[this.name].update){
          //         let patchedDelta;
          //         txtCols.map(c => {
          //             if(c.name in changeInfo.delta){
          //                 patchedDelta = patchedDelta || {
          //                     ...changeInfo.delta,
          //                 }
          //                 patchedDelta[c.name] = getTextPatch(changeInfo.oldItem[c.name], changeInfo.delta[c.name]);
          //             }
          //         });
          //         if(patchedDelta){
          //             try {
          //                 await this.db[this.name].update(idObj, patchedDelta);
          //                 updatedWithPatch = true;
          //             } catch(e) {
          //                 console.log("failed to patch update", e)
          //             }

          //         }
          //         // console.log("json-stable-stringify ???")
          //     }
          // }

          walItems.push({
            initial: oldItem,
            current: { ...newItem },
          });
        }
        if (!isEmpty(changeInfo.delta)) {
          results.push(changeInfo);
        }

        /* TODO: Deletes from server */
        // if(allow_deletes){
        //     items = this.getItems();
        // }

        return true;
      }),
    ).catch((err) => {
      console.error("SyncedTable failed upsert: ", err);
    });

    this.notifyWal?.addData(results.map((d) => ({ initial: d.oldItem, current: d.newItem })));

    /* Push to server */
    if (!from_server && walItems.length) {
      this.wal?.addData(walItems);
    }
  };

  /* Returns an item by idObj from the local store */
  getItem<T = AnyObject>(idObj: Partial<T>): T | undefined {
    const d = this.itemsMap.get(this.getIdStr(idObj)) as T | undefined;

    return quickClone(d);
  }

  /**
   *
   * @param item data to be inserted/updated/deleted. Must include id_fields
   * @param index (optional) index within array
   * @param isFullData
   * @param deleteItem
   */
  setItem(_item: AnyObject, isFullData = false, deleteItem = false) {
    const item = quickClone(_item);

    const id = this.getIdStr(item);
    if (deleteItem) {
      this.itemsMap.delete(id);
    } else {
      const existing = this.itemsMap.get(id) ?? {};
      this.itemsMap.set(id, isFullData ? { ...item } : { ...existing, ...item });
    }
  }

  /**
   * Sets the current data
   */
  setItems = (_items: AnyObject[]): void => {
    const items = quickClone(_items);

    this.itemsMap = new Map(
      items.map((item) => {
        const id = this.getIdStr(item);
        return [id, { ...item }];
      }),
    );
  };

  /**
   * Returns the current data ordered by synced_field ASC and matching the main filter;
   */
  getItems = <T extends AnyObject = AnyObject>(): T[] => {
    let items: T[] = [];

    items = Array.from(this.itemsMap.values()).map((d) => ({ ...(d as T) }));

    const syncFields = [this.synced_field, ...this.id_fields.sort()];
    items = items
      .filter((d) => {
        return !this.filter || !getKeys(this.filter).find((key) => d[key] !== this.filter![key]);
      })
      .sort((a, b) =>
        syncFields
          .map(
            (key) =>
              (a[key] < b[key] ? -1
              : a[key] > b[key] ? 1
              : 0) as any,
          )
          .find((v) => v),
      );

    return quickClone(items);
  };

  /**
   * Sync data request
   */
  getBatch = (
    { from_synced, to_synced, offset, limit }: SyncBatchParams = { offset: 0, limit: undefined },
  ) => {
    const items = this.getItems();
    let res = items
      .map((c) => ({ ...c }))
      .filter(
        (c) =>
          (!Number.isFinite(from_synced) || +c[this.synced_field] >= +from_synced!) &&
          (!Number.isFinite(to_synced) || +c[this.synced_field] <= +to_synced!),
      );

    if (offset || limit) {
      res = res.splice(offset ?? 0, limit || res.length);
    }
    return res;
  };
}

export const mergeDeep = (
  _target: Record<string, unknown> | undefined,
  _source: Record<string, unknown> | undefined,
) => {
  const target = _target ? quickClone(_target) : _target;
  const source = _source ? quickClone(_source) : _source;
  const output = isObject(target) ? { ...target } : {};
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((sourceKey) => {
      const sourceValue = source[sourceKey];
      const targetValue = target[sourceKey];

      if (isObject(sourceValue) && isObject(targetValue)) {
        output[sourceKey] = mergeDeep(targetValue, sourceValue);
      } else {
        output[sourceKey] = quickClone(sourceValue);
      }
    });
  }
  return output;
};

export const quickClone = <T>(obj: T): T => {
  if (hasWnd && "structuredClone" in window && typeof window.structuredClone === "function") {
    return window.structuredClone(obj);
  }
  if (Array.isArray(obj)) {
    return obj.slice(0).map((v) => quickClone(v)) as any;
  } else if (isObject(obj)) {
    const result = {} as any;
    getKeys(obj).map((k) => {
      result[k] = quickClone(obj[k]) as any;
    });
    return result;
  }

  return obj;
};
