import type { AnyObject, ClientSchema, ClientSyncHandles, DBSchema, DBSchemaTable, DbJoinMaker, EqualityFilter, FullFilter, SelectReturnType, MethodHandler, SQLHandler, SQLResult, SelectParams, SubscribeParams, TableHandler, ViewHandler } from "prostgles-types";
import { asName } from "prostgles-types";
import { type AuthHandler } from "./Auth";
import type { Sync, SyncDataItem, SyncOne, SyncOneOptions, SyncOptions, SyncedTable } from "./SyncedTable/SyncedTable";
import type { Socket } from "socket.io-client";
export declare const hasWnd: boolean;
export declare const debug: any;
export * from "./react-hooks";
export * from "./useProstglesClient";
export { MethodHandler, SQLResult, asName };
export type ViewHandlerClient<T extends AnyObject = AnyObject, S extends DBSchema | void = void> = ViewHandler<T, S> & {
    getJoinedTables: () => string[];
    _syncInfo?: any;
    getSync?: any;
    sync?: Sync<T>;
    /**
     * Retrieves rows matching the filter and keeps them in sync
     * - use { handlesOnData: true } to get optimistic updates method: $update
     * - any changes to the row using the $update method will be reflected instantly
     *    to all sync subscribers that were initiated with the same syncOptions
     */
    useSync?: (basicFilter: EqualityFilter<T>, syncOptions: SyncOptions) => {
        data: undefined | SyncDataItem<Required<T>>[];
        isLoading: boolean;
        error?: any;
    };
    syncOne?: SyncOne<T>;
    /**
     * Retrieves the first row matching the filter and keeps it in sync
     * - use { handlesOnData: true } to get optimistic updates method: $update
     * - any changes to the row using the $update method will be reflected instantly
     *    to all sync subscribers that were initiated with the same syncOptions
     */
    useSyncOne?: (basicFilter: EqualityFilter<T>, syncOptions: SyncOneOptions) => {
        data: undefined | SyncDataItem<Required<T>>;
        isLoading: boolean;
        error?: any;
    };
    _sync?: any;
    /**
     * Retrieves a list of matching records from the view/table and subscribes to changes
     */
    useSubscribe: <SubParams extends SubscribeParams<T, S>>(filter?: FullFilter<T, S>, options?: SubParams) => {
        data: SelectReturnType<S, SubParams, T, true> | undefined;
        error?: any;
        isLoading: boolean;
    };
    /**
     * Retrieves a matching record from the view/table and subscribes to changes
     */
    useSubscribeOne: <SubParams extends SubscribeParams<T, S>>(filter?: FullFilter<T, S>, options?: SubParams) => {
        data: SelectReturnType<S, SubParams, T, false> | undefined;
        error?: any;
        isLoading: boolean;
    };
    /**
     * Retrieves a list of matching records from the view/table
     */
    useFind: <P extends SelectParams<T, S>>(filter?: FullFilter<T, S>, selectParams?: P) => {
        data: undefined | SelectReturnType<S, P, T, true>;
        isLoading: boolean;
        error?: any;
    };
    /**
     * Retrieves first matching record from the view/table
     */
    useFindOne: <P extends SelectParams<T, S>>(filter?: FullFilter<T, S>, selectParams?: P) => {
        data: undefined | SelectReturnType<S, P, T, false>;
        isLoading: boolean;
        error?: any;
    };
    /**
     * Returns the total number of rows matching the filter
     */
    useCount: <P extends SelectParams<T, S>>(filter?: FullFilter<T, S>, selectParams?: P) => {
        data: number | undefined;
        isLoading: boolean;
        error?: any;
    };
    /**
     * Returns result size in bits matching the filter and selectParams
     */
    useSize: <P extends SelectParams<T, S>>(filter?: FullFilter<T, S>, selectParams?: P) => {
        data: string | undefined;
        isLoading: boolean;
        error?: any;
    };
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
type OnReadyArgs = {
    dbo: DBHandlerClient | any;
    methods: MethodHandler | undefined;
    tableSchema: DBSchemaTable[] | undefined;
    auth: AuthHandler;
    isReconnect: boolean;
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
    command: "unsubscribe";
    tableName: string;
    /**
     * If defined then the server will be asked to unsubscribe
     */
    unsubChannel?: string;
} | {
    type: "table";
    command: keyof TableHandlerClient;
    tableName: string;
    data: AnyObject;
} | {
    type: "method";
    command: string;
    data: AnyObject;
} | SyncDebugEvent | {
    type: "schemaChanged";
    data: ClientSchema;
    state: "connected" | "disconnected" | "reconnected" | undefined;
} | {
    type: "onReady";
    data: OnReadyArgs;
} | {
    type: "onReady.notMounted";
    data: OnReadyArgs;
} | {
    type: "onReady.call";
    data: OnReadyArgs;
    state: "connected" | "disconnected" | "reconnected" | undefined;
};
export type InitOptions<DBSchema = void> = {
    /**
     * Socket.io client instance
     */
    socket: Socket;
    /**
     * Execute this when requesting user reload (due to session expiring authGuard)
     * Otherwise window will reload
     */
    onReload?: () => void;
    /**
     * true by default
     */
    onSchemaChange?: false | (() => void);
    /**
     * Callback called when:
     * - the client connects for the first time
     * - the schema changes
     * - the client reconnects
     * - server requests a reload
     */
    onReady: OnReadyCallback<DBSchema>;
    /**
     * Custom handler in case of websocket re-connection.
     * If not provided will fire onReady
     */
    onReconnect?: (socket: any, error?: any) => any;
    /**
     * On disconnect handler.
     * It is recommended to use this callback instead of socket.on("disconnect")
     */
    onDisconnect?: () => any;
    /**
     * Awaited debug callback.
     * Allows greater granularity during debugging.
     */
    onDebug?: (event: DebugEvent) => any;
};
type OnReadyCallback<DBSchema = void> = (
/**
 * The database handler object.
 * Only allowed tables and table methods are defined
 */
dbo: DBHandlerClient<DBSchema>, 
/**
 * Custom server-side TS methods
 */
methods: MethodHandler | undefined, 
/**
 * Table schema together with column permission details the client has access to
 */
tableSchema: DBSchemaTable[] | undefined, 
/**
 * Handlers for authentication that are configured on the server through the "auth" options
 */
auth: AuthHandler, isReconnect: boolean) => void | Promise<void>;
export type AnyFunction = (...args: any[]) => any;
export type CoreParams = {
    tableName: string;
    command: string;
    param1?: AnyObject;
    param2?: AnyObject;
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
export declare function prostgles<DBSchema>(initOpts: InitOptions<DBSchema>, syncedTable: typeof SyncedTable | undefined): Promise<unknown>;
//# sourceMappingURL=prostgles.d.ts.map