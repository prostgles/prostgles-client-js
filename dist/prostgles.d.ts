import { TableHandler, DbJoinMaker, AnyObject, SubscriptionHandler, SQLHandler, DBSchemaTable, MethodHandler, SQLResult, DBSchema, ViewHandler, asName, FullFilter, SubscribeParams, OnError, GetSelectReturnType } from "prostgles-types";
import type { Sync, SyncOne } from "./SyncedTable";
export declare const debug: any;
export { MethodHandler, SQLResult, asName };
export type ViewHandlerClient<T extends AnyObject = AnyObject, S extends DBSchema | void = void> = ViewHandler<T, S> & {
    getJoinedTables: () => string[];
    _syncInfo?: any;
    getSync?: any;
    sync?: Sync<T>;
    syncOne?: SyncOne<T>;
    _sync?: any;
    subscribeHook: <SubParams extends SubscribeParams<T, S>>(filter?: FullFilter<T, S>, options?: SubParams, onError?: OnError) => {
        start: ((onChange: (items: GetSelectReturnType<S, SubParams, T, false>[]) => any) => Promise<SubscriptionHandler>);
        args: [
            filter?: FullFilter<T, S>,
            options?: SubscribeParams<T>,
            onError?: OnError
        ];
    };
    subscribeOneHook: <SubParams extends SubscribeParams<T, S>>(filter?: FullFilter<T, S>, options?: SubscribeParams<T>, onError?: OnError) => {
        start: (onChange: (item: GetSelectReturnType<S, SubParams, T, false> | undefined) => any) => Promise<SubscriptionHandler>;
        args: [
            filter?: FullFilter<T, S>,
            options?: SubscribeParams<T>,
            onError?: OnError
        ];
    };
};
export type TableHandlerClient<T extends AnyObject = AnyObject, S extends DBSchema | void = void> = TableHandler<T, S> & {
    getJoinedTables: () => string[];
    _syncInfo?: any;
    getSync?: any;
    sync?: Sync<T>;
    syncOne?: SyncOne<T>;
    _sync?: any;
};
export type DBHandlerClient<Schema = void> = (Schema extends DBSchema ? {
    [tov_name in keyof Schema]: Schema[tov_name]["is_view"] extends true ? ViewHandlerClient<Schema[tov_name]["columns"], Schema> : TableHandlerClient<Schema[tov_name]["columns"], Schema>;
} : Record<string, Partial<TableHandlerClient>>) & {
    sql?: SQLHandler;
} & DbJoinMaker;
export type Auth = {
    register?: (params: any) => Promise<any>;
    login?: (params: any) => Promise<any>;
    logout?: (params: any) => Promise<any>;
    user?: any;
};
export type InitOptions<DBSchema = void> = {
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
    onReady: (dbo: DBHandlerClient<DBSchema>, methods: MethodHandler | undefined, tableSchema: DBSchemaTable[] | undefined, auth: Auth | undefined, isReconnect: boolean) => any;
    /**
     * If not provided will fire onReady
     */
    onReconnect?: (socket: any, error?: any) => any;
    onDisconnect?: (socket: any) => any;
};
export type onUpdatesParams = {
    data: object[];
    isSynced: boolean;
};
export type SyncInfo = {
    id_fields: string[];
    synced_field: string;
    channelName: string;
};
export declare function prostgles<DBSchema>(initOpts: InitOptions<DBSchema>, syncedTable: any): Promise<unknown>;
//# sourceMappingURL=prostgles.d.ts.map