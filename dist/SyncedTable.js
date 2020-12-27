"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncedTable = void 0;
const STORAGE_TYPES = {
    array: "array",
    localStorage: "localStorage",
    object: "object"
};
class SyncedTable {
    constructor({ name, filter, onChange, db, skipFirstTrigger = false, select = "*", storageType = STORAGE_TYPES.object }) {
        this.throttle = 100;
        this.batch_size = 50;
        this.skipFirstTrigger = false;
        this.wal = {
            changed: {},
            sending: {}
        };
        this.items = [];
        this.itemsObj = {};
        /**
         * Notifies multi subs with ALL data + deltas. Attaches handles on data if required
         * @param newData -> updates. Must include id_fields + updates
         */
        this.notifySubscribers = (changes) => {
            let _changes = changes;
            // if(!changes) _changes
            let items = [], deltas = [], ids = [];
            _changes.map(({ idObj, newItem, delta }) => {
                /* Single subs do not care about the filter */
                this.singleSubscriptions.filter(s => this.matchesIdObj(s.idObj, idObj)
                /* What's the point here? That left filter includes the right one?? */
                // && Object.keys(s.idObj).length <= Object.keys(idObj).length
                ).map(s => {
                    let ni = { ...newItem };
                    if (s.handlesOnData && s.handles) {
                        ni.$update = s.handles.update;
                        ni.$delete = s.handles.delete;
                        ni.$unsync = s.handles.unsync;
                    }
                    s.onChange(ni, delta);
                });
                /* Preparing data for multi subs */
                if (this.matchesFilter(newItem)) {
                    items.push(newItem);
                    deltas.push(delta);
                    ids.push(idObj);
                }
            });
            /* Notify main subscription */
            if (this.onChange) {
                this.onChange(items, deltas);
            }
            /* Multisubs must not forget about the original filter */
            this.multiSubscriptions.map(s => {
                if (s.handlesOnData && s.handles) {
                    items = items.map((item, i) => {
                        const idObj = ids[i];
                        return {
                            ...item,
                            $update: (newData) => {
                                return this.upsert([{ idObj, delta: newData }]).then(r => true);
                            },
                            $delete: async () => {
                                return this.delete(idObj);
                            }
                        };
                    });
                }
                s.onChange(items, deltas);
            });
        };
        /**
         * Update one row locally. id_fields update dissallowed
         * @param idObj object -> item to be updated
         * @param delta object -> the exact data that changed. excluding synced_field and id_fields
         */
        // updateOne(req: ItemUpdate): Promise<boolean> {
        //     // idObj: object, delta: object
        //     const { idObj, delta } = req;
        //     return this.upsert({ ...this.getItem(idObj).data, ...delta, ...idObj });
        // }
        this.unsubscribe = (onChange) => {
            this.singleSubscriptions = this.singleSubscriptions.filter(s => s.onChange !== onChange);
            this.multiSubscriptions = this.multiSubscriptions.filter(s => s.onChange !== onChange);
        };
        this.unsync = () => {
            if (this.dbSync && this.dbSync.unsync)
                this.dbSync.unsync();
        };
        this.destroy = () => {
            this.unsync();
            this.multiSubscriptions = [];
            this.singleSubscriptions = [];
            this.itemsObj = {};
            this.items = [];
            this.onChange = null;
        };
        this.delete = async (item) => {
            const idObj = this.getIdObj(item);
            await this.db[this.name].delete(idObj);
            this.setItem(idObj, null, true, true);
            this.notifySubscribers();
            return true;
        };
        /**
         * Upserts data locally -> notify subs -> sends to server if required
         * synced_field is populated if data is not from server
         * @param data object | object[] -> data to be updated/inserted. Must include id_fields
         * @param delta object | object[] -> data that has changed.
         * @param from_server If false then updates will be sent to server
         */
        // upsert = async (data: object | object[], delta: object | object[], from_server = false): Promise<boolean> => {
        this.upsert = async (items, from_server = false) => {
            if (!items || !items.length)
                throw "No data provided for upsert";
            /* If data has been deleted then wait for it to sync with server before continuing */
            // if(from_server && this.getDeleted().length){
            //     await this.syncDeleted();
            // }
            // let _data = Array.isArray(data)? data : [data];
            // let _delta = Array.isArray(delta)? delta : [delta];
            // let items = this.getItems();
            let updates = [], inserts = [], deltas = [];
            let results = [];
            let status;
            items.map((item, i) => {
                // let d = { ...item.idObj, ...item.delta };
                let idObj = { ...item.idObj };
                let delta = { ...item.delta };
                let oItm = this.getItem(idObj), oldIdx = oItm.index, oldItem = oItm.data;
                /* Calc delta if missing or if from server */
                if ((from_server || isEmpty(delta)) && !isEmpty(oldItem)) {
                    delta = this.getDelta(oldItem || {}, delta);
                }
                /* Add synced if local update */
                if (!from_server) {
                    delta[this.synced_field] = Date.now();
                }
                let newItem = { ...oldItem, ...delta, ...idObj };
                /* Update existing -> Expecting delta */
                if (oldItem && oldItem[this.synced_field] < newItem[this.synced_field]) {
                    status = "updated";
                    /* Insert new item */
                }
                else if (!oldItem) {
                    status = "inserted";
                }
                this.setItem(newItem, oldIdx);
                let changeInfo = { idObj, delta, oldItem, newItem, status, from_server };
                /* IF Local updates then Keep any existing oldItem to revert to the earliest working item */
                if (!from_server) {
                    if (this.wal.changed[idObj]) {
                        this.wal.changed[idObj] = {
                            ...changeInfo,
                            oldItem: this.wal.changed[idObj].oldItem
                        };
                    }
                    else {
                        this.wal.changed[idObj] = changeInfo;
                    }
                }
                results.push(changeInfo);
                /* TODO: Deletes from server */
                // if(allow_deletes){
                //     items = this.getItems();
                // }
            });
            // console.log(`onUpdates: inserts( ${inserts.length} ) updates( ${updates.length} )  total( ${data.length} )`);
            // const newData = _data.map(d => ({ ...d }));
            this.notifySubscribers(results);
            /* Push to server */
            if (!from_server) {
            }
        };
        this.pushDataToServer = async () => {
            // Sending data. stop here
            if (this.isSendingTimeout || this.wal.sending && !isEmpty(this.wal.sending))
                return;
            // Nothing to send. stop here
            if (!this.wal.changed || isEmpty(this.wal.changed))
                return;
            // Prepare batch to send
            let batch = [];
            Object.keys(this.wal.changed)
                .slice(0, this.batch_size)
                .map(key => {
                let item = { ...this.wal.changed[key] };
                this.wal.sending[key] = item;
                batch.push({ ...item.delta, ...item.idObj });
                delete this.wal.changed[key];
            });
            // Throttle next data send
            this.isSendingTimeout = setTimeout(() => {
                this.isSendingTimeout = null;
                if (!isEmpty(this.wal.changed)) {
                    this.pushDataToServer();
                }
            }, this.throttle);
            window.onbeforeunload = confirmExit;
            function confirmExit() {
                return "Data may be lost. Are you sure?";
            }
            try {
                await this.dbSync.syncData(batch); //, deletedData);
                if (!isEmpty(this.wal.changed)) {
                    this.pushDataToServer();
                }
                else {
                    window.onbeforeunload = null;
                }
            }
            catch (err) {
                console.error(err);
            }
        };
        /**
         * Notifies local subscriptions immediately
         * Sends data to server (if changes are local)
         * Notifies local subscriptions with old data if server push fails
         * @param newData object[] -> upserted data. Must include id_fields
         * @param delta object[] -> deltas for upserted data
         * @param deletedData
         * @param from_server
         */
        this.isSendingTimeout = null;
        this.isSending = false;
        /**
         * Sets the current data
         * @param items data
         */
        this.setItems = (items) => {
            if (this.storageType === STORAGE_TYPES.localStorage) {
                window.localStorage.setItem(this.name, JSON.stringify(items));
            }
            else if (this.storageType === STORAGE_TYPES.array) {
                this.items = items;
            }
            else {
                this.itemsObj = items.reduce((a, v) => ({
                    ...a,
                    [this.getIdStr(v)]: v,
                }), {});
            }
        };
        /**
         * Returns the current data ordered by synced_field ASC and matching the main filter;
         */
        this.getItems = () => {
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
                items = Object.values(this.itemsObj);
            }
            if (this.id_fields && this.synced_field) {
                const s_fields = [this.synced_field, ...this.id_fields.sort()];
                items = items
                    .filter(d => {
                    return !this.filter || !Object.keys(this.filter)
                        .find(key => d[key] !== this.filter[key]
                    // typeof d[key] === typeof this.filter[key] && 
                    // d[key].toString && this.filter[key].toString &&
                    // d[key].toString() !== this.filter[key].toString()
                    );
                })
                    .sort((a, b) => s_fields.map(key => a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0).find(v => v));
            }
            else
                throw "id_fields AND/OR synced_field missing";
            this.items = items.filter(d => isEmpty(this.filter) || this.matchesFilter(d));
            return items.map(d => ({ ...d }));
        };
        /**
         * Sync data request
         * @param param0: SyncBatchRequest
         */
        this.getBatch = ({ from_synced, to_synced, offset, limit } = { offset: 0, limit: null }) => {
            let items = this.getItems();
            // params = params || {};
            // const { from_synced, to_synced, offset = 0, limit = null } = params;
            let res = items.map(c => ({ ...c }))
                .filter(c => (!from_synced || c[this.synced_field] >= from_synced) &&
                (!to_synced || c[this.synced_field] <= to_synced));
            if (offset || limit)
                res = res.splice(offset, limit || res.length);
            return res;
        };
        this.name = name;
        this.filter = filter;
        this.select = select;
        this.onChange = onChange;
        if (!STORAGE_TYPES[storageType])
            throw "Invalid storage type. Expecting one of: " + Object.keys(STORAGE_TYPES).join(", ");
        this.storageType = storageType;
        if (!db)
            throw "db missing";
        this.db = db;
        const { id_fields, synced_field, throttle = 100, batch_size = 50 } = db[this.name]._syncInfo;
        if (!id_fields || !synced_field)
            throw "id_fields/synced_field missing";
        this.id_fields = id_fields;
        this.synced_field = synced_field;
        this.batch_size = batch_size;
        this.throttle = throttle;
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
            // if(this.getDeleted().length){
            //     await this.syncDeleted();
            // }
            const data = this.getBatch(params);
            // console.log(`onPullRequest: total(${ data.length })`)
            return data;
        };
        db[this.name]._sync(filter, { select }, { onSyncRequest, onPullRequest, onUpdates: (data) => {
                /* Delta left empty so we can prepare it here */
                let updateItems = data.map(d => ({
                    idObj: this.getIdObj(d),
                    delta: d
                }));
                this.upsert(updateItems, true);
            } }).then(s => {
            this.dbSync = s;
        });
        if (this.onChange && !this.skipFirstTrigger) {
            setTimeout(this.onChange, 0);
        }
    }
    /**
     * Returns a sync handler to all records within the SyncedTable instance
     * @param onChange change listener <(items: object[], delta: object[]) => any >
     * @param handlesOnData If true then $upsert and $unsync handles will be added on each data item. False by default;
     */
    sync(onChange, handlesOnData = false) {
        const handles = {
            unsync: () => { this.unsubscribe(onChange); },
            upsert: (newData) => {
                if (newData) {
                    const prepareOne = (d) => {
                        return ({
                            idObj: this.getIdObj(d),
                            delta: d
                        });
                    };
                    if (Array.isArray(newData)) {
                        this.upsert(newData.map(d => prepareOne(d)));
                    }
                    else {
                        this.upsert([prepareOne(newData)]);
                    }
                }
                // this.upsert(newData, newData)
            }
        }, sub = {
            onChange,
            handlesOnData,
            handles
        };
        this.multiSubscriptions.push(sub);
        if (!this.skipFirstTrigger) {
            let items = this.getItems();
            onChange(items, items);
        }
        return Object.freeze({ ...handles });
    }
    /**
     * Returns a sync handler to a specific record within the SyncedTable instance
     * @param idObj object containing the target id_fields properties
     * @param onChange change listener <(item: object, delta: object) => any >
     * @param handlesOnData If true then $update, $delete and $unsync handles will be added on the data item. False by default;
     */
    syncOne(idObj, onChange, handlesOnData = false) {
        if (!idObj || !onChange)
            throw `syncOne(idObj, onChange) -> MISSING idObj or onChange`;
        // const getIdObj = () => this.getIdObj(this.findOne(idObj));
        const handles = {
            get: () => this.getItem(idObj).data,
            unsync: () => {
                this.unsubscribe(onChange);
            },
            delete: () => {
                return this.delete(idObj);
            },
            update: newData => {
                this.upsert([{ idObj, delta: newData }]);
            }
            // set: data => {
            //     const newData = { ...data, ...idObj }
            //     // this.notifySubscriptions(idObj, newData, data);
            //     this.upsert(newData, newData);
            // }
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
    // findOne(idObj){
    //     this.getItems();
    //     let itemIdx = -1;
    //     if(typeof idObj === "function"){
    //         itemIdx = this.items.findIndex(idObj);
    //     } else if(
    //         (!idObj || !Object.keys(idObj)) &&
    //         this.items.length === 1
    //     ){
    //         itemIdx = 0; 
    //     } else {
    //         itemIdx = this.items.findIndex(d => this.matchesIdObj(idObj, d) )
    //     }
    //     return this.items[itemIdx];
    // }
    getIdStr(d) {
        return this.id_fields.sort().map(key => `${d[key] || ""}`).join(".");
    }
    getIdObj(d) {
        let res = {};
        this.id_fields.sort().map(key => {
            res[key] = d[key];
        });
        return res;
    }
    matchesFilter(item) {
        return Boolean(item &&
            (!this.filter ||
                isEmpty(this.filter) ||
                !Object.keys(this.filter).find(k => this.filter[k] !== item[k])));
    }
    matchesIdObj(a, b) {
        return Boolean(a && b && !this.id_fields.sort().find(k => a[k] !== b[k]));
    }
    // TODO: offline-first deletes if allow_delete = true
    // private setDeleted(idObj, fullArray){
    //     let deleted: object[] = [];
    //     if(fullArray) deleted = fullArray;
    //     else {
    //         deleted = this.getDeleted();
    //         deleted.push(idObj);
    //     }
    //     window.localStorage.setItem(this.name + "_$$psql$$_deleted", <any>deleted);
    // }
    // private getDeleted(){
    //     const delStr = window.localStorage.getItem(this.name + "_$$psql$$_deleted") || '[]';
    //     return JSON.parse(delStr);
    // }
    // private syncDeleted = async () => {
    //     try {
    //         await Promise.all(this.getDeleted().map(async idObj => {
    //             return this.db[this.name].delete(idObj);
    //         }));
    //         this.setDeleted(null, []);
    //         return true;
    //     } catch(e){
    //         throw e;
    //     }
    // }
    /**
     * Returns properties that are present in {n} and are different to {o}
     * @param o current full data item
     * @param n new data item
     */
    getDelta(o, n) {
        if (!o)
            return { ...n };
        return Object.keys(o)
            .filter(k => !this.id_fields.includes(k))
            .reduce((a, k) => {
            let delta = {};
            if (k in n && n[k] !== o[k]) {
                delta = { [k]: n[k] };
            }
            return { ...a, ...delta };
        }, {});
    }
    deleteAll() {
        this.getItems().map(this.delete);
    }
    getItem(idObj) {
        let index = -1, d;
        if (this.storageType === STORAGE_TYPES.localStorage) {
            let items = this.getItems();
            d = items.find(d => this.matchesIdObj(d, idObj));
        }
        else if (this.storageType === STORAGE_TYPES.array) {
            d = this.items.find(d => this.matchesIdObj(d, idObj));
        }
        else {
            this.itemsObj = this.itemsObj || {};
            d = this.itemsObj[this.getIdStr(idObj)];
        }
        return { data: d ? { ...d } : d, index };
    }
    /**
     *
     * @param item data to be inserted/updated/deleted. Must include id_fields
     * @param index (optional) index within array
     * @param isFullData
     * @param deleteItem
     */
    setItem(item, index, isFullData = false, deleteItem = false) {
        const getExIdx = (arr) => index; // arr.findIndex(d => this.matchesIdObj(d, item));
        if (this.storageType === STORAGE_TYPES.localStorage) {
            let items = this.getItems();
            if (!deleteItem) {
                let existing_idx = getExIdx(items);
                if (items[existing_idx])
                    items[existing_idx] = isFullData ? { ...item } : { ...items[existing_idx], ...item };
                else
                    items.push(item);
            }
            else
                items = items.filter(d => !this.matchesIdObj(d, item));
            window.localStorage.setItem(this.name, JSON.stringify(items));
        }
        else if (this.storageType === STORAGE_TYPES.array) {
            if (!deleteItem) {
                if (!this.items[index]) {
                    this.items.push(item);
                }
                else {
                    this.items[index] = isFullData ? { ...item } : { ...this.items[index], ...item };
                }
            }
            else
                this.items = this.items.filter(d => !this.matchesIdObj(d, item));
        }
        else {
            this.itemsObj = this.itemsObj || {};
            if (!deleteItem) {
                let existing = this.itemsObj[this.getIdStr(item)] || {};
                this.itemsObj[this.getIdStr(item)] = isFullData ? { ...item } : { ...existing, ...item };
            }
            else {
                delete this.itemsObj[this.getIdStr(item)];
            }
        }
    }
}
exports.SyncedTable = SyncedTable;
function isEmpty(obj) {
    for (var v in obj)
        return false;
    return true;
}
