"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quickClone = exports.SyncedTable = exports.debug = void 0;
const prostgles_types_1 = require("prostgles-types");
const DEBUG_KEY = "DEBUG_SYNCEDTABLE";
const hasWnd = typeof window !== "undefined";
const debug = function (...args) {
    if (hasWnd && window[DEBUG_KEY]) {
        window[DEBUG_KEY](...args);
    }
};
exports.debug = debug;
const STORAGE_TYPES = {
    array: "array",
    localStorage: "localStorage",
    object: "object"
};
class SyncedTable {
    constructor({ name, filter, onChange, onReady, db, skipFirstTrigger = false, select = "*", storageType = "object", patchText = false, patchJSON = false, onError }) {
        this.throttle = 100;
        this.batch_size = 50;
        this.skipFirstTrigger = false;
        this.columns = [];
        // multiSubscriptions: SubscriptionMulti[];
        // singleSubscriptions:  SubscriptionSingle[];
        this._multiSubscriptions = [];
        this._singleSubscriptions = [];
        this.items = [];
        this.itemsObj = {};
        this.isSynced = false;
        /**
         * Will update text/json fields through patching method
         * This will send less data to server
         * @param walData
         */
        this.updatePatches = async (walData) => {
            var _a, _b;
            let remaining = walData.map(d => d.current);
            let patched = [], patchedItems = [];
            if (this.columns && this.columns.length && ((_a = this.tableHandler) === null || _a === void 0 ? void 0 : _a.updateBatch) && (this.patchText || this.patchJSON)) {
                // const jCols = this.columns.filter(c => c.data_type === "json")
                const txtCols = this.columns.filter(c => c.data_type === "text");
                if (this.patchText && txtCols.length) {
                    remaining = [];
                    const id_keys = [this.synced_field, ...this.id_fields];
                    await Promise.all(walData.slice(0).map(async (d, i) => {
                        const { current, initial } = { ...d };
                        let patchedDelta;
                        if (initial) {
                            txtCols.map(c => {
                                if (!id_keys.includes(c.name) && c.name in current) {
                                    patchedDelta !== null && patchedDelta !== void 0 ? patchedDelta : (patchedDelta = { ...current });
                                    patchedDelta[c.name] = (0, prostgles_types_1.getTextPatch)(initial[c.name], current[c.name]);
                                }
                            });
                            if (patchedDelta && this.wal) {
                                patchedItems.push(patchedDelta);
                                patched.push([
                                    this.wal.getIdObj(patchedDelta),
                                    this.wal.getDeltaObj(patchedDelta)
                                ]);
                            }
                        }
                        // console.log("json-stable-stringify ???")
                        if (!patchedDelta) {
                            remaining.push(current);
                        }
                    }));
                }
            }
            /**
             * There is a decent chance the patch update will fail.
             * As such, to prevent sync batch update failures, the patched updates are updated separately.
             * If patch update fails then sync batch normally without patch.
             */
            if (patched.length) {
                try {
                    await ((_b = this.tableHandler) === null || _b === void 0 ? void 0 : _b.updateBatch(patched));
                }
                catch (e) {
                    console.log("failed to patch update", e);
                    remaining = remaining.concat(patchedItems);
                }
            }
            return remaining.filter(d => d);
        };
        /**
         * Notifies multi subs with ALL data + deltas. Attaches handles on data if required
         * @param newData -> updates. Must include id_fields + updates
         */
        this._notifySubscribers = (changes = []) => {
            if (!this.isSynced)
                return;
            /* Deleted items (changes = []) do not trigger singleSubscriptions notify because it might break things */
            let items = [], deltas = [], ids = [];
            changes.map(({ idObj, newItem, delta }) => {
                /* Single subs do not care about the filter */
                this.singleSubscriptions.filter(s => this.matchesIdObj(s.idObj, idObj)).map(async (s) => {
                    try {
                        await s.notify(newItem, delta);
                    }
                    catch (e) {
                        console.error("SyncedTable failed to notify: ", e);
                    }
                });
                /* Preparing data for multi subs */
                if (this.matchesFilter(newItem)) {
                    items.push(newItem);
                    deltas.push(delta);
                    ids.push(idObj);
                }
            });
            if (this.onChange || this.multiSubscriptions.length) {
                let allItems = [], allDeltas = [];
                this.getItems().map(d => {
                    allItems.push({ ...d });
                    const dIdx = items.findIndex(_d => this.matchesIdObj(d, _d));
                    allDeltas.push(deltas[dIdx]);
                });
                /* Notify main subscription */
                if (this.onChange) {
                    try {
                        this.onChange(allItems, allDeltas);
                    }
                    catch (e) {
                        console.error("SyncedTable failed to notify onChange: ", e);
                    }
                }
                /* Multisubs must not forget about the original filter */
                this.multiSubscriptions.map(async (s) => {
                    try {
                        await s.notify(allItems, allDeltas);
                    }
                    catch (e) {
                        console.error("SyncedTable failed to notify: ", e);
                    }
                });
            }
        };
        this.unsubscribe = (onChange) => {
            this.singleSubscriptions = this.singleSubscriptions.filter(s => s._onChange !== onChange);
            this.multiSubscriptions = this.multiSubscriptions.filter(s => s._onChange !== onChange);
            (0, exports.debug)("unsubscribe", this);
            return "ok";
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
            this.onChange = undefined;
        };
        this.delete = async (item, from_server = false) => {
            var _a;
            const idObj = this.getIdObj(item);
            this.setItem(idObj, undefined, true, true);
            if (!from_server && ((_a = this.tableHandler) === null || _a === void 0 ? void 0 : _a.delete)) {
                await this.tableHandler.delete(idObj);
            }
            this._notifySubscribers();
            return true;
        };
        /**
         * Ensures that all object keys match valid column names
         */
        this.checkItemCols = (item) => {
            if (this.columns && this.columns.length) {
                const badCols = Object.keys({ ...item })
                    .filter(k => !this.columns.find(c => c.name === k));
                if (badCols.length) {
                    throw (`Unexpected columns in sync item update: ` + badCols.join(", "));
                }
            }
        };
        /**
         * Upserts data locally -> notify subs -> sends to server if required
         * synced_field is populated if data is not from server
         * @param items <{ idObj: object, delta: object }[]> Data items that changed
         * @param from_server : <boolean> If false then updates will be sent to server
         */
        this.upsert = async (items, from_server = false) => {
            var _a, _b;
            if ((!items || !items.length) && !from_server)
                throw "No data provided for upsert";
            /* If data has been deleted then wait for it to sync with server before continuing */
            // if(from_server && this.getDeleted().length){
            //     await this.syncDeleted();
            // }
            let results = [];
            let status;
            let walItems = [];
            await Promise.all(items.map(async (item, i) => {
                var _a;
                // let d = { ...item.idObj, ...item.delta };
                let idObj = { ...item.idObj };
                let delta = { ...item.delta };
                /* Convert undefined to null because:
                    1) JSON.stringify drops these keys
                    2) Postgres does not have undefined
                */
                Object.keys(delta).map(k => {
                    if (delta[k] === undefined)
                        delta[k] = null;
                });
                if (!from_server) {
                    this.checkItemCols({ ...item.delta, ...item.idObj });
                }
                let oItm = this.getItem(idObj), oldIdx = oItm.index, oldItem = oItm.data;
                /* Calc delta if missing or if from server */
                if ((from_server || (0, prostgles_types_1.isEmpty)(delta)) && !(0, prostgles_types_1.isEmpty)(oldItem)) {
                    delta = this.getDelta(oldItem || {}, delta);
                }
                /* Add synced if local update */
                /** Will need to check client clock shift */
                if (!from_server) {
                    delta[this.synced_field] = Date.now();
                }
                let newItem = { ...oldItem, ...delta, ...idObj };
                if (oldItem && !from_server) {
                    /**
                     * Merge deep
                     */
                    if ((_a = item.opts) === null || _a === void 0 ? void 0 : _a.deepMerge) {
                        newItem = mergeDeep({ ...oldItem, ...idObj }, { ...delta });
                    }
                }
                /* Update existing -> Expecting delta */
                if (oldItem) {
                    status = oldItem[this.synced_field] < newItem[this.synced_field] ? "updated" : "unchanged";
                    /* Insert new item */
                }
                else {
                    status = "inserted";
                }
                this.setItem(newItem, oldIdx);
                // if(!status) throw "changeInfo status missing"
                let changeInfo = { idObj, delta, oldItem, newItem, status, from_server };
                // const idStr = this.getIdStr(idObj);
                /* IF Local updates then Keep any existing oldItem to revert to the earliest working item */
                if (!from_server) {
                    /* Patch server data if necessary and update separately to account for errors */
                    // let updatedWithPatch = false;
                    // if(this.columns && this.columns.length && (this.patchText || this.patchJSON)){
                    //     // const jCols = this.columns.filter(c => c.data_type === "json")
                    //     const txtCols = this.columns.filter(c => c.data_type === "text");
                    //     if(this.patchText && txtCols.length && this.db[this.name].update){
                    //         let patchedDelta;
                    //         txtCols.map(c => {
                    //             if(c.name in changeInfo.delta){
                    //                 patchedDelta = patchedDelta || {
                    //                     ...changeInfo.delta,
                    //                 }
                    //                 patchedDelta[c.name] = getTextPatch(changeInfo.oldItem[c.name], changeInfo.delta[c.name]);
                    //             }
                    //         });
                    //         if(patchedDelta){
                    //             try {
                    //                 await this.db[this.name].update(idObj, patchedDelta);
                    //                 updatedWithPatch = true;
                    //             } catch(e) {
                    //                 console.log("failed to patch update", e)
                    //             }
                    //         }
                    //         // console.log("json-stable-stringify ???")
                    //     }
                    // }
                    // if(!updatedWithPatch){
                    // walItems.push({ ...delta, ...idObj });
                    walItems.push({
                        initial: oldItem,
                        current: { ...newItem }
                    });
                }
                if (changeInfo.delta && !(0, prostgles_types_1.isEmpty)(changeInfo.delta)) {
                    results.push(changeInfo);
                }
                /* TODO: Deletes from server */
                // if(allow_deletes){
                //     items = this.getItems();
                // }
                return true;
            })).catch(err => {
                console.error("SyncedTable failed upsert: ", err);
            });
            // console.log(`onUpdates: inserts( ${inserts.length} ) updates( ${updates.length} )  total( ${data.length} )`);
            // this.notifySubscribers(results);
            (_a = this.notifyWal) === null || _a === void 0 ? void 0 : _a.addData(results.map(d => ({ initial: d.oldItem, current: d.newItem })));
            /* Push to server */
            if (!from_server && walItems.length) {
                // this.addWALItems(walItems);
                (_b = this.wal) === null || _b === void 0 ? void 0 : _b.addData(walItems);
            }
        };
        /**
         * Sets the current data
         * @param items data
         */
        this.setItems = (_items) => {
            const items = quickClone(_items);
            if (this.storageType === STORAGE_TYPES.localStorage) {
                if (!hasWnd)
                    throw "Cannot access window object. Choose another storage method (array OR object)";
                window.localStorage.setItem(this.name, JSON.stringify(items));
            }
            else if (this.storageType === STORAGE_TYPES.array) {
                this.items = items;
            }
            else {
                this.itemsObj = items.reduce((a, v) => ({
                    ...a,
                    [this.getIdStr(v)]: ({ ...v }),
                }), {});
            }
        };
        /**
         * Returns the current data ordered by synced_field ASC and matching the main filter;
         */
        this.getItems = () => {
            let items = [];
            if (this.storageType === STORAGE_TYPES.localStorage) {
                if (!hasWnd)
                    throw "Cannot access window object. Choose another storage method (array OR object)";
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
                items = this.items.map(d => ({ ...d }));
            }
            else {
                items = Object.values({ ...this.itemsObj });
            }
            if (this.id_fields && this.synced_field) {
                const s_fields = [this.synced_field, ...this.id_fields.sort()];
                items = items
                    .filter(d => {
                    return !this.filter || !(0, prostgles_types_1.getKeys)(this.filter)
                        .find(key => d[key] !== this.filter[key]
                    // typeof d[key] === typeof this.filter[key] && 
                    // d[key].toString && this.filter[key].toString &&
                    // d[key].toString() !== this.filter[key].toString()
                    );
                })
                    .sort((a, b) => s_fields.map(key => (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0)).find(v => v));
            }
            else
                throw "id_fields AND/OR synced_field missing";
            // this.items = items.filter(d => isEmpty(this.filter) || this.matchesFilter(d));
            return quickClone(items);
        };
        /**
         * Sync data request
         * @param param0: SyncBatchRequest
         */
        this.getBatch = ({ from_synced, to_synced, offset, limit } = { offset: 0, limit: undefined }) => {
            let items = this.getItems();
            // params = params || {};
            // const { from_synced, to_synced, offset = 0, limit = null } = params;
            let res = items.map(c => ({ ...c }))
                .filter(c => (!Number.isFinite(from_synced) || +c[this.synced_field] >= +from_synced) &&
                (!Number.isFinite(to_synced) || +c[this.synced_field] <= +to_synced));
            if (offset || limit)
                res = res.splice(offset !== null && offset !== void 0 ? offset : 0, limit || res.length);
            return res;
        };
        this.name = name;
        this.filter = filter;
        this.select = select;
        this.onChange = onChange;
        if (!STORAGE_TYPES[storageType])
            throw "Invalid storage type. Expecting one of: " + Object.keys(STORAGE_TYPES).join(", ");
        if (!hasWnd && storageType === STORAGE_TYPES.localStorage) {
            console.warn("Could not set storageType to localStorage: window object missing\nStorage changed to object");
            storageType = "object";
        }
        this.storageType = storageType;
        this.patchText = patchText;
        this.patchJSON = patchJSON;
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
        this.onError = onError || function (err) { console.error("Sync internal error: ", err); };
        const onSyncRequest = (params) => {
            let res = { c_lr: undefined, c_fr: undefined, c_count: 0 };
            let batch = this.getBatch(params);
            if (batch.length) {
                res = {
                    c_fr: this.getRowSyncObj(batch[0]),
                    c_lr: this.getRowSyncObj(batch[batch.length - 1]),
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
        }, onUpdates = async (args) => {
            var _a;
            if ("err" in args && args.err) {
                (_a = this.onError) === null || _a === void 0 ? void 0 : _a.call(this, args.err);
            }
            else if ("isSynced" in args && args.isSynced && !this.isSynced) {
                this.isSynced = args.isSynced;
                let items = this.getItems().map(d => ({ ...d }));
                this.setItems([]);
                const updateItems = items.map(d => ({
                    idObj: this.getIdObj(d),
                    delta: { ...d }
                }));
                await this.upsert(updateItems, true);
            }
            else if ("data" in args) {
                /* Delta left empty so we can prepare it here */
                let updateItems = args.data.map(d => {
                    return {
                        idObj: this.getIdObj(d),
                        delta: d
                    };
                });
                await this.upsert(updateItems, true);
            }
            else {
                console.error("Unexpected onUpdates");
            }
            return true;
        };
        const opts = {
            id_fields,
            synced_field,
            throttle,
        };
        db[this.name]._sync(filter, { select }, { onSyncRequest, onPullRequest, onUpdates }).then((s) => {
            this.dbSync = s;
            function confirmExit() { return "Data may be lost. Are you sure?"; }
            /**
             * Some syncs can be read only. Any changes are local
             */
            this.wal = new prostgles_types_1.WAL({
                ...opts,
                batch_size,
                onSendStart: () => {
                    if (hasWnd)
                        window.onbeforeunload = confirmExit;
                },
                onSend: async (data, walData) => {
                    // if(this.patchText){
                    //     const textCols = this.columns.filter(c => c.data_type.toLowerCase().startsWith("text"));
                    //     data = await Promise.all(data.map(d => {
                    //         const dataTextCols = Object.keys(d).filter(k => textCols.find(tc => tc.name === k));
                    //         if(dataTextCols.length){
                    //             /* Create text patches and update separately */
                    //             dada
                    //         }
                    //         return d;
                    //     }))
                    // }
                    let _data = await this.updatePatches(walData);
                    if (!_data.length)
                        return [];
                    return this.dbSync.syncData(data);
                },
                onSendEnd: () => {
                    if (hasWnd)
                        window.onbeforeunload = null;
                }
            });
            this.notifyWal = new prostgles_types_1.WAL({
                ...opts,
                batch_size: Infinity,
                throttle: 5,
                onSend: async (items, fullItems) => {
                    this._notifySubscribers(fullItems.map(d => {
                        var _a;
                        return ({
                            delta: this.getDelta((_a = d.initial) !== null && _a !== void 0 ? _a : {}, d.current),
                            idObj: this.getIdObj(d.current),
                            newItem: d.current,
                        });
                    }));
                }
            });
            onReady();
        });
        if (db[this.name].getColumns) {
            db[this.name].getColumns().then((cols) => {
                this.columns = cols;
            });
        }
        if (this.onChange && !this.skipFirstTrigger) {
            setTimeout(this.onChange, 0);
        }
        (0, exports.debug)(this);
    }
    /**
     * add debug mode to fix sudden no data and sync listeners bug
     */
    set multiSubscriptions(mSubs) {
        (0, exports.debug)(mSubs, this._multiSubscriptions);
        this._multiSubscriptions = mSubs.slice(0);
    }
    ;
    get multiSubscriptions() {
        return this._multiSubscriptions;
    }
    ;
    set singleSubscriptions(sSubs) {
        (0, exports.debug)(sSubs, this._singleSubscriptions);
        this._singleSubscriptions = sSubs.slice(0);
    }
    ;
    get singleSubscriptions() {
        return this._singleSubscriptions;
    }
    ;
    static create(opts) {
        return new Promise((resolve, reject) => {
            try {
                const res = new SyncedTable({
                    ...opts, onReady: () => {
                        setTimeout(() => {
                            resolve(res);
                        }, 0);
                    }
                });
            }
            catch (err) {
                reject(err);
            }
        });
    }
    /**
     * Returns a sync handler to all records within the SyncedTable instance
     * @param onChange change listener <(items: object[], delta: object[]) => any >
     * @param handlesOnData If true then $upsert and $unsync handles will be added on each data item. True by default;
     */
    sync(onChange, handlesOnData = true) {
        const handles = {
            $unsync: () => {
                return this.unsubscribe(onChange);
            },
            getItems: () => { return this.getItems(); },
            $upsert: (newData) => {
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
            _onChange: onChange,
            handlesOnData,
            handles,
            notify: (_allItems, _allDeltas) => {
                let allItems = [..._allItems], allDeltas = [..._allDeltas];
                if (handlesOnData) {
                    allItems = allItems.map((item, i) => {
                        const getItem = (d, idObj) => ({
                            ...d,
                            ...this.makeSingleSyncHandles(idObj, onChange),
                            $get: () => getItem(this.getItem(idObj).data, idObj),
                            $find: (idObject) => getItem(this.getItem(idObject).data, idObject),
                            $update: (newData, opts) => {
                                return this.upsert([{ idObj, delta: newData, opts }]).then(r => true);
                            },
                            $delete: async () => {
                                return this.delete(idObj);
                            },
                            $cloneMultiSync: (onChange) => this.sync(onChange, handlesOnData)
                        });
                        const idObj = this.getIdObj(item);
                        return getItem(item, idObj);
                    });
                }
                return onChange(allItems, allDeltas);
            }
        };
        this.multiSubscriptions.push(sub);
        if (!this.skipFirstTrigger) {
            setTimeout(() => {
                let items = this.getItems();
                sub.notify(items, items);
            }, 0);
        }
        return Object.freeze({ ...handles });
    }
    makeSingleSyncHandles(idObj, onChange) {
        if (!idObj || !onChange)
            throw `syncOne(idObj, onChange) -> MISSING idObj or onChange`;
        const handles = {
            $get: () => this.getItem(idObj).data,
            $find: (idObject) => this.getItem(idObject).data,
            $unsync: () => {
                return this.unsubscribe(onChange);
            },
            $delete: () => {
                return this.delete(idObj);
            },
            $update: (newData, opts) => {
                /* DROPPED SYNC BUG */
                if (!this.singleSubscriptions.length && !this.multiSubscriptions.length) {
                    console.warn("No sync listeners");
                    (0, exports.debug)("nosync", this._singleSubscriptions, this._multiSubscriptions);
                }
                this.upsert([{ idObj, delta: newData, opts }]);
            },
            $cloneSync: (onChange) => this.syncOne(idObj, onChange),
            $cloneMultiSync: (onChange) => this.sync(onChange, true),
        };
        return handles;
    }
    /**
     * Returns a sync handler to a specific record within the SyncedTable instance
     * @param idObj object containing the target id_fields properties
     * @param onChange change listener <(item: object, delta: object) => any >
     * @param handlesOnData If true then $update, $delete and $unsync handles will be added on the data item. True by default;
     */
    syncOne(idObj, onChange, handlesOnData = true) {
        const handles = this.makeSingleSyncHandles(idObj, onChange);
        const sub = {
            _onChange: onChange,
            idObj,
            handlesOnData,
            handles,
            notify: (data, delta) => {
                let newData = { ...data };
                if (handlesOnData) {
                    newData.$get = handles.$get;
                    newData.$find = handles.$find;
                    newData.$update = handles.$update;
                    newData.$delete = handles.$delete;
                    newData.$unsync = handles.$unsync;
                    newData.$cloneSync = handles.$cloneSync;
                }
                return onChange(newData, delta);
            }
        };
        this.singleSubscriptions.push(sub);
        setTimeout(() => {
            let existingData = handles.$get();
            if (existingData) {
                sub.notify(existingData, existingData);
            }
        }, 0);
        return Object.freeze({ ...handles });
    }
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
    getRowSyncObj(d) {
        let res = {};
        [this.synced_field, ...this.id_fields].sort().map(key => {
            res[key] = d[key];
        });
        return res;
    }
    matchesFilter(item) {
        return Boolean(item &&
            (!this.filter ||
                (0, prostgles_types_1.isEmpty)(this.filter) ||
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
    //     if(hasWnd) window.localStorage.setItem(this.name + "_$$psql$$_deleted", <any>deleted);
    // }
    // private getDeleted(){
    //     const delStr = if(hasWnd) window.localStorage.getItem(this.name + "_$$psql$$_deleted") || '[]';
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
        if ((0, prostgles_types_1.isEmpty)(o))
            return { ...n };
        return Object.keys({ ...o, ...n })
            .filter(k => !this.id_fields.includes(k))
            .reduce((a, k) => {
            let delta = {};
            if (k in n && n[k] !== o[k]) {
                let deltaProp = { [k]: n[k] };
                /** If object then compare with stringify */
                if (n[k] && o[k] && typeof o[k] === "object") {
                    if (JSON.stringify(n[k]) !== JSON.stringify(o[k])) {
                        delta = deltaProp;
                    }
                }
                else {
                    delta = deltaProp;
                }
            }
            return { ...a, ...delta };
        }, {});
    }
    deleteAll() {
        this.getItems().map(d => this.delete(d));
    }
    get tableHandler() {
        const tblHandler = this.db[this.name];
        if (tblHandler.update && tblHandler.updateBatch) {
            return tblHandler;
        }
        return undefined;
    }
    /* Returns an item by idObj from the local store */
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
            d = ({ ...this.itemsObj })[this.getIdStr(idObj)];
        }
        return { data: quickClone(d), index };
    }
    /**
     *
     * @param item data to be inserted/updated/deleted. Must include id_fields
     * @param index (optional) index within array
     * @param isFullData
     * @param deleteItem
     */
    setItem(_item, index, isFullData = false, deleteItem = false) {
        const item = quickClone(_item);
        if (this.storageType === STORAGE_TYPES.localStorage) {
            let items = this.getItems();
            if (!deleteItem) {
                if (index !== undefined && items[index])
                    items[index] = isFullData ? { ...item } : { ...items[index], ...item };
                else
                    items.push(item);
            }
            else
                items = items.filter(d => !this.matchesIdObj(d, item));
            if (hasWnd)
                window.localStorage.setItem(this.name, JSON.stringify(items));
        }
        else if (this.storageType === STORAGE_TYPES.array) {
            if (!deleteItem) {
                if (index !== undefined && !this.items[index]) {
                    this.items.push(item);
                }
                else if (index !== undefined) {
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
/**
 * immutable args
 */
function mergeDeep(_target, _source) {
    const target = _target ? quickClone(_target) : _target;
    const source = _source ? quickClone(_source) : _source;
    let output = Object.assign({}, target);
    if ((0, prostgles_types_1.isObject)(target) && (0, prostgles_types_1.isObject)(source)) {
        Object.keys(source).forEach(key => {
            if ((0, prostgles_types_1.isObject)(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                }
                else {
                    output[key] = mergeDeep(target[key], source[key]);
                }
            }
            else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
}
exports.default = mergeDeep;
function quickClone(obj) {
    if (hasWnd && "structuredClone" in window && typeof window.structuredClone === "function") {
        return window.structuredClone(obj);
    }
    if (Array.isArray(obj)) {
        return obj.slice(0).map(v => quickClone(v));
    }
    else if ((0, prostgles_types_1.isObject)(obj)) {
        let result = {};
        (0, prostgles_types_1.getKeys)(obj).map(k => {
            result[k] = quickClone(obj[k]);
        });
        return result;
    }
    return obj;
}
exports.quickClone = quickClone;
