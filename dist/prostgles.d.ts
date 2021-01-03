import { TableHandler, DbJoinMaker, SQLOptions } from "prostgles-types";
import { Sync, SyncOne } from "./SyncedTable";
export declare type TableHandlerClient = TableHandler & {
    getJoinedTables: () => string[];
    _syncInfo?: any;
    getSync?: any;
    sync?: Sync;
    syncOne?: SyncOne;
    _sync?: any;
};
export declare type SQLResultRows = (any | {
    [key: string]: any;
})[];
export declare type SQLResult = {
    command: "SELECT" | "UPDATE" | "DELETE" | "CREATE" | "ALTER";
    rowCount: number;
    rows: SQLResultRows;
    fields: {
        name: string;
        dataType: string;
        tableName?: string;
    }[];
    duration: number;
};
export declare type DBHandlerClient = {
    [key: string]: Partial<TableHandlerClient>;
} & DbJoinMaker & {
    /**
     *
     * @param query <string> query. e.g.: SELECT * FROM users;
     * @param params <any[] | object> query arguments to be escaped. e.g.:
     * @param options <object> options: justRows: true will return only the resulting rows. statement: true will return the parsed SQL query.
     */
    sql?: <T = any | SQLResult | SQLResultRows | string>(query: string, args?: any | any[], options?: SQLOptions) => Promise<T>;
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