import { TableHandler, DbJoinMaker, AnyObject, SQLHandler, DBSchemaTable, MethodHandler, ClientSyncHandles, SQLResult, DBSchema, ViewHandler, asName, FullFilter, SubscribeParams, OnError, GetSelectReturnType, SelectParams } from "prostgles-types";
import { type Sync, type SyncOne } from "./SyncedTable";
export declare const debug: any;
export { MethodHandler, SQLResult, asName };
export * from "./react-hooks";
type OnReadyParams<DBSchema> = {
    dbo: DBHandlerClient<DBSchema>;
    methods: MethodHandler | undefined;
    tableSchema: DBSchemaTable[] | undefined;
    auth: Auth | undefined;
    isReconnect: boolean;
};
export declare const useProstglesClient: <DBSchema_1>(initOpts: InitOptions<DBSchema_1>) => OnReadyParams<DBSchema_1> | undefined;
export type ViewHandlerClient<T extends AnyObject = AnyObject, S extends DBSchema | void = void> = ViewHandler<T, S> & {
    getJoinedTables: () => string[];
    _syncInfo?: any;
    getSync?: any;
    sync?: Sync<T>;
    syncOne?: SyncOne<T>;
    _sync?: any;
    /**
     * Will return undefined while loading
     */
    useSubscribe: <SubParams extends SubscribeParams<T, S>>(filter?: FullFilter<T, S>, options?: SubParams, onError?: OnError) => GetSelectReturnType<S, SubParams, T, false>[] | undefined;
    /**
     * Will return undefined while loading
     */
    useSubscribeOne: <SubParams extends SubscribeParams<T, S>>(filter?: FullFilter<T, S>, options?: SubParams, onError?: OnError) => GetSelectReturnType<S, SubParams, T, false> | undefined;
    useFind: <P extends SelectParams<T, S>>(filter?: FullFilter<T, S>, selectParams?: P) => undefined | GetSelectReturnType<S, P, T, true>;
    useFindOne: <P extends SelectParams<T, S>>(filter?: FullFilter<T, S>, selectParams?: P) => undefined | GetSelectReturnType<S, P, T, false>;
    useCount: <P extends SelectParams<T, S>>(filter?: FullFilter<T, S>, selectParams?: P) => number | undefined;
    /**
     * Returns result size in bits
     */
    useSize: <P extends SelectParams<T, S>>(filter?: FullFilter<T, S>, selectParams?: P) => string | undefined;
};
export type TableHandlerClient<T extends AnyObject = AnyObject, S extends DBSchema | void = void> = ViewHandlerClient<T, S> & TableHandler<T, S> & {
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
type SyncDebugEvent = {
    type: "sync";
    tableName: string;
    channelName: string;
    command: keyof ClientSyncHandles;
    data: AnyObject;
};
type DebugEvent = {
    type: "table";
    command: keyof TableHandlerClient;
    tableName: string;
    data: AnyObject;
} | {
    type: "method";
    command: string;
    data: AnyObject;
} | SyncDebugEvent;
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
    onDisconnect?: () => any;
    onDebug?: (event: DebugEvent) => any;
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