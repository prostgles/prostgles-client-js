
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
  DeleteParams,
  EqualityFilter,
  FullFilter,
  GetSelectReturnType,
  MethodHandler,
  SQLHandler,
  SQLResult,
  SelectParams,
  SubscribeParams,
  SubscriptionChannels,
  SubscriptionHandler,
  TableHandler,
  UpdateParams,
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
import type { DbTableSync, Sync, SyncDataItem, SyncOne, SyncOneOptions, SyncOptions, SyncedTable } from "./SyncedTable/SyncedTable";
import { getSubscriptionHandler } from "./subscriptionHandler";

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
type SyncConfig = CoreParams & {
  onCall: AnyFunction,
  syncInfo: SyncInfo;
  triggers: ClientSyncHandles[]
};
type Syncs = {
  [channelName: string]: SyncConfig;
};
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

  let syncedTables: Record<string, any> = {};

  //@ts-ignore
  const subscriptionHandler = getSubscriptionHandler(initOpts);

  let syncs: Syncs = {};
  let state: undefined | "connected" | "disconnected" | "reconnected";
  const sql = new SQL();

  const destroySyncs = async () => {
    debug("destroySyncs", { syncedTables });
    // await subscriptionHandler.destroy();
    syncs = {};
    Object.values(syncedTables).map((s: any) => {
      if (s && s.destroy) s.destroy();
    });
    syncedTables = {};
  }

  function _unsync(channelName: string, triggers: ClientSyncHandles) {
    debug("_unsync", { channelName, triggers })
    return new Promise((resolve, reject) => {
      if (syncs[channelName]) {
        syncs[channelName]!.triggers = syncs[channelName]!.triggers.filter(tr => (
          tr.onPullRequest !== triggers.onPullRequest &&
          tr.onSyncRequest !== triggers.onSyncRequest &&
          tr.onUpdates !== triggers.onUpdates
        ));

        if (!syncs[channelName]!.triggers.length) {
          socket.emit(channelName + "unsync", {}, (err: any, res: any) => {
            if (err) reject(err);
            else resolve(res);
          });
          socket.removeListener(channelName, syncs[channelName]!.onCall);
          delete syncs[channelName];
        }
      }
    });
  }
  function addServerSync({ tableName, command, param1, param2 }: CoreParams, onSyncRequest: ClientSyncHandles["onSyncRequest"]): Promise<SyncInfo> {
    return new Promise((resolve, reject) => {
      socket.emit(preffix, { tableName, command, param1, param2 }, (err: any, res: SyncInfo) => {
        if (err) {
          console.error(err);
          reject(err);
        } else if (res as any) {
          const { id_fields, synced_field, channelName } = res;

          socket.emit(channelName, { onSyncRequest: onSyncRequest({}) }, (response: any) => {
            console.log(response);
          });
          resolve({ id_fields, synced_field, channelName });
        }
      });
    });
  }
  // /**
  //  * Obtaines subscribe channel from server
  //  */
  // function addServerSub({ tableName, command, param1, param2 }: CoreParams): Promise<SubscriptionChannels> {
  //   return new Promise((resolve, reject) => {
  //     socket.emit(preffix, { tableName, command, param1, param2 }, (err?: any, res?: SubscriptionChannels) => {
  //       if (err) {
  //         console.error(err);
  //         reject(err);
  //       } else if (res) {
  //         resolve(res);
  //       }
  //     });
  //   });
  // }

  const addSyncQueuer = new FunctionQueuer(_addSync, ([{ tableName }]) => tableName);
  async function addSync(params: CoreParams, triggers: ClientSyncHandles): Promise<any> {
    return addSyncQueuer.run([params, triggers])
  }
  async function _addSync({ tableName, command, param1, param2 }: CoreParams, triggers: ClientSyncHandles): Promise<any> {
    const { onSyncRequest } = triggers;

    function makeHandler(channelName: string) {
      const unsync = function () {
        _unsync(channelName, triggers);
      }

      const syncData: DbTableSync["syncData"] = function (data, deleted, cb) {
        socket.emit(channelName,
          {
            onSyncRequest: {
              ...onSyncRequest({}),
              ...({ data }),
              ...({ deleted })
            },
          },
          !cb ? null : (response?: any) => {
            cb(response)
          }
        );
      }

      return Object.freeze({ unsync, syncData });
    }

    const existingChannel = Object.keys(syncs).find(ch => {
      const s = syncs[ch];
      return (
        s &&
        s.tableName === tableName &&
        s.command === command &&
        isEqual(s.param1, param1) &&
        isEqual(s.param2, param2) 
      );
    });

    if (existingChannel) {
      syncs[existingChannel]!.triggers.push(triggers);
      return makeHandler(existingChannel);
    } else {
      const sync_info = await addServerSync({ tableName, command, param1, param2 }, onSyncRequest);
      const { channelName } = sync_info;
      const onCall = function (data: any | undefined, cb: AnyFunction) {
        /*               
            Client will:
            1. Send last_synced     on(onSyncRequest)
            2. Send data >= server_synced   on(onPullRequest)
            3. Send data on CRUD    emit(data.data)
            4. Upsert data.data     on(data.data)
        */
        if (!data) return;

        if (!syncs[channelName]) return;

        syncs[channelName]!.triggers.map(({ onUpdates, onSyncRequest, onPullRequest }) => {
          if (data.data) {
            Promise.resolve(onUpdates(data))
              .then(() => {
                cb({ ok: true })
              })
              .catch(err => {
                cb({ err });
              });
          } else if (data.onSyncRequest) {
            Promise.resolve(onSyncRequest(data.onSyncRequest))
              .then(res => cb({ onSyncRequest: res }))
              .catch(err => {
                cb({ err });
              })

          } else if (data.onPullRequest) {
            Promise.resolve(onPullRequest(data.onPullRequest))
              .then(arr => {
                cb({ data: arr });
              })
              .catch(err => {
                cb({ err });
              })
          } else {
            console.log("unexpected response")
          }
        })


      }
      syncs[channelName] = {
        tableName,
        command,
        param1,
        param2,
        triggers: [triggers],
        syncInfo: sync_info,
        onCall
      }

      socket.on(channelName, onCall);
      return makeHandler(channelName);
    }

  }

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
    socket.on(CHANNELS.SCHEMA, async ({ joinTables = [], ...clientSchema }: ClientSchema) => {
      const { schema, methods, tableSchema, auth: authConfig, rawSQL, err } = clientSchema;

      /** Only destroy existing syncs if schema changed */
      const schemaDidNotChange = schemaAge?.clientSchema && isEqual(schemaAge.clientSchema, clientSchema)
      if(!schemaDidNotChange){
        await destroySyncs();
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
                  if (!syncedTables[syncName]) {
                    syncedTables[syncName] = await syncedTable.create({ 
                      ...options, 
                      onDebug: onDebug as any, 
                      name: tableName, 
                      filter: basicFilter, 
                      db: dbo, 
                      onError 
                    });
                  }
                  return syncedTables[syncName]
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
                return addSync({ tableName, command, param1, param2 }, syncHandles);
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
      Object.entries(syncs).forEach(async ([ch, s]) => {
        const firstTrigger = s.triggers[0];
        if(firstTrigger){
          try { 
            await addServerSync(s, firstTrigger.onSyncRequest);
            socket.on(ch, s.onCall);
          } catch (err) {
            console.error("There was an issue reconnecting olf subscriptions", err)
          }
        }
      });


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
