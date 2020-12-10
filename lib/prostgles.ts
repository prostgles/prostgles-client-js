
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Stefan L. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
export type Auth = {
    register?: (params: any) => Promise<any>;
    login?: (params: any) => Promise<any>;
    logout?: (params: any) => Promise<any>;
    user?: any;
}

export type InitOptions = {
    socket: any;
    onReady: (dbo: any, methods?: any, fullSchema?: any, auth?: Auth) => any;
    onDisconnect?: (socket: any) => any;
}
type SubscriptionHandler = {
    unsubscribe: Function;
    update?: (object)=>Promise<any> | any;
}
type Subscriptions = {
    [ke: string]: { 
        tableName: string, 
        command: string, 
        param1: object, 
        param2: object,
        onCall: Function, 
        handlers: Function[]
    }
};
export type SyncTriggers = {
    onSyncRequest: (params, sync_info) => { c_fr: object, c_lr: object, c_count: number }, 
    onPullRequest: ({ from_synced, offset, limit }, sync_info) => object[], 
    onUpdates: (data: object[], sync_info) => any | void;
};
export type SyncInfo = {
    id_fields: string[], 
    synced_field: string, 
    channelName: string
}
type Syncs = {
    [channelName: string]: { 
        tableName: string,
        command: string,
        param1: object, 
        param2: object,
        onCall: Function,
        syncInfo: SyncInfo;
        triggers: SyncTriggers[]
    }
};
export function prostgles(initOpts: InitOptions, syncedTable: any){
    const { socket, onReady, onDisconnect } = initOpts;
    const preffix = "_psqlWS_.";
    let subscriptions: Subscriptions = {};
    // window["subscriptions"] = subscriptions;
    let syncedTables = {};
    let syncs = [];
    let ssyncs: Syncs = {};

    function _unsubscribe(channelName: string, handler: Function){
        if(subscriptions[channelName]){
            subscriptions[channelName].handlers = subscriptions[channelName].handlers.filter(h => h !== handler);
            if(!subscriptions[channelName].handlers.length){
                socket.emit(channelName + "unsubscribe", {}, (err, res)=>{
                    // console.log("unsubscribed", err, res);
                });
                socket.removeListener(channelName, subscriptions[channelName].onCall);
                delete subscriptions[channelName];
            }
        }
    }

    function _unsync(channelName: string, triggers: SyncTriggers){
        return new Promise((resolve, reject) => {
            if(ssyncs[channelName]){
                ssyncs[channelName].triggers = ssyncs[channelName].triggers.filter(tr => (
                    tr.onPullRequest !== triggers.onPullRequest &&
                    tr.onSyncRequest !== triggers.onSyncRequest &&
                    tr.onUpdates !== triggers.onUpdates
                ));
                
                if(!ssyncs[channelName].triggers.length){
                    socket.emit(channelName + "unsync", {}, (err, res)=>{
                        if(err) reject(err);
                        else resolve(res);
                    });
                    socket.removeListener(channelName, ssyncs[channelName].onCall);
                    delete ssyncs[channelName];
                }
            }
        });
    }
    function addServerSync({ tableName, command, param1, param2 }, onSyncRequest): Promise<SyncInfo>{
        return new Promise((resolve, reject) => {                           
            socket.emit(preffix, { tableName, command, param1, param2 }, (err, res) => {
                if(err) {
                    console.error(err);
                    reject(err);
                } else if(res) {
                    const { id_fields, synced_field, channelName } = res;

                    socket.emit(channelName, { onSyncRequest: onSyncRequest({}, res) }, (response) => {
                        console.log(response);
                    });
                    resolve({ id_fields, synced_field, channelName });                     
                }
            });
        });
    }
    function addServerSub({ tableName, command, param1, param2 }): Promise<string>{
        return new Promise((resolve, reject) => { 
            socket.emit(preffix, { tableName, command, param1, param2 }, (err, res) => {
                if(err) {
                    console.error(err);
                    reject(err);
                } else if(res) {
                    resolve(res.channelName);                     
                }
            });
        });
    }
    async function addSync({ tableName, command, param1, param2 }, triggers: SyncTriggers): Promise<any> {
        const { onPullRequest, onSyncRequest, onUpdates } = triggers;

        function makeHandler(channelName: string, sync_info: SyncInfo){
            let unsync = function(){
                _unsync(channelName, triggers);
            }

            let syncData = function(data, deleted, cb){
                socket.emit(channelName, 
                    { 
                        onSyncRequest: {
                            ...onSyncRequest({}, sync_info), 
                            ...({ data } || {}),
                            ...({ deleted } || {}) 
                        },
                    },
                    !cb? null : (response) => {
                        cb(response)
                    }
                );
            }

            return Object.freeze({ unsync, syncData });
        }

        const existingChannel = Object.keys(ssyncs).find(ch => {
            let s = ssyncs[ch];
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
            ssyncs[existingChannel].triggers.push(triggers);
            return makeHandler(existingChannel, ssyncs[existingChannel].syncInfo);
        } else {
            const sync_info = await addServerSync({ tableName, command, param1, param2 }, onSyncRequest);
            const { channelName, synced_field, id_fields } = sync_info;
            function onCall(data, cb){
                /*               
                    Client will:
                    1. Send last_synced     on(onSyncRequest)
                    2. Send data >= server_synced   on(onPullRequest)
                    3. Send data on CRUD    emit(data.data)
                    4. Upsert data.data     on(data.data)
                */
                if(!data) return;

                if(!ssyncs[channelName]) return;

                ssyncs[channelName].triggers.map(({ onUpdates, onSyncRequest, onPullRequest })=>{
                    // onChange(data.data);
                    if(data.data && data.data.length){
                        Promise.resolve(onUpdates(data.data, sync_info))
                            .then(() =>{ 
                                if(cb) cb({ ok: true })
                            })
                            .catch(err => { if(cb) { cb({ err }) } });
                    } else if(data.onSyncRequest){
                        // cb(onSyncRequest());
                        Promise.resolve(onSyncRequest(data.onSyncRequest, sync_info))
                            .then(res => cb({ onSyncRequest: res }))
                            .catch(err => { if(cb) { cb({ err }) } })

                    } else if(data.onPullRequest){
                        Promise.resolve(onPullRequest(data.onPullRequest, sync_info))
                            .then(arr =>{ 
                                cb({ data: arr });
                            })
                            .catch(err => { if(cb) { cb({ err }) } })
                    } else {
                        console.log("unexpected response")
                    }
                    
                    /* Cache */
                    // window.localStorage.setItem(channelName, JSON.stringify(data))
                })


            }
            ssyncs[channelName] = {
                tableName,
                command,
                param1,
                param2,
                triggers: [triggers],
                syncInfo: sync_info,
                onCall
            }

            socket.on(channelName, onCall);
            return makeHandler(channelName, sync_info);
        }

    }
    async function addSub(dbo: any, { tableName, command, param1, param2 }, onChange: Function): Promise<SubscriptionHandler> {
        function makeHandler(channelName: string){

            let unsubscribe = function(){
                _unsubscribe(channelName, onChange);
            }
            let res: any = { unsubscribe }
            /* Some dbo sorting was done to make sure this will work */
            if(dbo[tableName].update){                
                res = {
                    ...res,
                    update: function(newData, updateParams){
                        return dbo[tableName].update(param1, newData, updateParams);
                    }
                }
            }
            if(dbo[tableName].delete){                
                res = {
                    ...res,
                    delete: function(deleteParams){
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
            if(subscriptions[existing].handlers.includes(onChange)){
                console.warn("Duplicate subscription handler was added for:", subscriptions[existing])
            }
            return makeHandler(existing);
        } else {
            const channelName = await addServerSub({ tableName, command, param1, param2 })

            let onCall = function(data, cb){
                /* TO DO: confirm receiving data or server will unsubscribe */
                // if(cb) cb(true);
                subscriptions[channelName].handlers.map(h => {
                    h(data.data);
                });
            }

            socket.on(channelName, onCall);
            subscriptions[channelName] = {
                tableName,
                command,
                param1,
                param2,
                onCall,
                handlers: [onChange]
            }                        
            return makeHandler(channelName);   
        }
    }

    return new Promise((resolve, reject)=>{

        if(onDisconnect){
            socket.on("disconnect", onDisconnect);
        }
        
        /* Schema = published schema */
        socket.on(preffix + 'schema', ({ schema, methods, fullSchema, auth, rawSQL, joinTables = [], err }) => {
            if(err) throw err;

            let dbo = JSON.parse(JSON.stringify(schema));
            let _methods = JSON.parse(JSON.stringify(methods)),
                methodsObj = {},
                _auth = {};

            if(auth){
                _auth = { ...auth };
                ["login", "logout", "register"].map(funcName => {
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
                        socket.emit(preffix + "method", { method, params }, (err,res)=>{
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
                    return new Promise((resolve, reject)=>{
                        socket.emit(preffix + "sql", { query, params, options }, (err,res)=>{
                            if(err) reject(err);
                            else resolve(res);
                        });
                    });
                }
            }

            /* Building DBO object */
            const sub_commands = ["subscribe", "subscribeOne"];
            Object.keys(dbo).forEach(tableName => {
                Object.keys(dbo[tableName])
                .sort((a, b) => <never>sub_commands.includes(a) - <never>sub_commands.includes(b))
                .forEach(command=>{

                    if(command === "sync"){
                        dbo[tableName]._syncInfo = { ...dbo[tableName][command] };
                        if(syncedTable){
                            dbo[tableName].getSync = (filter, params = {}) => {
                                return new syncedTable({ name: tableName, filter, db: dbo, ...params });
                            }
                            const usertSTable = (basicFilter) => {
                                const syncName = `${tableName}.${JSON.stringify(basicFilter || {})}`
                                if(!syncedTables[syncName]){
                                    syncedTables[syncName] = new syncedTable({ name: tableName, filter: basicFilter, db: dbo });
                                }
                                return syncedTables[syncName]
                            }
                            dbo[tableName].sync = (basicFilter, onChange, handlesOnData = false) => {
                                const s = usertSTable(basicFilter);
                                return s.sync(onChange, handlesOnData);
                            }
                            dbo[tableName].syncOne = (basicFilter, onChange, handlesOnData = false) => {
                                const s = usertSTable(basicFilter);
                                return s.syncOne(basicFilter, onChange, handlesOnData);
                            }
                        }
                        
                        dbo[tableName]._sync = function(param1, param2, syncHandles){
                            return addSync({ tableName, command, param1, param2 }, syncHandles);
                        }
                    } else if(sub_commands.includes(command)){
                        dbo[tableName][command] = function(param1, param2, onChange){
                            return addSub(dbo, { tableName, command, param1, param2 }, onChange);
                        };
                    } else {
                        dbo[tableName][command] = function(param1, param2, param3){
                            // if(Array.isArray(param2) || Array.isArray(param3)) throw "Expecting an object";
                            return new Promise((resolve, reject) => {
                                socket.emit(preffix, { tableName, command, param1, param2, param3 }, (err,res)=>{
                                    if(err) reject(err);
                                    else resolve(res);
                                });
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
                        console.error("There was an issue reconnecting olf subscriptions", err)
                    }               
                });
            }
            if(ssyncs && Object.keys(ssyncs).length){
                Object.keys(ssyncs).filter(ch => {
                    return ssyncs[ch].triggers && ssyncs[ch].triggers.length
                }).map(async ch => {
                    try {
                        let s = ssyncs[ch];
                        await addServerSync(s, s.triggers[0].onSyncRequest);
                        socket.on(ch, s.onCall);
                    } catch(err) {
                        console.error("There was an issue reconnecting olf subscriptions", err)
                    }               
                });
            }


            joinTables.map(table => {
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

            try {
                onReady(dbo, methodsObj, fullSchema, _auth);
            } catch(err){
                console.error("Prostgles: Error within onReady: \n", err);
            }

            resolve(dbo);
        });

    })
};
