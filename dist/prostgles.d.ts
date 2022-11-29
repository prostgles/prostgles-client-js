import { TableHandler, TableHandlerBasic, DbJoinMaker, TableJoinBasic, AnyObject, SQLHandler, DBSchemaTable, MethodHandler, SQLResult, DBSchema, ViewHandler, asName } from "prostgles-types";
import type { Sync, SyncOne } from "./SyncedTable";
export declare const debug: any;
export { MethodHandler, SQLResult, asName };
export declare type TableHandlerClient<T extends AnyObject = AnyObject, S = void> = TableHandler<T, S> & {
    getJoinedTables: () => string[];
    _syncInfo?: any;
    getSync?: any;
    sync?: Sync<T>;
    syncOne?: SyncOne<T>;
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
export declare type DBHandlerClient<Tables extends Record<string, Record<string, any>> = Record<string, any>> = {
    [key in keyof Tables]: Partial<TableHandlerClient<Tables[key]>>;
} & DbJoinMaker & {
    sql?: SQLHandler;
};
export declare type DBOFullyTyped<Schema = void> = Schema extends DBSchema ? {
    [tov_name in keyof Schema]: Schema[tov_name]["is_view"] extends true ? ViewHandler<Schema[tov_name]["columns"], Schema> : TableHandlerClient<Schema[tov_name]["columns"], Schema>;
} : DBHandlerClient;
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
     * Execute this when requesting user reload (due to session expiring authGuard)
     * Otherwise window will reload
     */
    onReload?: () => void;
    /**
     * true by default
     */
    onSchemaChange?: false | (() => void);
    onReady: (dbo: DBHandlerClient, methods: MethodHandler | undefined, tableSchema: DBSchemaTable[] | undefined, auth: Auth | undefined, isReconnect: boolean) => any;
    /**
     * If not provided will fire onReady
     */
    onReconnect?: (socket: any, error?: any) => any;
    onDisconnect?: (socket: any) => any;
};
export declare type onUpdatesParams = {
    data: object[];
    isSynced: boolean;
};
export declare type SyncInfo = {
    id_fields: string[];
    synced_field: string;
    channelName: string;
};
export declare function prostgles(initOpts: InitOptions, syncedTable: any): Promise<unknown>;
//# sourceMappingURL=prostgles.d.ts.map