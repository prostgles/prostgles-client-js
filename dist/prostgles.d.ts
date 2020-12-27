import { TableHandler, DbJoinMaker } from "prostgles-types";
import { Sync, SyncOne } from "./SyncedTable";
export declare type TableHandlerClient = TableHandler & {
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
    sql?: (query: string, params?: any, options?: any) => Promise<any>;
};
export declare type Auth = {
    register?: (params: any) => Promise<any>;
    login?: (params: any) => Promise<any>;
    logout?: (params: any) => Promise<any>;
    user?: any;
};
export declare type InitOptions = {
    socket: any;
    onReady: (dbo: DBHandlerClient, methods?: any, fullSchema?: any, auth?: Auth) => any;
    onReconnect?: (socket: any) => any;
    onDisconnect?: (socket: any) => any;
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
    onUpdates: (data: object[], sync_info: any) => any | void;
};
export declare type SyncInfo = {
    id_fields: string[];
    synced_field: string;
    channelName: string;
};
export declare function prostgles(initOpts: InitOptions, syncedTable: any): Promise<unknown>;
//# sourceMappingURL=prostgles.d.ts.map