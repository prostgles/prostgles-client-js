
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Stefan L. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  TableHandler, DbJoinMaker,
  TableJoinBasic, CHANNELS, DBNotifConfig,
  DBNoticeConfig, AnyObject, SubscriptionHandler,
  SQLHandler, DBEventHandles, AuthGuardLocation, DBSchemaTable,
  AuthGuardLocationResponse, MethodHandler, ClientSyncHandles, UpdateParams, DeleteParams, ClientSchema, SQLResult, DBSchema, ViewHandler,
  asName, 
  SubscriptionChannels,
  FullFilter,
  SubscribeParams,
  OnError,
  GetSelectReturnType,
  getKeys,
  getJoinHandlers
} from "prostgles-types";

import type { DbTableSync, Sync, SyncOne } from "./SyncedTable";

const DEBUG_KEY = "DEBUG_SYNCEDTABLE";
const hasWnd = typeof window !== "undefined";
export const debug: any = function (...args: any[]) {
  if (hasWnd && (window as any)[DEBUG_KEY]) {
    (window as any)[DEBUG_KEY](...args);
  }
};

export { MethodHandler, SQLResult, asName };

export * from "./react-hooks";

export type ViewHandlerClient<T extends AnyObject = AnyObject, S extends DBSchema | void = void> = ViewHandler<T, S> & {
  getJoinedTables: () => string[];
  _syncInfo?: any;
  getSync?: any;
  sync?: Sync<T>;
  syncOne?: SyncOne<T>;
  _sync?: any;
  subscribeHook: <SubParams extends SubscribeParams<T, S>>(
    filter?: FullFilter<T, S>, 
    options?: SubParams, 
    onError?: OnError
  ) => { 
    start: ((
      onChange: (items: GetSelectReturnType<S, SubParams, T, false>[]) => any
    ) => Promise<SubscriptionHandler>) 
    args: [
      filter?: FullFilter<T, S>, 
      options?: SubscribeParams<T>, 
      onError?: OnError
    ]
  };
  subscribeOneHook: <SubParams extends SubscribeParams<T, S>>(
    filter?: FullFilter<T, S>, 
    options?: SubscribeParams<T>, 
    onError?: OnError
  ) => { 
    start: (
      onChange:  (item: GetSelectReturnType<S, SubParams, T, false> | undefined) => any
    ) => Promise<SubscriptionHandler>;
    args: [
      filter?: FullFilter<T, S>, 
      options?: SubscribeParams<T>, 
      onError?: OnError
    ]
  }
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

export type Auth = {
  register?: (params: any) => Promise<any>;
  login?: (params: any) => Promise<any>;
  logout?: (params: any) => Promise<any>;
  user?: any;
}

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
}


type CoreParams = {
  tableName: string;
  command: string;
  param1?: AnyObject;
  param2?: AnyObject;
};

type Subscription = CoreParams & {
  lastData: any;
  onCall: Function,
  handlers: Function[];
  errorHandlers: (Function | undefined)[];
  unsubChannel: string;
  destroy: () => any;
};

type Subscriptions = {
  [key: string]: Subscription
};

export type onUpdatesParams = { data: object[]; isSynced: boolean }

// export type SyncTriggers = {
//     onSyncRequest: (params, sync_info) => { c_fr: object, c_lr: object, c_count: number }, 
//     onPullRequest: ({ from_synced, offset, limit }, sync_info) => object[], 
//     onUpdates: (params: onUpdatesParams, sync_info) => any | void;
// };

