import type {
  AnyObject,
  ClientSchema,
  ClientSyncHandles,
  DBSchema,
  DBSchemaTable,
  EqualityFilter,
  FullFilter,
  SQLHandler,
  SQLResult,
  SelectParams,
  SelectReturnType,
  ServerFunctionHandler,
  SubscribeParams,
  TableHandler,
  UserLike,
  ViewHandler,
} from "prostgles-types";

import { CHANNELS, asName, isEqual } from "prostgles-types";

import type { Socket } from "socket.io-client";
import { getAuthHandler, type AuthHandler } from "./getAuthHandler";
import { getDB } from "./getDbHandler";
import { getMethods, type ClientFunctionHandler } from "./getMethods";
import { getSqlHandler } from "./getSqlHandler";
import { getSubscriptionHandler, type Subscription } from "./getSubscriptionHandler";
import { getSyncHandler } from "./getSyncHandler";
import type {
  Sync,
  SyncDataItem,
  SyncOne,
  SyncOneOptions,
  SyncOptions,
  SyncedTable,
} from "./SyncedTable/SyncedTable";

const DEBUG_KEY = "DEBUG_SYNCEDTABLE";
export const isClientSide = typeof window !== "undefined";
export const debug: any = function (...args: any[]) {
  if (isClientSide && (window as any)[DEBUG_KEY]) {
    (window as any)[DEBUG_KEY](...args);
  }
};

export * from "./hooks/useEffectDeep";
export * from "./hooks/useProstglesClient";
export { SQLResult, ServerFunctionHandler, asName };

/**
 * Async result type:
 * - data: the expected data
 * - isLoading: true when data is being fetched (initially or on subsequent filter/option changes)
 * - error: any error that occurred
 */
export type AsyncResult<T> =
  | { data?: undefined; isLoading: true; error?: undefined }
  | { data: T; isLoading: boolean; error?: any };

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

export type ViewHandlerClient<
  T extends AnyObject = AnyObject,
  S extends DBSchema | void = void,
> = ViewHandler<T, S> & {
  /**
   * Retrieves rows matching the filter and keeps them in sync
   * - use { handlesOnData: true } to get optimistic updates method: $update
   * - any changes to the row using the $update method will be reflected instantly
   *    to all sync subscribers that were initiated with the same syncOptions
   */
  useSync?: (
    basicFilter: EqualityFilter<T>,
    syncOptions: SyncOptions,
    hookOptions?: HookOptions,
  ) => AsyncResult<SyncDataItem<Required<T>>[] | undefined>;

  sync?: Sync<T>;
  syncOne?: SyncOne<T>;

  /**
   * Retrieves the first row matching the filter and keeps it in sync
   * - use { handlesOnData: true } to get optimistic updates method: $update
   * - any changes to the row using the $update method will be reflected instantly
   *    to all sync subscribers that were initiated with the same syncOptions
   */
  useSyncOne?: (
    basicFilter: EqualityFilter<T>,
    syncOptions: SyncOneOptions,
    hookOptions?: HookOptions,
  ) => AsyncResult<SyncDataItem<Required<T>> | undefined>;

  /**
   * Used internally to setup sync
   */
  _sync?: (params: CoreParams, triggers: ClientSyncHandles) => Promise<void>;
  _syncInfo?: AnyObject;
  getSync?: AnyObject;

  /**
   * Retrieves a list of matching records from the view/table and subscribes to changes
   */
  useSubscribe: <SubParams extends SubscribeParams<T, S>>(
    filter?: FullFilter<T, S>,
    options?: SubParams,
    hookOptions?: HookOptions,
  ) => AsyncResult<SelectReturnType<S, SubParams, T, true> | undefined>;

  /**
   * Retrieves a matching record from the view/table and subscribes to changes
   */
  useSubscribeOne: <SubParams extends SubscribeParams<T, S>>(
    filter?: FullFilter<T, S>,
    options?: SubParams,
    hookOptions?: HookOptions,
  ) => AsyncResult<SelectReturnType<S, SubParams, T, false> | undefined>;

  /**
   * Retrieves a list of matching records from the view/table
   */
  useFind: <P extends SelectParams<T, S>>(
    filter?: FullFilter<T, S>,
    selectParams?: P,
    hookOptions?: HookOptions,
  ) => AsyncResult<SelectReturnType<S, P, T, true> | undefined>;

  /**
   * Retrieves first matching record from the view/table
   */
  useFindOne: <P extends SelectParams<T, S>>(
    filter?: FullFilter<T, S>,
    selectParams?: P,
    hookOptions?: HookOptions,
  ) => AsyncResult<SelectReturnType<S, P, T, false> | undefined>;

  /**
   * Returns the total number of rows matching the filter
   */
  useCount: <P extends SelectParams<T, S>>(
    filter?: FullFilter<T, S>,
    selectParams?: P,
    hookOptions?: HookOptions,
  ) => AsyncResult<number | undefined>;

  /**
   * Returns result size in bits matching the filter and selectParams
   */
  useSize: <P extends SelectParams<T, S>>(
    filter?: FullFilter<T, S>,
    selectParams?: P,
    hookOptions?: HookOptions,
  ) => AsyncResult<string | undefined>;
};

