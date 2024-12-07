
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
  GetSelectReturnType,
  MethodHandler,
  SQLHandler,
  SQLResult,
  SelectParams,
  SubscribeParams,
  TableHandler,
  ViewHandler
} from "prostgles-types";

import {
  CHANNELS,
  asName,
  getJoinHandlers
} from "prostgles-types";

import { type AuthHandler, setupAuth } from "./Auth";
import { getDBO } from "./getDbHandler";
import { getMethods } from "./getMethods";
import { getSqlHandler } from "./getSqlHandler";
import { isEqual } from "./react-hooks";
import { getSubscriptionHandler } from "./getSubscriptionHandler";
import type { Sync, SyncDataItem, SyncOne, SyncOneOptions, SyncOptions, SyncedTable } from "./SyncedTable/SyncedTable";
import { getSyncHandler } from "./getSyncHandler";

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


export type ViewHandlerClient<T extends AnyObject = AnyObject, S extends DBSchema | void = void> = ViewHandler<T, S> & {
  getJoinedTables: () => string[];
  _syncInfo?: any;
  getSync?: any;
  sync?: Sync<T>;
  useSync?: (
    basicFilter: EqualityFilter<T>, 
    syncOptions: SyncOptions, 
  ) => { 
    data: undefined | SyncDataItem<Required<T>>[];
    isLoading: boolean;
    error?: any;
  };
  syncOne?: SyncOne<T>;
  useSyncOne?: (
    basicFilter: EqualityFilter<T>, 
    syncOptions: SyncOneOptions, 
  ) => {
    data: undefined | SyncDataItem<Required<T>>;
    isLoading: boolean;
    error?: any;
  };
  _sync?: any;
  useSubscribe: <SubParams extends SubscribeParams<T, S>>(
    filter?: FullFilter<T, S>, 
    options?: SubParams, 
  ) => {
    data: GetSelectReturnType<S, SubParams, T, true> | undefined;
    error?: any;
    isLoading: boolean;
  }
  useSubscribeOne: <SubParams extends SubscribeParams<T, S>>(
    filter?: FullFilter<T, S>, 
    options?: SubParams, 
  ) => {
    data: GetSelectReturnType<S, SubParams, T, false> | undefined;
    error?: any;
    isLoading: boolean;
  };
  useFind: <P extends SelectParams<T, S>>(filter?: FullFilter<T, S>, selectParams?: P) => { data: undefined | GetSelectReturnType<S, P, T, true>; isLoading: boolean; error?: any; };
  useFindOne: <P extends SelectParams<T, S>>(filter?: FullFilter<T, S>, selectParams?: P) => { data: undefined | GetSelectReturnType<S, P, T, false>; isLoading: boolean; error?: any; };
  /**
   * Returns the total number of rows matching the filter
   */
  useCount: <P extends SelectParams<T, S>>(filter?: FullFilter<T, S>, selectParams?: P) => { data: number | undefined; isLoading: boolean; error?: any; };
  /**
   * Returns result size in bits matching the filter and selectParams
   */
  useSize: <P extends SelectParams<T, S>>(filter?: FullFilter<T, S>, selectParams?: P) => { data: string | undefined; isLoading: boolean; error?: any; };
}

export type TableHandlerClient<T extends AnyObject = AnyObject, S extends DBSchema | void = void> = ViewHandlerClient<T, S> & TableHandler<T, S> & {
  getJoinedTables: () => string[];
  _syncInfo?: any;
  getSync?: any;
  sync?: Sync<T>;
  syncOne?: SyncOne<T>;
  _sync?: any;
}

export type DBHandlerClient<Schema = void> = (Schema extends DBSchema ? {
  [tov_name in keyof Schema]: Schema[tov_name]["is_view"] extends true ?
    ViewHandlerClient<Schema[tov_name]["columns"], Schema> :
    TableHandlerClient<Schema[tov_name]["columns"], Schema>
  } : 
  Record<string, Partial<TableHandlerClient>>
) & { 
  sql?: SQLHandler; 
} & DbJoinMaker;

