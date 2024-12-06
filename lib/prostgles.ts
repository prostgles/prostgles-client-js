
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
  getJoinHandlers,
  getKeys,
  isObject,
  omitKeys,
} from "prostgles-types";

import { type AuthHandler, setupAuth } from "./Auth";
import { FunctionQueuer } from "./FunctionQueuer";
import { isEqual, useFetch, useSubscribe, useSync } from "./react-hooks";
import { SQL } from "./SQL";
import { getSubscriptionHandler } from "./subscriptionHandler";
import type { DbTableSync, Sync, SyncDataItem, SyncOne, SyncOneOptions, SyncOptions, SyncedTable } from "./SyncedTable/SyncedTable";
import { getSyncHandler } from "./syncHandler";

const DEBUG_KEY = "DEBUG_SYNCEDTABLE";
export const hasWnd = typeof window !== "undefined";
export const debug: any = function (...args: any[]) {
  if (hasWnd && (window as any)[DEBUG_KEY]) {
    (window as any)[DEBUG_KEY](...args);
  }
};

export { MethodHandler, SQLResult, asName };
export * from "./react-hooks";
export * from "./useProstglesClient";


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

  const preffix = CHANNELS._preffix;


  //@ts-ignore
  const subscriptionHandler = getSubscriptionHandler(initOpts);
  const syncHandler = getSyncHandler(initOpts);

  let state: undefined | "connected" | "disconnected" | "reconnected";
  const sql = new SQL();


  return new Promise((resolve, reject) => {

    socket.removeAllListeners(CHANNELS.CONNECTION)
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
      await onDebug?.({ type: "schemaChanged", data: args });
      const { joinTables = [], ...clientSchema } = args;
      const { schema, methods, tableSchema, auth: authConfig, rawSQL, err } = clientSchema;

      /** Only destroy existing syncs if schema changed */
      const schemaDidNotChange = schemaAge?.clientSchema && isEqual(schemaAge.clientSchema, clientSchema)
      if(!schemaDidNotChange){
        await syncHandler.destroySyncs();
      }

      if ((state === "connected" || state === "reconnected") && onReconnect) {
        onReconnect(socket, err);
        if (err) {
          console.error(err)
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

      const dbo: Partial<DBHandlerClient> = JSON.parse(JSON.stringify(schema));
      const _methods: typeof methods = JSON.parse(JSON.stringify(methods));
      let methodsObj: MethodHandler = {};

      const auth = setupAuth({ authData: authConfig, socket, onReload }); 

      _methods.map(method => {
        /** New method def */
        const isBasic = typeof method === "string";
        const methodName = isBasic ? method : method.name;
        const onRun = async function (...params) {
          await onDebug?.({ type: "method", command: methodName, data: { params } });
          return new Promise((resolve, reject) => {
            socket.emit(CHANNELS.METHOD, { method: methodName, params }, (err, res) => {
              if (err) reject(err);
              else resolve(res);
            });
          })
        }
        methodsObj[methodName] = isBasic ? onRun : {
          ...method,
          run: onRun
        };
      });
      methodsObj = Object.freeze(methodsObj);

      if (rawSQL) {
        sql.setup({ dbo, socket });
      }

      /* Building DBO object */
      const checkSubscriptionArgs = (basicFilter: AnyObject | undefined, options: AnyObject | undefined, onChange: AnyFunction, onError?: AnyFunction) => {
        if (basicFilter !== undefined && !isObject(basicFilter) || options !== undefined && !isObject(options) || !(typeof onChange === "function") || onError !== undefined && typeof onError !== "function") {
          throw "Expecting: ( basicFilter<object>, options<object>, onChange<function> , onError?<function>) but got something else";
        }
      }
      const sub_commands = ["subscribe", "subscribeOne"] as const;
      getKeys(dbo).forEach(tableName => {
        const all_commands = Object.keys(dbo[tableName]!);

        const dboTable = dbo[tableName] as TableHandlerClient;
        all_commands
          .sort((a, b) => <never>sub_commands.includes(a as any) - <never>sub_commands.includes(b as any))
          .forEach(command => {

            if (command === "sync") {
              dboTable._syncInfo = { ...dboTable[command] };
              if (syncedTable) {
                dboTable.getSync = async (filter, params = {}) => {
                  await onDebug?.({ type: "table", command: "getSync", tableName, data: { filter, params } });
                  return syncedTable.create({ 
                    name: tableName, 
                    onDebug: onDebug as any, 
                    filter, 
                    db: dbo, 
                    ...params 
                  });
                }
                const upsertSyncTable = async (basicFilter = {}, options: SyncOptions = {}, onError) => {
                  const syncName = `${tableName}.${JSON.stringify(basicFilter)}.${JSON.stringify(omitKeys(options, ["handlesOnData"]))}`
                  if (!syncHandler.syncedTables[syncName]) {
                    syncHandler.syncedTables[syncName] = await syncedTable.create({ 
                      ...options, 
                      onDebug: onDebug as any, 
                      name: tableName, 
                      filter: basicFilter, 
                      db: dbo, 
                      onError 
                    });
                  }
                  return syncHandler.syncedTables[syncName]
                }
                const sync: Sync<AnyObject> = async (basicFilter, options = { handlesOnData: true, select: "*" }, onChange, onError) => {
                  await onDebug?.({ type: "table", command: "sync", tableName, data: { basicFilter, options } });
                  checkSubscriptionArgs(basicFilter, options, onChange, onError);
                  const s = await upsertSyncTable(basicFilter, options, onError);
                  return await s.sync(onChange, options.handlesOnData);
                }
                const syncOne: SyncOne<AnyObject> = async (basicFilter, options = { handlesOnData: true }, onChange, onError) => {
                  await onDebug?.({ type: "table", command: "syncOne", tableName, data: { basicFilter, options } });
                  checkSubscriptionArgs(basicFilter, options, onChange, onError);
                  const s = await upsertSyncTable(basicFilter, options, onError);
                  return await s.syncOne(basicFilter, onChange, options.handlesOnData);
                }
                dboTable.sync = sync;
                dboTable.syncOne = syncOne;
                // eslint-disable-next-line react-hooks/rules-of-hooks
                dboTable.useSync = (basicFilter, options) => useSync(sync, basicFilter, options) as any;
                // eslint-disable-next-line react-hooks/rules-of-hooks
                dboTable.useSyncOne = (basicFilter, options) => useSync(syncOne, basicFilter, options) as any;
              }

              dboTable._sync = async function (param1, param2, syncHandles) {
                await onDebug?.({ type: "table", command: "_sync", tableName, data: { param1, param2, syncHandles } });
                return syncHandler.addSync({ tableName, command, param1, param2 }, syncHandles);
              }
            } else if (sub_commands.includes(command as any)) {
              const subFunc = async function (param1 = {}, param2 = {}, onChange, onError) {
                await onDebug?.({ type: "table", command: command as typeof sub_commands[number], tableName, data: { param1, param2, onChange, onError } });
                checkSubscriptionArgs(param1, param2, onChange, onError);
                return subscriptionHandler.addSub(dbo, { tableName, command, param1, param2 }, onChange, onError);
              };
              dboTable[command] = subFunc;
              const SUBONE = "subscribeOne";

              /**
               * React hooks 
               */
              const handlerName = command === "subscribe" ? "useSubscribe" : command === "subscribeOne"? "useSubscribeOne" : undefined;
              if(handlerName){
                // eslint-disable-next-line react-hooks/rules-of-hooks
                dboTable[handlerName] = (filter, options) => useSubscribe(subFunc, command === SUBONE, filter, options)
              }

              if (command === SUBONE || !sub_commands.includes(SUBONE)) {
                dboTable[SUBONE] = async function (param1, param2, onChange, onError) {
                  await onDebug?.({ type: "table", command: "getSync", tableName, data: { param1, param2, onChange, onError } });
                  checkSubscriptionArgs(param1, param2, onChange, onError);

                  const onChangeOne = (rows) => { onChange(rows[0]) };
                  return subscriptionHandler.addSub(dbo, { tableName, command, param1, param2 }, onChangeOne, onError);
                };
              }
            } else {
              const method = async function (param1, param2, param3) {
                await onDebug?.({ type: "table", command: command as any, tableName, data: { param1, param2, param3 } });
                return new Promise((resolve, reject) => {
                  socket.emit(preffix,
                    { tableName, command, param1, param2, param3 },

                    /* Get col definition and re-cast data types?! */
                    (err, res) => {
                      if (err) reject(err);
                      else resolve(res);
                    }
                  );
                })
              }
              dboTable[command] = method;

              const methodName = command === "findOne" ? "useFindOne" : command === "find" ? "useFind" : command === "count" ? "useCount" : command === "size" ? "useSize" : undefined;
              if(methodName){
                // eslint-disable-next-line react-hooks/rules-of-hooks
                dboTable[methodName] = (param1, param2, param3?) => useFetch(method, [param1, param2, param3]);
              }
              if (["find", "findOne"].includes(command)) {
                dboTable.getJoinedTables = function () {
                  return joinTables
                    .filter(tb => Array.isArray(tb) && tb.includes(tableName))
                    .flat()
                    .filter(t => t !== tableName);
                }
              }
            }
          })
      });

      await subscriptionHandler.reAttachAll();
      await syncHandler.reAttachAll();

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
