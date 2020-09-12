(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else {
		var a = factory();
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./lib/prostgles-full.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./lib/SyncedTable.ts":
/*!****************************!*\
  !*** ./lib/SyncedTable.ts ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
            this.multiSubscriptions.map(s => s.onChange(this.getItems(), [newData]));
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
            const pushDataToServer = async (newItems = null, deletedData = null, callback = null) => {
                if (newItems) {
                    this.isSendingData = this.isSendingData.concat(newItems);
                }
                if (callback)
                    this.isSendingDataCallbacks.push(callback);
                const PUSH_BATCH_SIZE = 50;
                if (this.isSendingData && this.isSendingData.length || deletedData) {
                    window.onbeforeunload = confirmExit;
                    function confirmExit() {
                        return "Data may be lost. Are you sure?";
                    }
                    const newBatch = this.isSendingData.slice(0, PUSH_BATCH_SIZE);
                    await this.dbSync.syncData(newBatch, deletedData);
                    pushDataToServer();
                }
                else {
                    window.onbeforeunload = null;
                    this.isSendingDataCallbacks.map(cb => { cb(); });
                    this.isSendingDataCallbacks = [];
                }
            };
            return new Promise((resolve, reject) => {
                const items = this.getItems();
                // this.subscriptions.filter(s => !s.idObj).map(s =>{ s.onChange(items, newData) });
                this.multiSubscriptions.map(s => { s.onChange(items, newData); });
                if (this.onChange) {
                    this.onChange(items, newData);
                }
                /* Local updates. Need to push to server */
                if (!from_server && this.dbSync && this.dbSync.syncData) {
                    pushDataToServer(newData, deletedData, () => {
                        resolve(true);
                    });
                    // if(this.isSendingData){
                    //     window.clearTimeout(this.isSendingData);
                    // }
                    // this.isSendingData = window.setTimeout(async ()=>{
                    //     await this.dbSync.syncData(newData, deletedData);
                    //     resolve(true);
                    //     this.isSendingData = null;
                    //     window.onbeforeunload = null;
                    // }, this.pushDebounce);
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
        this.isSendingData = [];
        this.isSendingDataCallbacks = [];
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


/***/ }),

/***/ "./lib/prostgles-full.ts":
/*!*******************************!*\
  !*** ./lib/prostgles-full.ts ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncedTable = exports.prostgles = void 0;
const prostgles_1 = __webpack_require__(/*! ./prostgles */ "./lib/prostgles.ts");
const SyncedTable_1 = __webpack_require__(/*! ./SyncedTable */ "./lib/SyncedTable.ts");
Object.defineProperty(exports, "SyncedTable", { enumerable: true, get: function () { return SyncedTable_1.SyncedTable; } });
const prostgles = (params) => {
    return prostgles_1.prostgles(params, SyncedTable_1.SyncedTable);
};
exports.prostgles = prostgles;


/***/ }),

/***/ "./lib/prostgles.ts":
/*!**************************!*\
  !*** ./lib/prostgles.ts ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Stefan L. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.prostgles = void 0;
function prostgles({ socket, isReady = (dbo, methods) => { }, onDisconnect }, syncedTable) {
    const preffix = "_psqlWS_.";
    var subscriptions = [];
    return new Promise((resolve, reject) => {
        if (onDisconnect) {
            socket.on("disconnect", onDisconnect);
        }
        /* Schema = published schema */
        socket.on(preffix + 'schema', ({ schema, methods, fullSchema, joinTables = [] }) => {
            let dbo = JSON.parse(JSON.stringify(schema));
            let _methods = JSON.parse(JSON.stringify(methods)), methodsObj = {};
            _methods.map(method => {
                methodsObj[method] = function (params) {
                    return new Promise((resolve, reject) => {
                        socket.emit(preffix + "method", { method, params }, (err, res) => {
                            if (err)
                                reject(err);
                            else
                                resolve(res);
                        });
                    });
                };
            });
            methodsObj = Object.freeze(methodsObj);
            if (dbo.sql) {
                // dbo.schema = Object.freeze([ ...dbo.sql ]);
                dbo.sql = function (query, params, options) {
                    return new Promise((resolve, reject) => {
                        socket.emit(preffix + "sql", { query, params, options }, (err, res) => {
                            if (err)
                                reject(err);
                            else
                                resolve(res);
                        });
                    });
                };
            }
            /* Building DBO object */
            Object.keys(dbo).forEach(tableName => {
                Object.keys(dbo[tableName]).forEach(command => {
                    if (command === "sync") {
                        dbo[tableName]._syncInfo = { ...dbo[tableName][command] };
                        if (syncedTable && syncedTable) {
                            dbo[tableName].getSync = (filter) => {
                                return new syncedTable({ name: tableName, filter, db: dbo });
                            };
                        }
                        function syncHandle(param1, param2, syncHandles) {
                            const { onSyncRequest, onPullRequest, onUpdates } = syncHandles;
                            var _this = this, 
                            // channelName,
                            lastUpdated, socketHandle;
                            socket.emit(preffix, { tableName, command, param1, param2, lastUpdated }, (err, res) => {
                                if (err) {
                                    console.error(err);
                                }
                                else if (res) {
                                    // channelName = res.channelName;
                                    const { id_fields, synced_field, channelName } = res, sync_info = { id_fields, synced_field };
                                    _this.sync_info = sync_info;
                                    _this.channelName = channelName;
                                    _this.socket = socket;
                                    _this.syncData = function (data, deleted, cb) {
                                        socket.emit(channelName, {
                                            onSyncRequest: {
                                                ...onSyncRequest({}, sync_info),
                                                ...({ data } || {}),
                                                ...({ deleted } || {})
                                            },
                                        }, !cb ? null : (response) => {
                                            cb(response);
                                        });
                                    };
                                    socket.emit(channelName, { onSyncRequest: onSyncRequest({}, sync_info) }, (response) => {
                                        console.log(response);
                                    });
                                    socketHandle = function (data, cb) {
                                        /*
                                            Client will:
                                            1. Send last_synced     on(onSyncRequest)
                                            2. Send data >= server_synced   on(onPullRequest)
                                            3. Send data on CRUD    emit(data.data)
                                            4. Upsert data.data     on(data.data)
                                        */
                                        if (!data)
                                            return;
                                        // onChange(data.data);
                                        if (data.data && data.data.length) {
                                            Promise.resolve(onUpdates(data.data, sync_info))
                                                .then(() => {
                                                if (cb)
                                                    cb({ ok: true });
                                            })
                                                .catch(err => { if (cb) {
                                                cb({ err });
                                            } });
                                        }
                                        else if (data.onSyncRequest) {
                                            // cb(onSyncRequest());
                                            Promise.resolve(onSyncRequest(data.onSyncRequest, sync_info))
                                                .then(res => cb({ onSyncRequest: res }))
                                                .catch(err => { if (cb) {
                                                cb({ err });
                                            } });
                                        }
                                        else if (data.onPullRequest) {
                                            Promise.resolve(onPullRequest(data.onPullRequest, sync_info))
                                                .then(arr => {
                                                cb({ data: arr });
                                            })
                                                .catch(err => { if (cb) {
                                                cb({ err });
                                            } });
                                        }
                                        else {
                                            console.log("unexpected response");
                                        }
                                        /* Cache */
                                        // window.localStorage.setItem(channelName, JSON.stringify(data))
                                    };
                                    subscriptions.push({ channelName, syncHandles, socketHandle });
                                    socket.on(channelName, socketHandle);
                                }
                            });
                            function unsync() {
                                return new Promise((resolve, reject) => {
                                    var subs = subscriptions.filter(s => s.channelName === _this.channelName);
                                    if (subs.length === 1) {
                                        subscriptions = subscriptions.filter(s => s.channelName !== _this.channelName);
                                        socket.emit(_this.channelName + "unsync", {}, (err, res) => {
                                            if (err)
                                                reject(err);
                                            else
                                                resolve(res);
                                        });
                                    }
                                    else if (subs.length > 1) {
                                        // socket.removeListener(channelName, socketHandle);
                                    }
                                    else {
                                        console.log("no syncs to unsync from", subs);
                                    }
                                    socket.removeListener(_this.channelName, socketHandle);
                                });
                            }
                            function syncData(data, deleted) {
                                if (_this && _this.syncData) {
                                    _this.syncData(data, deleted);
                                }
                            }
                            return Object.freeze({ unsync, syncData });
                        }
                        dbo[tableName][command] = syncHandle;
                    }
                    else if (command === "subscribe") {
                        function handle(param1, param2, onChange) {
                            var _this = this, channelName, lastUpdated, socketHandle;
                            socket.emit(preffix, { tableName, command, param1, param2, lastUpdated }, (err, res) => {
                                if (err) {
                                    console.error(err);
                                }
                                else if (res) {
                                    channelName = res.channelName;
                                    socketHandle = function (data, cb) {
                                        /* TO DO: confirm receiving data or server will unsubscribe */
                                        // if(cb) cb(true);
                                        onChange(data.data);
                                        /* Cache */
                                        // window.localStorage.setItem(channelName, JSON.stringify(data))
                                        _this.channelName = channelName;
                                        _this.socket = socket;
                                    };
                                    subscriptions.push({ channelName, onChange, socketHandle });
                                    socket.on(channelName, socketHandle);
                                }
                            });
                            function unsubscribe() {
                                var subs = subscriptions.filter(s => s.channelName === channelName);
                                if (subs.length === 1) {
                                    subscriptions = subscriptions.filter(s => s.channelName !== channelName);
                                    socket.emit(channelName + "unsubscribe", {}, (err, res) => {
                                        // console.log("unsubscribed", err, res);
                                    });
                                }
                                else if (subs.length > 1) {
                                    // socket.removeListener(channelName, socketHandle);
                                }
                                else {
                                    console.log("no subscriptions to unsubscribe from", subs);
                                }
                                socket.removeListener(channelName, socketHandle);
                            }
                            return Object.freeze({ unsubscribe });
                        }
                        dbo[tableName][command] = handle;
                    }
                    else {
                        dbo[tableName][command] = function (param1, param2, param3) {
                            // if(Array.isArray(param2) || Array.isArray(param3)) throw "Expecting an object";
                            return new Promise((resolve, reject) => {
                                socket.emit(preffix, { tableName, command, param1, param2, param3 }, (err, res) => {
                                    if (err)
                                        reject(err);
                                    else
                                        resolve(res);
                                });
                            });
                        };
                    }
                });
            });
            joinTables.map(table => {
                dbo.innerJoin = dbo.innerJoin || {};
                dbo.leftJoin = dbo.leftJoin || {};
                dbo.innerJoinOne = dbo.innerJoinOne || {};
                dbo.leftJoinOne = dbo.leftJoinOne || {};
                dbo.leftJoin[table] = (filter, select, options = {}) => {
                    return makeJoin(true, filter, select, options);
                };
                dbo.innerJoin[table] = (filter, select, options = {}) => {
                    return makeJoin(false, filter, select, options);
                };
                dbo.leftJoinOne[table] = (filter, select, options = {}) => {
                    return makeJoin(true, filter, select, { ...options, limit: 1 });
                };
                dbo.innerJoinOne[table] = (filter, select, options = {}) => {
                    return makeJoin(false, filter, select, { ...options, limit: 1 });
                };
                function makeJoin(isLeft = true, filter, select, options) {
                    return {
                        [isLeft ? "$leftJoin" : "$innerJoin"]: table,
                        filter,
                        select,
                        ...options
                    };
                }
            });
            isReady(dbo, methodsObj);
            resolve(dbo);
        });
    });
}
exports.prostgles = prostgles;
;


