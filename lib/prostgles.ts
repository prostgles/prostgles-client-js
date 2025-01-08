/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Stefan L. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type {
  AnyObject,
  ClientSchema,
  ClientSyncHandles,
  DBSchema,
  DBSchemaTable,
  DbJoinMaker,
  EqualityFilter,
  FullFilter,
  SelectReturnType,
  MethodHandler,
  SQLHandler,
  SQLResult,
  SelectParams,
  SubscribeParams,
  TableHandler,
  ViewHandler,
} from "prostgles-types";

import { CHANNELS, asName, getJoinHandlers, isEqual } from "prostgles-types";

import { type AuthHandler, setupAuth } from "./Auth";
import { getDBO } from "./getDbHandler";
import { getMethods } from "./getMethods";
import { getSqlHandler } from "./getSqlHandler";
import { getSubscriptionHandler, type Subscription } from "./getSubscriptionHandler";
import type {
  Sync,
  SyncDataItem,
  SyncOne,
  SyncOneOptions,
  SyncOptions,
  SyncedTable,
} from "./SyncedTable/SyncedTable";
import { getSyncHandler } from "./getSyncHandler";
import type { Socket } from "socket.io-client";

const DEBUG_KEY = "DEBUG_SYNCEDTABLE";
export const hasWnd = typeof window !== "undefined";
export const debug: any = function (...args: any[]) {
  if (hasWnd && (window as any)[DEBUG_KEY]) {
    (window as any)[DEBUG_KEY](...args);
  }
};

export * from "./react-hooks";
export * from "./useProstglesClient";
export { MethodHandler, SQLResult, asName };

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

export type DBHandlerClient<Schema = void> = (Schema extends DBSchema ?
  {
    [tov_name in keyof Schema]: Schema[tov_name]["is_view"] extends true ?
      ViewHandlerClient<Schema[tov_name]["columns"], Schema>
    : TableHandlerClient<Schema[tov_name]["columns"], Schema>;
  }
: Record<string, Partial<TableHandlerClient>>) & {
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
      data: OnReadyArgs;
    }
  | {
      type: "onReady.notMounted";
      data: OnReadyArgs;
    }
  | {
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
  onReady: OnReadyCallback<DBSchema>;

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
  auth: AuthHandler,
  isReconnect: boolean,
) => void | Promise<void>;

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

export function prostgles<DBSchema>(
  initOpts: InitOptions<DBSchema>,
  syncedTable: typeof SyncedTable | undefined,
) {
  const { socket, onReady, onDisconnect, onReconnect, onSchemaChange, onReload, onDebug } =
    initOpts;
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

      const auth = setupAuth({ authData: authConfig, socket, onReload });
      const { methodsObj } = getMethods({ onDebug, methods, socket });

      const { dbo } = getDBO({
        schema,
        onDebug,
        syncedTable,
        syncHandler,
        subscriptionHandler,
        socket,
        tableSchema,
      });
      if (rawSQL) {
        dbo.sql = sqlHandler.sql;
      }

      subscriptionHandler.reAttachAll();
      syncHandler.reAttachAll();

      joinTables.flat().map((table) => {
        dbo.innerJoin ??= {};
        dbo.leftJoin ??= {};
        dbo.innerJoinOne ??= {};
        dbo.leftJoinOne ??= {};
        const joinHandlers = getJoinHandlers(table);
        //@ts-ignore
        dbo.leftJoin[table] = joinHandlers.leftJoin;
        dbo.innerJoin[table] = joinHandlers.innerJoin;
        dbo.leftJoinOne[table] = joinHandlers.leftJoinOne;
        dbo.innerJoinOne[table] = joinHandlers.innerJoinOne;
      });

      (async () => {
        try {
          const onReadyArgs = { dbo, methods: methodsObj, tableSchema, auth, isReconnect };
          await onDebug?.({ type: "onReady.call", data: onReadyArgs, state });
          await onReady(
            dbo as DBHandlerClient<DBSchema>,
            methodsObj,
            tableSchema,
            auth,
            isReconnect,
          );
        } catch (err) {
          console.error("Prostgles: Error within onReady: \n", err);
          reject(err);
        }

        resolve(dbo);
      })();
    });
  });
}
