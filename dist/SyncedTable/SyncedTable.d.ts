import type { AnyObject, EqualityFilter, FieldFilter, NormalizedRow, SyncBatchParams, TableHandler } from "prostgles-types";
import { WAL } from "prostgles-types";
import type { DBHandlerClient, SyncDebugEvent } from "../prostgles";
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
export type OnChange<T extends Record<string, unknown>, Opts extends SyncOptions> = (data: SyncDataItem<T, Opts>[], delta?: Partial<T>[]) => any;
export type SyncHandler<T> = {
    $unsync: () => void;
    $upsert: (newData: T[]) => void | Promise<void>;
    getItems: () => T[];
};
export type Sync<T extends AnyObject = AnyObject> = <TD extends T, Opts extends SyncOptions>(basicFilter: EqualityFilter<TD>, options: SyncOptions, onChange: OnChange<TD, Opts>, onError?: OnErrorHandler) => Promise<SyncHandler<TD>>;
export type OnchangeOne<T extends Record<string, unknown>, Opts extends SyncOptions> = (data: SyncDataItem<NormalizedRow<T>, Opts>, delta?: Partial<NormalizedRow<T>>) => void | Promise<void>;
/**
 * Creates a local synchronized record
 */
export type SyncOne<T extends AnyObject = AnyObject> = <TD extends T, Opts extends SyncOptions>(basicFilter: Partial<TD>, options: Opts, onChange: OnchangeOne<TD, Opts>, onError?: OnErrorHandler) => Promise<SingleSyncHandles<TD, Opts["handlesOnData"]>>;
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
export type CloneSync<T extends AnyObject, Full extends boolean | undefined> = (onChange: SingleChangeListener<T, Full>, onError?: (error: any) => void) => SingleSyncHandles<T, Full>;
export type CloneMultiSync<T extends AnyObject> = (onChange: MultiChangeListener<T>, onError?: (error: any) => void) => MultiSyncHandles<T>;
export type $UpdateOpts = {
    deepMerge: boolean;
};
type DeepPartial<T> = T extends Array<any> ? T : T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;
/**
 * CRUD handles added if initialised with handlesOnData = true
 */