type OnReadyArgs = {
  dbo: DBHandlerClient | any; 
  methods: MethodHandler | undefined;
  tableSchema: DBSchemaTable[] | undefined; 
  auth: AuthHandler; 
  isReconnect: boolean;
}

type SyncDebugEvent = {
  type: "sync";
  tableName: string;
  channelName: string;
  command: keyof ClientSyncHandles;
  data: AnyObject;
};
type DebugEvent = 
| {
  type: "table";
  command: "unsubscribe";
  tableName: string;
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
}
;

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
  onReady: (dbo: DBHandlerClient<DBSchema>, methods: MethodHandler | undefined, tableSchema: DBSchemaTable[] | undefined, auth: AuthHandler, isReconnect: boolean) => any;

  /**
   * If not provided will fire onReady
   */
  onReconnect?: (socket: any, error?: any) => any;
  onDisconnect?: () => any;

  onDebug?: (event: DebugEvent) => any;
}

export type AnyFunction = (...args: any[]) => any;

export type CoreParams = {
  tableName: string;
  command: string;
  param1?: AnyObject;
  param2?: AnyObject;
};

export type onUpdatesParams = { data: object[]; isSynced: boolean }

export type SyncInfo = {
  id_fields: string[],
  synced_field: string,
  channelName: string
}
type CurrentClientSchema = { 
  origin: "onReady" | "onReconnect"; 
  date: Date; 
  clientSchema: Omit<ClientSchema, "joinTables">;
};

export function prostgles<DBSchema>(initOpts: InitOptions<DBSchema>, syncedTable: typeof SyncedTable | undefined) {
  const { socket, onReady, onDisconnect, onReconnect, onSchemaChange = true, onReload, onDebug } = initOpts;
  let schemaAge: CurrentClientSchema | undefined;
  debug("prostgles", { initOpts })
  if (onSchemaChange) {
    let cb;
    if (typeof onSchemaChange === "function") {
      cb = onSchemaChange;
    }
    socket.removeAllListeners(CHANNELS.SCHEMA_CHANGED)
    if (cb) socket.on(CHANNELS.SCHEMA_CHANGED, cb)
  }

  const subscriptionHandler = getSubscriptionHandler(initOpts);
  const syncHandler = getSyncHandler(initOpts);
  const sqlHandler = getSqlHandler(initOpts);

  let state: undefined | "connected" | "disconnected" | "reconnected";


  return new Promise((resolve, reject) => {

    socket.removeAllListeners(CHANNELS.CONNECTION);
    socket.on(CHANNELS.CONNECTION, error => {
      reject(error);
      return "ok"
    });

    if (onDisconnect) {
      socket.on("disconnect", () => {
        state = "disconnected"
        onDisconnect();
      });
    }
    if(onReconnect){
      /** A reconnect will happen after the server is ready and pushed the schema */
      socket.on("connect", () => {
        if(state === "disconnected"){
          state = "reconnected"
        }
      });
    }

    /* Schema = published schema */
    socket.on(CHANNELS.SCHEMA, async (args: ClientSchema) => {
      await onDebug?.({ type: "schemaChanged", data: args, state });
      const { joinTables = [], ...clientSchema } = args;
      const { schema, methods, tableSchema, auth: authConfig, rawSQL, err } = clientSchema;

      /** Only destroy existing syncs if schema changed */
      const schemaDidNotChange = schemaAge?.clientSchema && isEqual(schemaAge.clientSchema, clientSchema)
      if(!schemaDidNotChange){
        syncHandler.destroySyncs()
          .catch(error => console.error("Error while destroying syncs", error));
      }

      if (err) {
        console.error("Error on schema change:", err)
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
        joinTables,
      });
      if(rawSQL){
        dbo.sql = sqlHandler.sql;
      }

      subscriptionHandler.reAttachAll();
      syncHandler.reAttachAll();

      joinTables.flat().map(table => {
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
          await onReady(dbo as DBHandlerClient<DBSchema>, methodsObj, tableSchema, auth, isReconnect);
        } catch (err) {
          console.error("Prostgles: Error within onReady: \n", err);
          reject(err);
        }

        resolve(dbo);

      })();
    });
  })
}
