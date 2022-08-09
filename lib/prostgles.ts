
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Stefan L. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TableHandler, TableHandlerBasic, DbJoinMaker, 
    TableJoinBasic, CHANNELS, DBNotifConfig, 
    DBNoticeConfig, AnyObject, SubscriptionHandler, 
    SQLHandler, DBEventHandles, AuthGuardLocation, DBSchemaTable,
    AuthGuardLocationResponse, MethodHandler, ClientSyncHandles, UpdateParams, DeleteParams, ClientSchema, SQLResult
} from "prostgles-types";

// import { debug } from "./SyncedTable";
import type { DbTableSync, Sync, SyncOne } from "./SyncedTable";
// type Sync = any; 
// type SyncOne = any;

const DEBUG_KEY = "DEBUG_SYNCEDTABLE";
const hasWnd = typeof window !== "undefined";
export const debug: any = function(...args: any[]){
    if(hasWnd && (window as any)[DEBUG_KEY]){
        (window as any)[DEBUG_KEY](...args);
    }
};

export { MethodHandler, SQLResult };

export type TableHandlerClient<T = AnyObject> = TableHandler<T> & {
    getJoinedTables: () => string[];
    _syncInfo?: any;
    getSync?: any;
    sync?: Sync;
    syncOne?: SyncOne;
    _sync?: any;
}
export type TableHandlerClientBasic = TableHandlerBasic & {
    getJoinedTables: () => string[];
    _syncInfo?: any;
    getSync?: any;
    sync?: Sync;
    syncOne?: SyncOne;
    _sync?: any;
}

export type DBHandlerClient<Tables extends Record<string, Record<string, any>> = Record<string, any>> = {
    [key in keyof Tables]: Partial<TableHandlerClient<Tables[key]>>;
} & DbJoinMaker & {
    sql?: SQLHandler;
};

/** Type inference check */
const db: DBHandlerClient<{ tbl1: { col1: string; col2: number }}> = 1 as any;
(async () => {
    const res = await db.tbl1.findOne!()
    res?.col1;
    // @ts-expect-error
    res.col2;
});

export type DBHandlerClientBasic = {
    [key: string]: Partial<TableHandlerClientBasic>;
  } & {
    innerJoin: TableJoinBasic;
    leftJoin: TableJoinBasic;
    innerJoinOne: TableJoinBasic;
    leftJoinOne: TableJoinBasic;
  } & {

    /**
     * 
     * @param query <string> query. e.g.: SELECT * FROM users;
     * @param params <any[] | object> query arguments to be escaped. e.g.: { name: 'dwadaw' }
     * @param options <object> { returnType: "statement" | "rows" | "noticeSubscription" }
     */
    sql?: SQLHandler;
};

export type Auth = {
    register?: (params: any) => Promise<any>;
    login?: (params: any) => Promise<any>;
    logout?: (params: any) => Promise<any>;
    user?: any;
}