export type SyncInfo = {
  id_fields: string[],
  synced_field: string,
  channelName: string
}
type SyncConfig = CoreParams & {
  onCall: Function,
  syncInfo: SyncInfo;
  triggers: ClientSyncHandles[]
}
type Syncs = {
  [channelName: string]: SyncConfig;
};
export function prostgles<DBSchema>(initOpts: InitOptions<DBSchema>, syncedTable: any) {
  const { socket, onReady, onDisconnect, onReconnect, onSchemaChange = true, onReload, onDebug } = initOpts;

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
  let subscriptions: Subscriptions = {};
  // window["subscriptions"] = subscriptions;

  let syncedTables: Record<string, any> = {};

  let syncs: Syncs = {};

  let notifSubs: {
    [key: string]: {
      config: DBNotifConfig
      listeners: ((notif: any) => void)[]
    }
  } = {};
  const removeNotifListener = (listener: any, conf: DBNotifConfig) => {
    const channelSubs = notifSubs[conf.notifChannel]
    if (channelSubs) {
      channelSubs.listeners = channelSubs.listeners.filter(nl => nl !== listener);
      if (!channelSubs.listeners.length && channelSubs.config && channelSubs.config.socketUnsubChannel && socket) {
        socket.emit(channelSubs.config.socketUnsubChannel, {});
        delete notifSubs[conf.notifChannel];
      }
    }
  };
  const addNotifListener = (listener: any, conf: DBNotifConfig) => {
    notifSubs = notifSubs || {};

    const channelSubs = notifSubs[conf.notifChannel]
    if (!channelSubs) {
      notifSubs[conf.notifChannel] = {
        config: conf,
        listeners: [listener]
      };
      socket.removeAllListeners(conf.socketChannel);
      socket.on(conf.socketChannel, (notif: any) => {
        if (notifSubs[conf.notifChannel]?.listeners.length) {
          notifSubs[conf.notifChannel]!.listeners.map(l => {
            l(notif);
          })
        } else {
          socket.emit(notifSubs[conf.notifChannel]?.config.socketUnsubChannel, {});
        }
      });

    } else {
      notifSubs[conf.notifChannel]?.listeners.push(listener);
    }
  };


  let noticeSubs: {
    listeners: ((notice: any) => void)[];
    config: DBNoticeConfig;
  };
  const removeNoticeListener = (listener: any) => {
    if (noticeSubs) {
      noticeSubs.listeners = noticeSubs.listeners.filter(nl => nl !== listener);
      if (!noticeSubs.listeners.length && noticeSubs.config && noticeSubs.config.socketUnsubChannel && socket) {
        socket.emit(noticeSubs.config.socketUnsubChannel, {});
      }
    }
  };
  const addNoticeListener = (listener: any, conf: DBNoticeConfig) => {
    noticeSubs = noticeSubs || {
      config: conf,
      listeners: []
    };

    if (!noticeSubs.listeners.length) {
      socket.removeAllListeners(conf.socketChannel);
      socket.on(conf.socketChannel, (notice: any) => {
        if (noticeSubs && noticeSubs.listeners && noticeSubs.listeners.length) {
          noticeSubs.listeners.map(l => {
            l(notice);
          })
        } else {
          socket.emit(conf.socketUnsubChannel, {});
        }
      });
    }
    noticeSubs.listeners.push(listener);
  };

  let connected = false;

  const destroySyncs = () => {
    debug("destroySyncs", { subscriptions, syncedTables })
    Object.values(subscriptions).map(s => s.destroy());
    subscriptions = {};
    syncs = {};
    Object.values(syncedTables).map((s: any) => {
      if (s && s.destroy) s.destroy();
    });
    syncedTables = {};
  }

  function _unsubscribe(channelName: string, unsubChannel: string, handler: Function) {
    debug("_unsubscribe", { channelName, handler });

    return new Promise((resolve, reject) => {
      if (subscriptions[channelName]) {
        subscriptions[channelName]!.handlers = subscriptions[channelName]!.handlers.filter(h => h !== handler);
        if (!subscriptions[channelName]!.handlers.length) {
          socket.emit(unsubChannel, {}, (err: any, _res: any) => {
            // console.log("unsubscribed", err, res);
            if (err) console.error(err);
            // else resolve(res);
          });
          socket.removeListener(channelName, subscriptions[channelName]!.onCall);
          delete subscriptions[channelName];

          /* Not waiting for server confirmation to speed things up */
          resolve(true)
        } else {
          resolve(true)
        }
      } else {
        resolve(true)
      }
    });
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
        } else if (res) {
          const { id_fields, synced_field, channelName } = res;

          socket.emit(channelName, { onSyncRequest: onSyncRequest({}) }, (response: any) => {
            console.log(response);
          });
          resolve({ id_fields, synced_field, channelName });
        }
      });
    });
  }
  /**
   * Obtaines subscribe channel from server
   */
  function addServerSub({ tableName, command, param1, param2 }: CoreParams): Promise<SubscriptionChannels> {
    return new Promise((resolve, reject) => {
      socket.emit(preffix, { tableName, command, param1, param2 }, (err?: any, res?: SubscriptionChannels) => {
        if (err) {
          console.error(err);
          reject(err);
        } else if (res) {
          resolve(res);
        }
      });
    });
  }

  const addSyncQueuer = new FunctionQueuer(_addSync, ([{ tableName }]) => tableName);
  async function addSync(params: CoreParams, triggers: ClientSyncHandles): Promise<any> {
    return addSyncQueuer.run([params, triggers])
  }
  async function _addSync({ tableName, command, param1, param2 }: CoreParams, triggers: ClientSyncHandles): Promise<any> {
    const { onPullRequest, onSyncRequest, onUpdates } = triggers;

    function makeHandler(channelName: string) {
      let unsync = function () {
        _unsync(channelName, triggers);
      }

      let syncData: DbTableSync["syncData"] = function (data, deleted, cb) {
        socket.emit(channelName,
          {
            onSyncRequest: {
              ...onSyncRequest({}),
              ...({ data } || {}),
              ...({ deleted } || {})
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
      let s = syncs[ch];
      return (
        s &&
        s.tableName === tableName &&
        s.command === command &&
        JSON.stringify(s.param1 || {}) === JSON.stringify(param1 || {}) &&
        JSON.stringify(s.param2 || {}) === JSON.stringify(param2 || {})
        // s.triggers.find(tr => (
        //     tr.onPullRequest === triggers.onPullRequest &&
        //     tr.onSyncRequest === triggers.onSyncRequest &&
        //     tr.onUpdates === triggers.onUpdates
        // ))
      );
    });

    if (existingChannel) {
      syncs[existingChannel]!.triggers.push(triggers);
      return makeHandler(existingChannel);
    } else {
      const sync_info = await addServerSync({ tableName, command, param1, param2 }, onSyncRequest);
      const { channelName, synced_field, id_fields } = sync_info;
      function onCall(data: any | undefined, cb: Function) {
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
          // onChange(data.data);
          if (data.data) {
            Promise.resolve(onUpdates(data))
              .then(() => {
                if (cb) cb({ ok: true })
              })
              .catch(err => {
                if (cb) {
                  cb({ err })
                } else {
                  console.error(tableName + " onUpdates error", err)
                }
              });
          } else if (data.onSyncRequest) {
            // cb(onSyncRequest());
            Promise.resolve(onSyncRequest(data.onSyncRequest))
              .then(res => cb({ onSyncRequest: res }))
              .catch(err => {
                if (cb) {
                  cb({ err })
                } else {
                  console.error(tableName + " onSyncRequest error", err)
                }
              })

          } else if (data.onPullRequest) {
            Promise.resolve(onPullRequest(data.onPullRequest))
              .then(arr => {
                cb({ data: arr });
              })
              .catch(err => {
                if (cb) {
                  cb({ err })
                } else {
                  console.error(tableName + " onPullRequest error", err)
                }
              })
          } else {
            console.log("unexpected response")
          }

          /* Cache */
          // window.localStorage.setItem(channelName, JSON.stringify(data))
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

  /**
   * Can be used concurrently
   */
  const addSubQueuer = new FunctionQueuer(_addSub, ([_, { tableName }]) => tableName);
  async function addSub(dbo: any, params: CoreParams, onChange: Function, _onError?: Function): Promise<SubscriptionHandler> { 
    return addSubQueuer.run([dbo, params, onChange, _onError]);
  }

  /**
   * Do NOT use concurrently
   */
  async function _addSub(dbo: any, { tableName, command, param1, param2 }: CoreParams, onChange: Function, _onError?: Function): Promise<SubscriptionHandler> {

    function makeHandler(channelName: string, unsubChannel: string) {

      const unsubscribe = function () {
        return _unsubscribe(channelName, unsubChannel, onChange);
      }
      let res: any = { unsubscribe, filter: { ...param1 } }
      /* Some dbo sorting was done to make sure this will work */
      if (dbo[tableName].update) {
        res = {
          ...res,
          update: function (newData: AnyObject, updateParams: UpdateParams) {
            return dbo[tableName].update(param1, newData, updateParams);
          }
        }
      }
      if (dbo[tableName].delete) {
        res = {
          ...res,
          delete: function (deleteParams: DeleteParams) {
            return dbo[tableName].delete(param1, deleteParams);
          }
        }
      }
      return Object.freeze(res);
    }

    const existing = Object.entries(subscriptions).find(([ch]) => {
      let s = subscriptions[ch];
      return (
        s &&
        s.tableName === tableName &&
        s.command === command &&
        JSON.stringify(s.param1 || {}) === JSON.stringify(param1 || {}) &&
        JSON.stringify(s.param2 || {}) === JSON.stringify(param2 || {})
      );
    });

    if (existing) {
      const existingCh = existing[0];
      existing[1].handlers.push(onChange);
      existing[1].errorHandlers.push(_onError);
      /* Reuse existing sub config */
      // if(subscriptions[existing].handlers.includes(onChange)){
      //     console.warn("Duplicate subscription handler was added for:", subscriptions[existing])
      // }
      setTimeout(() => {
        if (onChange && subscriptions?.[existingCh]?.lastData) {
          onChange(subscriptions?.[existingCh]?.lastData)
        }
      }, 10)
      return makeHandler(existingCh, existing[1].unsubChannel);
    }

    const { channelName, channelNameReady, channelNameUnsubscribe } = await addServerSub({ tableName, command, param1, param2 })

    const onCall = function (data: any, cb: Function) {
      /* TO DO: confirm receiving data or server will unsubscribe */
      // if(cb) cb(true);
      const sub = subscriptions[channelName];
      if (sub) {
        if (data.data) {
          sub.lastData = data.data;
          sub.handlers.forEach(h => {
            h(data.data);
          });
        } else if (data.err) {
          sub.errorHandlers.forEach(h => {
            h?.(data.err);
          });
        } else {
          console.error("INTERNAL ERROR: Unexpected data format from subscription: ", data)
        }
      } else {
        console.warn("Orphaned subscription: ", channelName)
      }
    }
    const onError = _onError || function (err: any) { console.error(`Uncaught error within running subscription \n ${channelName}`, err) }

    socket.on(channelName, onCall);
    subscriptions[channelName] = {
      lastData: undefined,
      tableName,
      command,
      param1,
      param2,
      onCall,
      unsubChannel: channelNameUnsubscribe,
      handlers: [onChange],
      errorHandlers: [onError],
      destroy: () => {
        if (subscriptions[channelName]) {
          Object.values(subscriptions[channelName]!).map((s: Subscription) => {
            if (s && s.handlers) s.handlers.map(h => _unsubscribe(channelName, channelNameUnsubscribe, h))
          });
          delete subscriptions[channelName];
        }
      }
    }
    socket.emit(channelNameReady, { now: Date.now() });
    return makeHandler(channelName, channelNameUnsubscribe);

  }

  return new Promise((resolve, reject) => {

    socket.removeAllListeners(CHANNELS.CONNECTION)
    socket.on(CHANNELS.CONNECTION, error => {
      reject(error);
      return "ok"
    })

    if (onDisconnect) {
      socket.on("disconnect", () => {
        connected = false; 
        onDisconnect();
      });
    }
    if(onReconnect){
      /** A reconnect will happen after the server is ready and pushed the schema */
      socket.on("connect", () => {
        connected = true; 
      });
    }

    /* Schema = published schema */
    // socket.removeAllListeners(CHANNELS.SCHEMA)
    socket.on(CHANNELS.SCHEMA, ({ schema, methods, tableSchema, auth, rawSQL, joinTables = [], err }: ClientSchema) => {

      destroySyncs();
      if (connected && onReconnect) {
        onReconnect(socket, err);
        if (err) {
          console.error(err)
          return;
        }
      }

      if (err) {
        reject(err)
        throw err;
      }

      connected = true;

      let dbo: DBHandlerClient = JSON.parse(JSON.stringify(schema));
      let _methods: typeof methods = JSON.parse(JSON.stringify(methods)),
        methodsObj: MethodHandler = {},
        _auth = {};

      if (auth) {
        if (auth.pathGuard && hasWnd) {
          const doReload = (res?: AuthGuardLocationResponse) => {
            if (res?.shouldReload) {
              if (onReload) onReload();
              else if (typeof window !== "undefined") {
                window?.location?.reload?.();
              }
            }
          }
          socket.emit(CHANNELS.AUTHGUARD, JSON.stringify(window.location as AuthGuardLocation), (err: any, res: AuthGuardLocationResponse) => {
            doReload(res)
          });

          socket.removeAllListeners(CHANNELS.AUTHGUARD);
          socket.on(CHANNELS.AUTHGUARD, (res: AuthGuardLocationResponse) => {
            doReload(res);
          });
        }

        _auth = { ...auth };
        [CHANNELS.LOGIN, CHANNELS.LOGOUT, CHANNELS.REGISTER].map(funcName => {
          if (auth[funcName]) {
            _auth[funcName] = function (params) {
              return new Promise((resolve, reject) => {
                socket.emit(preffix + funcName, params, (err, res) => {
                  if (err) reject(err);
                  else resolve(res);
                });
              });
            }
          }
        });
      }

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
        dbo.sql = function (query, params, options) {
          return new Promise((resolve, reject) => {
            socket.emit(CHANNELS.SQL, { query, params, options }, (err, res) => {
              if (err) reject(err);
              else {
                if (options &&
                  options.returnType === "noticeSubscription" &&
                  res &&
                  Object.keys(res).sort().join() === ["socketChannel", "socketUnsubChannel"].sort().join() &&
                  !Object.values(res).find(v => typeof v !== "string")
                ) {
                  const sockInfo: DBNoticeConfig = res;
                  const addListener = (listener: (arg: any) => void) => {
                    addNoticeListener(listener, sockInfo);
                    return {
                      ...sockInfo,
                      removeListener: () => removeNoticeListener(listener)
                    }
                  };
                  const handle: DBEventHandles = {
                    ...sockInfo,
                    addListener
                  };
                  // @ts-ignore
                  resolve(handle);
                } else if (
                  (!options || !options.returnType || options.returnType !== "statement") &&
                  res &&
                  Object.keys(res).sort().join() === ["socketChannel", "socketUnsubChannel", "notifChannel"].sort().join() &&
                  !Object.values(res).find(v => typeof v !== "string")
                ) {
                  const addListener = (listener: (arg: any) => void) => {
                    addNotifListener(listener, res as DBNotifConfig)
                    return {
                      ...res,
                      removeListener: () => removeNotifListener(listener, res as DBNotifConfig)
                    }
                  }
                  const handle: DBEventHandles = { ...res, addListener };
                  // @ts-ignore
                  resolve(handle);

                } else {
                  resolve(res);
                }
              }
            });
          });
        }
      }

      /* Building DBO object */
      const isPojo = (obj: any) => Object.prototype.toString.call(obj) === "[object Object]";
      const checkSubscriptionArgs = (basicFilter: AnyObject, options: AnyObject, onChange: Function, onError?: Function) => {
        if (!isPojo(basicFilter) || !isPojo(options) || !(typeof onChange === "function") || onError && typeof onError !== "function") {
          throw "Expecting: ( basicFilter<object>, options<object>, onChange<function> , onError?<function>) but got something else";
        }
      }
      const sub_commands = ["subscribe", "subscribeOne"] as const;
      getKeys(dbo).forEach(tableName => {
        const all_commands = Object.keys(dbo[tableName]);
        
        all_commands
          .sort((a, b) => <never>sub_commands.includes(a as any) - <never>sub_commands.includes(b as any))
          .forEach(command => {
            if (["find", "findOne"].includes(command)) {
              dbo[tableName].getJoinedTables = function () {
                return (joinTables || [])
                  .filter(tb => Array.isArray(tb) && tb.includes(tableName))
                  .flat()
                  .filter(t => t !== tableName);
              }
            }

            if (command === "sync") {
              dbo[tableName]._syncInfo = { ...dbo[tableName][command] };
              if (syncedTable) {
                dbo[tableName].getSync = async (filter, params = {}) => {
                  await onDebug?.({ type: "table", command: "getSync", tableName, data: { filter, params } });
                  return syncedTable.create({ name: tableName, onDebug, filter, db: dbo, ...params });
                }
                const upsertSTable = async (basicFilter = {}, options = {}, onError) => {
                  const syncName = `${tableName}.${JSON.stringify(basicFilter)}.${JSON.stringify(options)}`
                  if (!syncedTables[syncName]) {
                    syncedTables[syncName] = await syncedTable.create({ ...options, onDebug, name: tableName, filter: basicFilter, db: dbo, onError });
                  }
                  return syncedTables[syncName]
                }
                dbo[tableName].sync = async (basicFilter, options = { handlesOnData: true, select: "*" }, onChange, onError) => {
                  await onDebug?.({ type: "table", command: "sync", tableName, data: { basicFilter, options } });
                  checkSubscriptionArgs(basicFilter, options, onChange, onError);
                  const s = await upsertSTable(basicFilter, options, onError);
                  return await s.sync(onChange, options.handlesOnData);
                }
                dbo[tableName].syncOne = async (basicFilter, options = { handlesOnData: true }, onChange, onError) => {
                  await onDebug?.({ type: "table", command: "syncOne", tableName, data: { basicFilter, options } });
                  checkSubscriptionArgs(basicFilter, options, onChange, onError);
                  const s = await upsertSTable(basicFilter, options, onError);
                  return await s.syncOne(basicFilter, onChange, options.handlesOnData);
                }
              }

              dbo[tableName]._sync = async function (param1, param2, syncHandles) {
                await onDebug?.({ type: "table", command: "_sync", tableName, data: { param1, param2, syncHandles } });
                return addSync({ tableName, command, param1, param2 }, syncHandles);
              }
            } else if (sub_commands.includes(command as any)) {
              const subFunc = async function <T extends AnyObject = AnyObject>(param1, param2, onChange, onError) {
                await onDebug?.({ type: "table", command: command as typeof sub_commands[number], tableName, data: { param1, param2, onChange, onError } });
                checkSubscriptionArgs(param1, param2, onChange, onError);
                return addSub(dbo, { tableName, command, param1, param2 }, onChange, onError);
              };
              dbo[tableName][command] = subFunc;
              const SUBONE = "subscribeOne";
              /**
               * Used in for react hooks 
               */
              dbo[tableName][command + "Hook"] = function (param1 = {}, param2 = {}, onError?) {
                return { 
                  start: (onChange: any) => {
                    const changeFunc = command !== SUBONE? onChange : (rows) => { onChange(rows[0]); }; 
                    return subFunc(param1, param2, changeFunc, onError);
                  },
                  args: [param1, param2, onError]
                }
              }

              if (command === SUBONE || !sub_commands.includes(SUBONE)) {
                dbo[tableName][SUBONE] = async function (param1, param2, onChange, onError) {
                  await onDebug?.({ type: "table", command: "getSync", tableName, data: { param1, param2, onChange, onError } });
                  checkSubscriptionArgs(param1, param2, onChange, onError);

                  let onChangeOne = (rows) => { onChange(rows[0]) };
                  return addSub(dbo, { tableName, command, param1, param2 }, onChangeOne, onError);
                };
              }
            } else {
              dbo[tableName][command] = async function (param1, param2, param3) {
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
            }
          })
      });


      // Re-attach listeners
      if (subscriptions && Object.keys(subscriptions).length) {
        Object.keys(subscriptions).map(async ch => {
          try {
            let s = subscriptions[ch]!;
            await addServerSub(s);
            socket.on(ch, s.onCall);
          } catch (err) {
            console.error("There was an issue reconnecting old subscriptions", err)
          }
        });
      }
      if (syncs && Object.keys(syncs).length) {
        getKeys(syncs).filter(ch => {
          return syncs[ch]?.triggers.length
        }).map(async ch => {
          try {
            let s = syncs[ch]!;
            await addServerSync(s, s.triggers[0]!.onSyncRequest);
            socket.on(ch, s.onCall);
          } catch (err) {
            console.error("There was an issue reconnecting olf subscriptions", err)
          }
        });
      }


      joinTables.flat().map(table => {
        dbo.innerJoin = dbo.innerJoin || {};
        dbo.leftJoin = dbo.leftJoin || {};
        dbo.innerJoinOne = dbo.innerJoinOne || {};
        dbo.leftJoinOne = dbo.leftJoinOne || {};
        const joinHandlers = getJoinHandlers(table);
        dbo.leftJoin[table] = joinHandlers.leftJoin;
        dbo.innerJoin[table] = joinHandlers.innerJoin;
        dbo.leftJoinOne[table] = joinHandlers.leftJoinOne;
        dbo.innerJoinOne[table] = joinHandlers.innerJoinOne;
      });

      (async () => {
        try {
          await onReady(dbo as DBHandlerClient<DBSchema>, methodsObj, tableSchema, _auth, connected);
        } catch (err) {
          console.error("Prostgles: Error within onReady: \n", err);
          reject(err);
        }

        resolve(dbo);

      })();
    });
  })
};

type Func = (...args: any[]) => any;
class FunctionQueuer<F extends Func> {
  private queue: { arguments: Parameters<F>; onResult: (result: ReturnType<F>) => void; onFail: (error: any) => void }[] = [];
  private func: F;
  private groupBy?: (args: Parameters<F>) => string;
  constructor(func: F, groupBy?: ((args: Parameters<F>) => string)) {
    this.func = func;
    this.groupBy = groupBy;
  }
  private isRunning = false;
  async run(args: Parameters<F>): Promise<ReturnType<F>> {

    const result = new Promise<ReturnType<F>>((resolve, reject) => {
      const item = { arguments: args, onResult: resolve, onFail: reject }
      this.queue.push(item);
    });

    const startQueueJob = async () => {
      if (this.isRunning) {
        return;
      }
      this.isRunning = true;

      const runItem = async (item: undefined | typeof this.queue[number]) => {
        if (item) {
          try {
            const result = await this.func(...item.arguments);
            item.onResult(result);
          } catch(error) {
            item.onFail(error);
          }
        }
      }

      if(!this.groupBy){
        const item = this.queue.shift();
        await runItem(item);

      /** Run items in parallel for each group */
      } else {
        type Item = typeof this.queue[number];
        const groups: string[] = [];
        const items: { index: number; item: Item; }[] = [];
        this.queue.forEach(async (item, index) => {
          const group = this.groupBy!(item.arguments);
          if(!groups.includes(group)){
            groups.push(group);
            items.push({ index, item });
          }
        });
        items.slice(0).reverse().forEach((item) => {
          this.queue.splice(item.index, 1);
        });
        await Promise.all(items.map(item => {
          return runItem(item.item);
        }));
      }

      this.isRunning = false;
      if (this.queue.length) {
        startQueueJob();
      }
    }

    startQueueJob();

    return result;

  }
}