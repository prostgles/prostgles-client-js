const preffix = "_psqlWS_.";
var subscriptions = []
function getChannelName({tableName, param1, param2}){
    return `_psqlWS_.${tableName}.${JSON.stringify(param1 || {})}.${JSON.stringify(param2 || {})}`
}

const psqlWS = {
    init: function({ socket, isReady = () => {}, onDisconnect }){
        return new Promise((resolve, reject)=>{

            if(onDisconnect){
                socket.on("disconnect", onDisconnect)
            }
            
            socket.on(preffix + 'schema', (schema)=>{

                let dbo = JSON.parse(JSON.stringify(schema));

                if(dbo.sql){
                    dbo.schema = Object.freeze([ ...dbo.sql ]);
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
                            
                            function handle(param1, param2, syncHandles){
                                const { onSyncRequest, onPullRequest, onUpdates } = syncHandles;
                                
                                var _this = this,
                                    // channelName,
                                    lastUpdated,
                                    socketHandle;

                                socket.emit(preffix, { tableName, command, param1, param2, lastUpdated }, (err, res)=>{
                                    if(err) {
                                        throw err
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
                            dbo[tableName][command] = handle;
                        } else if(command === "subscribe"){
                            function handle(param1, param2, onChange){

                                var _this = this,
                                    channelName,
                                    lastUpdated,
                                    socketHandle;
                                    
                                /* Cache */
                                // let cachedStr = window.localStorage.getItem(getChannelName({tableName, param1, param2}));
                                // if(cachedStr){
                                //     let cached = JSON.parse(cachedStr);
                                //     lastUpdated = cached.lastUpdated;
                                //     onChange(cached.data);
                                // }

                                socket.emit(preffix, { tableName, command, param1, param2, lastUpdated }, (err, res)=>{
                                    if(err) {
                                        throw err
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
                            // handle.prototype.unsubscribe = function(){
                            //     let channelName = this.channelName
                            //     this.socket.emit(preffix, {channelName, unsubscribe: true}, (err, channelName)=>{
                            //         console.log(err, res)
                            //     });
                            // }

                            dbo[tableName][command] = handle;

                        } else {
                            dbo[tableName][command] = function(param1, param2, param3){
                                return new Promise((resolve, reject)=>{
                                    socket.emit(preffix, { tableName, command, param1, param2, param3 }, (err,res)=>{
                                        if(err) reject(err);
                                        else resolve(res);
                                    });
                                })
                            }
                        }
                    })
                });

                isReady(dbo);
                resolve(dbo);
            });

        })
    }
}

function getHashCode(str) {
    var hash = 0, i, chr;
    for (i = 0; i < str.length; i++) {
        chr   = str.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

class SyncedTable {
    constructor({ name, filter, onChange, db, id_fields, synced_field, pushDebounce = 100, skipFirstTrigger = false }){
        this.name = name;
        this.filter = filter;
        this.onChange = onChange;
        this.db = db;
        this.id_fields = id_fields;
        this.synced_field = synced_field;
        this.pushDebounce = pushDebounce;
        this.isSendingData = null;
        this.skipFirstTrigger = skipFirstTrigger;

        this.subscriptions = [];
        
        const onSyncRequest = (params, sync_info) => {
                
                let res = { c_lr: null, c_fr: null, c_count: 0 };

                let batch = this.getBatch(params, sync_info);
                if(batch.length){

                    res = { 
                        c_fr: batch[0] || null,
                        c_lr: batch[batch.length - 1] || null, 
                        c_count: batch.length
                    };
                }
                
                // console.log("onSyncRequest", res);
                return res;
            },
            onPullRequest = async (params, sync_info) => {
                
                if(this.getDeleted().length){
                    await this.syncDeleted();
                }
                const data = this.getBatch(params, sync_info);
                // console.log(`onPullRequest: total(${ data.length })`)
                return data;
            };
        
        this.dbSync = db[this.name].sync(filter, { },{ onSyncRequest, onPullRequest, onUpdates: (data) => { 
            this.upsert(data, true) 
        } });

        if(this.onChange && !this.skipFirstTrigger){
            setTimeout(this.onChange, 0);
        }
    }

    subscribeAll(onChange){

        const sub = { onChange },
            unsubscribe = () => { this.unsubscribe(onChange); };

        this.subscriptions.push(sub);
        if(!this.skipFirstTrigger){
            onChange(this.getItems());
        }
        return Object.freeze({ unsubscribe });
    }

    subscribeOne(idObj, onChange){
        if(!idObj || !onChange) throw "bad";
        const item = this.findOne(idObj);

        if(!item) throw "no item found";

        const sub = {
                onChange,
                idObj,
                item
            };
            
        const syncHandle = {
            get: () => this.findOne(idObj),
            unsubscribe: () => {
                this.unsubscribe(onChange)
            },
            delete: () => {
                return this.delete(idObj);
            },
            update: data => {
                // const newData = { ...this.findOne(idObj), ...data, ...idObj };
                // notifySubscriptions(newData, data);
                // this.upsert([newData]);

                this.updateOne(idObj, data)
            },
            updateFull: data => {
                const newData = { ...data, ...idObj }
                this.notifySubscriptions(idObj, newData, data);
                this.upsert([newData]);
            }
        };
        

        this.subscriptions.push(sub);
        setTimeout(()=>onChange(item, item), 0);

        return Object.freeze({ ...syncHandle });
    }

    notifySubscriptions = (idObj, newData, delta) => {
        this.subscriptions.filter(s => 
            s.idObj &&
            this.matchesIdObj(s.idObj, idObj) && 
            Object.keys(s.idObj).length <= Object.keys(idObj).length)
        .map(s => {
            s.onChange(newData, delta);
        });
    };


    updateOne(idObj, newData){
        const item = { ...this.findOne(idObj), ...newData, ...idObj };
        this.notifySubscriptions(idObj, item, newData);
        this.upsert([item]);
    }

    unsubscribe = (onChange) => {
        this.subscriptions = this.subscriptions.filter(s => s.onChange !== onChange);
    }

    findOne(idObj){
        this.getItems();
        const itemIdx = this.items.findIndex(d => this.matchesIdObj(idObj, d) )
        return this.items[itemIdx];
    }

    getIdObj(d){
        let res = {};
        this.id_fields.map(key => {
            res[key] = d[key];
        })
        return res;
    }

    unsync = () => {
        if(this.dbSync && this.dbSync.unsync) this.dbSync.unsync();
    }

    matchesIdObj(idObj, d){
        return Object.keys(idObj).length && !Object.keys(idObj).find(key => d[key] !== idObj[key])
    }

    deleteAll(){
        this.getItems().map(this.getIdObj).map(this.delete);
    }

    delete = (idObj) => {
        let items = this.getItems();
        items = items.filter(d => !this.matchesIdObj(idObj, d) );

        window.localStorage.setItem(this.name, JSON.stringify(items));
        return this.onDataChanged(null, [idObj]);
    }

    setDeleted(idObj, fullArray){
        let deleted = [];
        
        if(fullArray) deleted = fullArray;
        else {
            deleted = this.getDeleted();
            deleted.push(idObj);
        }
        window.localStorage.setItem(this.name + "_$$psql$$_deleted", deleted);
    }
    getDeleted(){
        const delStr = window.localStorage.getItem(this.name + "_$$psql$$_deleted") || '[]';
        return JSON.parse(delStr);
    }
    syncDeleted = async () => {
        try {
            await Promise.await(this.getDeleted().map(async idObj => {
                return db[this.name].delete(idObj);
            }));
            this.setDeleted(null, []);
            return true;
        } catch(e){
            throw e;
        }
    }

    upsert = async (data, from_server = false) => {
        let items = this.getItems();

        if(from_server && this.getDeleted().length){
            await this.syncDeleted();
        }
        let updates = [], inserts = [];
        data.map(d => {
            if(!from_server) d[this.synced_field] = Date.now();

            let existing_idx = items.findIndex(c => !this.id_fields.find(key => c[key] !== d[key])),
                existing = items[existing_idx];
            if(existing && existing[this.synced_field] < d[this.synced_field]){
                items[existing_idx] = { ...d };
                updates.push(d);
                
                if(from_server){
                    this.subscriptions.filter(s => s.idObj && this.matchesIdObj(s.idObj, d))
                        .map(s => {
                            s.onChange({ ...d }, { ...d });
                        });
                }
            } else if(!existing) {
                items.push({ ...d });
                inserts.push(d);
            }

            /* TODO: Deletes from server */
            // if(allow_deletes){
            //     items = this.getItems();
            // }
        });
        // console.log(`onUpdates: inserts( ${inserts.length} ) updates( ${updates.length} )  total( ${data.length} )`);
        const newData = [...inserts, ...updates];
        window.localStorage.setItem(this.name, JSON.stringify(items));
        
        this.onDataChanged(newData, null, from_server);
        
        return true;
    }

    onDataChanged = async (newData = null, deletedData = null, from_server = false) => {
        return new Promise((resolve, reject) => {

            const items = this.getItems();
            this.subscriptions.filter(s => !s.idObj).map(s =>{ s.onChange(items, newData) });
            if(this.onChange){
                this.onChange(items, newData);
            }
            window.onbeforeunload = confirmExit;
            function confirmExit() {
                return "Data may be lost. Are you sure?";
            }
            if(!from_server && this.dbSync && this.dbSync.syncData){
                if(this.isSendingData){
                    window.clearTimeout(this.isSendingData);
                }
                this.isSendingData = setTimeout(async ()=>{
                    await this.dbSync.syncData(newData, deletedData);
                    resolve(true);
                    this.isSendingData = null;
                    window.onbeforeunload = null;
                }, this.pushDebounce);
            }
            resolve(true);
        })
    }

    getItems = (sync_info) => {
        let cachedStr = window.localStorage.getItem(this.name),
            items = [];
        if(cachedStr){
            try {
                items = JSON.parse(cachedStr);
            } catch(e){
                console.error(e);
            }
        }
        if(this.id_fields && this.synced_field){
            const s_fields = [this.synced_field, ...this.id_fields.sort()];
            items = items
                .filter(d => {
                    return !this.filter || !Object.keys(this.filter).find(key => d[key].toString() !== this.filter[key].toString())
                })
                .sort((a, b) => 
                    s_fields.map(key => 
                        a[key] < b[key]? -1 : a[key] > b[key]? 1 : 0
                    ).find(v => v) 
                );
        }
        this.items = items;
        return items;
    }

    getBatch = (params, sync_info) => {
        let items = this.getItems();
        params = params || {};
        const { from_synced, to_synced, offset = 0, limit = null } = params;
        let res = items.map(c => ({ ...c }))
            .filter(c =>
                (!from_synced || c[this.synced_field] >= from_synced) &&
                (!to_synced || c[this.synced_field] <= to_synced)
            );

        if(offset || limit) res = res.splice(offset, limit || res.length);

        return res;
    }
}