export type InitOptions = {
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
    onReady: (dbo: DBHandlerClient, methods: MethodHandler | undefined, tableSchema: DBSchemaTable[] | undefined, auth?: Auth) => any;
    onReconnect?: (socket: any) => any;
    onDisconnect?: (socket: any) => any;
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
    errorHandlers: Function[];
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
export function prostgles(initOpts: InitOptions, syncedTable: any){
    const { socket, onReady, onDisconnect, onReconnect, onSchemaChange = true, onReload } = initOpts;

    debug("prostgles", { initOpts })
    if(onSchemaChange){
        let cb;
        if(typeof onSchemaChange === "function"){
            cb = onSchemaChange;
        } 
        socket.removeAllListeners(CHANNELS.SCHEMA_CHANGED)
        if(cb) socket.on(CHANNELS.SCHEMA_CHANGED, cb)
    }

    const preffix = CHANNELS._preffix;
    let subscriptions: Subscriptions = {};
    // window["subscriptions"] = subscriptions;

    let syncedTables: Record<string, any> = {};

    let syncs: Syncs = {};

    const addSubQueue: {
        dbo: any;
        params: CoreParams;
        onChange: Function;
        _onError: Function;
        returnHandlers: (subHandlers: SubscriptionHandler) => void;
    }[] = [];
    let isAddingSub = false;

    let notifSubs: { 
        [key: string]: {
            config: DBNotifConfig
            listeners: ((notif: any) => void)[] 
        } 
    } = {};
    const removeNotifListener = (listener: any, conf: DBNotifConfig) => {
        if(notifSubs && notifSubs[conf.notifChannel]){
            notifSubs[conf.notifChannel].listeners = notifSubs[conf.notifChannel].listeners.filter(nl => nl !== listener);
            if(!notifSubs[conf.notifChannel].listeners.length && notifSubs[conf.notifChannel].config && notifSubs[conf.notifChannel].config.socketUnsubChannel && socket){
                socket.emit(notifSubs[conf.notifChannel].config.socketUnsubChannel, {});
                delete notifSubs[conf.notifChannel];
            }
        }
    };
    const addNotifListener = (listener: any, conf: DBNotifConfig) => {
            notifSubs = notifSubs || {};

            if(!notifSubs[conf.notifChannel]){
                notifSubs[conf.notifChannel] = {
                    config: conf,
                    listeners: [listener]
                };
                socket.removeAllListeners(conf.socketChannel);
                socket.on(conf.socketChannel, (notif: any) => {
                    if(notifSubs[conf.notifChannel] && notifSubs[conf.notifChannel].listeners && notifSubs[conf.notifChannel].listeners.length){
                        notifSubs[conf.notifChannel].listeners.map(l => {
                            l(notif);
                        })
                    } else {
                        socket.emit(notifSubs[conf.notifChannel].config.socketUnsubChannel, {});
                    }
                });
                
            } else {
                notifSubs[conf.notifChannel].listeners.push(listener);
            }
        };
        

    let noticeSubs: {
        listeners: ((notice: any) => void)[];
        config: DBNoticeConfig;
    };
    const removeNoticeListener = (listener: any) => {
        if(noticeSubs){
            noticeSubs.listeners = noticeSubs.listeners.filter(nl => nl !== listener);
            if(!noticeSubs.listeners.length && noticeSubs.config && noticeSubs.config.socketUnsubChannel && socket){
                socket.emit(noticeSubs.config.socketUnsubChannel, {});
            }
        }
    };
    const addNoticeListener = (listener: any, conf: DBNoticeConfig) => {
            noticeSubs = noticeSubs || {
                config: conf,
                listeners: []
            };
            
            if(!noticeSubs.listeners.length){
                socket.removeAllListeners(conf.socketChannel);
                socket.on(conf.socketChannel, (notice: any) => {
                    if(noticeSubs && noticeSubs.listeners && noticeSubs.listeners.length){
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
        Object.values(syncedTables).map((s: any)=> {
            if(s && s.destroy) s.destroy();
        });
        syncedTables = {};
    }

    function _unsubscribe(channelName: string, handler: Function){
        debug("_unsubscribe", { channelName, handler });

        return new Promise((resolve, reject) => {
            if(subscriptions[channelName]){
                subscriptions[channelName].handlers = subscriptions[channelName].handlers.filter(h => h !== handler);
                if(!subscriptions[channelName].handlers.length){
                    socket.emit(channelName + "unsubscribe", {}, (err: any, _res: any)=>{
                        // console.log("unsubscribed", err, res);
                        if(err) console.error(err);
                        // else resolve(res);
                    });
                    socket.removeListener(channelName, subscriptions[channelName].onCall);
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

    function _unsync(channelName: string, triggers: ClientSyncHandles){
        debug("_unsync", { channelName, triggers })
        return new Promise((resolve, reject) => {
            if(syncs[channelName]){
                syncs[channelName].triggers = syncs[channelName].triggers.filter(tr => (
                    tr.onPullRequest !== triggers.onPullRequest &&
                    tr.onSyncRequest !== triggers.onSyncRequest &&
                    tr.onUpdates !== triggers.onUpdates
                ));
                
                if(!syncs[channelName].triggers.length){
                    socket.emit(channelName + "unsync", {}, (err: any, res: any)=>{
                        if(err) reject(err);
                        else resolve(res);
                    });
                    socket.removeListener(channelName, syncs[channelName].onCall);
                    delete syncs[channelName];
                }
            }
        });
    }
    function addServerSync({ tableName, command, param1, param2 }: CoreParams, onSyncRequest: ClientSyncHandles["onSyncRequest"]): Promise<SyncInfo>{
        return new Promise((resolve, reject) => {                           
            socket.emit(preffix, { tableName, command, param1, param2 }, (err: any, res: SyncInfo) => {
                if(err) {
                    console.error(err);
                    reject(err);
                } else if(res) {
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
    function addServerSub({ tableName, command, param1, param2 }: CoreParams): Promise<string>{
        return new Promise((resolve, reject) => { 
            socket.emit(preffix, { tableName, command, param1, param2 }, (err?: any, res?: any) => {
                if(err) {
                    console.error(err);
                    reject(err);
                } else if(res) {
                    resolve(res.channelName);                     
                }
            });
        });
    }
    
    const addSyncQueuer = new FunctionQueuer(_addSync);
    async function addSync(params: CoreParams, triggers: ClientSyncHandles): Promise<any> {
        return addSyncQueuer.run([params, triggers])
    }
    async function _addSync({ tableName, command, param1, param2 }: CoreParams, triggers: ClientSyncHandles): Promise<any> {
        const { onPullRequest, onSyncRequest, onUpdates } = triggers;

        function makeHandler(channelName: string){
            let unsync = function(){
                _unsync(channelName, triggers);
            }

            let syncData: DbTableSync["syncData"] = function(data, deleted, cb){
                socket.emit(channelName, 
                    { 
                        onSyncRequest: {
                            ...onSyncRequest({}), 
                            ...({ data } || {}),
                            ...({ deleted } || {}) 
                        },
                    },
                    !cb? null : (response?: any) => {
                        cb(response)
                    }
                );
            }

            return Object.freeze({ unsync, syncData });
        }

        const existingChannel = Object.keys(syncs).find(ch => {
            let s = syncs[ch];
            return (
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

        if(existingChannel){
            syncs[existingChannel].triggers.push(triggers);
            return makeHandler(existingChannel);
        } else {
            const sync_info = await addServerSync({ tableName, command, param1, param2 }, onSyncRequest);
            const { channelName, synced_field, id_fields } = sync_info;
            function onCall(data: any | undefined, cb: Function){
                /*               
                    Client will:
                    1. Send last_synced     on(onSyncRequest)
                    2. Send data >= server_synced   on(onPullRequest)
                    3. Send data on CRUD    emit(data.data)
                    4. Upsert data.data     on(data.data)
                */
                if(!data) return;

                if(!syncs[channelName]) return;

                syncs[channelName].triggers.map(({ onUpdates, onSyncRequest, onPullRequest })=>{
                    // onChange(data.data);
                    if(data.data){
                        Promise.resolve(onUpdates(data))
                            .then(() =>{ 
                                if(cb) cb({ ok: true })
                            })
                            .catch(err => { 
                                if(cb) { 
                                    cb({ err }) 
                                } else {
                                    console.error(tableName + " onUpdates error", err)
                                } 
                            });
                    } else if(data.onSyncRequest){
                        // cb(onSyncRequest());
                        Promise.resolve(onSyncRequest(data.onSyncRequest))
                            .then(res => cb({ onSyncRequest: res }))
                            .catch(err => { 
                                if(cb) { 
                                    cb({ err }) 
                                } else {
                                    console.error(tableName + " onSyncRequest error", err)
                                } 
                            })

                    } else if(data.onPullRequest){
                        Promise.resolve(onPullRequest(data.onPullRequest))
                            .then(arr =>{ 
                                cb({ data: arr });
                            })
                            .catch(err => { 
                                if(cb) { 
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
    const addSubQueuer = new FunctionQueuer(_addSub);
    async function addSub<T>(dbo: any, params: CoreParams, onChange: Function, _onError: Function): Promise<SubscriptionHandler<T>> {
        return addSubQueuer.run([dbo, params, onChange, _onError]);
    }
    
    /**
     * Do NOT use concurrently
     */
    async function _addSub<T>(dbo: any, { tableName, command, param1, param2 }: CoreParams, onChange: Function, _onError: Function): Promise<SubscriptionHandler<T>> {

        isAddingSub = true;
        function makeHandler(channelName: string){

            let unsubscribe = function(){
                return _unsubscribe(channelName, onChange);
            }
            let res: any = { unsubscribe, filter: { ...param1 } }
            /* Some dbo sorting was done to make sure this will work */
            if(dbo[tableName].update){                
                res = {
                    ...res,
                    update: function(newData: AnyObject, updateParams: UpdateParams){
                        return dbo[tableName].update(param1, newData, updateParams);
                    }
                }
            }
            if(dbo[tableName].delete){                
                res = {
                    ...res,
                    delete: function(deleteParams: DeleteParams){
                        return dbo[tableName].delete(param1, deleteParams);
                    }
                }
            }
            return Object.freeze(res);
        }

        const existing = Object.keys(subscriptions).find(ch => {
            let s = subscriptions[ch];
            return (
                s.tableName === tableName &&
                s.command === command &&
                JSON.stringify(s.param1 || {}) === JSON.stringify(param1 || {}) && 
                JSON.stringify(s.param2 || {}) === JSON.stringify(param2 || {})
            );
        });

        if(existing){
            subscriptions[existing].handlers.push(onChange);
            /* Reuse existing sub config */
            // if(subscriptions[existing].handlers.includes(onChange)){
            //     console.warn("Duplicate subscription handler was added for:", subscriptions[existing])
            // }
            setTimeout(() => {
                if(onChange && subscriptions?.[existing].lastData) onChange(subscriptions?.[existing].lastData)
            }, 10)
            isAddingSub = false;    
            return makeHandler(existing);
        } 

        const channelName = await addServerSub({ tableName, command, param1, param2 })

        let onCall = function(data: any, cb: Function){
            /* TO DO: confirm receiving data or server will unsubscribe */
            // if(cb) cb(true);
            if(subscriptions[channelName]){
                if(data.data){
                    subscriptions[channelName].lastData = data.data;
                    subscriptions[channelName].handlers.map(h => {
                        h(data.data);
                    });
                } else if(data.err){
                    subscriptions[channelName].errorHandlers.map(h => {
                        h(data.err);
                    });
                } else {
                    console.error("INTERNAL ERROR: Unexpected data format from subscription: ", data)
                }
            } else {
                console.warn("Orphaned subscription: ", channelName)
            }
        }
        let onError = _onError || function(err: any){ console.error(`Uncaught error within running subscription \n ${channelName}`, err) }

        socket.on(channelName, onCall);
        subscriptions[channelName] = {
            lastData: undefined,
            tableName,
            command,
            param1,
            param2,
            onCall,
            handlers: [onChange],
            errorHandlers: [onError],
            destroy: () => {
                if(subscriptions[channelName]){
                    Object.values(subscriptions[channelName]).map((s: Subscription)=> {
                        if(s && s.handlers) s.handlers.map(h => _unsubscribe(channelName, h))
                    });
                    delete subscriptions[channelName];
                }
            }
        }  
        
        isAddingSub = false;                      
        return makeHandler(channelName);  
            
    }

    return new Promise((resolve, reject)=>{

        if(onDisconnect){
            // socket.removeAllListeners("disconnect", onDisconnect)
            socket.on("disconnect", onDisconnect);
        }
        
        /* Schema = published schema */
        // socket.removeAllListeners(CHANNELS.SCHEMA)
        socket.on(CHANNELS.SCHEMA, ({ schema, methods, tableSchema, auth, rawSQL, joinTables = [], err }: ClientSchema) => {
            if(err){
                reject(err)
                throw err;
            }

            destroySyncs();
            if(connected && onReconnect){
                onReconnect(socket);
            }
            connected = true;

            let dbo: DBHandlerClient = JSON.parse(JSON.stringify(schema));
            let _methods: string[] = JSON.parse(JSON.stringify(methods)),
                methodsObj: MethodHandler = {},
                _auth = {};

            if(auth){
                if(auth.pathGuard){
                    const doReload = (res?: AuthGuardLocationResponse) => {
                        if(res?.shouldReload){
                            if(onReload) onReload();
                            else if(typeof window !== "undefined"){
                                window?.location?.reload?.();
                            }
                        }
                    }
                    socket.emit(CHANNELS.AUTHGUARD, JSON.stringify(window.location as AuthGuardLocation), (err: any,res: AuthGuardLocationResponse)=>{
                        doReload(res)
                    });

                    socket.removeAllListeners(CHANNELS.AUTHGUARD);
                    socket.on(CHANNELS.AUTHGUARD, (res: AuthGuardLocationResponse)=>{
                        doReload(res);
                    });
                }
                
                _auth = { ...auth };
                [CHANNELS.LOGIN, CHANNELS.LOGOUT, CHANNELS.REGISTER].map(funcName => {
                    if(auth[funcName]) {
                        _auth[funcName] = function(params){
                            return new Promise((resolve, reject) => {
                                socket.emit(preffix + funcName, params, (err,res)=>{
                                    if(err) reject(err);
                                    else resolve(res);
                                });
                            });
                        }
                    }
                });
            }

            _methods.map(method => {
                methodsObj[method] = function(...params){
                    return new Promise((resolve, reject)=>{
                        socket.emit(CHANNELS.METHOD, { method, params }, (err,res)=>{
                            if(err) reject(err);
                            else resolve(res);
                        });
                    })
                }
            });
            methodsObj = Object.freeze(methodsObj);

            if(rawSQL){
                // dbo.schema = Object.freeze([ ...dbo.sql ]);
                dbo.sql = function(query, params, options){
                    return new Promise((resolve, reject) => {
                        socket.emit(CHANNELS.SQL, { query, params, options }, (err, res)=>{
                            if(err) reject(err);
                            else {
                                if( options && 
                                    options.returnType === "noticeSubscription" &&
                                    res && 
                                    Object.keys(res).sort().join() === [ "socketChannel", "socketUnsubChannel"].sort().join() && 
                                    !Object.values(res).find(v => typeof v !== "string")
                                ){
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
                                } else if(
                                    (!options || !options.returnType || options.returnType !== "statement") &&
                                    res && 
                                    Object.keys(res).sort().join() === [ "socketChannel", "socketUnsubChannel", "notifChannel"].sort().join() && 
                                    !Object.values(res).find(v => typeof v !== "string")
                                ){
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
            const checkArgs = (basicFilter: AnyObject, options: AnyObject, onChange: Function, onError?: Function) => {
                if(!isPojo(basicFilter) || !isPojo(options) || !(typeof onChange === "function") || onError && typeof onError !== "function"){
                    throw "Expecting: ( basicFilter<object>, options<object>, onChange<function> , onError?<function>) but got something else";
                }
            }
            const sub_commands = ["subscribe", "subscribeOne"];
            Object.keys(dbo).forEach(tableName => {
                const all_commands = Object.keys(dbo[tableName]);
                
                all_commands
                .sort((a, b) => <never>sub_commands.includes(a) - <never>sub_commands.includes(b))
                .forEach(command => {
                    if(["find", "findOne"].includes(command)){
                        dbo[tableName].getJoinedTables = function(){
                            return (joinTables || [])
                            .filter(tb => Array.isArray(tb) && tb.includes(tableName))
                            .flat()
                            .filter(t => t !== tableName);
                        }
                    }

                    if(command === "sync"){
                        dbo[tableName]._syncInfo = { ...dbo[tableName][command] };
                        if(syncedTable){
                            dbo[tableName].getSync = (filter, params = {}) => {
                                return syncedTable.create({ name: tableName, filter, db: dbo, ...params });
                            }
                            const upsertSTable = async (basicFilter = {}, options = {}, onError) => {
                                const syncName = `${tableName}.${JSON.stringify(basicFilter)}.${JSON.stringify(options)}`
                                if(!syncedTables[syncName]){
                                    syncedTables[syncName] = await syncedTable.create({ ...options, name: tableName, filter: basicFilter, db: dbo, onError });
                                }
                                return syncedTables[syncName]
                            }
                            dbo[tableName].sync = async (basicFilter, options = { handlesOnData: true, select: "*" }, onChange, onError) => {
                                checkArgs(basicFilter, options, onChange, onError);
                                const s = await upsertSTable(basicFilter, options, onError);
                                return await s.sync(onChange, options.handlesOnData);
                            }
                            dbo[tableName].syncOne = async (basicFilter, options = { handlesOnData: true }, onChange, onError) => {
                                checkArgs(basicFilter, options, onChange, onError);
                                const s = await upsertSTable(basicFilter, options, onError);
                                return await s.syncOne(basicFilter, onChange, options.handlesOnData);
                            }
                        }
                        
                        dbo[tableName]._sync = function(param1, param2, syncHandles){
                            return addSync({ tableName, command, param1, param2 }, syncHandles);
                        }
                    } else if(sub_commands.includes(command)){
                        dbo[tableName][command] = function<T = AnyObject>(param1, param2, onChange, onError){
                            checkArgs(param1, param2, onChange, onError);
                            return addSub<T>(dbo, { tableName, command, param1, param2 }, onChange, onError);
                        };

                        const SUBONE = "subscribeOne";
                        if(command === SUBONE || !sub_commands.includes(SUBONE)){
                            dbo[tableName][SUBONE] = function<T = AnyObject>(param1, param2, onChange, onError){
                                checkArgs(param1, param2, onChange, onError);

                                let onChangeOne = (rows) => { onChange(rows[0]) };
                                return addSub<T>(dbo, { tableName, command, param1, param2 }, onChangeOne, onError);
                            };
                        }
                    } else {
                        dbo[tableName][command] = function(param1, param2, param3){
                            // if(Array.isArray(param2) || Array.isArray(param3)) throw "Expecting an object";
                            return new Promise((resolve, reject) => {
                                socket.emit(preffix, 
                                    { tableName, command, param1, param2, param3 },

                                    /* Get col definition and re-cast data types?! */
                                    (err, res) => {
                                        if(err) reject(err);
                                        else resolve(res);
                                    }
                                );
                            })
                        }
                    }
                })
            });


            // Re-attach listeners
            if(subscriptions && Object.keys(subscriptions).length){
                Object.keys(subscriptions).map(async ch => {
                    try {
                        let s = subscriptions[ch];
                        await addServerSub(s);
                        socket.on(ch, s.onCall);
                    } catch(err) {
                        console.error("There was an issue reconnecting old subscriptions", err)
                    }               
                });
            }
            if(syncs && Object.keys(syncs).length){
                Object.keys(syncs).filter(ch => {
                    return syncs[ch].triggers && syncs[ch].triggers.length
                }).map(async ch => {
                    try {
                        let s = syncs[ch];
                        await addServerSync(s, s.triggers[0].onSyncRequest);
                        socket.on(ch, s.onCall);
                    } catch(err) {
                        console.error("There was an issue reconnecting olf subscriptions", err)
                    }               
                });
            }


            joinTables.flat().map(table => {
                dbo.innerJoin = dbo.innerJoin || {};
                dbo.leftJoin = dbo.leftJoin || {};
                dbo.innerJoinOne = dbo.innerJoinOne || {};
                dbo.leftJoinOne = dbo.leftJoinOne || {};
                dbo.leftJoin[table] = (filter, select, options = {}) => {
                    return makeJoin(true, filter, select, options);
                }
                dbo.innerJoin[table] = (filter, select, options = {}) => {
                    return makeJoin(false, filter, select, options);
                }
                dbo.leftJoinOne[table] = (filter, select, options = {}) => {
                    return makeJoin(true, filter, select, {...options, limit: 1});
                }
                dbo.innerJoinOne[table] = (filter, select, options = {}) => {
                    return makeJoin(false, filter, select, {...options, limit: 1});
                }
                function makeJoin(isLeft = true, filter, select, options){
                    return {
                        [isLeft? "$leftJoin" : "$innerJoin"]: table,
                        filter,
                        select,
                        ...options
                    }
                }
            });

            (async () => {
                try {
                    await onReady(dbo, methodsObj, tableSchema, _auth);
                } catch(err){
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
    private queue: { arguments: Parameters<F>; onResult: (result: ReturnType<F>) => void }[] = [];
    private func: F;
    constructor(func: F){
        this.func = func;
    }
    private isRunning = false;
    async run(args: Parameters<F>): Promise<ReturnType<F>> {
        
        const result = new Promise<ReturnType<F>>((resolve, reject) => {
            const item = { arguments: args, onResult: resolve }
            this.queue.push(item);
        });

        const startQueueJob = async () => {
            if(this.isRunning) {
                return;
            }
            this.isRunning = true;
            const item = this.queue.shift();
            if(item){
                const result = await this.func(...item.arguments);
                item.onResult(result);
            }
            this.isRunning = false;
            if(this.queue.length){
                startQueueJob();
            }
        }

        startQueueJob();

        return result;
        
    }
}