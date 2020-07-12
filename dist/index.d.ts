export declare function prostgles({ socket, isReady, onDisconnect }: {
    socket: any;
    isReady?: (dbo: any, methods: any) => void;
    onDisconnect: any;
}): Promise<unknown>;
declare type FilterFunction = (data: object) => boolean;
declare type SubscriptionSingle = {
    onChange: (data: object, delta: object) => object;
    idObj: object | FilterFunction;
};
declare type SubscriptionMulti = {
    onChange: (data: object[], delta: object) => object[];
    idObj?: object | FilterFunction;
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
    isSendingData: number;
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
    subscribeAll(onChange: any): Readonly<{
        unsubscribe: () => void;
    }>;
    subscribeOne(idObj: any, onChange: any): Readonly<{
        get: () => object;
        unsubscribe: () => void;
        delete: () => Promise<unknown>;
        update: (data: any) => void;
        updateFull: (data: any) => void;
    }>;
    notifySubscriptions: (idObj: any, newData: any, delta: any) => void;
    updateOne(idObj: any, newData: any): void;
    unsubscribe: (onChange: any) => void;
    findOne(idObj: any): object;
    getIdObj(d: any): {};
    unsync: () => void;
    matchesIdObj(idObj: any, d: any): boolean;
    deleteAll(): void;
    delete: (idObj: any) => Promise<unknown>;
    setDeleted(idObj: any, fullArray: any): void;
    getDeleted(): any;
    syncDeleted: () => Promise<boolean>;
    upsert: (data: any, from_server?: boolean) => Promise<boolean>;
    onDataChanged: (newData?: any, deletedData?: any, from_server?: boolean) => Promise<unknown>;
    setItems: (items: object[]) => void;
    getItems: (sync_info?: any) => object[];
    getBatch: (params: any, sync_info: any) => {}[];
}
export {};
//# sourceMappingURL=index.d.ts.map