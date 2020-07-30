
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Stefan L. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/


export function prostgles({  socket, isReady = (dbo: any, methods: any) => {}, onDisconnect }){

    const preffix = "_psqlWS_.";
    var subscriptions = [];

    return new Promise((resolve, reject)=>{

        if(onDisconnect){
            socket.on("disconnect", onDisconnect)
        }
        
        /* Schema = published schema */
        socket.on(preffix + 'schema', ({ schema, methods, fullSchema, joinTables = [] })=>{

            let dbo = JSON.parse(JSON.stringify(schema));
            let _methods = JSON.parse(JSON.stringify(methods)),
                methodsObj = {};

            joinTables.map(table => {
                dbo.innerJoin = dbo.innerJoin || {};
                dbo.leftJoin = dbo.leftJoin || {};
                dbo.leftJoin[table] = (filter, select, options) => {
                    return makeJoin(true, filter, select, options);
                }
                dbo.innerJoin[table] = (filter, select, options) => {
                    return makeJoin(false, filter, select, options);
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

            _methods.map(method => {
                methodsObj[method] = function(params){
                    return new Promise((resolve, reject)=>{
                        socket.emit(preffix + "method", { method, params }, (err,res)=>{
                            if(err) reject(err);
                            else resolve(res);
                        });
                    })
                }
            });
            methodsObj = Object.freeze(methodsObj);

            if(dbo.sql){
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
            Object.keys(dbo).forEach(tableName => {
                Object.keys(dbo[tableName]).forEach(command=>{

                    if(command === "sync"){
                        dbo[tableName]._syncInfo = { ...dbo[tableName][command] };
                        
                        function syncHandle(param1, param2, syncHandles){
                            const { onSyncRequest, onPullRequest, onUpdates } = syncHandles;
                            
                            var _this = this,
                                // channelName,
                                lastUpdated,
                                socketHandle;

                            socket.emit(preffix, { tableName, command, param1, param2, lastUpdated }, (err, res)=>{
                                if(err) {
                                    console.error(err);
                                } else if(res) {
                                    
                                    // channelName = res.channelName;
                                    const { id_fields, synced_field, channelName } = res,
                                        sync_info = { id_fields, synced_field };

                                    _this.sync_info = sync_info;
                                    _this.channelName = channelName;
                                    _this.socket = socket;

                                    _this.syncData = function(data, deleted, cb){
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

                                    socket.emit(channelName, { onSyncRequest: onSyncRequest({}, sync_info) }, (response) => {
                                        console.log(response)
                                    });

                                    socketHandle = function(data, cb){
                                    /*               
                                        Client will:
                                        1. Send last_synced     on(onSyncRequest)
                                        2. Send data >= server_synced   on(onPullRequest)
                                        3. Send data on CRUD    emit(data.data)
                                        4. Upsert data.data     on(data.data)
                                    */
                                        if(!data) return;

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

                                    }
                                    subscriptions.push({ channelName, syncHandles, socketHandle });

                                    socket.on(channelName, socketHandle);
                                }
                            });

                            function unsync(){
                                return new Promise((resolve, reject) => {
                                    var subs = subscriptions.filter(s => s.channelName === _this.channelName);

                                    if(subs.length === 1){
                                        subscriptions = subscriptions.filter(s => s.channelName !== _this.channelName);
                                        socket.emit(_this.channelName + "unsync", {}, (err, res)=>{
                                            if(err) reject(err);
                                            else resolve(res);
                                        });

                                    } else if(subs.length > 1){
                                        // socket.removeListener(channelName, socketHandle);
                                    } else {
                                        console.log("no syncs to unsync from", subs)
                                    }
                                    socket.removeListener(_this.channelName, socketHandle);
                                });
                            }

                            function syncData(data, deleted){
                                if(_this && _this.syncData){
                                    _this.syncData(data, deleted);
                                }
                            }

                            return Object.freeze({ unsync, syncData });
                        }
                        dbo[tableName][command] = syncHandle;
                    } else if(command === "subscribe"){
                        function handle(param1, param2, onChange){

                            var _this = this,
                                channelName,
                                lastUpdated,
                                socketHandle;

                            socket.emit(preffix, { tableName, command, param1, param2, lastUpdated }, (err, res) => {
                                if(err) {
                                    console.error(err);
                                } else if(res) {
                                    
                                    channelName = res.channelName;

                                    socketHandle = function(data, cb){
                                        /* TO DO: confirm receiving data or server will unsubscribe */
                                        // if(cb) cb(true);
                                        onChange(data.data);
                                        
                                        /* Cache */
                                        // window.localStorage.setItem(channelName, JSON.stringify(data))

                                        _this.channelName = channelName;
                                        _this.socket = socket;
                                    }
                                    subscriptions.push({ channelName, onChange, socketHandle });

                                    socket.on(channelName, socketHandle);
                                }
                            });

                            function unsubscribe(){
                                var subs = subscriptions.filter(s => s.channelName === channelName);

                                if(subs.length === 1){
                                    subscriptions = subscriptions.filter(s => s.channelName !== channelName);
                                    socket.emit(channelName + "unsubscribe", {}, (err, res)=>{
                                        // console.log("unsubscribed", err, res);
                                    });

                                } else if(subs.length > 1){
                                    // socket.removeListener(channelName, socketHandle);
                                } else {
                                    console.log("no subscriptions to unsubscribe from", subs)
                                }
                                socket.removeListener(channelName, socketHandle);
                            }

                            return Object.freeze({ unsubscribe });
                        }

                        dbo[tableName][command] = handle;

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

            isReady(dbo, methodsObj);
            resolve(dbo);
        });

    })
};
