import { FieldFilter, WAL } from "prostgles-types";
export declare type POJO = {
    [key: string]: any;
};
export declare type SyncOptions = Partial<SyncedTableOptions> & {
    select?: FieldFilter;
    handlesOnData?: boolean;
};
export declare type SyncOneOptions = Partial<SyncedTableOptions> & {
    handlesOnData?: boolean;
};
/**
 * Creates a local synchronized table
 */
export declare type Sync = <T = any>(basicFilter: any, options: SyncOptions, onChange: (data: (SyncDataItems & T)[], delta?: Partial<T>[]) => any) => Promise<MultiSyncHandles>;
/**
 * Creates a local synchronized record
 */
export declare type SyncOne = <T = any>(basicFilter: any, options: SyncOneOptions, onChange: (data: (SyncDataItem & T), delta?: Partial<T>) => any) => Promise<SingleSyncHandles>;
export declare type SyncBatchRequest = {
    from_synced?: string | number;
    to_synced?: string | number;
    offset: number;
    limit: number;
};
export declare type ItemUpdate = {
    idObj: any;
    delta: any;
};
export declare type ItemUpdated = ItemUpdate & {
    oldItem: any;
    newItem: any;
    status: "inserted" | "updated" | "deleted";
    from_server: boolean;
};
/**
 * CRUD handles added if initialised with handlesOnData = true
 */
export declare type SyncDataItems = POJO & {
    $update?: (newData: POJO) => any;
    $delete?: () => any;
};
/**
 * CRUD handles added if initialised with handlesOnData = true
 * A single data item can also be unsynced
 */
export declare type SyncDataItem = SyncDataItems & {
    $unsync?: () => any;
};
export declare type MultiSyncHandles = {
    unsync: () => void;
    upsert: (newData: POJO[]) => any;
};
export declare type SingleSyncHandles = {
    get: () => POJO;
    unsync: () => any;
    delete: () => void;
    update: (data: POJO) => void;
};
export declare type SubscriptionSingle = {
    _onChange: (data: POJO, delta: POJO) => POJO;
    notify: (data: POJO, delta: POJO) => POJO;
    idObj: POJO;
    handlesOnData?: boolean;
    handles?: SingleSyncHandles;
};
export declare type SubscriptionMulti = {
    _onChange: (data: POJO[], delta: POJO[]) => POJO[];
    notify: (data: POJO[], delta: POJO[]) => POJO[];
    idObj?: POJO;
    handlesOnData?: boolean;
    handles?: MultiSyncHandles;
};
export declare type MultiChangeListener = (items: SyncDataItems[], delta: POJO[]) => any;
export declare type SingleChangeListener = (item: SyncDataItem, delta: POJO) => any;
export declare type SyncedTableOptions = {
    name: string;
    filter?: POJO;
    onChange?: MultiChangeListener;
    db: any;
    pushDebounce?: number;
    skipFirstTrigger?: boolean;
    select?: "*" | {};
    storageType: string;
    patchText: boolean;
    patchJSON: boolean;
    onReady: () => any;
};
export declare class SyncedTable {
    db: any;
    name: string;
    select?: "*" | {};
    filter?: POJO;
    onChange: (data: POJO[], delta: POJO) => POJO[];
    id_fields: string[];
    synced_field: string;
    throttle: number;
    batch_size: number;
    skipFirstTrigger: boolean;
    columns: {
        name: string;
        data_type: string;
    }[];
    wal: WAL;
    _multiSubscriptions: SubscriptionMulti[];
    _singleSubscriptions: SubscriptionSingle[];
    /**
     * add debug mode to fix sudden no data and sync listeners bug
     */
    set multiSubscriptions(mSubs: SubscriptionMulti[]);
    get multiSubscriptions(): SubscriptionMulti[];
    set singleSubscriptions(sSubs: SubscriptionSingle[]);
    get singleSubscriptions(): SubscriptionSingle[];
    dbSync: any;
    items: POJO[];
    storageType: string;
    itemsObj: POJO;
    patchText: boolean;
    patchJSON: boolean;
    isSynced: boolean;
    constructor({ name, filter, onChange, onReady, db, skipFirstTrigger, select, storageType, patchText, patchJSON }: SyncedTableOptions);
    private updatePatches;
    static create(opts: SyncedTableOptions): Promise<SyncedTable>;
    /**
     * Returns a sync handler to all records within the SyncedTable instance
     * @param onChange change listener <(items: object[], delta: object[]) => any >
     * @param handlesOnData If true then $upsert and $unsync handles will be added on each data item. False by default;
     */
    sync(onChange: MultiChangeListener, handlesOnData?: boolean): MultiSyncHandles;
    /**
     * Returns a sync handler to a specific record within the SyncedTable instance
     * @param idObj object containing the target id_fields properties
     * @param onChange change listener <(item: object, delta: object) => any >
     * @param handlesOnData If true then $update, $delete and $unsync handles will be added on the data item. False by default;
     */
    syncOne(idObj: POJO, onChange: SingleChangeListener, handlesOnData?: boolean): SingleSyncHandles;
    /**
     * Notifies multi subs with ALL data + deltas. Attaches handles on data if required
     * @param newData -> updates. Must include id_fields + updates
     */
    private notifySubscribers;
    unsubscribe: (onChange: any) => void;
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
    private delete;
    /**
     * Upserts data locally -> notify subs -> sends to server if required
     * synced_field is populated if data is not from server
     * @param items <{ idObj: object, delta: object }[]> Data items that changed
     * @param from_server : <boolean> If false then updates will be sent to server
     */
    upsert: (items: ItemUpdate[], from_server?: boolean) => Promise<any>;
    getItem(idObj: POJO): {
        data?: POJO;
        index: number;
    };
    /**
     *
     * @param item data to be inserted/updated/deleted. Must include id_fields
     * @param index (optional) index within array
     * @param isFullData
     * @param deleteItem
     */
    setItem(item: POJO, index: number, isFullData?: boolean, deleteItem?: boolean): void;
    /**
     * Sets the current data
     * @param items data
     */
    setItems: (items: POJO[]) => void;
    /**
     * Returns the current data ordered by synced_field ASC and matching the main filter;
     */
    getItems: () => POJO[];
    /**
     * Sync data request
     * @param param0: SyncBatchRequest
     */
    getBatch: ({ from_synced, to_synced, offset, limit }?: SyncBatchRequest) => {
        [x: string]: any;
    }[];
}
//# sourceMappingURL=SyncedTable.d.ts.map