export type TableHandlerClient<
  T extends AnyObject = AnyObject,
  S extends DBSchema | void = void,
> = ViewHandlerClient<T, S> &
  TableHandler<T, S> & {
    _syncInfo?: any;
    getSync?: any;
    sync?: Sync<T>;
    syncOne?: SyncOne<T>;
    _sync?: any;
  };

export type DBHandlerClient<Schema = void> =
  Schema extends DBSchema ?
    {
      [tov_name in keyof Schema]: Schema[tov_name]["is_view"] extends true ?
        ViewHandlerClient<Schema[tov_name]["columns"], Schema>
      : TableHandlerClient<Schema[tov_name]["columns"], Schema>;
    }
  : Record<string, Partial<TableHandlerClient>>;

export type ClientOnReadyParams<
  DBSchema = void,
  FunctionHandler extends ClientFunctionHandler = ClientFunctionHandler,
  U extends UserLike = UserLike,
> = {
  /**
   * The database handler object.
   * Only allowed tables and table methods are defined
   */
  db: Partial<DBHandlerClient<DBSchema>>;
  sql: SQLHandler | undefined;
  /**
   * Server-side TS function handlers
   * Only allowed methods are defined
   */
  methods: FunctionHandler | undefined;
  methodSchema: ServerFunctionHandler | undefined;

  /**
   * Table schema with column permission details the client has access to
   */
  tableSchema: DBSchemaTable[] | undefined;
  auth: AuthHandler<U>;
  isReconnect: boolean;
  socket: Socket;
};

type SyncDebugEvent = {
  type: "sync";
  tableName: string;
  channelName: string;
  command: keyof ClientSyncHandles;
  data: AnyObject;
};
type DebugEvent =
  | {
      type: "subscriptions";
      command: "reAttachAll.start";
      subscriptions: Record<string, Subscription>;
    }
  | {
      type: "subscriptions";
      command: "reAttachAll.end";
      subscriptions: Record<string, Subscription>;
    }
  | {
      type: "table";
      command: "unsubscribe";
      tableName: string;
      handlers: AnyFunction[];
      /**
       * If defined then the server will be asked to unsubscribe
       */
      unsubChannel?: string;
    }
  | {
      type: "table";
      command: keyof TableHandlerClient;
      tableName: string;
      data: AnyObject;
    }
  | {
      type: "method";
      command: string;
      data: AnyObject;
    }
  | SyncDebugEvent
  | {
      type: "schemaChanged";
      data: ClientSchema;
      state: "connected" | "disconnected" | "reconnected" | undefined;
    }
  | {
      type: "onReady";
      data: ClientOnReadyParams;
    }
  | {
      type: "onReady.notMounted";
      data: ClientOnReadyParams;
    }
  | {
      type: "onReady.call";
      data: ClientOnReadyParams;
      state: "connected" | "disconnected" | "reconnected" | undefined;
    };

export type InitOptions<
  DBSchema = void,
  FuncSchema extends ClientFunctionHandler = ClientFunctionHandler,
  U extends UserLike = UserLike,
