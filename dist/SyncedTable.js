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
        this.notifySubscriptions = (idObj, newData, delta) => {
            this.singleSubscriptions.filter(s => s.idObj &&
                this.matchesIdObj(s.idObj, idObj) &&
                Object.keys(s.idObj).length <= Object.keys(idObj).length)
                .map(s => {
                s.onChange(newData, delta);
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
            return this.onDataChanged(null, [idObj]);
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
        this.upsert = async (data, from_server = false) => {
            let items = this.getItems();
            if (from_server && this.getDeleted().length) {
                await this.syncDeleted();
            }
            let updates = [], inserts = [];
            data.map(d => {
                if (!from_server)
                    d[this.synced_field] = Date.now();
                let existing_idx = items.findIndex(c => !this.id_fields.find(key => c[key] !== d[key])), existing = items[existing_idx];
                if (existing && existing[this.synced_field] < d[this.synced_field]) {
                    items[existing_idx] = { ...d };
                    updates.push(d);
                    if (from_server) {
                        // this.subscriptions.filter(s => s.idObj && this.matchesIdObj(s.idObj, d))
                        //     .map(s => {
                        //         s.onChange({ ...d }, { ...d });
                        //     });
                        this.singleSubscriptions.filter(s => s.idObj && this.matchesIdObj(s.idObj, d))
                            .map(s => {
                            s.onChange({ ...d }, { ...d });
                        });
                    }
                }
                else if (!existing) {
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
            // window.localStorage.setItem(this.name, JSON.stringify(items));
            this.setItems(items);
            this.onDataChanged(newData, null, from_server);
            return true;
        };
        this.onDataChanged = async (newData = null, deletedData = null, from_server = false) => {
            return new Promise((resolve, reject) => {
                const items = this.getItems();
                // this.subscriptions.filter(s => !s.idObj).map(s =>{ s.onChange(items, newData) });
                this.multiSubscriptions.map(s => { s.onChange(items, newData); });
                if (this.onChange) {
                    this.onChange(items, newData);
                }
                window.onbeforeunload = confirmExit;
                function confirmExit() {
                    return "Data may be lost. Are you sure?";
                }
                if (!from_server && this.dbSync && this.dbSync.syncData) {
                    if (this.isSendingData) {
                        window.clearTimeout(this.isSendingData);
                    }
                    this.isSendingData = window.setTimeout(async () => {
                        await this.dbSync.syncData(newData, deletedData);
                        resolve(true);
                        this.isSendingData = null;
                        window.onbeforeunload = null;
                    }, this.pushDebounce);
                }
                resolve(true);
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
            return items;
        };
        this.getBatch = (params, sync_info) => {
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
        this.isSendingData = null;
        this.skipFirstTrigger = skipFirstTrigger;
        this.multiSubscriptions = [];
        this.singleSubscriptions = [];
        const onSyncRequest = (params, sync_info) => {
            let res = { c_lr: null, c_fr: null, c_count: 0 };
            let batch = this.getBatch(params, sync_info);
            if (batch.length) {
                res = {
                    c_fr: batch[0] || null,
                    c_lr: batch[batch.length - 1] || null,
                    c_count: batch.length
                };
            }
            // console.log("onSyncRequest", res);
            return res;
        }, onPullRequest = async (params, sync_info) => {
            if (this.getDeleted().length) {
                await this.syncDeleted();
            }
            const data = this.getBatch(params, sync_info);
            // console.log(`onPullRequest: total(${ data.length })`)
            return data;
        };
        this.dbSync = db[this.name].sync(filter, {}, { onSyncRequest, onPullRequest, onUpdates: (data) => {
                this.upsert(data, true);
            } });
        if (this.onChange && !this.skipFirstTrigger) {
            setTimeout(this.onChange, 0);
        }
    }
    subscribeAll(onChange) {
        const sub = { onChange }, unsubscribe = () => { this.unsubscribe(onChange); };
        this.multiSubscriptions.push(sub);
        if (!this.skipFirstTrigger) {
            onChange(this.getItems());
        }
        return Object.freeze({ unsubscribe });
    }
    subscribeOne(idObj, onChange) {
        if (!idObj || !onChange)
            throw "bad";
        const item = this.findOne(idObj);
        if (!item)
            throw "no item found";
        const sub = {
            onChange,
            idObj,
            item
        };
        const syncHandle = {
            get: () => this.findOne(idObj),
            unsubscribe: () => {
                this.unsubscribe(onChange);
            },
            delete: () => {
                return this.delete(idObj);
            },
            update: data => {
                // const newData = { ...this.findOne(idObj), ...data, ...idObj };
                // notifySubscriptions(newData, data);
                // this.upsert([newData]);
                this.updateOne(idObj, data);
            },
            updateFull: data => {
                const newData = { ...data, ...idObj };
                this.notifySubscriptions(idObj, newData, data);
                this.upsert([newData]);
            }
        };
        this.singleSubscriptions.push(sub);
        setTimeout(() => onChange(item, item), 0);
        return Object.freeze({ ...syncHandle });
    }
    updateOne(idObj, newData) {
        const item = { ...this.findOne(idObj), ...newData, ...idObj };
        this.notifySubscriptions(idObj, item, newData);
        this.upsert([item]);
    }
    findOne(idObj) {
        this.getItems();
        let itemIdx = -1;
        if (typeof idObj === "function") {
            itemIdx = this.items.findIndex(idObj);
        }
        else {
            itemIdx = this.items.findIndex(d => this.matchesIdObj(idObj, d));
        }
        return this.items[itemIdx];
    }
    getIdObj(d) {
        let res = {};
        this.id_fields.map(key => {
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