export type SingleSyncHandles<T extends AnyObject = AnyObject, Full extends boolean | undefined = false> = {
    $get: () => NormalizedRow<T> | undefined;
    $find: (idObj: Partial<NormalizedRow<T>>) => NormalizedRow<T> | undefined;
    $unsync: () => void;
    $delete: () => void;
    $update: <OPTS extends $UpdateOpts>(newData: OPTS extends {
        deepMerge: true;
    } ? DeepPartial<T> : Partial<T>, opts?: OPTS) => Promise<void>;
    $cloneSync: CloneSync<T, Full>;
    $cloneMultiSync: CloneMultiSync<T>;
};
type PickFieldFilterFields<T extends AnyObject, F extends SyncOptions["select"]> = F extends "" ? Record<string, never> : F extends Record<string, 1> ? Pick<T, keyof F & string> : F extends Record<string, 0> ? Omit<T, keyof F> : T;
export type SyncDataItem<T extends AnyObject, Opts extends Pick<SyncOptions, "handlesOnData" | "select">> = PickFieldFilterFields<NormalizedRow<T>, Opts["select"]> & (Opts["handlesOnData"] extends true ? SingleSyncHandles<NormalizedRow<T>, Opts["handlesOnData"]> : Partial<SingleSyncHandles<NormalizedRow<T>, Opts["handlesOnData"]>>);
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
export type MultiChangeListener<T extends AnyObject = AnyObject> = (items: NormalizedRow<T>[], delta: DeepPartial<T>[]) => any;
export type SingleChangeListener<T extends AnyObject = AnyObject, Full extends boolean | undefined = false> = (item: SyncDataItem<T, {
    handlesOnData: Full;
}>, delta?: DeepPartial<T>) => any;
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
export declare class SyncedTable {
    db: DBHandlerClient | Partial<DBHandlerClient>;
    name: string;
    select?: "*" | AnyObject;
    filter?: EqualityFilter<AnyObject>;
    id_fields: string[];
    synced_field: string;
    throttle: number;
    batch_size: number;
    columns: {
        name: string;
        data_type: string;
    }[];
    wal?: WAL;
    notifyWal?: WAL;
    _multiSubscriptions: SubscriptionMulti[];
    _singleSubscriptions: SubscriptionSingle[];
    /**
     * add debug mode to fix sudden no data and sync listeners bug
     */
    set multiSubscriptions(mSubs: SubscriptionMulti[]);
    get multiSubscriptions(): SubscriptionMulti[];
    set singleSubscriptions(sSubs: SubscriptionSingle[]);
    get singleSubscriptions(): SubscriptionSingle[];
    dbSync?: DbTableSync;
    itemsMap: Map<string, AnyObject>;
    isSynced: boolean;
    onError: SyncedTableOptions["onError"];
    onDebug?: (evt: Omit<SyncDebugEvent, "type" | "tableName" | "channelName" | "syncedTable">) => Promise<void> | void;
    constructor({ name, filter, onReady, onDebug, db, select, onError, }: SyncedTableOptions);
    static create(opts: Omit<SyncedTableOptions, "onReady">): Promise<SyncedTable>;
    /**
     * Returns a sync handler to all records within the SyncedTable instance
     * @param onChange change listener <(items: object[], delta: object[]) => any >
     * @param handlesOnData If true then $upsert and $unsync handles will be added on each data item. True by default;
     */
    sync<T extends AnyObject = AnyObject>(onChange: MultiChangeListener<T>, handlesOnData?: boolean): MultiSyncHandles<T>;
    makeSingleSyncHandles<T extends AnyObject = AnyObject, Full extends boolean = false>(idObj: Partial<T>, onChange: SingleChangeListener<T, Full> | MultiChangeListener<T>): SingleSyncHandles<T, Full>;
    /**
     * Returns a sync handler to a specific record within the SyncedTable instance
     * @param idObj object containing the target id_fields properties
     * @param onChange change listener <(item: object, delta: object) => any >
     * @param handlesOnData If true then $update, $delete and $unsync handles will be added on the data item. True by default;
     */
    syncOne<T extends AnyObject = AnyObject, Full extends boolean = false>(idObj: Partial<T>, onChange: SingleChangeListener<T, Full>, handlesOnData?: boolean): SingleSyncHandles<T, Full>;
    /**
     * Notifies multi subs with ALL data + deltas. Attaches handles on data if required
     * @param newData -> updates. Must include id_fields + updates
     */
    _notifySubscribers: (changes?: Pick<ItemUpdated, "idObj" | "newItem" | "delta">[]) => void;
    unsubscribe: (onChange: SingleChangeListener | MultiChangeListener) => string;
    getIdStr(d: AnyObject): string;
    getIdObj(d: AnyObject): AnyObject;
    getRowSyncObj(d: AnyObject): AnyObject;
    unsync: () => void;
    destroy: () => void;
    matchesFilter(item: AnyObject | undefined): boolean;
    matchesIdObj(a: AnyObject | undefined, b: AnyObject | undefined): boolean;
    /**
     * Returns properties that are present in {n} and are different to {o}
     * @param o current full data item
     * @param n new data item
     */
    getDelta(o: AnyObject, n: AnyObject): AnyObject;
    deleteAll(): void;
    get tableHandler(): Pick<TableHandler, "update" | "updateBatch" | "delete"> | undefined;
    delete: (item: AnyObject, from_server?: boolean) => Promise<boolean>;
    /**
     * Ensures that all object keys match valid column names
     */
    checkItemCols: (item: AnyObject) => void;
    /**
     * Upserts data locally -> notify subs -> sends to server if required
     * synced_field is populated if data is not from server
     * @param items <{ idObj: object, delta: object }[]> Data items that changed
     * @param from_server : <boolean> If false then updates will be sent to server
     */
    upsert: (items: ItemUpdate[], from_server?: boolean) => Promise<void>;
    getItem<T = AnyObject>(idObj: Partial<T>): T | undefined;
    /**
     *
     * @param item data to be inserted/updated/deleted. Must include id_fields
     * @param index (optional) index within array
     * @param isFullData
     * @param deleteItem
     */
    setItem(_item: AnyObject, isFullData?: boolean, deleteItem?: boolean): void;
    /**
     * Sets the current data
     */
    setItems: (_items: AnyObject[]) => void;
    /**
     * Returns the current data ordered by synced_field ASC and matching the main filter;
     */
    getItems: <T extends AnyObject = AnyObject>() => T[];
    /**
     * Sync data request
     */
    getBatch: ({ from_synced, to_synced, offset, limit }?: SyncBatchParams) => {
        [x: string]: any;
    }[];
}
export declare const mergeDeep: (_target: Record<string, unknown> | undefined, _source: Record<string, unknown> | undefined) => {
    [x: string]: unknown;
};
export declare const quickClone: <T>(obj: T) => T;
export {};
//# sourceMappingURL=SyncedTable.d.ts.map