> = {
  /**
   * Prostgles UI host url
   */
  endpoint?: string;

  credentials?: RequestCredentials;
  redirect?: RequestRedirect;

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
  onReady: OnReadyCallback<DBSchema, FuncSchema, U>;

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

type OnReadyCallback<
  DBSchema = void,
  FuncSchema extends ClientFunctionHandler = ClientFunctionHandler,
  U extends UserLike = UserLike,
> = (onReadyParams: ClientOnReadyParams<DBSchema, FuncSchema, U>) => void | Promise<void>;

export type AnyFunction = (...args: any[]) => any;

export type CoreParams = {
  tableName: string;
  command: string;
  param1?: AnyObject;
  param2?: AnyObject;
};

export type onUpdatesParams = { data: object[]; isSynced: boolean };

export type SyncInfo = {
  id_fields: string[];
  synced_field: string;
  channelName: string;
};
type CurrentClientSchema = {
  origin: "onReady" | "onReconnect";
  date: Date;
  clientSchema: Omit<ClientSchema, "joinTables">;
};

export function prostgles<DBSchema, FuncSchema extends ClientFunctionHandler, U extends UserLike>(
  initOpts: InitOptions<DBSchema, FuncSchema, U>,
  syncedTable: typeof SyncedTable | undefined,
) {
  const {
    endpoint,
    socket,
    onReady,
    onDisconnect,
    onReconnect,
    onSchemaChange,
    onReload,
    onDebug,
    credentials,
    redirect,
  } = initOpts;
  let schemaAge: CurrentClientSchema | undefined;
  debug("prostgles", { initOpts });
  if (onSchemaChange) {
    socket.removeAllListeners(CHANNELS.SCHEMA_CHANGED);
    socket.on(CHANNELS.SCHEMA_CHANGED, onSchemaChange);
  }

  const subscriptionHandler = getSubscriptionHandler(initOpts);
  const syncHandler = getSyncHandler(initOpts);
  const sqlHandler = getSqlHandler(initOpts);

  let state: undefined | "connected" | "disconnected" | "reconnected";

  return new Promise((resolve, reject) => {
    socket.removeAllListeners("connect_error");
    socket.on("connect_error", (err) => {
      reject(err);
    });
    socket.removeAllListeners(CHANNELS.CONNECTION);
    socket.on(CHANNELS.CONNECTION, (error) => {
      reject(error);
      return "ok";
    });

    if (onDisconnect) {
      socket.on("disconnect", () => {
        state = "disconnected";
        onDisconnect();
      });
    }
    if (onReconnect) {
      /** A reconnect will happen after the server is ready and pushed the schema */
      socket.on("connect", () => {
        if (state === "disconnected") {
          state = "reconnected";
        }
      });
    }

    /* Schema = published schema */
    socket.on(CHANNELS.SCHEMA, async (args: ClientSchema) => {
      await onDebug?.({ type: "schemaChanged", data: args, state });
      const { joinTables = [], ...clientSchema } = args;
      const { schema, methods, tableSchema, auth: authConfig, rawSQL, err } = clientSchema;

      /** Only destroy existing syncs if schema changed */
      const schemaDidNotChange =
        schemaAge?.clientSchema && isEqual(schemaAge.clientSchema, clientSchema);
      if (!schemaDidNotChange) {
        syncHandler
          .destroySyncs()
          .catch((error) => console.error("Error while destroying syncs", error));
      }

      if (err) {
        console.error("Error on schema change:", err);
      }
      if ((state === "connected" || state === "reconnected") && onReconnect) {
        onReconnect(socket, err);
        if (err) {
          return;
        }
        schemaAge = { origin: "onReconnect", date: new Date(), clientSchema };
      } else {
        schemaAge = { origin: "onReady", date: new Date(), clientSchema };
      }

      if (err) {
        reject(err);
        return;
      }

      const isReconnect = state === "reconnected";
      state = "connected";

      const auth = getAuthHandler({
        authData: authConfig,
        socket,
        onReload,
        endpoint,
        credentials,
        redirect,
      }) as AuthHandler<U>;
      const { methodHandlers, methodSchema } = getMethods({ onDebug, methods, socket });

      const { db } = getDB<DBSchema>({
        schema,
        onDebug,
        syncedTable,
        syncHandler,
        subscriptionHandler,
        socket,
        tableSchema,
      });

      const sql = rawSQL ? getSqlHandler(initOpts).sql : undefined;

      subscriptionHandler.reAttachAll();
      syncHandler.reAttachAll();

      (async () => {
        try {
          const onReadyArgs = {
            db,
            sql,
            methods: methodHandlers as FuncSchema,
            methodSchema,
            tableSchema,
            auth,
            socket,
            isReconnect,
          };
          await onDebug?.({
            type: "onReady.call",
            data: onReadyArgs as ClientOnReadyParams,
            state,
          });
          await onReady(onReadyArgs);
        } catch (err) {
          console.error("Prostgles: Error within onReady: \n", err);
          reject(err);
        }

        resolve(db);
      })();
    });
  });
}
