import { FieldFilter, WAL, AnyObject, ClientSyncHandles, SyncBatchParams } from "prostgles-types";
import { DBHandlerClient } from "./prostgles";
export type POJO = {
    [key: string]: any;
};
export declare const debug: any;
export type SyncOptions = Partial<SyncedTableOptions> & {
    select?: FieldFilter;
    handlesOnData?: boolean;
};
export type SyncOneOptions = Partial<SyncedTableOptions> & {
    handlesOnData?: boolean;
};
type SyncDebugEvent = {
    type: "sync";
    tableName: string;
    command: keyof ClientSyncHandles;
    data: AnyObject;
};
/**
 * Creates a local synchronized table
 */
type OnChange<T> = (data: (SyncDataItem<Required<T>>)[], delta?: Partial<T>[]) => any;
export type Sync<T extends AnyObject, OnChangeFunc extends OnChange<T> = (data: (SyncDataItem<Required<T>>)[], delta?: Partial<T>[]) => any, Upsert extends ((newData: T[]) => any) = ((newData: T[]) => any)> = (basicFilter: Partial<T>, options: SyncOptions, onChange: OnChangeFunc, onError?: (error: any) => void) => Promise<{
    $unsync: () => void;
    $upsert: Upsert;
    getItems: () => T[];
}>;
/**
 * Creates a local synchronized record
 */
export type SyncOne<T extends AnyObject = AnyObject> = (basicFilter: Partial<T>, options: SyncOneOptions, onChange: (data: (SyncDataItem<Required<T>>), delta?: Partial<T>) => any, onError?: (error: any) => void) => Promise<SingleSyncHandles<T>>;
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
export type CloneSync<T extends AnyObject, Full extends boolean> = (onChange: SingleChangeListener<T>, onError?: (error: any) => void) => SingleSyncHandles<T, Full>;
export type CloneMultiSync<T extends AnyObject> = (onChange: MultiChangeListener<T>, onError?: (error: any) => void) => MultiSyncHandles<T>;
type $UpdateOpts = {
    deepMerge: boolean;
};
type DeepPartial<T> = T extends Array<any> ? T : T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;
/**
 * CRUD handles added if initialised with handlesOnData = true
 */
export type SingleSyncHandles<T extends AnyObject = AnyObject, Full extends boolean = false> = {
    $get: () => T;
    $find: (idObj: Partial<T>) => (T | undefined);
    $unsync: () => any;
    $delete: () => void;
    $update: <OPTS extends $UpdateOpts>(newData: OPTS extends {
        deepMerge: true;
    } ? DeepPartial<T> : Partial<T>, opts?: OPTS) => any;
    $cloneSync: CloneSync<T, Full>;
    $cloneMultiSync: CloneMultiSync<T>;
};
export type SyncDataItem<T extends AnyObject = AnyObject, Full extends boolean = false> = T & (Full extends true ? SingleSyncHandles<T, true> : Partial<SingleSyncHandles<T>>);
export type MultiSyncHandles<T extends AnyObject> = {
    $unsync: () => void;
    $upsert: (newData: T[]) => any;
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
declare const STORAGE_TYPES: {
    readonly array: "array";
    readonly localStorage: "localStorage";
    readonly object: "object";
};
export type MultiChangeListener<T extends AnyObject = AnyObject> = (items: SyncDataItem<T>[], delta: DeepPartial<T>[]) => any;
export type SingleChangeListener<T extends AnyObject = AnyObject, Full extends boolean = false> = (item: SyncDataItem<T, Full>, delta?: DeepPartial<T>) => any;
export type SyncedTableOptions = {
    name: string;
    filter?: POJO;
    onChange?: MultiChangeListener;
    onError?: (error: any) => void;
    db: any;
    pushDebounce?: number;
    skipFirstTrigger?: boolean;
    select?: "*" | {};
    storageType: keyof typeof STORAGE_TYPES;
    patchText: boolean;
    patchJSON: boolean;
    onReady: () => any;
    skipIncomingDeltaCheck?: boolean;
    onDebug?: (event: SyncDebugEvent, tbl: SyncedTable) => Promise<void>;
};
export type DbTableSync = {
    unsync: () => void;
    syncData: (data?: AnyObject[], deleted?: AnyObject[], cb?: (err?: any) => void) => void;
};
export declare class SyncedTable {
    db: DBHandlerClient;
    name: string;
    select?: "*" | {};
    filter?: POJO;
    onChange?: MultiChangeListener;
    id_fields: string[];
    synced_field: string;
    throttle: number;
    batch_size: number;
    skipFirstTrigger: boolean;
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
    items: POJO[];
    storageType: string;
    itemsObj: POJO;
    patchText: boolean;
    patchJSON: boolean;
    isSynced: boolean;
    onError: SyncedTableOptions["onError"];
    onDebug?: (evt: Omit<SyncDebugEvent, "type" | "tableName" | "channelName">) => Promise<void>;
    constructor({ name, filter, onChange, onReady, onDebug, db, skipFirstTrigger, select, storageType, patchText, patchJSON, onError }: SyncedTableOptions);
    /**
     * Will update text/json fields through patching method
     * This will send less data to server
     * @param walData
     */
    private updatePatches;
    static create(opts: SyncedTableOptions): Promise<SyncedTable>;
    /**
     * Returns a sync handler to all records within the SyncedTable instance
     * @param onChange change listener <(items: object[], delta: object[]) => any >
     * @param handlesOnData If true then $upsert and $unsync handles will be added on each data item. True by default;
     */
    sync<T extends AnyObject = AnyObject>(onChange: MultiChangeListener<T>, handlesOnData?: boolean): MultiSyncHandles<T>;
    private makeSingleSyncHandles;
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
    private _notifySubscribers;
    unsubscribe: (onChange: Function) => string;
    private getIdStr;
    private getIdObj;
    private getRowSyncObj;
    unsync: () => void;
    destroy: () => void;
    private matchesFilter;
    private matchesIdObj;
    /**
     * Returns properties that are present in {n} and are different to {o}
     * @param o current full data item
     * @param n new data item
     */
    private getDelta;
    deleteAll(): void;
    private get tableHandler();
    private delete;
    /**
     * Ensures that all object keys match valid column names
     */
    private checkItemCols;
    /**
     * Upserts data locally -> notify subs -> sends to server if required
     * synced_field is populated if data is not from server
     * @param items <{ idObj: object, delta: object }[]> Data items that changed
     * @param from_server : <boolean> If false then updates will be sent to server
     */
    upsert: (items: ItemUpdate[], from_server?: boolean) => Promise<any>;
    getItem<T = AnyObject>(idObj: Partial<T>): {
        data?: T;
        index: number;
    };
    /**
     *
     * @param item data to be inserted/updated/deleted. Must include id_fields
     * @param index (optional) index within array
     * @param isFullData
     * @param deleteItem
     */
    setItem(_item: POJO, index: number | undefined, isFullData?: boolean, deleteItem?: boolean): void;
    /**
     * Sets the current data
     * @param items data
     */
    setItems: (_items: POJO[]) => void;
    /**
     * Returns the current data ordered by synced_field ASC and matching the main filter;
     */
    getItems: <T extends AnyObject = AnyObject>() => T[];
    /**
     * Sync data request
     * @param param0: SyncBatchRequest
     */
    getBatch: ({ from_synced, to_synced, offset, limit }?: SyncBatchParams) => {
        [x: string]: any;
    }[];
}
/**
 * immutable args
 */
export default function mergeDeep(_target: any, _source: any): any;
export declare function quickClone<T>(obj: T): T;
export {};
//# sourceMappingURL=SyncedTable.d.ts.map