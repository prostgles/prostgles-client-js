import { TableHandler, TableHandlerBasic, DbJoinMaker, TableJoinBasic, AnyObject, SQLHandler, MethodHandler } from "prostgles-types";
import { Sync, SyncOne } from "./SyncedTable";
export { MethodHandler };
export declare type TableHandlerClient<T = AnyObject> = TableHandler<T> & {
    getJoinedTables: () => string[];
    _syncInfo?: any;
    getSync?: any;
    sync?: Sync;
    syncOne?: SyncOne;
    _sync?: any;
};
export declare type TableHandlerClientBasic = TableHandlerBasic & {
    getJoinedTables: () => string[];
    _syncInfo?: any;
    getSync?: any;
    sync?: Sync;
    syncOne?: SyncOne;
    _sync?: any;
};
export declare type DBHandlerClient = {
    [key: string]: Partial<TableHandlerClient>;
} & DbJoinMaker & {
    sql?: SQLHandler;
};
export declare type DBHandlerClientBasic = {
    [key: string]: Partial<TableHandlerClientBasic>;
} & {
    innerJoin: TableJoinBasic;
    leftJoin: TableJoinBasic;
    innerJoinOne: TableJoinBasic;
    leftJoinOne: TableJoinBasic;
} & {
    /**
     *
     * @param query <string> query. e.g.: SELECT * FROM users;
     * @param params <any[] | object> query arguments to be escaped. e.g.: { name: 'dwadaw' }
     * @param options <object> { returnType: "statement" | "rows" | "noticeSubscription" }
     */
    sql?: SQLHandler;
};
export declare type Auth = {
    register?: (params: any) => Promise<any>;
    login?: (params: any) => Promise<any>;
    logout?: (params: any) => Promise<any>;
    user?: any;
};
export declare type InitOptions = {
    socket: any;
    /**
     * true by default
     */
    onSchemaChange?: false | (() => void);
    onReady: (dbo: DBHandlerClient, methods?: any, fullSchema?: any, auth?: Auth) => any;
    onReconnect?: (socket: any) => any;
    onDisconnect?: (socket: any) => any;
};
export declare type onUpdatesParams = {
    data: object[];
    isSynced: boolean;
};
export declare type SyncTriggers = {
    onSyncRequest: (params: any, sync_info: any) => {
        c_fr: object;
        c_lr: object;
        c_count: number;
    };
    onPullRequest: ({ from_synced, offset, limit }: {
        from_synced: any;
        offset: any;
        limit: any;
    }, sync_info: any) => object[];
    onUpdates: (params: onUpdatesParams, sync_info: any) => any | void;
};
export declare type SyncInfo = {
    id_fields: string[];
    synced_field: string;
    channelName: string;
};
export declare function prostgles(initOpts: InitOptions, syncedTable: any): Promise<unknown>;
//# sourceMappingURL=prostgles.d.ts.map