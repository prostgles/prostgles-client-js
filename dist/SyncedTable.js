"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncedTable = void 0;
const STORAGE_TYPES = {
    array: "array",
    localStorage: "localStorage"
};
class SyncedTable {
    constructor({ name, filter, onChange, db, pushDebounce = 100, skipFirstTrigger = false }) {
        this.pushDebounce = 100;
        this.skipFirstTrigger = false;
        this.items = [];
        this.storageType = STORAGE_TYPES.array;
        this.itemsObj = {};
        this.notifyMultiSubscriptions = (newData, delta) => {
            this.multiSubscriptions.map(s => {
                let items = this.getItems();
                if (s.handlesOnData && s.handles) {
                    items = items.map(d => ({
                        ...d,
                        $update: (newData) => {
                            return this.updateOne({ ...d }, newData);
                        },
                        $delete: async () => {
                            try {
                                const idObj = this.getIdObj({ ...d });
                                await this.db[this.name].delete(idObj);
                                return this.delete(idObj);
                            }
                            catch (err) {
                                return Promise.reject(err);
                            }
                        }
                    }));
                }
                s.onChange(items, newData);
            });
        };
        this.notifySingleSubscriptions = (idObj, newData, delta) => {
            this.singleSubscriptions.filter(s => s.idObj &&
                this.matchesIdObj(s.idObj, idObj) &&
                Object.keys(s.idObj).length <= Object.keys(idObj).length)
                .map(s => {
                let newItem = { ...newData };
                if (s.handlesOnData && s.handles) {
                    newItem.$update = s.handles.update;
                    newItem.$delete = s.handles.delete;
                    newItem.$unsync = s.handles.unsync;
                }
                s.onChange(newItem, delta);
            });
        };
        this.unsubscribe = (onChange) => {
            this.singleSubscriptions = this.singleSubscriptions.filter(s => s.onChange !== onChange);
            this.multiSubscriptions = this.multiSubscriptions.filter(s => s.onChange !== onChange);
        };
        this.unsync = () => {
            if (this.dbSync && this.dbSync.unsync)
                this.dbSync.unsync();
        };
        this.delete = (idObj) => {
            let items = this.getItems();
            items = items.filter(d => !this.matchesIdObj(idObj, d));
            // window.localStorage.setItem(this.name, JSON.stringify(items));
            this.setItems(items);
            return this.onDataChanged(null, null, [idObj]);
        };
        this.syncDeleted = async () => {
            try {
                await Promise.all(this.getDeleted().map(async (idObj) => {
                    return this.db[this.name].delete(idObj);
                }));
                this.setDeleted(null, []);
                return true;
            }
            catch (e) {
                throw e;
            }
        };
        this.upsert = async (data, delta, from_server = false) => {
            if (!data)
                throw "No data provided for upsert";
            if (from_server && this.getDeleted().length) {
                await this.syncDeleted();
            }
            let _data = Array.isArray(data) ? data : [data];
            let _delta = Array.isArray(delta) ? delta : [delta];
            let items = this.getItems();
            let updates = [], inserts = [], deltas = [];
            _data.map((_d, i) => {
                let d = { ..._d };
                /* Add synced if missing */
                if (!from_server)
                    d[this.synced_field] = Date.now();
                let existing_idx = items.findIndex(c => !this.id_fields.find(key => c[key] !== d[key])), existing = items[existing_idx];
                if (existing && existing[this.synced_field] < d[this.synced_field]) {
                    items[existing_idx] = { ...d };
                    updates.push(d);
                    if (_delta && _delta[i]) {
                        deltas.push(_delta[i]);
                    }
                    else {
                        deltas.push(d);
                        // Object.keys(_d)
                        // let dlt = Array.from(new Set()).map(key => ).reduce((a, v) => {
                        // }, {})
                    }
                    // if(from_server){
                    //     this.singleSubscriptions.filter(s => s.idObj && this.matchesIdObj(s.idObj, d))
                    //         .map(s => {
                    //             s.onChange({ ...d }, { ...d });
                    //         });
                    // }
                }
                else if (!existing) {
                    items.push({ ...d });
                    inserts.push(d);
                    deltas.push(d);
                }
                /* TODO: Deletes from server */
                // if(allow_deletes){
                //     items = this.getItems();
                // }
            });
            // console.log(`onUpdates: inserts( ${inserts.length} ) updates( ${updates.length} )  total( ${data.length} )`);
            const newData = [...inserts, ...updates].map(d => ({ ...d }));
            // window.localStorage.setItem(this.name, JSON.stringify(items));
            this.setItems(items);
            return this.onDataChanged(newData, deltas, null, from_server);
            // return true;
        };
        this.onDataChanged = async (newData = null, delta = null, deletedData = null, from_server = false) => {
            const setSending = (rows, cb) => {
                this.isSendingData = this.isSendingData || {};
                rows.map(r => {
                    let idStr = JSON.stringify(this.getIdObj(r));
                    if (this.isSendingData[idStr]) {
                        this.isSendingData[idStr].n = { ...this.isSendingData[idStr].n, ...r };
                        if (cb)
                            this.isSendingData[idStr].cbs.push(cb);
                    }
                    else {
                        this.isSendingData[idStr] = {
                            o: this.findOne(this.getIdObj(r)),
                            n: r,
                            cbs: cb ? [cb] : []
                        };
                    }
                });
            }, getSending = () => {
                const PUSH_BATCH_SIZE = 20;
                return Object.keys(this.isSendingData).slice(0, PUSH_BATCH_SIZE).map(k => this.isSendingData[k].n);
            }, finishSending = (rows, revert = false) => {
                rows.map(r => {
                    if (revert) {
                    }
                    else {
                        this.isSendingData[JSON.stringify(this.getIdObj(r))].cbs.map(cb => { cb(); });
                        delete this.isSendingData[JSON.stringify(this.getIdObj(r))];
                    }
                });
            }, pushDataToServer = async (newItems = null, deletedData = null, callback = null) => {
                if (newItems) {
                    setSending(newItems, callback);
                }
                // if(callback) this.isSendingDataCallbacks.push(callback);
                if (deletedData || this.isSendingData && Object.keys(this.isSendingData).length) {
                    window.onbeforeunload = confirmExit;
                    function confirmExit() {
                        return "Data may be lost. Are you sure?";
                    }
                    const newBatch = getSending(); // this.isSendingData.slice(0, PUSH_BATCH_SIZE);
                    try {
                        await this.dbSync.syncData(newBatch, deletedData);
                        finishSending(newBatch);
                        pushDataToServer();
                    }
                    catch (err) {
                        console.error(err);
                    }
                }
                else {
                    window.onbeforeunload = null;
                    // this.isSendingDataCallbacks.map(cb => { cb(); });
                    // this.isSendingDataCallbacks = [];
                }
            };
            return new Promise((resolve, reject) => {
                const items = this.getItems();
                if (newData && newData.length) {
                    newData.map((d, i) => {
                        let dlt = {};
                        if (delta && delta.length)
                            dlt = delta[i];
                        this.notifySingleSubscriptions(this.getIdObj({ ...d }), { ...d }, { ...dlt });
                    });
                    this.notifyMultiSubscriptions(items, newData);
                }
                if (this.onChange) {
                    this.onChange(items, newData);
                }
                /* Local updates. Need to push to server */
                if (!from_server && this.dbSync && this.dbSync.syncData) {
                    pushDataToServer(newData, deletedData, () => {
                        resolve(true);
                    });
                }
                else {
                    resolve(true);
                }
            });
        };
        this.setItems = (items) => {
            if (this.storageType === STORAGE_TYPES.localStorage) {
                window.localStorage.setItem(this.name, JSON.stringify(items));
            }
            else if (this.storageType === STORAGE_TYPES.array) {
                this.items = items;
            }
            else {
                console.log("invalid/missing storageType -> " + this.storageType);
            }
        };
        this.getItems = (sync_info) => {
            let items = [];
            if (this.storageType === STORAGE_TYPES.localStorage) {
                let cachedStr = window.localStorage.getItem(this.name);
                if (cachedStr) {
                    try {
                        items = JSON.parse(cachedStr);
                    }
                    catch (e) {
                        console.error(e);
                    }
                }
            }
            else if (this.storageType === STORAGE_TYPES.array) {
                items = this.items.slice(0);
            }
            else {
                console.log("invalid/missing storageType -> " + this.storageType);
            }
            if (this.id_fields && this.synced_field) {
                const s_fields = [this.synced_field, ...this.id_fields.sort()];
                items = items
                    .filter(d => {
                    return !this.filter || !Object.keys(this.filter).find(key => d[key].toString() !== this.filter[key].toString());
                })
                    .sort((a, b) => s_fields.map(key => a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0).find(v => v));
            }
            this.items = items;
            return items.map(d => ({ ...d }));
        };
        this.getBatch = (params) => {
            let items = this.getItems();
            params = params || {};
            const { from_synced, to_synced, offset = 0, limit = null } = params;
            let res = items.map(c => ({ ...c }))
                .filter(c => (!from_synced || c[this.synced_field] >= from_synced) &&
                (!to_synced || c[this.synced_field] <= to_synced));
            if (offset || limit)
                res = res.splice(offset, limit || res.length);
            return res;
        };
        this.name = name;
        this.filter = filter;
        this.onChange = onChange;
        if (!db)
            throw "db missing";
        this.db = db;
        const { id_fields, synced_field } = db[this.name]._syncInfo;
        if (!id_fields || !synced_field)
            throw "id_fields/synced_field missing";
        this.id_fields = id_fields;
        this.synced_field = synced_field;
        this.pushDebounce = pushDebounce;
        this.isSendingData = {};
        this.skipFirstTrigger = skipFirstTrigger;
        this.multiSubscriptions = [];
        this.singleSubscriptions = [];
        const onSyncRequest = (params) => {
            let res = { c_lr: null, c_fr: null, c_count: 0 };
            let batch = this.getBatch(params);
            if (batch.length) {
                res = {
                    c_fr: batch[0] || null,
                    c_lr: batch[batch.length - 1] || null,
                    c_count: batch.length
                };
            }
            // console.log("onSyncRequest", res);
            return res;
        }, onPullRequest = async (params) => {
            if (this.getDeleted().length) {
                await this.syncDeleted();
            }
            const data = this.getBatch(params);
            // console.log(`onPullRequest: total(${ data.length })`)
            return data;
        };
        // this.dbSync = db[this.name]._sync(filter, { },{ onSyncRequest, onPullRequest, onUpdates: (data) => { 
        //     this.upsert(data, data, true) 
        // } });
        db[this.name]._sync(filter, {}, { onSyncRequest, onPullRequest, onUpdates: (data) => {
                this.upsert(data, data, true);
            } }).then(s => {
            this.dbSync = s;
        });
        if (this.onChange && !this.skipFirstTrigger) {
            setTimeout(this.onChange, 0);
        }
    }
    sync(onChange, handlesOnData = false) {
        const handles = {
            unsync: () => { this.unsubscribe(onChange); },
            upsert: (newData) => this.upsert(newData, newData)
        }, sub = {
            onChange,
            handlesOnData,
            handles
        };
        this.multiSubscriptions.push(sub);
        if (!this.skipFirstTrigger) {
            onChange(this.getItems());
        }
        return Object.freeze({ ...handles });
    }
    syncOne(idObj, onChange, handlesOnData = false) {
        if (!idObj || !onChange)
            throw `syncOne(idObj, onChange) -> MISSING idObj or onChange`;
        const getIdObj = () => this.getIdObj(this.findOne(idObj));
        const handles = {
            get: () => this.findOne(idObj),
            unsync: () => {
                this.unsubscribe(onChange);
            },
            delete: () => {
                return this.delete(getIdObj());
            },
            update: data => {
                this.updateOne(getIdObj(), data);
            },
            set: data => {
                const newData = { ...data, ...idObj };
                // this.notifySubscriptions(idObj, newData, data);
                this.upsert(newData, newData);
            }
        };
        const sub = {
            onChange,
            idObj,
            handlesOnData,
            handles
        };
        this.singleSubscriptions.push(sub);
        // const item = this.findOne(idObj);
        // if(!item) {
        //     this.db[this.name].findOne(idObj).then(d => {
        //         onChange(d, d)
        //     }).catch(err => {
        //         throw err;
        //     });
        // } else {
        //     setTimeout(()=>onChange(item, item), 0);
        // }
        return Object.freeze({ ...handles });
    }
    updateOne(idObj, newData) {
        let id = this.getIdObj(idObj);
        return this.upsert({ ...this.findOne(id), ...newData, ...id }, { ...newData });
    }
    findOne(idObj) {
        this.getItems();
        let itemIdx = -1;
        if (typeof idObj === "function") {
            itemIdx = this.items.findIndex(idObj);
        }
        else if ((!idObj || !Object.keys(idObj)) &&
            this.items.length === 1) {
            itemIdx = 0;
        }
        else {
            itemIdx = this.items.findIndex(d => this.matchesIdObj(idObj, d));
        }
        return this.items[itemIdx];
    }
    getIdObj(d) {
        let res = {};
        this.id_fields.sort().map(key => {
            res[key] = d[key];
        });
        return res;
    }
    matchesIdObj(idObj, d) {
        return Object.keys(idObj).length && !Object.keys(idObj).find(key => d[key] !== idObj[key]);
    }
    deleteAll() {
        this.getItems().map(this.getIdObj).map(this.delete);
    }
    setDeleted(idObj, fullArray) {
        let deleted = [];
        if (fullArray)
            deleted = fullArray;
        else {
            deleted = this.getDeleted();
            deleted.push(idObj);
        }
        window.localStorage.setItem(this.name + "_$$psql$$_deleted", deleted);
    }
    getDeleted() {
        const delStr = window.localStorage.getItem(this.name + "_$$psql$$_deleted") || '[]';
        return JSON.parse(delStr);
    }
}
exports.SyncedTable = SyncedTable;
