declare type FilterFunction = (data: object) => boolean;
declare type MultiSyncHandles = {
    unsync: () => void;
    upsert: (newData: object[]) => any;
};
declare type SingleSyncHandles = {
    get: () => object;
    unsync: () => any;
    delete: () => void;
    update: (data: object) => void;
    set: (data: object) => void;
};
declare type SubscriptionSingle = {
    onChange: (data: object, delta: object) => object;
    idObj: object | FilterFunction;
    handlesOnData?: boolean;
    handles?: SingleSyncHandles;
};
declare type SubscriptionMulti = {
    onChange: (data: object[], delta: object) => object[];
    idObj?: object | FilterFunction;
    handlesOnData?: boolean;
    handles?: MultiSyncHandles;
};
export declare class SyncedTable {
    db: any;
    name: string;
    filter?: object;
    onChange: (data: object[], delta: object) => object[];
    id_fields: string[];
    synced_field: string;
    pushDebounce: number;
    skipFirstTrigger: boolean;
    isSendingData: {
        [key: string]: {
            n: object;
            o: object;
            cbs: Function[];
        };
    };
    multiSubscriptions: SubscriptionMulti[];
    singleSubscriptions: SubscriptionSingle[];
    dbSync: any;
    items: object[];
    storageType?: string;
    itemsObj: object;
    constructor({ name, filter, onChange, db, pushDebounce, skipFirstTrigger }: {
        name: any;
        filter: any;
        onChange: any;
        db: any;
        pushDebounce?: number;
        skipFirstTrigger?: boolean;
    });
    sync(onChange: any, handlesOnData?: boolean): MultiSyncHandles;
    syncOne(idObj: any, onChange: any, handlesOnData?: boolean): SingleSyncHandles;
    notifyMultiSubscriptions: (newData: object[], delta: object[]) => void;
    notifySingleSubscriptions: (idObj: any, newData: any, delta: any) => void;
    updateOne(idObj: object, newData: object): Promise<boolean>;
    unsubscribe: (onChange: any) => void;
    findOne(idObj: any): object;
    private getIdObj;
    unsync: () => void;
    private matchesIdObj;
    deleteAll(): void;
    private delete;
    private setDeleted;
    private getDeleted;
    private syncDeleted;
    upsert: (data: object | object[], delta: object | object[], from_server?: boolean) => Promise<boolean>;
    onDataChanged: (newData?: object[], delta?: object[], deletedData?: any, from_server?: boolean) => Promise<boolean>;
    setItems: (items: object[]) => void;
    getItems: (sync_info?: any) => object[];
    getBatch: (params: any) => {}[];
}
export {};
//# sourceMappingURL=SyncedTable.d.ts.map