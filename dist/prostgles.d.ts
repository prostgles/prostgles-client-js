import type { AnyObject, ClientSchema, ClientSyncHandles, DBSchema, DBSchemaTable, DbJoinMaker, EqualityFilter, FullFilter, SelectReturnType, MethodHandler, SQLHandler, SQLResult, SelectParams, SubscribeParams, TableHandler, ViewHandler, UserLike } from "prostgles-types";
import { asName } from "prostgles-types";
import { type AuthHandler } from "./getAuthHandler";
import { type Subscription } from "./getSubscriptionHandler";
import type { Sync, SyncDataItem, SyncOne, SyncOneOptions, SyncOptions, SyncedTable } from "./SyncedTable/SyncedTable";
import type { Socket } from "socket.io-client";
export declare const isClientSide: boolean;
export declare const debug: any;
export * from "./hooks/useEffectDeep";
export * from "./hooks/useProstglesClient";
export { MethodHandler, SQLResult, asName };
/**
 * Async result type:
 * - data: the expected data
 * - isLoading: true when data is being fetched (initially or on subsequent filter/option changes)
 * - error: any error that occurred
 */
export type AsyncResult<T> = {
    data?: undefined;
    isLoading: true;
    error?: undefined;
} | {
    data: T;
    isLoading: boolean;
    error?: any;
};
export type HookOptions = {
    /**
     * Used to prevent the hook from fetching data
     */
    skip?: boolean;
    /**
     * Used to trigger re-fetching
     */
    deps?: any[];
};
export type ViewHandlerClient<T extends AnyObject = AnyObject, S extends DBSchema | void = void> = ViewHandler<T, S> & {
    /**
     * Retrieves rows matching the filter and keeps them in sync
     * - use { handlesOnData: true } to get optimistic updates method: $update
     * - any changes to the row using the $update method will be reflected instantly
     *    to all sync subscribers that were initiated with the same syncOptions
     */
    useSync?: (basicFilter: EqualityFilter<T>, syncOptions: SyncOptions, hookOptions?: HookOptions) => AsyncResult<SyncDataItem<Required<T>>[] | undefined>;
    sync?: Sync<T>;
    syncOne?: SyncOne<T>;
    /**
     * Retrieves the first row matching the filter and keeps it in sync
     * - use { handlesOnData: true } to get optimistic updates method: $update
     * - any changes to the row using the $update method will be reflected instantly
     *    to all sync subscribers that were initiated with the same syncOptions
     */
    useSyncOne?: (basicFilter: EqualityFilter<T>, syncOptions: SyncOneOptions, hookOptions?: HookOptions) => AsyncResult<SyncDataItem<Required<T>> | undefined>;
    /**
     * Used internally to setup sync
     */
    _sync?: (params: CoreParams, triggers: ClientSyncHandles) => Promise<void>;
    _syncInfo?: AnyObject;
    getSync?: AnyObject;
    /**
     * Retrieves a list of matching records from the view/table and subscribes to changes
     */
    useSubscribe: <SubParams extends SubscribeParams<T, S>>(filter?: FullFilter<T, S>, options?: SubParams, hookOptions?: HookOptions) => AsyncResult<SelectReturnType<S, SubParams, T, true> | undefined>;
    /**
     * Retrieves a matching record from the view/table and subscribes to changes
     */
    useSubscribeOne: <SubParams extends SubscribeParams<T, S>>(filter?: FullFilter<T, S>, options?: SubParams, hookOptions?: HookOptions) => AsyncResult<SelectReturnType<S, SubParams, T, false> | undefined>;
    /**
     * Retrieves a list of matching records from the view/table
     */
    useFind: <P extends SelectParams<T, S>>(filter?: FullFilter<T, S>, selectParams?: P, hookOptions?: HookOptions) => AsyncResult<SelectReturnType<S, P, T, true> | undefined>;
    /**
     * Retrieves first matching record from the view/table
     */
    useFindOne: <P extends SelectParams<T, S>>(filter?: FullFilter<T, S>, selectParams?: P, hookOptions?: HookOptions) => AsyncResult<SelectReturnType<S, P, T, false> | undefined>;
    /**
     * Returns the total number of rows matching the filter
     */
    useCount: <P extends SelectParams<T, S>>(filter?: FullFilter<T, S>, selectParams?: P, hookOptions?: HookOptions) => AsyncResult<number | undefined>;
    /**
     * Returns result size in bits matching the filter and selectParams
     */
    useSize: <P extends SelectParams<T, S>>(filter?: FullFilter<T, S>, selectParams?: P, hookOptions?: HookOptions) => AsyncResult<string | undefined>;
};
export type TableHandlerClient<T extends AnyObject = AnyObject, S extends DBSchema | void = void> = ViewHandlerClient<T, S> & TableHandler<T, S> & {
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
    type: "subscriptions";
    command: "reAttachAll.start";
    subscriptions: Record<string, Subscription>;
} | {
    type: "subscriptions";
    command: "reAttachAll.end";
    subscriptions: Record<string, Subscription>;
} | {
    type: "table";
    command: "unsubscribe";
    tableName: string;
    handlers: AnyFunction[];
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
export type InitOptions<DBSchema = void, U extends UserLike = UserLike> = {
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
     * Callback called when schema changes.
     * "onReady" will be called after this callback
     */
    onSchemaChange?: () => void;
    /**
     * Callback called when:
     * - the client connects for the first time
     * - the schema changes
     * - the client reconnects
     * - server requests a reload
     */
    onReady: OnReadyCallback<DBSchema, U>;
    /**
     * Custom handler in case of websocket re-connection.
     * If not provided will fire onReady
     */
    onReconnect?: (socket: any, error?: any) => void;
    /**
     * On disconnect handler.
     * It is recommended to use this callback instead of socket.on("disconnect")
     */
    onDisconnect?: () => void;
    /**
     * Awaited debug callback.
     * Allows greater granularity during debugging.
     */
    onDebug?: (event: DebugEvent) => void | Promise<void>;
};
type OnReadyCallback<DBSchema = void, U extends UserLike = UserLike> = (
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
auth: AuthHandler<U>, isReconnect: boolean) => void | Promise<void>;
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