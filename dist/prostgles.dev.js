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
                    this.isSendingData.splice(0, PUSH_BATCH_SIZE);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay91bml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uIiwid2VicGFjazovLy93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly8vLi9saWIvU3luY2VkVGFibGUudHMiLCJ3ZWJwYWNrOi8vLy4vbGliL3Byb3N0Z2xlcy1mdWxsLnRzIiwid2VicGFjazovLy8uL2xpYi9wcm9zdGdsZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNELE87UUNWQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7O1FBRUE7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7UUFDQTs7O1FBR0E7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7UUFDQTtRQUNBLDBDQUEwQyxnQ0FBZ0M7UUFDMUU7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7UUFDQSx3REFBd0Qsa0JBQWtCO1FBQzFFO1FBQ0EsaURBQWlELGNBQWM7UUFDL0Q7O1FBRUE7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBLHlDQUF5QyxpQ0FBaUM7UUFDMUUsZ0hBQWdILG1CQUFtQixFQUFFO1FBQ3JJO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0EsMkJBQTJCLDBCQUEwQixFQUFFO1FBQ3ZELGlDQUFpQyxlQUFlO1FBQ2hEO1FBQ0E7UUFDQTs7UUFFQTtRQUNBLHNEQUFzRCwrREFBK0Q7O1FBRXJIO1FBQ0E7OztRQUdBO1FBQ0E7Ozs7Ozs7Ozs7Ozs7QUNsRmE7QUFDYiw4Q0FBOEMsY0FBYztBQUM1RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUIsMkVBQTJFO0FBQzVGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJDQUEyQztBQUMzQztBQUNBO0FBQ0E7QUFDQTtBQUNBLCtDQUErQyxPQUFPLEdBQUcsT0FBTztBQUNoRSxnQ0FBZ0M7QUFDaEM7QUFDQTtBQUNBLHdDQUF3QyxPQUFPLEdBQUcsT0FBTztBQUN6RCx5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0EsZ0NBQWdDLE9BQU87QUFDdkM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiLGtEQUFrRCxlQUFlLGNBQWMsZUFBZSxhQUFhLFlBQVk7QUFDdkg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJEQUEyRCxNQUFNLEVBQUU7QUFDbkU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFFQUFxRSw2QkFBNkI7QUFDbEcsa0RBQWtELDRCQUE0QixFQUFFO0FBQ2hGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0I7QUFDeEI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUIsbURBQW1EO0FBQ3RFLHVDQUF1QyxPQUFPO0FBQzlDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGVBQWUsMEJBQTBCO0FBQ3pDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUI7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtREFBbUQsY0FBYztBQUNqRTtBQUNBO0FBQ0EsbURBQW1ELEdBQUc7QUFDdEQ7QUFDQSxhQUFhLEVBQUU7QUFDZjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCLFdBQVcsdUJBQXVCLDRCQUE0QjtBQUNuRjtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhCQUE4QixjQUFjO0FBQzVDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQSxvQ0FBb0M7QUFDcEM7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0EsaUNBQWlDO0FBQ2pDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhCQUE4QixnQkFBZ0I7QUFDOUM7QUFDQTtBQUNBLHNCQUFzQjtBQUN0QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7O0FDcFVhO0FBQ2IsOENBQThDLGNBQWM7QUFDNUQ7QUFDQSxvQkFBb0IsbUJBQU8sQ0FBQyx1Q0FBYTtBQUN6QyxzQkFBc0IsbUJBQU8sQ0FBQywyQ0FBZTtBQUM3QywrQ0FBK0MscUNBQXFDLGtDQUFrQyxFQUFFLEVBQUU7QUFDMUg7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7QUNUYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOENBQThDLGNBQWM7QUFDNUQ7QUFDQSxvQkFBb0Isc0NBQXNDLEVBQUUsZ0JBQWdCO0FBQzVFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0NBQXdDLCtDQUErQztBQUN2RjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseURBQXlELGlCQUFpQjtBQUMxRTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QixxQkFBcUI7QUFDckI7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNEQUFzRCx5QkFBeUI7QUFDL0U7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekIscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9EQUFvRDtBQUNwRDtBQUNBO0FBQ0Esd0RBQXdELG1DQUFtQztBQUMzRjtBQUNBO0FBQ0E7QUFDQSxtQ0FBbUMsMENBQTBDO0FBQzdFO0FBQ0E7QUFDQTtBQUNBLGtEQUFrRCxrREFBa0Q7QUFDcEc7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJDQUEyQyx1Q0FBdUMscUJBQXFCO0FBQ3ZHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1FQUFtRTtBQUNuRSxxREFBcUQsT0FBTyxNQUFNO0FBQ2xFLHFEQUFxRCxVQUFVLE1BQU07QUFDckUsNkNBQTZDO0FBQzdDLHlDQUF5QztBQUN6QztBQUNBLHlDQUF5QztBQUN6QztBQUNBLDhEQUE4RCxnQ0FBZ0MsY0FBYztBQUM1RztBQUNBLHFDQUFxQztBQUNyQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3REFBd0QsV0FBVztBQUNuRSw2Q0FBNkM7QUFDN0MsK0RBQStEO0FBQy9ELG9EQUFvRCxNQUFNO0FBQzFELDZDQUE2QyxFQUFFO0FBQy9DO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUVBQWlFLHFCQUFxQjtBQUN0RiwrREFBK0Q7QUFDL0Qsb0RBQW9ELE1BQU07QUFDMUQsNkNBQTZDLEVBQUU7QUFDL0M7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvREFBb0QsWUFBWTtBQUNoRSw2Q0FBNkM7QUFDN0MsK0RBQStEO0FBQy9ELG9EQUFvRCxNQUFNO0FBQzFELDZDQUE2QyxFQUFFO0FBQy9DO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0RBQXdELHlDQUF5QztBQUNqRztBQUNBO0FBQ0EsNkJBQTZCO0FBQzdCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvRkFBb0Y7QUFDcEY7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5Q0FBeUM7QUFDekM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlDQUFpQztBQUNqQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrREFBa0QsbUJBQW1CO0FBQ3JFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtEQUFrRCxrREFBa0Q7QUFDcEc7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdEQUF3RCxzQ0FBc0M7QUFDOUY7QUFDQTtBQUNBLDZCQUE2QjtBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtFQUErRTtBQUMvRTtBQUNBLHFDQUFxQztBQUNyQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrREFBa0QsY0FBYztBQUNoRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNEQUFzRCw2Q0FBNkM7QUFDbkc7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQ0FBaUM7QUFDakMsNkJBQTZCO0FBQzdCO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakIsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtRUFBbUU7QUFDbkU7QUFDQTtBQUNBLG9FQUFvRTtBQUNwRTtBQUNBO0FBQ0Esc0VBQXNFO0FBQ3RFLDJEQUEyRCx1QkFBdUI7QUFDbEY7QUFDQSx1RUFBdUU7QUFDdkUsNERBQTRELHVCQUF1QjtBQUNuRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLFNBQVM7QUFDVCxLQUFLO0FBQ0w7QUFDQTtBQUNBIiwiZmlsZSI6InByb3N0Z2xlcy5kZXYuanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gd2VicGFja1VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24ocm9vdCwgZmFjdG9yeSkge1xuXHRpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcpXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdGVsc2UgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKVxuXHRcdGRlZmluZShbXSwgZmFjdG9yeSk7XG5cdGVsc2Uge1xuXHRcdHZhciBhID0gZmFjdG9yeSgpO1xuXHRcdGZvcih2YXIgaSBpbiBhKSAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnID8gZXhwb3J0cyA6IHJvb3QpW2ldID0gYVtpXTtcblx0fVxufSkodGhpcywgZnVuY3Rpb24oKSB7XG5yZXR1cm4gIiwiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZ2V0dGVyIH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4gXHRcdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuIFx0XHR9XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG4gXHR9O1xuXG4gXHQvLyBjcmVhdGUgYSBmYWtlIG5hbWVzcGFjZSBvYmplY3RcbiBcdC8vIG1vZGUgJiAxOiB2YWx1ZSBpcyBhIG1vZHVsZSBpZCwgcmVxdWlyZSBpdFxuIFx0Ly8gbW9kZSAmIDI6IG1lcmdlIGFsbCBwcm9wZXJ0aWVzIG9mIHZhbHVlIGludG8gdGhlIG5zXG4gXHQvLyBtb2RlICYgNDogcmV0dXJuIHZhbHVlIHdoZW4gYWxyZWFkeSBucyBvYmplY3RcbiBcdC8vIG1vZGUgJiA4fDE6IGJlaGF2ZSBsaWtlIHJlcXVpcmVcbiBcdF9fd2VicGFja19yZXF1aXJlX18udCA9IGZ1bmN0aW9uKHZhbHVlLCBtb2RlKSB7XG4gXHRcdGlmKG1vZGUgJiAxKSB2YWx1ZSA9IF9fd2VicGFja19yZXF1aXJlX18odmFsdWUpO1xuIFx0XHRpZihtb2RlICYgOCkgcmV0dXJuIHZhbHVlO1xuIFx0XHRpZigobW9kZSAmIDQpICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgJiYgdmFsdWUuX19lc01vZHVsZSkgcmV0dXJuIHZhbHVlO1xuIFx0XHR2YXIgbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIobnMpO1xuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkobnMsICdkZWZhdWx0JywgeyBlbnVtZXJhYmxlOiB0cnVlLCB2YWx1ZTogdmFsdWUgfSk7XG4gXHRcdGlmKG1vZGUgJiAyICYmIHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJykgZm9yKHZhciBrZXkgaW4gdmFsdWUpIF9fd2VicGFja19yZXF1aXJlX18uZChucywga2V5LCBmdW5jdGlvbihrZXkpIHsgcmV0dXJuIHZhbHVlW2tleV07IH0uYmluZChudWxsLCBrZXkpKTtcbiBcdFx0cmV0dXJuIG5zO1xuIFx0fTtcblxuIFx0Ly8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubiA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuIFx0XHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cbiBcdFx0XHRmdW5jdGlvbiBnZXREZWZhdWx0KCkgeyByZXR1cm4gbW9kdWxlWydkZWZhdWx0J107IH0gOlxuIFx0XHRcdGZ1bmN0aW9uIGdldE1vZHVsZUV4cG9ydHMoKSB7IHJldHVybiBtb2R1bGU7IH07XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsICdhJywgZ2V0dGVyKTtcbiBcdFx0cmV0dXJuIGdldHRlcjtcbiBcdH07XG5cbiBcdC8vIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbFxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpOyB9O1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKF9fd2VicGFja19yZXF1aXJlX18ucyA9IFwiLi9saWIvcHJvc3RnbGVzLWZ1bGwudHNcIik7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuU3luY2VkVGFibGUgPSB2b2lkIDA7XG5jb25zdCBTVE9SQUdFX1RZUEVTID0ge1xuICAgIGFycmF5OiBcImFycmF5XCIsXG4gICAgbG9jYWxTdG9yYWdlOiBcImxvY2FsU3RvcmFnZVwiXG59O1xuY2xhc3MgU3luY2VkVGFibGUge1xuICAgIGNvbnN0cnVjdG9yKHsgbmFtZSwgZmlsdGVyLCBvbkNoYW5nZSwgZGIsIHB1c2hEZWJvdW5jZSA9IDEwMCwgc2tpcEZpcnN0VHJpZ2dlciA9IGZhbHNlIH0pIHtcbiAgICAgICAgdGhpcy5wdXNoRGVib3VuY2UgPSAxMDA7XG4gICAgICAgIHRoaXMuc2tpcEZpcnN0VHJpZ2dlciA9IGZhbHNlO1xuICAgICAgICB0aGlzLml0ZW1zID0gW107XG4gICAgICAgIHRoaXMuc3RvcmFnZVR5cGUgPSBTVE9SQUdFX1RZUEVTLmFycmF5O1xuICAgICAgICB0aGlzLml0ZW1zT2JqID0ge307XG4gICAgICAgIHRoaXMubm90aWZ5U3Vic2NyaXB0aW9ucyA9IChpZE9iaiwgbmV3RGF0YSwgZGVsdGEpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2luZ2xlU3Vic2NyaXB0aW9ucy5maWx0ZXIocyA9PiBzLmlkT2JqICYmXG4gICAgICAgICAgICAgICAgdGhpcy5tYXRjaGVzSWRPYmoocy5pZE9iaiwgaWRPYmopICYmXG4gICAgICAgICAgICAgICAgT2JqZWN0LmtleXMocy5pZE9iaikubGVuZ3RoIDw9IE9iamVjdC5rZXlzKGlkT2JqKS5sZW5ndGgpXG4gICAgICAgICAgICAgICAgLm1hcChzID0+IHtcbiAgICAgICAgICAgICAgICBzLm9uQ2hhbmdlKG5ld0RhdGEsIGRlbHRhKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5tdWx0aVN1YnNjcmlwdGlvbnMubWFwKHMgPT4gcy5vbkNoYW5nZSh0aGlzLmdldEl0ZW1zKCksIFtuZXdEYXRhXSkpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLnVuc3Vic2NyaWJlID0gKG9uQ2hhbmdlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNpbmdsZVN1YnNjcmlwdGlvbnMgPSB0aGlzLnNpbmdsZVN1YnNjcmlwdGlvbnMuZmlsdGVyKHMgPT4gcy5vbkNoYW5nZSAhPT0gb25DaGFuZ2UpO1xuICAgICAgICAgICAgdGhpcy5tdWx0aVN1YnNjcmlwdGlvbnMgPSB0aGlzLm11bHRpU3Vic2NyaXB0aW9ucy5maWx0ZXIocyA9PiBzLm9uQ2hhbmdlICE9PSBvbkNoYW5nZSk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMudW5zeW5jID0gKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuZGJTeW5jICYmIHRoaXMuZGJTeW5jLnVuc3luYylcbiAgICAgICAgICAgICAgICB0aGlzLmRiU3luYy51bnN5bmMoKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5kZWxldGUgPSAoaWRPYmopID0+IHtcbiAgICAgICAgICAgIGxldCBpdGVtcyA9IHRoaXMuZ2V0SXRlbXMoKTtcbiAgICAgICAgICAgIGl0ZW1zID0gaXRlbXMuZmlsdGVyKGQgPT4gIXRoaXMubWF0Y2hlc0lkT2JqKGlkT2JqLCBkKSk7XG4gICAgICAgICAgICAvLyB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0odGhpcy5uYW1lLCBKU09OLnN0cmluZ2lmeShpdGVtcykpO1xuICAgICAgICAgICAgdGhpcy5zZXRJdGVtcyhpdGVtcyk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5vbkRhdGFDaGFuZ2VkKG51bGwsIFtpZE9ial0pO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLnN5bmNEZWxldGVkID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBQcm9taXNlLmFsbCh0aGlzLmdldERlbGV0ZWQoKS5tYXAoYXN5bmMgKGlkT2JqKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmRiW3RoaXMubmFtZV0uZGVsZXRlKGlkT2JqKTtcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXREZWxldGVkKG51bGwsIFtdKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy51cHNlcnQgPSBhc3luYyAoZGF0YSwgZnJvbV9zZXJ2ZXIgPSBmYWxzZSkgPT4ge1xuICAgICAgICAgICAgbGV0IGl0ZW1zID0gdGhpcy5nZXRJdGVtcygpO1xuICAgICAgICAgICAgaWYgKGZyb21fc2VydmVyICYmIHRoaXMuZ2V0RGVsZXRlZCgpLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc3luY0RlbGV0ZWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCB1cGRhdGVzID0gW10sIGluc2VydHMgPSBbXTtcbiAgICAgICAgICAgIGRhdGEubWFwKGQgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghZnJvbV9zZXJ2ZXIpXG4gICAgICAgICAgICAgICAgICAgIGRbdGhpcy5zeW5jZWRfZmllbGRdID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICBsZXQgZXhpc3RpbmdfaWR4ID0gaXRlbXMuZmluZEluZGV4KGMgPT4gIXRoaXMuaWRfZmllbGRzLmZpbmQoa2V5ID0+IGNba2V5XSAhPT0gZFtrZXldKSksIGV4aXN0aW5nID0gaXRlbXNbZXhpc3RpbmdfaWR4XTtcbiAgICAgICAgICAgICAgICBpZiAoZXhpc3RpbmcgJiYgZXhpc3RpbmdbdGhpcy5zeW5jZWRfZmllbGRdIDwgZFt0aGlzLnN5bmNlZF9maWVsZF0pIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbXNbZXhpc3RpbmdfaWR4XSA9IHsgLi4uZCB9O1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVzLnB1c2goZCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChmcm9tX3NlcnZlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhpcy5zdWJzY3JpcHRpb25zLmZpbHRlcihzID0+IHMuaWRPYmogJiYgdGhpcy5tYXRjaGVzSWRPYmoocy5pZE9iaiwgZCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgLm1hcChzID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgcy5vbkNoYW5nZSh7IC4uLmQgfSwgeyAuLi5kIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaW5nbGVTdWJzY3JpcHRpb25zLmZpbHRlcihzID0+IHMuaWRPYmogJiYgdGhpcy5tYXRjaGVzSWRPYmoocy5pZE9iaiwgZCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcChzID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzLm9uQ2hhbmdlKHsgLi4uZCB9LCB7IC4uLmQgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICghZXhpc3RpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbXMucHVzaCh7IC4uLmQgfSk7XG4gICAgICAgICAgICAgICAgICAgIGluc2VydHMucHVzaChkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLyogVE9ETzogRGVsZXRlcyBmcm9tIHNlcnZlciAqL1xuICAgICAgICAgICAgICAgIC8vIGlmKGFsbG93X2RlbGV0ZXMpe1xuICAgICAgICAgICAgICAgIC8vICAgICBpdGVtcyA9IHRoaXMuZ2V0SXRlbXMoKTtcbiAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBvblVwZGF0ZXM6IGluc2VydHMoICR7aW5zZXJ0cy5sZW5ndGh9ICkgdXBkYXRlcyggJHt1cGRhdGVzLmxlbmd0aH0gKSAgdG90YWwoICR7ZGF0YS5sZW5ndGh9IClgKTtcbiAgICAgICAgICAgIGNvbnN0IG5ld0RhdGEgPSBbLi4uaW5zZXJ0cywgLi4udXBkYXRlc107XG4gICAgICAgICAgICAvLyB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0odGhpcy5uYW1lLCBKU09OLnN0cmluZ2lmeShpdGVtcykpO1xuICAgICAgICAgICAgdGhpcy5zZXRJdGVtcyhpdGVtcyk7XG4gICAgICAgICAgICB0aGlzLm9uRGF0YUNoYW5nZWQobmV3RGF0YSwgbnVsbCwgZnJvbV9zZXJ2ZXIpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMub25EYXRhQ2hhbmdlZCA9IGFzeW5jIChuZXdEYXRhID0gbnVsbCwgZGVsZXRlZERhdGEgPSBudWxsLCBmcm9tX3NlcnZlciA9IGZhbHNlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwdXNoRGF0YVRvU2VydmVyID0gYXN5bmMgKG5ld0l0ZW1zID0gbnVsbCwgZGVsZXRlZERhdGEgPSBudWxsLCBjYWxsYmFjayA9IG51bGwpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAobmV3SXRlbXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pc1NlbmRpbmdEYXRhID0gdGhpcy5pc1NlbmRpbmdEYXRhLmNvbmNhdChuZXdJdGVtcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjaylcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pc1NlbmRpbmdEYXRhQ2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIGNvbnN0IFBVU0hfQkFUQ0hfU0laRSA9IDUwO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzU2VuZGluZ0RhdGEgJiYgdGhpcy5pc1NlbmRpbmdEYXRhLmxlbmd0aCB8fCBkZWxldGVkRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cub25iZWZvcmV1bmxvYWQgPSBjb25maXJtRXhpdDtcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gY29uZmlybUV4aXQoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJEYXRhIG1heSBiZSBsb3N0LiBBcmUgeW91IHN1cmU/XCI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbmV3QmF0Y2ggPSB0aGlzLmlzU2VuZGluZ0RhdGEuc2xpY2UoMCwgUFVTSF9CQVRDSF9TSVpFKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5kYlN5bmMuc3luY0RhdGEobmV3QmF0Y2gsIGRlbGV0ZWREYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pc1NlbmRpbmdEYXRhLnNwbGljZSgwLCBQVVNIX0JBVENIX1NJWkUpO1xuICAgICAgICAgICAgICAgICAgICBwdXNoRGF0YVRvU2VydmVyKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cub25iZWZvcmV1bmxvYWQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlzU2VuZGluZ0RhdGFDYWxsYmFja3MubWFwKGNiID0+IHsgY2IoKTsgfSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaXNTZW5kaW5nRGF0YUNhbGxiYWNrcyA9IFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1zID0gdGhpcy5nZXRJdGVtcygpO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMuc3Vic2NyaXB0aW9ucy5maWx0ZXIocyA9PiAhcy5pZE9iaikubWFwKHMgPT57IHMub25DaGFuZ2UoaXRlbXMsIG5ld0RhdGEpIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMubXVsdGlTdWJzY3JpcHRpb25zLm1hcChzID0+IHsgcy5vbkNoYW5nZShpdGVtcywgbmV3RGF0YSk7IH0pO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9uQ2hhbmdlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25DaGFuZ2UoaXRlbXMsIG5ld0RhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvKiBMb2NhbCB1cGRhdGVzLiBOZWVkIHRvIHB1c2ggdG8gc2VydmVyICovXG4gICAgICAgICAgICAgICAgaWYgKCFmcm9tX3NlcnZlciAmJiB0aGlzLmRiU3luYyAmJiB0aGlzLmRiU3luYy5zeW5jRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBwdXNoRGF0YVRvU2VydmVyKG5ld0RhdGEsIGRlbGV0ZWREYXRhLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYodGhpcy5pc1NlbmRpbmdEYXRhKXtcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy5pc1NlbmRpbmdEYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgICAgICAgICAvLyB0aGlzLmlzU2VuZGluZ0RhdGEgPSB3aW5kb3cuc2V0VGltZW91dChhc3luYyAoKT0+e1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgYXdhaXQgdGhpcy5kYlN5bmMuc3luY0RhdGEobmV3RGF0YSwgZGVsZXRlZERhdGEpO1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgcmVzb2x2ZSh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIHRoaXMuaXNTZW5kaW5nRGF0YSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICB3aW5kb3cub25iZWZvcmV1bmxvYWQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAvLyB9LCB0aGlzLnB1c2hEZWJvdW5jZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRydWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLnNldEl0ZW1zID0gKGl0ZW1zKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5zdG9yYWdlVHlwZSA9PT0gU1RPUkFHRV9UWVBFUy5sb2NhbFN0b3JhZ2UpIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0odGhpcy5uYW1lLCBKU09OLnN0cmluZ2lmeShpdGVtcykpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodGhpcy5zdG9yYWdlVHlwZSA9PT0gU1RPUkFHRV9UWVBFUy5hcnJheSkge1xuICAgICAgICAgICAgICAgIHRoaXMuaXRlbXMgPSBpdGVtcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiaW52YWxpZC9taXNzaW5nIHN0b3JhZ2VUeXBlIC0+IFwiICsgdGhpcy5zdG9yYWdlVHlwZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZ2V0SXRlbXMgPSAoc3luY19pbmZvKSA9PiB7XG4gICAgICAgICAgICBsZXQgaXRlbXMgPSBbXTtcbiAgICAgICAgICAgIGlmICh0aGlzLnN0b3JhZ2VUeXBlID09PSBTVE9SQUdFX1RZUEVTLmxvY2FsU3RvcmFnZSkge1xuICAgICAgICAgICAgICAgIGxldCBjYWNoZWRTdHIgPSB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0odGhpcy5uYW1lKTtcbiAgICAgICAgICAgICAgICBpZiAoY2FjaGVkU3RyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtcyA9IEpTT04ucGFyc2UoY2FjaGVkU3RyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMuc3RvcmFnZVR5cGUgPT09IFNUT1JBR0VfVFlQRVMuYXJyYXkpIHtcbiAgICAgICAgICAgICAgICBpdGVtcyA9IHRoaXMuaXRlbXMuc2xpY2UoMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImludmFsaWQvbWlzc2luZyBzdG9yYWdlVHlwZSAtPiBcIiArIHRoaXMuc3RvcmFnZVR5cGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuaWRfZmllbGRzICYmIHRoaXMuc3luY2VkX2ZpZWxkKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc19maWVsZHMgPSBbdGhpcy5zeW5jZWRfZmllbGQsIC4uLnRoaXMuaWRfZmllbGRzLnNvcnQoKV07XG4gICAgICAgICAgICAgICAgaXRlbXMgPSBpdGVtc1xuICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKGQgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gIXRoaXMuZmlsdGVyIHx8ICFPYmplY3Qua2V5cyh0aGlzLmZpbHRlcikuZmluZChrZXkgPT4gZFtrZXldLnRvU3RyaW5nKCkgIT09IHRoaXMuZmlsdGVyW2tleV0udG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLnNvcnQoKGEsIGIpID0+IHNfZmllbGRzLm1hcChrZXkgPT4gYVtrZXldIDwgYltrZXldID8gLTEgOiBhW2tleV0gPiBiW2tleV0gPyAxIDogMCkuZmluZCh2ID0+IHYpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuaXRlbXMgPSBpdGVtcztcbiAgICAgICAgICAgIHJldHVybiBpdGVtcztcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5nZXRCYXRjaCA9IChwYXJhbXMsIHN5bmNfaW5mbykgPT4ge1xuICAgICAgICAgICAgbGV0IGl0ZW1zID0gdGhpcy5nZXRJdGVtcygpO1xuICAgICAgICAgICAgcGFyYW1zID0gcGFyYW1zIHx8IHt9O1xuICAgICAgICAgICAgY29uc3QgeyBmcm9tX3N5bmNlZCwgdG9fc3luY2VkLCBvZmZzZXQgPSAwLCBsaW1pdCA9IG51bGwgfSA9IHBhcmFtcztcbiAgICAgICAgICAgIGxldCByZXMgPSBpdGVtcy5tYXAoYyA9PiAoeyAuLi5jIH0pKVxuICAgICAgICAgICAgICAgIC5maWx0ZXIoYyA9PiAoIWZyb21fc3luY2VkIHx8IGNbdGhpcy5zeW5jZWRfZmllbGRdID49IGZyb21fc3luY2VkKSAmJlxuICAgICAgICAgICAgICAgICghdG9fc3luY2VkIHx8IGNbdGhpcy5zeW5jZWRfZmllbGRdIDw9IHRvX3N5bmNlZCkpO1xuICAgICAgICAgICAgaWYgKG9mZnNldCB8fCBsaW1pdClcbiAgICAgICAgICAgICAgICByZXMgPSByZXMuc3BsaWNlKG9mZnNldCwgbGltaXQgfHwgcmVzLmxlbmd0aCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLmZpbHRlciA9IGZpbHRlcjtcbiAgICAgICAgdGhpcy5vbkNoYW5nZSA9IG9uQ2hhbmdlO1xuICAgICAgICBpZiAoIWRiKVxuICAgICAgICAgICAgdGhyb3cgXCJkYiBtaXNzaW5nXCI7XG4gICAgICAgIHRoaXMuZGIgPSBkYjtcbiAgICAgICAgY29uc3QgeyBpZF9maWVsZHMsIHN5bmNlZF9maWVsZCB9ID0gZGJbdGhpcy5uYW1lXS5fc3luY0luZm87XG4gICAgICAgIGlmICghaWRfZmllbGRzIHx8ICFzeW5jZWRfZmllbGQpXG4gICAgICAgICAgICB0aHJvdyBcImlkX2ZpZWxkcy9zeW5jZWRfZmllbGQgbWlzc2luZ1wiO1xuICAgICAgICB0aGlzLmlkX2ZpZWxkcyA9IGlkX2ZpZWxkcztcbiAgICAgICAgdGhpcy5zeW5jZWRfZmllbGQgPSBzeW5jZWRfZmllbGQ7XG4gICAgICAgIHRoaXMucHVzaERlYm91bmNlID0gcHVzaERlYm91bmNlO1xuICAgICAgICB0aGlzLmlzU2VuZGluZ0RhdGEgPSBbXTtcbiAgICAgICAgdGhpcy5pc1NlbmRpbmdEYXRhQ2FsbGJhY2tzID0gW107XG4gICAgICAgIHRoaXMuc2tpcEZpcnN0VHJpZ2dlciA9IHNraXBGaXJzdFRyaWdnZXI7XG4gICAgICAgIHRoaXMubXVsdGlTdWJzY3JpcHRpb25zID0gW107XG4gICAgICAgIHRoaXMuc2luZ2xlU3Vic2NyaXB0aW9ucyA9IFtdO1xuICAgICAgICBjb25zdCBvblN5bmNSZXF1ZXN0ID0gKHBhcmFtcywgc3luY19pbmZvKSA9PiB7XG4gICAgICAgICAgICBsZXQgcmVzID0geyBjX2xyOiBudWxsLCBjX2ZyOiBudWxsLCBjX2NvdW50OiAwIH07XG4gICAgICAgICAgICBsZXQgYmF0Y2ggPSB0aGlzLmdldEJhdGNoKHBhcmFtcywgc3luY19pbmZvKTtcbiAgICAgICAgICAgIGlmIChiYXRjaC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICByZXMgPSB7XG4gICAgICAgICAgICAgICAgICAgIGNfZnI6IGJhdGNoWzBdIHx8IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIGNfbHI6IGJhdGNoW2JhdGNoLmxlbmd0aCAtIDFdIHx8IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIGNfY291bnQ6IGJhdGNoLmxlbmd0aFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIm9uU3luY1JlcXVlc3RcIiwgcmVzKTtcbiAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgIH0sIG9uUHVsbFJlcXVlc3QgPSBhc3luYyAocGFyYW1zLCBzeW5jX2luZm8pID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmdldERlbGV0ZWQoKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnN5bmNEZWxldGVkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gdGhpcy5nZXRCYXRjaChwYXJhbXMsIHN5bmNfaW5mbyk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgb25QdWxsUmVxdWVzdDogdG90YWwoJHsgZGF0YS5sZW5ndGggfSlgKVxuICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZGJTeW5jID0gZGJbdGhpcy5uYW1lXS5zeW5jKGZpbHRlciwge30sIHsgb25TeW5jUmVxdWVzdCwgb25QdWxsUmVxdWVzdCwgb25VcGRhdGVzOiAoZGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMudXBzZXJ0KGRhdGEsIHRydWUpO1xuICAgICAgICAgICAgfSB9KTtcbiAgICAgICAgaWYgKHRoaXMub25DaGFuZ2UgJiYgIXRoaXMuc2tpcEZpcnN0VHJpZ2dlcikge1xuICAgICAgICAgICAgc2V0VGltZW91dCh0aGlzLm9uQ2hhbmdlLCAwKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzdWJzY3JpYmVBbGwob25DaGFuZ2UpIHtcbiAgICAgICAgY29uc3Qgc3ViID0geyBvbkNoYW5nZSB9LCB1bnN1YnNjcmliZSA9ICgpID0+IHsgdGhpcy51bnN1YnNjcmliZShvbkNoYW5nZSk7IH07XG4gICAgICAgIHRoaXMubXVsdGlTdWJzY3JpcHRpb25zLnB1c2goc3ViKTtcbiAgICAgICAgaWYgKCF0aGlzLnNraXBGaXJzdFRyaWdnZXIpIHtcbiAgICAgICAgICAgIG9uQ2hhbmdlKHRoaXMuZ2V0SXRlbXMoKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIE9iamVjdC5mcmVlemUoeyB1bnN1YnNjcmliZSB9KTtcbiAgICB9XG4gICAgc3Vic2NyaWJlT25lKGlkT2JqLCBvbkNoYW5nZSkge1xuICAgICAgICBpZiAoIWlkT2JqIHx8ICFvbkNoYW5nZSlcbiAgICAgICAgICAgIHRocm93IFwiYmFkXCI7XG4gICAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLmZpbmRPbmUoaWRPYmopO1xuICAgICAgICBpZiAoIWl0ZW0pXG4gICAgICAgICAgICB0aHJvdyBcIm5vIGl0ZW0gZm91bmRcIjtcbiAgICAgICAgY29uc3Qgc3ViID0ge1xuICAgICAgICAgICAgb25DaGFuZ2UsXG4gICAgICAgICAgICBpZE9iaixcbiAgICAgICAgICAgIGl0ZW1cbiAgICAgICAgfTtcbiAgICAgICAgY29uc3Qgc3luY0hhbmRsZSA9IHtcbiAgICAgICAgICAgIGdldDogKCkgPT4gdGhpcy5maW5kT25lKGlkT2JqKSxcbiAgICAgICAgICAgIHVuc3Vic2NyaWJlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy51bnN1YnNjcmliZShvbkNoYW5nZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGVsZXRlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGVsZXRlKGlkT2JqKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1cGRhdGU6IGRhdGEgPT4ge1xuICAgICAgICAgICAgICAgIC8vIGNvbnN0IG5ld0RhdGEgPSB7IC4uLnRoaXMuZmluZE9uZShpZE9iaiksIC4uLmRhdGEsIC4uLmlkT2JqIH07XG4gICAgICAgICAgICAgICAgLy8gbm90aWZ5U3Vic2NyaXB0aW9ucyhuZXdEYXRhLCBkYXRhKTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzLnVwc2VydChbbmV3RGF0YV0pO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlT25lKGlkT2JqLCBkYXRhKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1cGRhdGVGdWxsOiBkYXRhID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdEYXRhID0geyAuLi5kYXRhLCAuLi5pZE9iaiB9O1xuICAgICAgICAgICAgICAgIHRoaXMubm90aWZ5U3Vic2NyaXB0aW9ucyhpZE9iaiwgbmV3RGF0YSwgZGF0YSk7XG4gICAgICAgICAgICAgICAgdGhpcy51cHNlcnQoW25ld0RhdGFdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5zaW5nbGVTdWJzY3JpcHRpb25zLnB1c2goc3ViKTtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiBvbkNoYW5nZShpdGVtLCBpdGVtKSwgMCk7XG4gICAgICAgIHJldHVybiBPYmplY3QuZnJlZXplKHsgLi4uc3luY0hhbmRsZSB9KTtcbiAgICB9XG4gICAgdXBkYXRlT25lKGlkT2JqLCBuZXdEYXRhKSB7XG4gICAgICAgIGNvbnN0IGl0ZW0gPSB7IC4uLnRoaXMuZmluZE9uZShpZE9iaiksIC4uLm5ld0RhdGEsIC4uLmlkT2JqIH07XG4gICAgICAgIHRoaXMubm90aWZ5U3Vic2NyaXB0aW9ucyhpZE9iaiwgaXRlbSwgbmV3RGF0YSk7XG4gICAgICAgIHRoaXMudXBzZXJ0KFtpdGVtXSk7XG4gICAgfVxuICAgIGZpbmRPbmUoaWRPYmopIHtcbiAgICAgICAgdGhpcy5nZXRJdGVtcygpO1xuICAgICAgICBsZXQgaXRlbUlkeCA9IC0xO1xuICAgICAgICBpZiAodHlwZW9mIGlkT2JqID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIGl0ZW1JZHggPSB0aGlzLml0ZW1zLmZpbmRJbmRleChpZE9iaik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpdGVtSWR4ID0gdGhpcy5pdGVtcy5maW5kSW5kZXgoZCA9PiB0aGlzLm1hdGNoZXNJZE9iaihpZE9iaiwgZCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLml0ZW1zW2l0ZW1JZHhdO1xuICAgIH1cbiAgICBnZXRJZE9iaihkKSB7XG4gICAgICAgIGxldCByZXMgPSB7fTtcbiAgICAgICAgdGhpcy5pZF9maWVsZHMubWFwKGtleSA9PiB7XG4gICAgICAgICAgICByZXNba2V5XSA9IGRba2V5XTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuICAgIG1hdGNoZXNJZE9iaihpZE9iaiwgZCkge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXMoaWRPYmopLmxlbmd0aCAmJiAhT2JqZWN0LmtleXMoaWRPYmopLmZpbmQoa2V5ID0+IGRba2V5XSAhPT0gaWRPYmpba2V5XSk7XG4gICAgfVxuICAgIGRlbGV0ZUFsbCgpIHtcbiAgICAgICAgdGhpcy5nZXRJdGVtcygpLm1hcCh0aGlzLmdldElkT2JqKS5tYXAodGhpcy5kZWxldGUpO1xuICAgIH1cbiAgICBzZXREZWxldGVkKGlkT2JqLCBmdWxsQXJyYXkpIHtcbiAgICAgICAgbGV0IGRlbGV0ZWQgPSBbXTtcbiAgICAgICAgaWYgKGZ1bGxBcnJheSlcbiAgICAgICAgICAgIGRlbGV0ZWQgPSBmdWxsQXJyYXk7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZGVsZXRlZCA9IHRoaXMuZ2V0RGVsZXRlZCgpO1xuICAgICAgICAgICAgZGVsZXRlZC5wdXNoKGlkT2JqKTtcbiAgICAgICAgfVxuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0odGhpcy5uYW1lICsgXCJfJCRwc3FsJCRfZGVsZXRlZFwiLCBkZWxldGVkKTtcbiAgICB9XG4gICAgZ2V0RGVsZXRlZCgpIHtcbiAgICAgICAgY29uc3QgZGVsU3RyID0gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKHRoaXMubmFtZSArIFwiXyQkcHNxbCQkX2RlbGV0ZWRcIikgfHwgJ1tdJztcbiAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoZGVsU3RyKTtcbiAgICB9XG59XG5leHBvcnRzLlN5bmNlZFRhYmxlID0gU3luY2VkVGFibGU7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuU3luY2VkVGFibGUgPSBleHBvcnRzLnByb3N0Z2xlcyA9IHZvaWQgMDtcbmNvbnN0IHByb3N0Z2xlc18xID0gcmVxdWlyZShcIi4vcHJvc3RnbGVzXCIpO1xuY29uc3QgU3luY2VkVGFibGVfMSA9IHJlcXVpcmUoXCIuL1N5bmNlZFRhYmxlXCIpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiU3luY2VkVGFibGVcIiwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIFN5bmNlZFRhYmxlXzEuU3luY2VkVGFibGU7IH0gfSk7XG5jb25zdCBwcm9zdGdsZXMgPSAocGFyYW1zKSA9PiB7XG4gICAgcmV0dXJuIHByb3N0Z2xlc18xLnByb3N0Z2xlcyhwYXJhbXMsIFN5bmNlZFRhYmxlXzEuU3luY2VkVGFibGUpO1xufTtcbmV4cG9ydHMucHJvc3RnbGVzID0gcHJvc3RnbGVzO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG4vKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogIENvcHlyaWdodCAoYykgU3RlZmFuIEwuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLiBTZWUgTElDRU5TRSBpbiB0aGUgcHJvamVjdCByb290IGZvciBsaWNlbnNlIGluZm9ybWF0aW9uLlxuICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLnByb3N0Z2xlcyA9IHZvaWQgMDtcbmZ1bmN0aW9uIHByb3N0Z2xlcyh7IHNvY2tldCwgaXNSZWFkeSA9IChkYm8sIG1ldGhvZHMpID0+IHsgfSwgb25EaXNjb25uZWN0IH0sIHN5bmNlZFRhYmxlKSB7XG4gICAgY29uc3QgcHJlZmZpeCA9IFwiX3BzcWxXU18uXCI7XG4gICAgdmFyIHN1YnNjcmlwdGlvbnMgPSBbXTtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBpZiAob25EaXNjb25uZWN0KSB7XG4gICAgICAgICAgICBzb2NrZXQub24oXCJkaXNjb25uZWN0XCIsIG9uRGlzY29ubmVjdCk7XG4gICAgICAgIH1cbiAgICAgICAgLyogU2NoZW1hID0gcHVibGlzaGVkIHNjaGVtYSAqL1xuICAgICAgICBzb2NrZXQub24ocHJlZmZpeCArICdzY2hlbWEnLCAoeyBzY2hlbWEsIG1ldGhvZHMsIGZ1bGxTY2hlbWEsIGpvaW5UYWJsZXMgPSBbXSB9KSA9PiB7XG4gICAgICAgICAgICBsZXQgZGJvID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShzY2hlbWEpKTtcbiAgICAgICAgICAgIGxldCBfbWV0aG9kcyA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkobWV0aG9kcykpLCBtZXRob2RzT2JqID0ge307XG4gICAgICAgICAgICBfbWV0aG9kcy5tYXAobWV0aG9kID0+IHtcbiAgICAgICAgICAgICAgICBtZXRob2RzT2JqW21ldGhvZF0gPSBmdW5jdGlvbiAocGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChwcmVmZml4ICsgXCJtZXRob2RcIiwgeyBtZXRob2QsIHBhcmFtcyB9LCAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBtZXRob2RzT2JqID0gT2JqZWN0LmZyZWV6ZShtZXRob2RzT2JqKTtcbiAgICAgICAgICAgIGlmIChkYm8uc3FsKSB7XG4gICAgICAgICAgICAgICAgLy8gZGJvLnNjaGVtYSA9IE9iamVjdC5mcmVlemUoWyAuLi5kYm8uc3FsIF0pO1xuICAgICAgICAgICAgICAgIGRiby5zcWwgPSBmdW5jdGlvbiAocXVlcnksIHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQocHJlZmZpeCArIFwic3FsXCIsIHsgcXVlcnksIHBhcmFtcywgb3B0aW9ucyB9LCAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLyogQnVpbGRpbmcgREJPIG9iamVjdCAqL1xuICAgICAgICAgICAgT2JqZWN0LmtleXMoZGJvKS5mb3JFYWNoKHRhYmxlTmFtZSA9PiB7XG4gICAgICAgICAgICAgICAgT2JqZWN0LmtleXMoZGJvW3RhYmxlTmFtZV0pLmZvckVhY2goY29tbWFuZCA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb21tYW5kID09PSBcInN5bmNcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGJvW3RhYmxlTmFtZV0uX3N5bmNJbmZvID0geyAuLi5kYm9bdGFibGVOYW1lXVtjb21tYW5kXSB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN5bmNlZFRhYmxlICYmIHN5bmNlZFRhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGJvW3RhYmxlTmFtZV0uZ2V0U3luYyA9IChmaWx0ZXIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBzeW5jZWRUYWJsZSh7IG5hbWU6IHRhYmxlTmFtZSwgZmlsdGVyLCBkYjogZGJvIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBzeW5jSGFuZGxlKHBhcmFtMSwgcGFyYW0yLCBzeW5jSGFuZGxlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgb25TeW5jUmVxdWVzdCwgb25QdWxsUmVxdWVzdCwgb25VcGRhdGVzIH0gPSBzeW5jSGFuZGxlcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjaGFubmVsTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0VXBkYXRlZCwgc29ja2V0SGFuZGxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KHByZWZmaXgsIHsgdGFibGVOYW1lLCBjb21tYW5kLCBwYXJhbTEsIHBhcmFtMiwgbGFzdFVwZGF0ZWQgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChyZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNoYW5uZWxOYW1lID0gcmVzLmNoYW5uZWxOYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgeyBpZF9maWVsZHMsIHN5bmNlZF9maWVsZCwgY2hhbm5lbE5hbWUgfSA9IHJlcywgc3luY19pbmZvID0geyBpZF9maWVsZHMsIHN5bmNlZF9maWVsZCB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuc3luY19pbmZvID0gc3luY19pbmZvO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuY2hhbm5lbE5hbWUgPSBjaGFubmVsTmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnNvY2tldCA9IHNvY2tldDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnN5bmNEYXRhID0gZnVuY3Rpb24gKGRhdGEsIGRlbGV0ZWQsIGNiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoY2hhbm5lbE5hbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25TeW5jUmVxdWVzdDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4ub25TeW5jUmVxdWVzdCh7fSwgc3luY19pbmZvKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLih7IGRhdGEgfSB8fCB7fSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi4oeyBkZWxldGVkIH0gfHwge30pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgIWNiID8gbnVsbCA6IChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYihyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoY2hhbm5lbE5hbWUsIHsgb25TeW5jUmVxdWVzdDogb25TeW5jUmVxdWVzdCh7fSwgc3luY19pbmZvKSB9LCAocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvY2tldEhhbmRsZSA9IGZ1bmN0aW9uIChkYXRhLCBjYikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIENsaWVudCB3aWxsOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAxLiBTZW5kIGxhc3Rfc3luY2VkICAgICBvbihvblN5bmNSZXF1ZXN0KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAyLiBTZW5kIGRhdGEgPj0gc2VydmVyX3N5bmNlZCAgIG9uKG9uUHVsbFJlcXVlc3QpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDMuIFNlbmQgZGF0YSBvbiBDUlVEICAgIGVtaXQoZGF0YS5kYXRhKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA0LiBVcHNlcnQgZGF0YS5kYXRhICAgICBvbihkYXRhLmRhdGEpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWRhdGEpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBvbkNoYW5nZShkYXRhLmRhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXRhLmRhdGEgJiYgZGF0YS5kYXRhLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBQcm9taXNlLnJlc29sdmUob25VcGRhdGVzKGRhdGEuZGF0YSwgc3luY19pbmZvKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjYilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYih7IG9rOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7IGlmIChjYikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2IoeyBlcnIgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGRhdGEub25TeW5jUmVxdWVzdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjYihvblN5bmNSZXF1ZXN0KCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBQcm9taXNlLnJlc29sdmUob25TeW5jUmVxdWVzdChkYXRhLm9uU3luY1JlcXVlc3QsIHN5bmNfaW5mbykpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbihyZXMgPT4gY2IoeyBvblN5bmNSZXF1ZXN0OiByZXMgfSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHsgaWYgKGNiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYih7IGVyciB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoZGF0YS5vblB1bGxSZXF1ZXN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFByb21pc2UucmVzb2x2ZShvblB1bGxSZXF1ZXN0KGRhdGEub25QdWxsUmVxdWVzdCwgc3luY19pbmZvKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGFyciA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYih7IGRhdGE6IGFyciB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4geyBpZiAoY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNiKHsgZXJyIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJ1bmV4cGVjdGVkIHJlc3BvbnNlXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBDYWNoZSAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbShjaGFubmVsTmFtZSwgSlNPTi5zdHJpbmdpZnkoZGF0YSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9ucy5wdXNoKHsgY2hhbm5lbE5hbWUsIHN5bmNIYW5kbGVzLCBzb2NrZXRIYW5kbGUgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb2NrZXQub24oY2hhbm5lbE5hbWUsIHNvY2tldEhhbmRsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiB1bnN5bmMoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3VicyA9IHN1YnNjcmlwdGlvbnMuZmlsdGVyKHMgPT4gcy5jaGFubmVsTmFtZSA9PT0gX3RoaXMuY2hhbm5lbE5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN1YnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9ucyA9IHN1YnNjcmlwdGlvbnMuZmlsdGVyKHMgPT4gcy5jaGFubmVsTmFtZSAhPT0gX3RoaXMuY2hhbm5lbE5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KF90aGlzLmNoYW5uZWxOYW1lICsgXCJ1bnN5bmNcIiwge30sIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHN1YnMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNvY2tldC5yZW1vdmVMaXN0ZW5lcihjaGFubmVsTmFtZSwgc29ja2V0SGFuZGxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwibm8gc3luY3MgdG8gdW5zeW5jIGZyb21cIiwgc3Vicyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb2NrZXQucmVtb3ZlTGlzdGVuZXIoX3RoaXMuY2hhbm5lbE5hbWUsIHNvY2tldEhhbmRsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBzeW5jRGF0YShkYXRhLCBkZWxldGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChfdGhpcyAmJiBfdGhpcy5zeW5jRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuc3luY0RhdGEoZGF0YSwgZGVsZXRlZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5mcmVlemUoeyB1bnN5bmMsIHN5bmNEYXRhIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZGJvW3RhYmxlTmFtZV1bY29tbWFuZF0gPSBzeW5jSGFuZGxlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGNvbW1hbmQgPT09IFwic3Vic2NyaWJlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGhhbmRsZShwYXJhbTEsIHBhcmFtMiwgb25DaGFuZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzLCBjaGFubmVsTmFtZSwgbGFzdFVwZGF0ZWQsIHNvY2tldEhhbmRsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChwcmVmZml4LCB7IHRhYmxlTmFtZSwgY29tbWFuZCwgcGFyYW0xLCBwYXJhbTIsIGxhc3RVcGRhdGVkIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAocmVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFubmVsTmFtZSA9IHJlcy5jaGFubmVsTmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvY2tldEhhbmRsZSA9IGZ1bmN0aW9uIChkYXRhLCBjYikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFRPIERPOiBjb25maXJtIHJlY2VpdmluZyBkYXRhIG9yIHNlcnZlciB3aWxsIHVuc3Vic2NyaWJlICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYoY2IpIGNiKHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlKGRhdGEuZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQ2FjaGUgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oY2hhbm5lbE5hbWUsIEpTT04uc3RyaW5naWZ5KGRhdGEpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLmNoYW5uZWxOYW1lID0gY2hhbm5lbE5hbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuc29ja2V0ID0gc29ja2V0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbnMucHVzaCh7IGNoYW5uZWxOYW1lLCBvbkNoYW5nZSwgc29ja2V0SGFuZGxlIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc29ja2V0Lm9uKGNoYW5uZWxOYW1lLCBzb2NrZXRIYW5kbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gdW5zdWJzY3JpYmUoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzdWJzID0gc3Vic2NyaXB0aW9ucy5maWx0ZXIocyA9PiBzLmNoYW5uZWxOYW1lID09PSBjaGFubmVsTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdWJzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9ucyA9IHN1YnNjcmlwdGlvbnMuZmlsdGVyKHMgPT4gcy5jaGFubmVsTmFtZSAhPT0gY2hhbm5lbE5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoY2hhbm5lbE5hbWUgKyBcInVuc3Vic2NyaWJlXCIsIHt9LCAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcInVuc3Vic2NyaWJlZFwiLCBlcnIsIHJlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChzdWJzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNvY2tldC5yZW1vdmVMaXN0ZW5lcihjaGFubmVsTmFtZSwgc29ja2V0SGFuZGxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwibm8gc3Vic2NyaXB0aW9ucyB0byB1bnN1YnNjcmliZSBmcm9tXCIsIHN1YnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvY2tldC5yZW1vdmVMaXN0ZW5lcihjaGFubmVsTmFtZSwgc29ja2V0SGFuZGxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5mcmVlemUoeyB1bnN1YnNjcmliZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGRib1t0YWJsZU5hbWVdW2NvbW1hbmRdID0gaGFuZGxlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGJvW3RhYmxlTmFtZV1bY29tbWFuZF0gPSBmdW5jdGlvbiAocGFyYW0xLCBwYXJhbTIsIHBhcmFtMykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmKEFycmF5LmlzQXJyYXkocGFyYW0yKSB8fCBBcnJheS5pc0FycmF5KHBhcmFtMykpIHRocm93IFwiRXhwZWN0aW5nIGFuIG9iamVjdFwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KHByZWZmaXgsIHsgdGFibGVOYW1lLCBjb21tYW5kLCBwYXJhbTEsIHBhcmFtMiwgcGFyYW0zIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBqb2luVGFibGVzLm1hcCh0YWJsZSA9PiB7XG4gICAgICAgICAgICAgICAgZGJvLmlubmVySm9pbiA9IGRiby5pbm5lckpvaW4gfHwge307XG4gICAgICAgICAgICAgICAgZGJvLmxlZnRKb2luID0gZGJvLmxlZnRKb2luIHx8IHt9O1xuICAgICAgICAgICAgICAgIGRiby5pbm5lckpvaW5PbmUgPSBkYm8uaW5uZXJKb2luT25lIHx8IHt9O1xuICAgICAgICAgICAgICAgIGRiby5sZWZ0Sm9pbk9uZSA9IGRiby5sZWZ0Sm9pbk9uZSB8fCB7fTtcbiAgICAgICAgICAgICAgICBkYm8ubGVmdEpvaW5bdGFibGVdID0gKGZpbHRlciwgc2VsZWN0LCBvcHRpb25zID0ge30pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1ha2VKb2luKHRydWUsIGZpbHRlciwgc2VsZWN0LCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGRiby5pbm5lckpvaW5bdGFibGVdID0gKGZpbHRlciwgc2VsZWN0LCBvcHRpb25zID0ge30pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1ha2VKb2luKGZhbHNlLCBmaWx0ZXIsIHNlbGVjdCwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBkYm8ubGVmdEpvaW5PbmVbdGFibGVdID0gKGZpbHRlciwgc2VsZWN0LCBvcHRpb25zID0ge30pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1ha2VKb2luKHRydWUsIGZpbHRlciwgc2VsZWN0LCB7IC4uLm9wdGlvbnMsIGxpbWl0OiAxIH0pO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgZGJvLmlubmVySm9pbk9uZVt0YWJsZV0gPSAoZmlsdGVyLCBzZWxlY3QsIG9wdGlvbnMgPSB7fSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWFrZUpvaW4oZmFsc2UsIGZpbHRlciwgc2VsZWN0LCB7IC4uLm9wdGlvbnMsIGxpbWl0OiAxIH0pO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gbWFrZUpvaW4oaXNMZWZ0ID0gdHJ1ZSwgZmlsdGVyLCBzZWxlY3QsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFtpc0xlZnQgPyBcIiRsZWZ0Sm9pblwiIDogXCIkaW5uZXJKb2luXCJdOiB0YWJsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdCxcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLm9wdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlzUmVhZHkoZGJvLCBtZXRob2RzT2JqKTtcbiAgICAgICAgICAgIHJlc29sdmUoZGJvKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5leHBvcnRzLnByb3N0Z2xlcyA9IHByb3N0Z2xlcztcbjtcbiJdLCJzb3VyY2VSb290IjoiIn0=