/***/ })

/******/ });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay91bml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uIiwid2VicGFjazovLy93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly8vLi9saWIvU3luY2VkVGFibGUudHMiLCJ3ZWJwYWNrOi8vLy4vbGliL3Byb3N0Z2xlcy1mdWxsLnRzIiwid2VicGFjazovLy8uL2xpYi9wcm9zdGdsZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNELE87UUNWQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7O1FBRUE7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7UUFDQTs7O1FBR0E7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7UUFDQTtRQUNBLDBDQUEwQyxnQ0FBZ0M7UUFDMUU7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7UUFDQSx3REFBd0Qsa0JBQWtCO1FBQzFFO1FBQ0EsaURBQWlELGNBQWM7UUFDL0Q7O1FBRUE7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBLHlDQUF5QyxpQ0FBaUM7UUFDMUUsZ0hBQWdILG1CQUFtQixFQUFFO1FBQ3JJO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0EsMkJBQTJCLDBCQUEwQixFQUFFO1FBQ3ZELGlDQUFpQyxlQUFlO1FBQ2hEO1FBQ0E7UUFDQTs7UUFFQTtRQUNBLHNEQUFzRCwrREFBK0Q7O1FBRXJIO1FBQ0E7OztRQUdBO1FBQ0E7Ozs7Ozs7Ozs7Ozs7QUNsRmE7QUFDYiw4Q0FBOEMsY0FBYztBQUM1RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUIsMkVBQTJFO0FBQzVGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJDQUEyQztBQUMzQztBQUNBO0FBQ0E7QUFDQTtBQUNBLCtDQUErQyxPQUFPLEdBQUcsT0FBTztBQUNoRSxnQ0FBZ0M7QUFDaEM7QUFDQTtBQUNBLHdDQUF3QyxPQUFPLEdBQUcsT0FBTztBQUN6RCx5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0EsZ0NBQWdDLE9BQU87QUFDdkM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiLGtEQUFrRCxlQUFlLGNBQWMsZUFBZSxhQUFhLFlBQVk7QUFDdkg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyREFBMkQsTUFBTSxFQUFFO0FBQ25FO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxRUFBcUUsNkJBQTZCO0FBQ2xHLGtEQUFrRCw0QkFBNEIsRUFBRTtBQUNoRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCO0FBQ3hCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLG1EQUFtRDtBQUN0RSx1Q0FBdUMsT0FBTztBQUM5QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxlQUFlLDBCQUEwQjtBQUN6QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbURBQW1ELGNBQWM7QUFDakU7QUFDQTtBQUNBLG1EQUFtRCxHQUFHO0FBQ3REO0FBQ0EsYUFBYSxFQUFFO0FBQ2Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQixXQUFXLHVCQUF1Qiw0QkFBNEI7QUFDbkY7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4QkFBOEIsY0FBYztBQUM1QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0Esb0NBQW9DO0FBQ3BDO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBLGlDQUFpQztBQUNqQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4QkFBOEIsZ0JBQWdCO0FBQzlDO0FBQ0E7QUFDQSxzQkFBc0I7QUFDdEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7OztBQ25VYTtBQUNiLDhDQUE4QyxjQUFjO0FBQzVEO0FBQ0Esb0JBQW9CLG1CQUFPLENBQUMsdUNBQWE7QUFDekMsc0JBQXNCLG1CQUFPLENBQUMsMkNBQWU7QUFDN0MsK0NBQStDLHFDQUFxQyxrQ0FBa0MsRUFBRSxFQUFFO0FBQzFIO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7O0FDVGE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhDQUE4QyxjQUFjO0FBQzVEO0FBQ0Esb0JBQW9CLHNDQUFzQyxFQUFFLGdCQUFnQjtBQUM1RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdDQUF3QywrQ0FBK0M7QUFDdkY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlEQUF5RCxpQkFBaUI7QUFDMUU7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekIscUJBQXFCO0FBQ3JCO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzREFBc0QseUJBQXlCO0FBQy9FO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvREFBb0Q7QUFDcEQ7QUFDQTtBQUNBLHdEQUF3RCxtQ0FBbUM7QUFDM0Y7QUFDQTtBQUNBO0FBQ0EsbUNBQW1DLDBDQUEwQztBQUM3RTtBQUNBO0FBQ0E7QUFDQSxrREFBa0Qsa0RBQWtEO0FBQ3BHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQ0FBMkMsdUNBQXVDLHFCQUFxQjtBQUN2RztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtRUFBbUU7QUFDbkUscURBQXFELE9BQU8sTUFBTTtBQUNsRSxxREFBcUQsVUFBVSxNQUFNO0FBQ3JFLDZDQUE2QztBQUM3Qyx5Q0FBeUM7QUFDekM7QUFDQSx5Q0FBeUM7QUFDekM7QUFDQSw4REFBOEQsZ0NBQWdDLGNBQWM7QUFDNUc7QUFDQSxxQ0FBcUM7QUFDckM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0RBQXdELFdBQVc7QUFDbkUsNkNBQTZDO0FBQzdDLCtEQUErRDtBQUMvRCxvREFBb0QsTUFBTTtBQUMxRCw2Q0FBNkMsRUFBRTtBQUMvQztBQUNBO0FBQ0E7QUFDQTtBQUNBLGlFQUFpRSxxQkFBcUI7QUFDdEYsK0RBQStEO0FBQy9ELG9EQUFvRCxNQUFNO0FBQzFELDZDQUE2QyxFQUFFO0FBQy9DO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0RBQW9ELFlBQVk7QUFDaEUsNkNBQTZDO0FBQzdDLCtEQUErRDtBQUMvRCxvREFBb0QsTUFBTTtBQUMxRCw2Q0FBNkMsRUFBRTtBQUMvQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdEQUF3RCx5Q0FBeUM7QUFDakc7QUFDQTtBQUNBLDZCQUE2QjtBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0ZBQW9GO0FBQ3BGO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUNBQXlDO0FBQ3pDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQ0FBaUM7QUFDakM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0RBQWtELG1CQUFtQjtBQUNyRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrREFBa0Qsa0RBQWtEO0FBQ3BHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3REFBd0Qsc0NBQXNDO0FBQzlGO0FBQ0E7QUFDQSw2QkFBNkI7QUFDN0I7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrRUFBK0U7QUFDL0U7QUFDQSxxQ0FBcUM7QUFDckM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0RBQWtELGNBQWM7QUFDaEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzREFBc0QsNkNBQTZDO0FBQ25HO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUNBQWlDO0FBQ2pDLDZCQUE2QjtBQUM3QjtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUVBQW1FO0FBQ25FO0FBQ0E7QUFDQSxvRUFBb0U7QUFDcEU7QUFDQTtBQUNBLHNFQUFzRTtBQUN0RSwyREFBMkQsdUJBQXVCO0FBQ2xGO0FBQ0EsdUVBQXVFO0FBQ3ZFLDREQUE0RCx1QkFBdUI7QUFDbkY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxTQUFTO0FBQ1QsS0FBSztBQUNMO0FBQ0E7QUFDQSIsImZpbGUiOiJwcm9zdGdsZXMuZGV2LmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIHdlYnBhY2tVbml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uKHJvb3QsIGZhY3RvcnkpIHtcblx0aWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnKVxuXHRcdG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuXHRlbHNlIGlmKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZClcblx0XHRkZWZpbmUoW10sIGZhY3RvcnkpO1xuXHRlbHNlIHtcblx0XHR2YXIgYSA9IGZhY3RvcnkoKTtcblx0XHRmb3IodmFyIGkgaW4gYSkgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyA/IGV4cG9ydHMgOiByb290KVtpXSA9IGFbaV07XG5cdH1cbn0pKHRoaXMsIGZ1bmN0aW9uKCkge1xucmV0dXJuICIsIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKSB7XG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG4gXHRcdH1cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGk6IG1vZHVsZUlkLFxuIFx0XHRcdGw6IGZhbHNlLFxuIFx0XHRcdGV4cG9ydHM6IHt9XG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmwgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb24gZm9yIGhhcm1vbnkgZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgZ2V0dGVyKSB7XG4gXHRcdGlmKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywgbmFtZSkpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbmFtZSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGdldHRlciB9KTtcbiBcdFx0fVxuIFx0fTtcblxuIFx0Ly8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yID0gZnVuY3Rpb24oZXhwb3J0cykge1xuIFx0XHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcbiBcdFx0fVxuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuIFx0fTtcblxuIFx0Ly8gY3JlYXRlIGEgZmFrZSBuYW1lc3BhY2Ugb2JqZWN0XG4gXHQvLyBtb2RlICYgMTogdmFsdWUgaXMgYSBtb2R1bGUgaWQsIHJlcXVpcmUgaXRcbiBcdC8vIG1vZGUgJiAyOiBtZXJnZSBhbGwgcHJvcGVydGllcyBvZiB2YWx1ZSBpbnRvIHRoZSBuc1xuIFx0Ly8gbW9kZSAmIDQ6IHJldHVybiB2YWx1ZSB3aGVuIGFscmVhZHkgbnMgb2JqZWN0XG4gXHQvLyBtb2RlICYgOHwxOiBiZWhhdmUgbGlrZSByZXF1aXJlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnQgPSBmdW5jdGlvbih2YWx1ZSwgbW9kZSkge1xuIFx0XHRpZihtb2RlICYgMSkgdmFsdWUgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKHZhbHVlKTtcbiBcdFx0aWYobW9kZSAmIDgpIHJldHVybiB2YWx1ZTtcbiBcdFx0aWYoKG1vZGUgJiA0KSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICYmIHZhbHVlLl9fZXNNb2R1bGUpIHJldHVybiB2YWx1ZTtcbiBcdFx0dmFyIG5zID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yKG5zKTtcbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KG5zLCAnZGVmYXVsdCcsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHZhbHVlIH0pO1xuIFx0XHRpZihtb2RlICYgMiAmJiB0eXBlb2YgdmFsdWUgIT0gJ3N0cmluZycpIGZvcih2YXIga2V5IGluIHZhbHVlKSBfX3dlYnBhY2tfcmVxdWlyZV9fLmQobnMsIGtleSwgZnVuY3Rpb24oa2V5KSB7IHJldHVybiB2YWx1ZVtrZXldOyB9LmJpbmQobnVsbCwga2V5KSk7XG4gXHRcdHJldHVybiBucztcbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXyhfX3dlYnBhY2tfcmVxdWlyZV9fLnMgPSBcIi4vbGliL3Byb3N0Z2xlcy1mdWxsLnRzXCIpO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlN5bmNlZFRhYmxlID0gdm9pZCAwO1xuY29uc3QgU1RPUkFHRV9UWVBFUyA9IHtcbiAgICBhcnJheTogXCJhcnJheVwiLFxuICAgIGxvY2FsU3RvcmFnZTogXCJsb2NhbFN0b3JhZ2VcIlxufTtcbmNsYXNzIFN5bmNlZFRhYmxlIHtcbiAgICBjb25zdHJ1Y3Rvcih7IG5hbWUsIGZpbHRlciwgb25DaGFuZ2UsIGRiLCBwdXNoRGVib3VuY2UgPSAxMDAsIHNraXBGaXJzdFRyaWdnZXIgPSBmYWxzZSB9KSB7XG4gICAgICAgIHRoaXMucHVzaERlYm91bmNlID0gMTAwO1xuICAgICAgICB0aGlzLnNraXBGaXJzdFRyaWdnZXIgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pdGVtcyA9IFtdO1xuICAgICAgICB0aGlzLnN0b3JhZ2VUeXBlID0gU1RPUkFHRV9UWVBFUy5hcnJheTtcbiAgICAgICAgdGhpcy5pdGVtc09iaiA9IHt9O1xuICAgICAgICB0aGlzLm5vdGlmeVN1YnNjcmlwdGlvbnMgPSAoaWRPYmosIG5ld0RhdGEsIGRlbHRhKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNpbmdsZVN1YnNjcmlwdGlvbnMuZmlsdGVyKHMgPT4gcy5pZE9iaiAmJlxuICAgICAgICAgICAgICAgIHRoaXMubWF0Y2hlc0lkT2JqKHMuaWRPYmosIGlkT2JqKSAmJlxuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKHMuaWRPYmopLmxlbmd0aCA8PSBPYmplY3Qua2V5cyhpZE9iaikubGVuZ3RoKVxuICAgICAgICAgICAgICAgIC5tYXAocyA9PiB7XG4gICAgICAgICAgICAgICAgcy5vbkNoYW5nZShuZXdEYXRhLCBkZWx0YSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMubXVsdGlTdWJzY3JpcHRpb25zLm1hcChzID0+IHMub25DaGFuZ2UodGhpcy5nZXRJdGVtcygpLCBbbmV3RGF0YV0pKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy51bnN1YnNjcmliZSA9IChvbkNoYW5nZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zaW5nbGVTdWJzY3JpcHRpb25zID0gdGhpcy5zaW5nbGVTdWJzY3JpcHRpb25zLmZpbHRlcihzID0+IHMub25DaGFuZ2UgIT09IG9uQ2hhbmdlKTtcbiAgICAgICAgICAgIHRoaXMubXVsdGlTdWJzY3JpcHRpb25zID0gdGhpcy5tdWx0aVN1YnNjcmlwdGlvbnMuZmlsdGVyKHMgPT4gcy5vbkNoYW5nZSAhPT0gb25DaGFuZ2UpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLnVuc3luYyA9ICgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmRiU3luYyAmJiB0aGlzLmRiU3luYy51bnN5bmMpXG4gICAgICAgICAgICAgICAgdGhpcy5kYlN5bmMudW5zeW5jKCk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZGVsZXRlID0gKGlkT2JqKSA9PiB7XG4gICAgICAgICAgICBsZXQgaXRlbXMgPSB0aGlzLmdldEl0ZW1zKCk7XG4gICAgICAgICAgICBpdGVtcyA9IGl0ZW1zLmZpbHRlcihkID0+ICF0aGlzLm1hdGNoZXNJZE9iaihpZE9iaiwgZCkpO1xuICAgICAgICAgICAgLy8gd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKHRoaXMubmFtZSwgSlNPTi5zdHJpbmdpZnkoaXRlbXMpKTtcbiAgICAgICAgICAgIHRoaXMuc2V0SXRlbXMoaXRlbXMpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMub25EYXRhQ2hhbmdlZChudWxsLCBbaWRPYmpdKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5zeW5jRGVsZXRlZCA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwodGhpcy5nZXREZWxldGVkKCkubWFwKGFzeW5jIChpZE9iaikgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5kYlt0aGlzLm5hbWVdLmRlbGV0ZShpZE9iaik7XG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0RGVsZXRlZChudWxsLCBbXSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMudXBzZXJ0ID0gYXN5bmMgKGRhdGEsIGZyb21fc2VydmVyID0gZmFsc2UpID0+IHtcbiAgICAgICAgICAgIGxldCBpdGVtcyA9IHRoaXMuZ2V0SXRlbXMoKTtcbiAgICAgICAgICAgIGlmIChmcm9tX3NlcnZlciAmJiB0aGlzLmdldERlbGV0ZWQoKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnN5bmNEZWxldGVkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgdXBkYXRlcyA9IFtdLCBpbnNlcnRzID0gW107XG4gICAgICAgICAgICBkYXRhLm1hcChkID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIWZyb21fc2VydmVyKVxuICAgICAgICAgICAgICAgICAgICBkW3RoaXMuc3luY2VkX2ZpZWxkXSA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgbGV0IGV4aXN0aW5nX2lkeCA9IGl0ZW1zLmZpbmRJbmRleChjID0+ICF0aGlzLmlkX2ZpZWxkcy5maW5kKGtleSA9PiBjW2tleV0gIT09IGRba2V5XSkpLCBleGlzdGluZyA9IGl0ZW1zW2V4aXN0aW5nX2lkeF07XG4gICAgICAgICAgICAgICAgaWYgKGV4aXN0aW5nICYmIGV4aXN0aW5nW3RoaXMuc3luY2VkX2ZpZWxkXSA8IGRbdGhpcy5zeW5jZWRfZmllbGRdKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zW2V4aXN0aW5nX2lkeF0gPSB7IC4uLmQgfTtcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlcy5wdXNoKGQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZnJvbV9zZXJ2ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoaXMuc3Vic2NyaXB0aW9ucy5maWx0ZXIocyA9PiBzLmlkT2JqICYmIHRoaXMubWF0Y2hlc0lkT2JqKHMuaWRPYmosIGQpKVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIC5tYXAocyA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIHMub25DaGFuZ2UoeyAuLi5kIH0sIHsgLi4uZCB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2luZ2xlU3Vic2NyaXB0aW9ucy5maWx0ZXIocyA9PiBzLmlkT2JqICYmIHRoaXMubWF0Y2hlc0lkT2JqKHMuaWRPYmosIGQpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAocyA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcy5vbkNoYW5nZSh7IC4uLmQgfSwgeyAuLi5kIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoIWV4aXN0aW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zLnB1c2goeyAuLi5kIH0pO1xuICAgICAgICAgICAgICAgICAgICBpbnNlcnRzLnB1c2goZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8qIFRPRE86IERlbGV0ZXMgZnJvbSBzZXJ2ZXIgKi9cbiAgICAgICAgICAgICAgICAvLyBpZihhbGxvd19kZWxldGVzKXtcbiAgICAgICAgICAgICAgICAvLyAgICAgaXRlbXMgPSB0aGlzLmdldEl0ZW1zKCk7XG4gICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgb25VcGRhdGVzOiBpbnNlcnRzKCAke2luc2VydHMubGVuZ3RofSApIHVwZGF0ZXMoICR7dXBkYXRlcy5sZW5ndGh9ICkgIHRvdGFsKCAke2RhdGEubGVuZ3RofSApYCk7XG4gICAgICAgICAgICBjb25zdCBuZXdEYXRhID0gWy4uLmluc2VydHMsIC4uLnVwZGF0ZXNdO1xuICAgICAgICAgICAgLy8gd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKHRoaXMubmFtZSwgSlNPTi5zdHJpbmdpZnkoaXRlbXMpKTtcbiAgICAgICAgICAgIHRoaXMuc2V0SXRlbXMoaXRlbXMpO1xuICAgICAgICAgICAgdGhpcy5vbkRhdGFDaGFuZ2VkKG5ld0RhdGEsIG51bGwsIGZyb21fc2VydmVyKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLm9uRGF0YUNoYW5nZWQgPSBhc3luYyAobmV3RGF0YSA9IG51bGwsIGRlbGV0ZWREYXRhID0gbnVsbCwgZnJvbV9zZXJ2ZXIgPSBmYWxzZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHVzaERhdGFUb1NlcnZlciA9IGFzeW5jIChuZXdJdGVtcyA9IG51bGwsIGRlbGV0ZWREYXRhID0gbnVsbCwgY2FsbGJhY2sgPSBudWxsKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKG5ld0l0ZW1zKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaXNTZW5kaW5nRGF0YSA9IHRoaXMuaXNTZW5kaW5nRGF0YS5jb25jYXQobmV3SXRlbXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaXNTZW5kaW5nRGF0YUNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICBjb25zdCBQVVNIX0JBVENIX1NJWkUgPSA1MDtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pc1NlbmRpbmdEYXRhICYmIHRoaXMuaXNTZW5kaW5nRGF0YS5sZW5ndGggfHwgZGVsZXRlZERhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93Lm9uYmVmb3JldW5sb2FkID0gY29uZmlybUV4aXQ7XG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGNvbmZpcm1FeGl0KCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiRGF0YSBtYXkgYmUgbG9zdC4gQXJlIHlvdSBzdXJlP1wiO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld0JhdGNoID0gdGhpcy5pc1NlbmRpbmdEYXRhLnNsaWNlKDAsIFBVU0hfQkFUQ0hfU0laRSk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuZGJTeW5jLnN5bmNEYXRhKG5ld0JhdGNoLCBkZWxldGVkRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIHB1c2hEYXRhVG9TZXJ2ZXIoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5vbmJlZm9yZXVubG9hZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaXNTZW5kaW5nRGF0YUNhbGxiYWNrcy5tYXAoY2IgPT4geyBjYigpOyB9KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pc1NlbmRpbmdEYXRhQ2FsbGJhY2tzID0gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbXMgPSB0aGlzLmdldEl0ZW1zKCk7XG4gICAgICAgICAgICAgICAgLy8gdGhpcy5zdWJzY3JpcHRpb25zLmZpbHRlcihzID0+ICFzLmlkT2JqKS5tYXAocyA9Pnsgcy5vbkNoYW5nZShpdGVtcywgbmV3RGF0YSkgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5tdWx0aVN1YnNjcmlwdGlvbnMubWFwKHMgPT4geyBzLm9uQ2hhbmdlKGl0ZW1zLCBuZXdEYXRhKTsgfSk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub25DaGFuZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkNoYW5nZShpdGVtcywgbmV3RGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8qIExvY2FsIHVwZGF0ZXMuIE5lZWQgdG8gcHVzaCB0byBzZXJ2ZXIgKi9cbiAgICAgICAgICAgICAgICBpZiAoIWZyb21fc2VydmVyICYmIHRoaXMuZGJTeW5jICYmIHRoaXMuZGJTeW5jLnN5bmNEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHB1c2hEYXRhVG9TZXJ2ZXIobmV3RGF0YSwgZGVsZXRlZERhdGEsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAvLyBpZih0aGlzLmlzU2VuZGluZ0RhdGEpe1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgd2luZG93LmNsZWFyVGltZW91dCh0aGlzLmlzU2VuZGluZ0RhdGEpO1xuICAgICAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAgICAgICAgIC8vIHRoaXMuaXNTZW5kaW5nRGF0YSA9IHdpbmRvdy5zZXRUaW1lb3V0KGFzeW5jICgpPT57XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICBhd2FpdCB0aGlzLmRiU3luYy5zeW5jRGF0YShuZXdEYXRhLCBkZWxldGVkRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICByZXNvbHZlKHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgdGhpcy5pc1NlbmRpbmdEYXRhID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIHdpbmRvdy5vbmJlZm9yZXVubG9hZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIC8vIH0sIHRoaXMucHVzaERlYm91bmNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuc2V0SXRlbXMgPSAoaXRlbXMpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLnN0b3JhZ2VUeXBlID09PSBTVE9SQUdFX1RZUEVTLmxvY2FsU3RvcmFnZSkge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbSh0aGlzLm5hbWUsIEpTT04uc3RyaW5naWZ5KGl0ZW1zKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh0aGlzLnN0b3JhZ2VUeXBlID09PSBTVE9SQUdFX1RZUEVTLmFycmF5KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pdGVtcyA9IGl0ZW1zO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJpbnZhbGlkL21pc3Npbmcgc3RvcmFnZVR5cGUgLT4gXCIgKyB0aGlzLnN0b3JhZ2VUeXBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5nZXRJdGVtcyA9IChzeW5jX2luZm8pID0+IHtcbiAgICAgICAgICAgIGxldCBpdGVtcyA9IFtdO1xuICAgICAgICAgICAgaWYgKHRoaXMuc3RvcmFnZVR5cGUgPT09IFNUT1JBR0VfVFlQRVMubG9jYWxTdG9yYWdlKSB7XG4gICAgICAgICAgICAgICAgbGV0IGNhY2hlZFN0ciA9IHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbSh0aGlzLm5hbWUpO1xuICAgICAgICAgICAgICAgIGlmIChjYWNoZWRTdHIpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zID0gSlNPTi5wYXJzZShjYWNoZWRTdHIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodGhpcy5zdG9yYWdlVHlwZSA9PT0gU1RPUkFHRV9UWVBFUy5hcnJheSkge1xuICAgICAgICAgICAgICAgIGl0ZW1zID0gdGhpcy5pdGVtcy5zbGljZSgwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiaW52YWxpZC9taXNzaW5nIHN0b3JhZ2VUeXBlIC0+IFwiICsgdGhpcy5zdG9yYWdlVHlwZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5pZF9maWVsZHMgJiYgdGhpcy5zeW5jZWRfZmllbGQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzX2ZpZWxkcyA9IFt0aGlzLnN5bmNlZF9maWVsZCwgLi4udGhpcy5pZF9maWVsZHMuc29ydCgpXTtcbiAgICAgICAgICAgICAgICBpdGVtcyA9IGl0ZW1zXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoZCA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAhdGhpcy5maWx0ZXIgfHwgIU9iamVjdC5rZXlzKHRoaXMuZmlsdGVyKS5maW5kKGtleSA9PiBkW2tleV0udG9TdHJpbmcoKSAhPT0gdGhpcy5maWx0ZXJba2V5XS50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAuc29ydCgoYSwgYikgPT4gc19maWVsZHMubWFwKGtleSA9PiBhW2tleV0gPCBiW2tleV0gPyAtMSA6IGFba2V5XSA+IGJba2V5XSA/IDEgOiAwKS5maW5kKHYgPT4gdikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5pdGVtcyA9IGl0ZW1zO1xuICAgICAgICAgICAgcmV0dXJuIGl0ZW1zO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmdldEJhdGNoID0gKHBhcmFtcywgc3luY19pbmZvKSA9PiB7XG4gICAgICAgICAgICBsZXQgaXRlbXMgPSB0aGlzLmdldEl0ZW1zKCk7XG4gICAgICAgICAgICBwYXJhbXMgPSBwYXJhbXMgfHwge307XG4gICAgICAgICAgICBjb25zdCB7IGZyb21fc3luY2VkLCB0b19zeW5jZWQsIG9mZnNldCA9IDAsIGxpbWl0ID0gbnVsbCB9ID0gcGFyYW1zO1xuICAgICAgICAgICAgbGV0IHJlcyA9IGl0ZW1zLm1hcChjID0+ICh7IC4uLmMgfSkpXG4gICAgICAgICAgICAgICAgLmZpbHRlcihjID0+ICghZnJvbV9zeW5jZWQgfHwgY1t0aGlzLnN5bmNlZF9maWVsZF0gPj0gZnJvbV9zeW5jZWQpICYmXG4gICAgICAgICAgICAgICAgKCF0b19zeW5jZWQgfHwgY1t0aGlzLnN5bmNlZF9maWVsZF0gPD0gdG9fc3luY2VkKSk7XG4gICAgICAgICAgICBpZiAob2Zmc2V0IHx8IGxpbWl0KVxuICAgICAgICAgICAgICAgIHJlcyA9IHJlcy5zcGxpY2Uob2Zmc2V0LCBsaW1pdCB8fCByZXMubGVuZ3RoKTtcbiAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuZmlsdGVyID0gZmlsdGVyO1xuICAgICAgICB0aGlzLm9uQ2hhbmdlID0gb25DaGFuZ2U7XG4gICAgICAgIGlmICghZGIpXG4gICAgICAgICAgICB0aHJvdyBcImRiIG1pc3NpbmdcIjtcbiAgICAgICAgdGhpcy5kYiA9IGRiO1xuICAgICAgICBjb25zdCB7IGlkX2ZpZWxkcywgc3luY2VkX2ZpZWxkIH0gPSBkYlt0aGlzLm5hbWVdLl9zeW5jSW5mbztcbiAgICAgICAgaWYgKCFpZF9maWVsZHMgfHwgIXN5bmNlZF9maWVsZClcbiAgICAgICAgICAgIHRocm93IFwiaWRfZmllbGRzL3N5bmNlZF9maWVsZCBtaXNzaW5nXCI7XG4gICAgICAgIHRoaXMuaWRfZmllbGRzID0gaWRfZmllbGRzO1xuICAgICAgICB0aGlzLnN5bmNlZF9maWVsZCA9IHN5bmNlZF9maWVsZDtcbiAgICAgICAgdGhpcy5wdXNoRGVib3VuY2UgPSBwdXNoRGVib3VuY2U7XG4gICAgICAgIHRoaXMuaXNTZW5kaW5nRGF0YSA9IFtdO1xuICAgICAgICB0aGlzLmlzU2VuZGluZ0RhdGFDYWxsYmFja3MgPSBbXTtcbiAgICAgICAgdGhpcy5za2lwRmlyc3RUcmlnZ2VyID0gc2tpcEZpcnN0VHJpZ2dlcjtcbiAgICAgICAgdGhpcy5tdWx0aVN1YnNjcmlwdGlvbnMgPSBbXTtcbiAgICAgICAgdGhpcy5zaW5nbGVTdWJzY3JpcHRpb25zID0gW107XG4gICAgICAgIGNvbnN0IG9uU3luY1JlcXVlc3QgPSAocGFyYW1zLCBzeW5jX2luZm8pID0+IHtcbiAgICAgICAgICAgIGxldCByZXMgPSB7IGNfbHI6IG51bGwsIGNfZnI6IG51bGwsIGNfY291bnQ6IDAgfTtcbiAgICAgICAgICAgIGxldCBiYXRjaCA9IHRoaXMuZ2V0QmF0Y2gocGFyYW1zLCBzeW5jX2luZm8pO1xuICAgICAgICAgICAgaWYgKGJhdGNoLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHJlcyA9IHtcbiAgICAgICAgICAgICAgICAgICAgY19mcjogYmF0Y2hbMF0gfHwgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgY19scjogYmF0Y2hbYmF0Y2gubGVuZ3RoIC0gMV0gfHwgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgY19jb3VudDogYmF0Y2gubGVuZ3RoXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwib25TeW5jUmVxdWVzdFwiLCByZXMpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgfSwgb25QdWxsUmVxdWVzdCA9IGFzeW5jIChwYXJhbXMsIHN5bmNfaW5mbykgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuZ2V0RGVsZXRlZCgpLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc3luY0RlbGV0ZWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLmdldEJhdGNoKHBhcmFtcywgc3luY19pbmZvKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBvblB1bGxSZXF1ZXN0OiB0b3RhbCgkeyBkYXRhLmxlbmd0aCB9KWApXG4gICAgICAgICAgICByZXR1cm4gZGF0YTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5kYlN5bmMgPSBkYlt0aGlzLm5hbWVdLnN5bmMoZmlsdGVyLCB7fSwgeyBvblN5bmNSZXF1ZXN0LCBvblB1bGxSZXF1ZXN0LCBvblVwZGF0ZXM6IChkYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy51cHNlcnQoZGF0YSwgdHJ1ZSk7XG4gICAgICAgICAgICB9IH0pO1xuICAgICAgICBpZiAodGhpcy5vbkNoYW5nZSAmJiAhdGhpcy5za2lwRmlyc3RUcmlnZ2VyKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KHRoaXMub25DaGFuZ2UsIDApO1xuICAgICAgICB9XG4gICAgfVxuICAgIHN1YnNjcmliZUFsbChvbkNoYW5nZSkge1xuICAgICAgICBjb25zdCBzdWIgPSB7IG9uQ2hhbmdlIH0sIHVuc3Vic2NyaWJlID0gKCkgPT4geyB0aGlzLnVuc3Vic2NyaWJlKG9uQ2hhbmdlKTsgfTtcbiAgICAgICAgdGhpcy5tdWx0aVN1YnNjcmlwdGlvbnMucHVzaChzdWIpO1xuICAgICAgICBpZiAoIXRoaXMuc2tpcEZpcnN0VHJpZ2dlcikge1xuICAgICAgICAgICAgb25DaGFuZ2UodGhpcy5nZXRJdGVtcygpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gT2JqZWN0LmZyZWV6ZSh7IHVuc3Vic2NyaWJlIH0pO1xuICAgIH1cbiAgICBzdWJzY3JpYmVPbmUoaWRPYmosIG9uQ2hhbmdlKSB7XG4gICAgICAgIGlmICghaWRPYmogfHwgIW9uQ2hhbmdlKVxuICAgICAgICAgICAgdGhyb3cgXCJiYWRcIjtcbiAgICAgICAgY29uc3QgaXRlbSA9IHRoaXMuZmluZE9uZShpZE9iaik7XG4gICAgICAgIGlmICghaXRlbSlcbiAgICAgICAgICAgIHRocm93IFwibm8gaXRlbSBmb3VuZFwiO1xuICAgICAgICBjb25zdCBzdWIgPSB7XG4gICAgICAgICAgICBvbkNoYW5nZSxcbiAgICAgICAgICAgIGlkT2JqLFxuICAgICAgICAgICAgaXRlbVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBzeW5jSGFuZGxlID0ge1xuICAgICAgICAgICAgZ2V0OiAoKSA9PiB0aGlzLmZpbmRPbmUoaWRPYmopLFxuICAgICAgICAgICAgdW5zdWJzY3JpYmU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnVuc3Vic2NyaWJlKG9uQ2hhbmdlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkZWxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5kZWxldGUoaWRPYmopO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVwZGF0ZTogZGF0YSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gY29uc3QgbmV3RGF0YSA9IHsgLi4udGhpcy5maW5kT25lKGlkT2JqKSwgLi4uZGF0YSwgLi4uaWRPYmogfTtcbiAgICAgICAgICAgICAgICAvLyBub3RpZnlTdWJzY3JpcHRpb25zKG5ld0RhdGEsIGRhdGEpO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMudXBzZXJ0KFtuZXdEYXRhXSk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVPbmUoaWRPYmosIGRhdGEpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVwZGF0ZUZ1bGw6IGRhdGEgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5ld0RhdGEgPSB7IC4uLmRhdGEsIC4uLmlkT2JqIH07XG4gICAgICAgICAgICAgICAgdGhpcy5ub3RpZnlTdWJzY3JpcHRpb25zKGlkT2JqLCBuZXdEYXRhLCBkYXRhKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwc2VydChbbmV3RGF0YV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLnNpbmdsZVN1YnNjcmlwdGlvbnMucHVzaChzdWIpO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IG9uQ2hhbmdlKGl0ZW0sIGl0ZW0pLCAwKTtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5mcmVlemUoeyAuLi5zeW5jSGFuZGxlIH0pO1xuICAgIH1cbiAgICB1cGRhdGVPbmUoaWRPYmosIG5ld0RhdGEpIHtcbiAgICAgICAgY29uc3QgaXRlbSA9IHsgLi4udGhpcy5maW5kT25lKGlkT2JqKSwgLi4ubmV3RGF0YSwgLi4uaWRPYmogfTtcbiAgICAgICAgdGhpcy5ub3RpZnlTdWJzY3JpcHRpb25zKGlkT2JqLCBpdGVtLCBuZXdEYXRhKTtcbiAgICAgICAgdGhpcy51cHNlcnQoW2l0ZW1dKTtcbiAgICB9XG4gICAgZmluZE9uZShpZE9iaikge1xuICAgICAgICB0aGlzLmdldEl0ZW1zKCk7XG4gICAgICAgIGxldCBpdGVtSWR4ID0gLTE7XG4gICAgICAgIGlmICh0eXBlb2YgaWRPYmogPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgaXRlbUlkeCA9IHRoaXMuaXRlbXMuZmluZEluZGV4KGlkT2JqKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGl0ZW1JZHggPSB0aGlzLml0ZW1zLmZpbmRJbmRleChkID0+IHRoaXMubWF0Y2hlc0lkT2JqKGlkT2JqLCBkKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuaXRlbXNbaXRlbUlkeF07XG4gICAgfVxuICAgIGdldElkT2JqKGQpIHtcbiAgICAgICAgbGV0IHJlcyA9IHt9O1xuICAgICAgICB0aGlzLmlkX2ZpZWxkcy5tYXAoa2V5ID0+IHtcbiAgICAgICAgICAgIHJlc1trZXldID0gZFtrZXldO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG4gICAgbWF0Y2hlc0lkT2JqKGlkT2JqLCBkKSB7XG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyhpZE9iaikubGVuZ3RoICYmICFPYmplY3Qua2V5cyhpZE9iaikuZmluZChrZXkgPT4gZFtrZXldICE9PSBpZE9ialtrZXldKTtcbiAgICB9XG4gICAgZGVsZXRlQWxsKCkge1xuICAgICAgICB0aGlzLmdldEl0ZW1zKCkubWFwKHRoaXMuZ2V0SWRPYmopLm1hcCh0aGlzLmRlbGV0ZSk7XG4gICAgfVxuICAgIHNldERlbGV0ZWQoaWRPYmosIGZ1bGxBcnJheSkge1xuICAgICAgICBsZXQgZGVsZXRlZCA9IFtdO1xuICAgICAgICBpZiAoZnVsbEFycmF5KVxuICAgICAgICAgICAgZGVsZXRlZCA9IGZ1bGxBcnJheTtcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBkZWxldGVkID0gdGhpcy5nZXREZWxldGVkKCk7XG4gICAgICAgICAgICBkZWxldGVkLnB1c2goaWRPYmopO1xuICAgICAgICB9XG4gICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbSh0aGlzLm5hbWUgKyBcIl8kJHBzcWwkJF9kZWxldGVkXCIsIGRlbGV0ZWQpO1xuICAgIH1cbiAgICBnZXREZWxldGVkKCkge1xuICAgICAgICBjb25zdCBkZWxTdHIgPSB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0odGhpcy5uYW1lICsgXCJfJCRwc3FsJCRfZGVsZXRlZFwiKSB8fCAnW10nO1xuICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShkZWxTdHIpO1xuICAgIH1cbn1cbmV4cG9ydHMuU3luY2VkVGFibGUgPSBTeW5jZWRUYWJsZTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5TeW5jZWRUYWJsZSA9IGV4cG9ydHMucHJvc3RnbGVzID0gdm9pZCAwO1xuY29uc3QgcHJvc3RnbGVzXzEgPSByZXF1aXJlKFwiLi9wcm9zdGdsZXNcIik7XG5jb25zdCBTeW5jZWRUYWJsZV8xID0gcmVxdWlyZShcIi4vU3luY2VkVGFibGVcIik7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJTeW5jZWRUYWJsZVwiLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gU3luY2VkVGFibGVfMS5TeW5jZWRUYWJsZTsgfSB9KTtcbmNvbnN0IHByb3N0Z2xlcyA9IChwYXJhbXMpID0+IHtcbiAgICByZXR1cm4gcHJvc3RnbGVzXzEucHJvc3RnbGVzKHBhcmFtcywgU3luY2VkVGFibGVfMS5TeW5jZWRUYWJsZSk7XG59O1xuZXhwb3J0cy5wcm9zdGdsZXMgPSBwcm9zdGdsZXM7XG4iLCJcInVzZSBzdHJpY3RcIjtcbi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiAgQ29weXJpZ2h0IChjKSBTdGVmYW4gTC4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuIFNlZSBMSUNFTlNFIGluIHRoZSBwcm9qZWN0IHJvb3QgZm9yIGxpY2Vuc2UgaW5mb3JtYXRpb24uXG4gKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMucHJvc3RnbGVzID0gdm9pZCAwO1xuZnVuY3Rpb24gcHJvc3RnbGVzKHsgc29ja2V0LCBpc1JlYWR5ID0gKGRibywgbWV0aG9kcykgPT4geyB9LCBvbkRpc2Nvbm5lY3QgfSwgc3luY2VkVGFibGUpIHtcbiAgICBjb25zdCBwcmVmZml4ID0gXCJfcHNxbFdTXy5cIjtcbiAgICB2YXIgc3Vic2NyaXB0aW9ucyA9IFtdO1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGlmIChvbkRpc2Nvbm5lY3QpIHtcbiAgICAgICAgICAgIHNvY2tldC5vbihcImRpc2Nvbm5lY3RcIiwgb25EaXNjb25uZWN0KTtcbiAgICAgICAgfVxuICAgICAgICAvKiBTY2hlbWEgPSBwdWJsaXNoZWQgc2NoZW1hICovXG4gICAgICAgIHNvY2tldC5vbihwcmVmZml4ICsgJ3NjaGVtYScsICh7IHNjaGVtYSwgbWV0aG9kcywgZnVsbFNjaGVtYSwgam9pblRhYmxlcyA9IFtdIH0pID0+IHtcbiAgICAgICAgICAgIGxldCBkYm8gPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHNjaGVtYSkpO1xuICAgICAgICAgICAgbGV0IF9tZXRob2RzID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShtZXRob2RzKSksIG1ldGhvZHNPYmogPSB7fTtcbiAgICAgICAgICAgIF9tZXRob2RzLm1hcChtZXRob2QgPT4ge1xuICAgICAgICAgICAgICAgIG1ldGhvZHNPYmpbbWV0aG9kXSA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KHByZWZmaXggKyBcIm1ldGhvZFwiLCB7IG1ldGhvZCwgcGFyYW1zIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIG1ldGhvZHNPYmogPSBPYmplY3QuZnJlZXplKG1ldGhvZHNPYmopO1xuICAgICAgICAgICAgaWYgKGRiby5zcWwpIHtcbiAgICAgICAgICAgICAgICAvLyBkYm8uc2NoZW1hID0gT2JqZWN0LmZyZWV6ZShbIC4uLmRiby5zcWwgXSk7XG4gICAgICAgICAgICAgICAgZGJvLnNxbCA9IGZ1bmN0aW9uIChxdWVyeSwgcGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChwcmVmZml4ICsgXCJzcWxcIiwgeyBxdWVyeSwgcGFyYW1zLCBvcHRpb25zIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvKiBCdWlsZGluZyBEQk8gb2JqZWN0ICovXG4gICAgICAgICAgICBPYmplY3Qua2V5cyhkYm8pLmZvckVhY2godGFibGVOYW1lID0+IHtcbiAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhkYm9bdGFibGVOYW1lXSkuZm9yRWFjaChjb21tYW5kID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbW1hbmQgPT09IFwic3luY1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYm9bdGFibGVOYW1lXS5fc3luY0luZm8gPSB7IC4uLmRib1t0YWJsZU5hbWVdW2NvbW1hbmRdIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3luY2VkVGFibGUgJiYgc3luY2VkVGFibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYm9bdGFibGVOYW1lXS5nZXRTeW5jID0gKGZpbHRlcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHN5bmNlZFRhYmxlKHsgbmFtZTogdGFibGVOYW1lLCBmaWx0ZXIsIGRiOiBkYm8gfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHN5bmNIYW5kbGUocGFyYW0xLCBwYXJhbTIsIHN5bmNIYW5kbGVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgeyBvblN5bmNSZXF1ZXN0LCBvblB1bGxSZXF1ZXN0LCBvblVwZGF0ZXMgfSA9IHN5bmNIYW5kbGVzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXMsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNoYW5uZWxOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RVcGRhdGVkLCBzb2NrZXRIYW5kbGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQocHJlZmZpeCwgeyB0YWJsZU5hbWUsIGNvbW1hbmQsIHBhcmFtMSwgcGFyYW0yLCBsYXN0VXBkYXRlZCB9LCAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHJlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2hhbm5lbE5hbWUgPSByZXMuY2hhbm5lbE5hbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB7IGlkX2ZpZWxkcywgc3luY2VkX2ZpZWxkLCBjaGFubmVsTmFtZSB9ID0gcmVzLCBzeW5jX2luZm8gPSB7IGlkX2ZpZWxkcywgc3luY2VkX2ZpZWxkIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5zeW5jX2luZm8gPSBzeW5jX2luZm87XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5jaGFubmVsTmFtZSA9IGNoYW5uZWxOYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuc29ja2V0ID0gc29ja2V0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuc3luY0RhdGEgPSBmdW5jdGlvbiAoZGF0YSwgZGVsZXRlZCwgY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChjaGFubmVsTmFtZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvblN5bmNSZXF1ZXN0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5vblN5bmNSZXF1ZXN0KHt9LCBzeW5jX2luZm8pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uKHsgZGF0YSB9IHx8IHt9KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLih7IGRlbGV0ZWQgfSB8fCB7fSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAhY2IgPyBudWxsIDogKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNiKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChjaGFubmVsTmFtZSwgeyBvblN5bmNSZXF1ZXN0OiBvblN5bmNSZXF1ZXN0KHt9LCBzeW5jX2luZm8pIH0sIChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc29ja2V0SGFuZGxlID0gZnVuY3Rpb24gKGRhdGEsIGNiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQ2xpZW50IHdpbGw6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDEuIFNlbmQgbGFzdF9zeW5jZWQgICAgIG9uKG9uU3luY1JlcXVlc3QpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDIuIFNlbmQgZGF0YSA+PSBzZXJ2ZXJfc3luY2VkICAgb24ob25QdWxsUmVxdWVzdClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMy4gU2VuZCBkYXRhIG9uIENSVUQgICAgZW1pdChkYXRhLmRhdGEpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDQuIFVwc2VydCBkYXRhLmRhdGEgICAgIG9uKGRhdGEuZGF0YSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZGF0YSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9uQ2hhbmdlKGRhdGEuZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEuZGF0YSAmJiBkYXRhLmRhdGEubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFByb21pc2UucmVzb2x2ZShvblVwZGF0ZXMoZGF0YS5kYXRhLCBzeW5jX2luZm8pKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNiKHsgb2s6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHsgaWYgKGNiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYih7IGVyciB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoZGF0YS5vblN5bmNSZXF1ZXN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNiKG9uU3luY1JlcXVlc3QoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFByb21pc2UucmVzb2x2ZShvblN5bmNSZXF1ZXN0KGRhdGEub25TeW5jUmVxdWVzdCwgc3luY19pbmZvKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKHJlcyA9PiBjYih7IG9uU3luY1JlcXVlc3Q6IHJlcyB9KSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4geyBpZiAoY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNiKHsgZXJyIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChkYXRhLm9uUHVsbFJlcXVlc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUHJvbWlzZS5yZXNvbHZlKG9uUHVsbFJlcXVlc3QoZGF0YS5vblB1bGxSZXF1ZXN0LCBzeW5jX2luZm8pKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oYXJyID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNiKHsgZGF0YTogYXJyIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7IGlmIChjYikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2IoeyBlcnIgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInVuZXhwZWN0ZWQgcmVzcG9uc2VcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIENhY2hlICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKGNoYW5uZWxOYW1lLCBKU09OLnN0cmluZ2lmeShkYXRhKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb25zLnB1c2goeyBjaGFubmVsTmFtZSwgc3luY0hhbmRsZXMsIHNvY2tldEhhbmRsZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvY2tldC5vbihjaGFubmVsTmFtZSwgc29ja2V0SGFuZGxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHVuc3luYygpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzdWJzID0gc3Vic2NyaXB0aW9ucy5maWx0ZXIocyA9PiBzLmNoYW5uZWxOYW1lID09PSBfdGhpcy5jaGFubmVsTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3Vicy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb25zID0gc3Vic2NyaXB0aW9ucy5maWx0ZXIocyA9PiBzLmNoYW5uZWxOYW1lICE9PSBfdGhpcy5jaGFubmVsTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoX3RoaXMuY2hhbm5lbE5hbWUgKyBcInVuc3luY1wiLCB7fSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoc3Vicy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc29ja2V0LnJlbW92ZUxpc3RlbmVyKGNoYW5uZWxOYW1lLCBzb2NrZXRIYW5kbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJubyBzeW5jcyB0byB1bnN5bmMgZnJvbVwiLCBzdWJzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvY2tldC5yZW1vdmVMaXN0ZW5lcihfdGhpcy5jaGFubmVsTmFtZSwgc29ja2V0SGFuZGxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHN5bmNEYXRhKGRhdGEsIGRlbGV0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKF90aGlzICYmIF90aGlzLnN5bmNEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5zeW5jRGF0YShkYXRhLCBkZWxldGVkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gT2JqZWN0LmZyZWV6ZSh7IHVuc3luYywgc3luY0RhdGEgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBkYm9bdGFibGVOYW1lXVtjb21tYW5kXSA9IHN5bmNIYW5kbGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoY29tbWFuZCA9PT0gXCJzdWJzY3JpYmVcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gaGFuZGxlKHBhcmFtMSwgcGFyYW0yLCBvbkNoYW5nZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXMsIGNoYW5uZWxOYW1lLCBsYXN0VXBkYXRlZCwgc29ja2V0SGFuZGxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KHByZWZmaXgsIHsgdGFibGVOYW1lLCBjb21tYW5kLCBwYXJhbTEsIHBhcmFtMiwgbGFzdFVwZGF0ZWQgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChyZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5uZWxOYW1lID0gcmVzLmNoYW5uZWxOYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc29ja2V0SGFuZGxlID0gZnVuY3Rpb24gKGRhdGEsIGNiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogVE8gRE86IGNvbmZpcm0gcmVjZWl2aW5nIGRhdGEgb3Igc2VydmVyIHdpbGwgdW5zdWJzY3JpYmUgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpZihjYikgY2IodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2UoZGF0YS5kYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBDYWNoZSAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbShjaGFubmVsTmFtZSwgSlNPTi5zdHJpbmdpZnkoZGF0YSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuY2hhbm5lbE5hbWUgPSBjaGFubmVsTmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5zb2NrZXQgPSBzb2NrZXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9ucy5wdXNoKHsgY2hhbm5lbE5hbWUsIG9uQ2hhbmdlLCBzb2NrZXRIYW5kbGUgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb2NrZXQub24oY2hhbm5lbE5hbWUsIHNvY2tldEhhbmRsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiB1bnN1YnNjcmliZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHN1YnMgPSBzdWJzY3JpcHRpb25zLmZpbHRlcihzID0+IHMuY2hhbm5lbE5hbWUgPT09IGNoYW5uZWxOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN1YnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb25zID0gc3Vic2NyaXB0aW9ucy5maWx0ZXIocyA9PiBzLmNoYW5uZWxOYW1lICE9PSBjaGFubmVsTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChjaGFubmVsTmFtZSArIFwidW5zdWJzY3JpYmVcIiwge30sIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwidW5zdWJzY3JpYmVkXCIsIGVyciwgcmVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHN1YnMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc29ja2V0LnJlbW92ZUxpc3RlbmVyKGNoYW5uZWxOYW1lLCBzb2NrZXRIYW5kbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJubyBzdWJzY3JpcHRpb25zIHRvIHVuc3Vic2NyaWJlIGZyb21cIiwgc3Vicyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc29ja2V0LnJlbW92ZUxpc3RlbmVyKGNoYW5uZWxOYW1lLCBzb2NrZXRIYW5kbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gT2JqZWN0LmZyZWV6ZSh7IHVuc3Vic2NyaWJlIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZGJvW3RhYmxlTmFtZV1bY29tbWFuZF0gPSBoYW5kbGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYm9bdGFibGVOYW1lXVtjb21tYW5kXSA9IGZ1bmN0aW9uIChwYXJhbTEsIHBhcmFtMiwgcGFyYW0zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYoQXJyYXkuaXNBcnJheShwYXJhbTIpIHx8IEFycmF5LmlzQXJyYXkocGFyYW0zKSkgdGhyb3cgXCJFeHBlY3RpbmcgYW4gb2JqZWN0XCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQocHJlZmZpeCwgeyB0YWJsZU5hbWUsIGNvbW1hbmQsIHBhcmFtMSwgcGFyYW0yLCBwYXJhbTMgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGpvaW5UYWJsZXMubWFwKHRhYmxlID0+IHtcbiAgICAgICAgICAgICAgICBkYm8uaW5uZXJKb2luID0gZGJvLmlubmVySm9pbiB8fCB7fTtcbiAgICAgICAgICAgICAgICBkYm8ubGVmdEpvaW4gPSBkYm8ubGVmdEpvaW4gfHwge307XG4gICAgICAgICAgICAgICAgZGJvLmlubmVySm9pbk9uZSA9IGRiby5pbm5lckpvaW5PbmUgfHwge307XG4gICAgICAgICAgICAgICAgZGJvLmxlZnRKb2luT25lID0gZGJvLmxlZnRKb2luT25lIHx8IHt9O1xuICAgICAgICAgICAgICAgIGRiby5sZWZ0Sm9pblt0YWJsZV0gPSAoZmlsdGVyLCBzZWxlY3QsIG9wdGlvbnMgPSB7fSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWFrZUpvaW4odHJ1ZSwgZmlsdGVyLCBzZWxlY3QsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgZGJvLmlubmVySm9pblt0YWJsZV0gPSAoZmlsdGVyLCBzZWxlY3QsIG9wdGlvbnMgPSB7fSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWFrZUpvaW4oZmFsc2UsIGZpbHRlciwgc2VsZWN0LCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGRiby5sZWZ0Sm9pbk9uZVt0YWJsZV0gPSAoZmlsdGVyLCBzZWxlY3QsIG9wdGlvbnMgPSB7fSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWFrZUpvaW4odHJ1ZSwgZmlsdGVyLCBzZWxlY3QsIHsgLi4ub3B0aW9ucywgbGltaXQ6IDEgfSk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBkYm8uaW5uZXJKb2luT25lW3RhYmxlXSA9IChmaWx0ZXIsIHNlbGVjdCwgb3B0aW9ucyA9IHt9KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtYWtlSm9pbihmYWxzZSwgZmlsdGVyLCBzZWxlY3QsIHsgLi4ub3B0aW9ucywgbGltaXQ6IDEgfSk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBtYWtlSm9pbihpc0xlZnQgPSB0cnVlLCBmaWx0ZXIsIHNlbGVjdCwgb3B0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgW2lzTGVmdCA/IFwiJGxlZnRKb2luXCIgOiBcIiRpbm5lckpvaW5cIl06IHRhYmxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgLi4ub3B0aW9uc1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaXNSZWFkeShkYm8sIG1ldGhvZHNPYmopO1xuICAgICAgICAgICAgcmVzb2x2ZShkYm8pO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cbmV4cG9ydHMucHJvc3RnbGVzID0gcHJvc3RnbGVzO1xuO1xuIl0sInNvdXJjZVJvb3QiOiIifQ==