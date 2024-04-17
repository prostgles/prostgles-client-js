import { AnyObject, ClientSyncHandles, DBSchema, DBSchemaTable, DbJoinMaker, EqualityFilter, FullFilter, GetSelectReturnType, MethodHandler, SQLHandler, SQLResult, SelectParams, SubscribeParams, TableHandler, ViewHandler, asName } from "prostgles-types";
import { SyncDataItem, SyncOneOptions, SyncOptions, SyncedTable, type Sync, type SyncOne } from "./SyncedTable/SyncedTable";
import type { ManagerOptions, SocketOptions } from "socket.io-client";
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
type HookInitOpts = Omit<InitOptions<DBSchema>, "onReady" | "socket"> & {
    socketOptions?: Partial<ManagerOptions & SocketOptions> & {
        uri?: string;
    };
    skip?: boolean;
};
type ProstglesClientState<PGC> = {
    isLoading: true;
    error?: undefined;
} | {
    isLoading: false;
    error?: undefined;
} & PGC | {
    isLoading: false;
    error: any;
};
export declare const useProstglesClient: <DBSchema_1>({ skip, socketOptions, ...initOpts }?: HookInitOpts) => ProstglesClientState<OnReadyParams<DBSchema_1>>;
export type ViewHandlerClient<T extends AnyObject = AnyObject, S extends DBSchema | void = void> = ViewHandler<T, S> & {
    getJoinedTables: () => string[];
    _syncInfo?: any;
    getSync?: any;
    sync?: Sync<T>;
    useSync?: (basicFilter: EqualityFilter<T>, syncOptions: SyncOptions) => {
        data: undefined | SyncDataItem<Required<T>>[];
        isLoading: boolean;
        error?: any;
    };
    syncOne?: SyncOne<T>;
    useSyncOne?: (basicFilter: EqualityFilter<T>, syncOptions: SyncOneOptions) => {
        data: undefined | SyncDataItem<Required<T>>;
        isLoading: boolean;
        error?: any;
    };
    _sync?: any;
    useSubscribe: <SubParams extends SubscribeParams<T, S>>(filter?: FullFilter<T, S>, options?: SubParams) => {
        data: GetSelectReturnType<S, SubParams, T, true> | undefined;
        error?: any;
        isLoading: boolean;
    };
    useSubscribeOne: <SubParams extends SubscribeParams<T, S>>(filter?: FullFilter<T, S>, options?: SubParams) => {
        data: GetSelectReturnType<S, SubParams, T, false> | undefined;
        error?: any;
        isLoading: boolean;
    };
    useFind: <P extends SelectParams<T, S>>(filter?: FullFilter<T, S>, selectParams?: P) => {
        data: undefined | GetSelectReturnType<S, P, T, true>;
        isLoading: boolean;
        error?: any;
    };
    useFindOne: <P extends SelectParams<T, S>>(filter?: FullFilter<T, S>, selectParams?: P) => {
        data: undefined | GetSelectReturnType<S, P, T, false>;
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
export declare function prostgles<DBSchema>(initOpts: InitOptions<DBSchema>, syncedTable: typeof SyncedTable): Promise<unknown>;
//# sourceMappingURL=prostgles.d.ts.map