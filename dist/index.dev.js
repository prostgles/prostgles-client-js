/******/ (function(modules) { // webpackBootstrap
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
/******/ 	return __webpack_require__(__webpack_require__.s = "./lib/index.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./lib/index.ts":
/*!**********************!*\
  !*** ./lib/index.ts ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Stefan L. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncedTable = exports.prostgles = void 0;
function prostgles({ socket, isReady = (dbo, methods) => { }, onDisconnect }) {
    const preffix = "_psqlWS_.";
    var subscriptions = [];
    return new Promise((resolve, reject) => {
        if (onDisconnect) {
            socket.on("disconnect", onDisconnect);
        }
        socket.on(preffix + 'schema', ({ schema, methods }) => {
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
                dbo.schema = Object.freeze([...dbo.sql]);
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
                        function syncHandle(param1, param2, syncHandles) {
                            const { onSyncRequest, onPullRequest, onUpdates } = syncHandles;
                            var _this = this, 
                            // channelName,
                            lastUpdated, socketHandle;
                            socket.emit(preffix, { tableName, command, param1, param2, lastUpdated }, (err, res) => {
                                if (err) {
                                    throw err;
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
                                    throw err;
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
            isReady(dbo, methodsObj);
            resolve(dbo);
        });
    });
}
exports.prostgles = prostgles;
;
function getHashCode(str) {
    var hash = 0, i, chr;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}
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
                    this.isSendingData = setTimeout(async () => {
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


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vbGliL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7UUFBQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7O1FBRUE7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7UUFDQTs7O1FBR0E7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7UUFDQTtRQUNBLDBDQUEwQyxnQ0FBZ0M7UUFDMUU7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7UUFDQSx3REFBd0Qsa0JBQWtCO1FBQzFFO1FBQ0EsaURBQWlELGNBQWM7UUFDL0Q7O1FBRUE7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBLHlDQUF5QyxpQ0FBaUM7UUFDMUUsZ0hBQWdILG1CQUFtQixFQUFFO1FBQ3JJO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0EsMkJBQTJCLDBCQUEwQixFQUFFO1FBQ3ZELGlDQUFpQyxlQUFlO1FBQ2hEO1FBQ0E7UUFDQTs7UUFFQTtRQUNBLHNEQUFzRCwrREFBK0Q7O1FBRXJIO1FBQ0E7OztRQUdBO1FBQ0E7Ozs7Ozs7Ozs7Ozs7QUNsRmE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhDQUE4QyxjQUFjO0FBQzVEO0FBQ0Esb0JBQW9CLHNDQUFzQyxFQUFFLGdCQUFnQjtBQUM1RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3Q0FBd0Msa0JBQWtCO0FBQzFEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5REFBeUQsaUJBQWlCO0FBQzFFO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCLHFCQUFxQjtBQUNyQjtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0RBQXNELHlCQUF5QjtBQUMvRTtBQUNBO0FBQ0E7QUFDQTtB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QVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1EQUFtRCxjQUFjO0FBQ2pFO0FBQ0E7QUFDQSxtREFBbUQsR0FBRztBQUN0RDtBQUNBLGFBQWEsRUFBRTtBQUNmO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUIsV0FBVyx1QkFBdUIsNEJBQTRCO0FBQ25GO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOEJBQThCLGNBQWM7QUFDNUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBLG9DQUFvQztBQUNwQztBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQSxpQ0FBaUM7QUFDakM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOEJBQThCLGdCQUFnQjtBQUM5QztBQUNBO0FBQ0Esc0JBQXNCO0FBQ3RCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiaW5kZXguZGV2LmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZ2V0dGVyIH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4gXHRcdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuIFx0XHR9XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG4gXHR9O1xuXG4gXHQvLyBjcmVhdGUgYSBmYWtlIG5hbWVzcGFjZSBvYmplY3RcbiBcdC8vIG1vZGUgJiAxOiB2YWx1ZSBpcyBhIG1vZHVsZSBpZCwgcmVxdWlyZSBpdFxuIFx0Ly8gbW9kZSAmIDI6IG1lcmdlIGFsbCBwcm9wZXJ0aWVzIG9mIHZhbHVlIGludG8gdGhlIG5zXG4gXHQvLyBtb2RlICYgNDogcmV0dXJuIHZhbHVlIHdoZW4gYWxyZWFkeSBucyBvYmplY3RcbiBcdC8vIG1vZGUgJiA4fDE6IGJlaGF2ZSBsaWtlIHJlcXVpcmVcbiBcdF9fd2VicGFja19yZXF1aXJlX18udCA9IGZ1bmN0aW9uKHZhbHVlLCBtb2RlKSB7XG4gXHRcdGlmKG1vZGUgJiAxKSB2YWx1ZSA9IF9fd2VicGFja19yZXF1aXJlX18odmFsdWUpO1xuIFx0XHRpZihtb2RlICYgOCkgcmV0dXJuIHZhbHVlO1xuIFx0XHRpZigobW9kZSAmIDQpICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgJiYgdmFsdWUuX19lc01vZHVsZSkgcmV0dXJuIHZhbHVlO1xuIFx0XHR2YXIgbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIobnMpO1xuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkobnMsICdkZWZhdWx0JywgeyBlbnVtZXJhYmxlOiB0cnVlLCB2YWx1ZTogdmFsdWUgfSk7XG4gXHRcdGlmKG1vZGUgJiAyICYmIHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJykgZm9yKHZhciBrZXkgaW4gdmFsdWUpIF9fd2VicGFja19yZXF1aXJlX18uZChucywga2V5LCBmdW5jdGlvbihrZXkpIHsgcmV0dXJuIHZhbHVlW2tleV07IH0uYmluZChudWxsLCBrZXkpKTtcbiBcdFx0cmV0dXJuIG5zO1xuIFx0fTtcblxuIFx0Ly8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubiA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuIFx0XHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cbiBcdFx0XHRmdW5jdGlvbiBnZXREZWZhdWx0KCkgeyByZXR1cm4gbW9kdWxlWydkZWZhdWx0J107IH0gOlxuIFx0XHRcdGZ1bmN0aW9uIGdldE1vZHVsZUV4cG9ydHMoKSB7IHJldHVybiBtb2R1bGU7IH07XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsICdhJywgZ2V0dGVyKTtcbiBcdFx0cmV0dXJuIGdldHRlcjtcbiBcdH07XG5cbiBcdC8vIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbFxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpOyB9O1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKF9fd2VicGFja19yZXF1aXJlX18ucyA9IFwiLi9saWIvaW5kZXgudHNcIik7XG4iLCJcInVzZSBzdHJpY3RcIjtcbi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiAgQ29weXJpZ2h0IChjKSBTdGVmYW4gTC4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuIFNlZSBMSUNFTlNFIGluIHRoZSBwcm9qZWN0IHJvb3QgZm9yIGxpY2Vuc2UgaW5mb3JtYXRpb24uXG4gKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuU3luY2VkVGFibGUgPSBleHBvcnRzLnByb3N0Z2xlcyA9IHZvaWQgMDtcbmZ1bmN0aW9uIHByb3N0Z2xlcyh7IHNvY2tldCwgaXNSZWFkeSA9IChkYm8sIG1ldGhvZHMpID0+IHsgfSwgb25EaXNjb25uZWN0IH0pIHtcbiAgICBjb25zdCBwcmVmZml4ID0gXCJfcHNxbFdTXy5cIjtcbiAgICB2YXIgc3Vic2NyaXB0aW9ucyA9IFtdO1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGlmIChvbkRpc2Nvbm5lY3QpIHtcbiAgICAgICAgICAgIHNvY2tldC5vbihcImRpc2Nvbm5lY3RcIiwgb25EaXNjb25uZWN0KTtcbiAgICAgICAgfVxuICAgICAgICBzb2NrZXQub24ocHJlZmZpeCArICdzY2hlbWEnLCAoeyBzY2hlbWEsIG1ldGhvZHMgfSkgPT4ge1xuICAgICAgICAgICAgbGV0IGRibyA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoc2NoZW1hKSk7XG4gICAgICAgICAgICBsZXQgX21ldGhvZHMgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG1ldGhvZHMpKSwgbWV0aG9kc09iaiA9IHt9O1xuICAgICAgICAgICAgX21ldGhvZHMubWFwKG1ldGhvZCA9PiB7XG4gICAgICAgICAgICAgICAgbWV0aG9kc09ialttZXRob2RdID0gZnVuY3Rpb24gKHBhcmFtcykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQocHJlZmZpeCArIFwibWV0aG9kXCIsIHsgbWV0aG9kLCBwYXJhbXMgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgbWV0aG9kc09iaiA9IE9iamVjdC5mcmVlemUobWV0aG9kc09iaik7XG4gICAgICAgICAgICBpZiAoZGJvLnNxbCkge1xuICAgICAgICAgICAgICAgIGRiby5zY2hlbWEgPSBPYmplY3QuZnJlZXplKFsuLi5kYm8uc3FsXSk7XG4gICAgICAgICAgICAgICAgZGJvLnNxbCA9IGZ1bmN0aW9uIChxdWVyeSwgcGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChwcmVmZml4ICsgXCJzcWxcIiwgeyBxdWVyeSwgcGFyYW1zLCBvcHRpb25zIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvKiBCdWlsZGluZyBEQk8gb2JqZWN0ICovXG4gICAgICAgICAgICBPYmplY3Qua2V5cyhkYm8pLmZvckVhY2godGFibGVOYW1lID0+IHtcbiAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhkYm9bdGFibGVOYW1lXSkuZm9yRWFjaChjb21tYW5kID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbW1hbmQgPT09IFwic3luY1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYm9bdGFibGVOYW1lXS5fc3luY0luZm8gPSB7IC4uLmRib1t0YWJsZU5hbWVdW2NvbW1hbmRdIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBzeW5jSGFuZGxlKHBhcmFtMSwgcGFyYW0yLCBzeW5jSGFuZGxlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgb25TeW5jUmVxdWVzdCwgb25QdWxsUmVxdWVzdCwgb25VcGRhdGVzIH0gPSBzeW5jSGFuZGxlcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjaGFubmVsTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0VXBkYXRlZCwgc29ja2V0SGFuZGxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KHByZWZmaXgsIHsgdGFibGVOYW1lLCBjb21tYW5kLCBwYXJhbTEsIHBhcmFtMiwgbGFzdFVwZGF0ZWQgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChyZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNoYW5uZWxOYW1lID0gcmVzLmNoYW5uZWxOYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgeyBpZF9maWVsZHMsIHN5bmNlZF9maWVsZCwgY2hhbm5lbE5hbWUgfSA9IHJlcywgc3luY19pbmZvID0geyBpZF9maWVsZHMsIHN5bmNlZF9maWVsZCB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuc3luY19pbmZvID0gc3luY19pbmZvO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuY2hhbm5lbE5hbWUgPSBjaGFubmVsTmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnNvY2tldCA9IHNvY2tldDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnN5bmNEYXRhID0gZnVuY3Rpb24gKGRhdGEsIGRlbGV0ZWQsIGNiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoY2hhbm5lbE5hbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25TeW5jUmVxdWVzdDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4ub25TeW5jUmVxdWVzdCh7fSwgc3luY19pbmZvKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLih7IGRhdGEgfSB8fCB7fSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi4oeyBkZWxldGVkIH0gfHwge30pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgIWNiID8gbnVsbCA6IChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYihyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoY2hhbm5lbE5hbWUsIHsgb25TeW5jUmVxdWVzdDogb25TeW5jUmVxdWVzdCh7fSwgc3luY19pbmZvKSB9LCAocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvY2tldEhhbmRsZSA9IGZ1bmN0aW9uIChkYXRhLCBjYikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIENsaWVudCB3aWxsOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAxLiBTZW5kIGxhc3Rfc3luY2VkICAgICBvbihvblN5bmNSZXF1ZXN0KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAyLiBTZW5kIGRhdGEgPj0gc2VydmVyX3N5bmNlZCAgIG9uKG9uUHVsbFJlcXVlc3QpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDMuIFNlbmQgZGF0YSBvbiBDUlVEICAgIGVtaXQoZGF0YS5kYXRhKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA0LiBVcHNlcnQgZGF0YS5kYXRhICAgICBvbihkYXRhLmRhdGEpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWRhdGEpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBvbkNoYW5nZShkYXRhLmRhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXRhLmRhdGEgJiYgZGF0YS5kYXRhLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBQcm9taXNlLnJlc29sdmUob25VcGRhdGVzKGRhdGEuZGF0YSwgc3luY19pbmZvKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjYilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYih7IG9rOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7IGlmIChjYikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2IoeyBlcnIgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGRhdGEub25TeW5jUmVxdWVzdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjYihvblN5bmNSZXF1ZXN0KCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBQcm9taXNlLnJlc29sdmUob25TeW5jUmVxdWVzdChkYXRhLm9uU3luY1JlcXVlc3QsIHN5bmNfaW5mbykpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbihyZXMgPT4gY2IoeyBvblN5bmNSZXF1ZXN0OiByZXMgfSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHsgaWYgKGNiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYih7IGVyciB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoZGF0YS5vblB1bGxSZXF1ZXN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFByb21pc2UucmVzb2x2ZShvblB1bGxSZXF1ZXN0KGRhdGEub25QdWxsUmVxdWVzdCwgc3luY19pbmZvKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGFyciA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYih7IGRhdGE6IGFyciB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4geyBpZiAoY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNiKHsgZXJyIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJ1bmV4cGVjdGVkIHJlc3BvbnNlXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBDYWNoZSAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbShjaGFubmVsTmFtZSwgSlNPTi5zdHJpbmdpZnkoZGF0YSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9ucy5wdXNoKHsgY2hhbm5lbE5hbWUsIHN5bmNIYW5kbGVzLCBzb2NrZXRIYW5kbGUgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb2NrZXQub24oY2hhbm5lbE5hbWUsIHNvY2tldEhhbmRsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiB1bnN5bmMoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3VicyA9IHN1YnNjcmlwdGlvbnMuZmlsdGVyKHMgPT4gcy5jaGFubmVsTmFtZSA9PT0gX3RoaXMuY2hhbm5lbE5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN1YnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9ucyA9IHN1YnNjcmlwdGlvbnMuZmlsdGVyKHMgPT4gcy5jaGFubmVsTmFtZSAhPT0gX3RoaXMuY2hhbm5lbE5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KF90aGlzLmNoYW5uZWxOYW1lICsgXCJ1bnN5bmNcIiwge30sIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHN1YnMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNvY2tldC5yZW1vdmVMaXN0ZW5lcihjaGFubmVsTmFtZSwgc29ja2V0SGFuZGxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwibm8gc3luY3MgdG8gdW5zeW5jIGZyb21cIiwgc3Vicyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb2NrZXQucmVtb3ZlTGlzdGVuZXIoX3RoaXMuY2hhbm5lbE5hbWUsIHNvY2tldEhhbmRsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBzeW5jRGF0YShkYXRhLCBkZWxldGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChfdGhpcyAmJiBfdGhpcy5zeW5jRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuc3luY0RhdGEoZGF0YSwgZGVsZXRlZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5mcmVlemUoeyB1bnN5bmMsIHN5bmNEYXRhIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZGJvW3RhYmxlTmFtZV1bY29tbWFuZF0gPSBzeW5jSGFuZGxlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGNvbW1hbmQgPT09IFwic3Vic2NyaWJlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGhhbmRsZShwYXJhbTEsIHBhcmFtMiwgb25DaGFuZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzLCBjaGFubmVsTmFtZSwgbGFzdFVwZGF0ZWQsIHNvY2tldEhhbmRsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChwcmVmZml4LCB7IHRhYmxlTmFtZSwgY29tbWFuZCwgcGFyYW0xLCBwYXJhbTIsIGxhc3RVcGRhdGVkIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAocmVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFubmVsTmFtZSA9IHJlcy5jaGFubmVsTmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvY2tldEhhbmRsZSA9IGZ1bmN0aW9uIChkYXRhLCBjYikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFRPIERPOiBjb25maXJtIHJlY2VpdmluZyBkYXRhIG9yIHNlcnZlciB3aWxsIHVuc3Vic2NyaWJlICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYoY2IpIGNiKHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlKGRhdGEuZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQ2FjaGUgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oY2hhbm5lbE5hbWUsIEpTT04uc3RyaW5naWZ5KGRhdGEpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLmNoYW5uZWxOYW1lID0gY2hhbm5lbE5hbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuc29ja2V0ID0gc29ja2V0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbnMucHVzaCh7IGNoYW5uZWxOYW1lLCBvbkNoYW5nZSwgc29ja2V0SGFuZGxlIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc29ja2V0Lm9uKGNoYW5uZWxOYW1lLCBzb2NrZXRIYW5kbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gdW5zdWJzY3JpYmUoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzdWJzID0gc3Vic2NyaXB0aW9ucy5maWx0ZXIocyA9PiBzLmNoYW5uZWxOYW1lID09PSBjaGFubmVsTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdWJzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9ucyA9IHN1YnNjcmlwdGlvbnMuZmlsdGVyKHMgPT4gcy5jaGFubmVsTmFtZSAhPT0gY2hhbm5lbE5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoY2hhbm5lbE5hbWUgKyBcInVuc3Vic2NyaWJlXCIsIHt9LCAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcInVuc3Vic2NyaWJlZFwiLCBlcnIsIHJlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChzdWJzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNvY2tldC5yZW1vdmVMaXN0ZW5lcihjaGFubmVsTmFtZSwgc29ja2V0SGFuZGxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwibm8gc3Vic2NyaXB0aW9ucyB0byB1bnN1YnNjcmliZSBmcm9tXCIsIHN1YnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvY2tldC5yZW1vdmVMaXN0ZW5lcihjaGFubmVsTmFtZSwgc29ja2V0SGFuZGxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5mcmVlemUoeyB1bnN1YnNjcmliZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGRib1t0YWJsZU5hbWVdW2NvbW1hbmRdID0gaGFuZGxlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGJvW3RhYmxlTmFtZV1bY29tbWFuZF0gPSBmdW5jdGlvbiAocGFyYW0xLCBwYXJhbTIsIHBhcmFtMykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmKEFycmF5LmlzQXJyYXkocGFyYW0yKSB8fCBBcnJheS5pc0FycmF5KHBhcmFtMykpIHRocm93IFwiRXhwZWN0aW5nIGFuIG9iamVjdFwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KHByZWZmaXgsIHsgdGFibGVOYW1lLCBjb21tYW5kLCBwYXJhbTEsIHBhcmFtMiwgcGFyYW0zIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpc1JlYWR5KGRibywgbWV0aG9kc09iaik7XG4gICAgICAgICAgICByZXNvbHZlKGRibyk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuZXhwb3J0cy5wcm9zdGdsZXMgPSBwcm9zdGdsZXM7XG47XG5mdW5jdGlvbiBnZXRIYXNoQ29kZShzdHIpIHtcbiAgICB2YXIgaGFzaCA9IDAsIGksIGNocjtcbiAgICBmb3IgKGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNociA9IHN0ci5jaGFyQ29kZUF0KGkpO1xuICAgICAgICBoYXNoID0gKChoYXNoIDw8IDUpIC0gaGFzaCkgKyBjaHI7XG4gICAgICAgIGhhc2ggfD0gMDsgLy8gQ29udmVydCB0byAzMmJpdCBpbnRlZ2VyXG4gICAgfVxuICAgIHJldHVybiBoYXNoO1xufVxuY29uc3QgU1RPUkFHRV9UWVBFUyA9IHtcbiAgICBhcnJheTogXCJhcnJheVwiLFxuICAgIGxvY2FsU3RvcmFnZTogXCJsb2NhbFN0b3JhZ2VcIlxufTtcbmNsYXNzIFN5bmNlZFRhYmxlIHtcbiAgICBjb25zdHJ1Y3Rvcih7IG5hbWUsIGZpbHRlciwgb25DaGFuZ2UsIGRiLCBwdXNoRGVib3VuY2UgPSAxMDAsIHNraXBGaXJzdFRyaWdnZXIgPSBmYWxzZSB9KSB7XG4gICAgICAgIHRoaXMucHVzaERlYm91bmNlID0gMTAwO1xuICAgICAgICB0aGlzLnNraXBGaXJzdFRyaWdnZXIgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pdGVtcyA9IFtdO1xuICAgICAgICB0aGlzLnN0b3JhZ2VUeXBlID0gU1RPUkFHRV9UWVBFUy5hcnJheTtcbiAgICAgICAgdGhpcy5pdGVtc09iaiA9IHt9O1xuICAgICAgICB0aGlzLm5vdGlmeVN1YnNjcmlwdGlvbnMgPSAoaWRPYmosIG5ld0RhdGEsIGRlbHRhKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNpbmdsZVN1YnNjcmlwdGlvbnMuZmlsdGVyKHMgPT4gcy5pZE9iaiAmJlxuICAgICAgICAgICAgICAgIHRoaXMubWF0Y2hlc0lkT2JqKHMuaWRPYmosIGlkT2JqKSAmJlxuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKHMuaWRPYmopLmxlbmd0aCA8PSBPYmplY3Qua2V5cyhpZE9iaikubGVuZ3RoKVxuICAgICAgICAgICAgICAgIC5tYXAocyA9PiB7XG4gICAgICAgICAgICAgICAgcy5vbkNoYW5nZShuZXdEYXRhLCBkZWx0YSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy51bnN1YnNjcmliZSA9IChvbkNoYW5nZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zaW5nbGVTdWJzY3JpcHRpb25zID0gdGhpcy5zaW5nbGVTdWJzY3JpcHRpb25zLmZpbHRlcihzID0+IHMub25DaGFuZ2UgIT09IG9uQ2hhbmdlKTtcbiAgICAgICAgICAgIHRoaXMubXVsdGlTdWJzY3JpcHRpb25zID0gdGhpcy5tdWx0aVN1YnNjcmlwdGlvbnMuZmlsdGVyKHMgPT4gcy5vbkNoYW5nZSAhPT0gb25DaGFuZ2UpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLnVuc3luYyA9ICgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmRiU3luYyAmJiB0aGlzLmRiU3luYy51bnN5bmMpXG4gICAgICAgICAgICAgICAgdGhpcy5kYlN5bmMudW5zeW5jKCk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZGVsZXRlID0gKGlkT2JqKSA9PiB7XG4gICAgICAgICAgICBsZXQgaXRlbXMgPSB0aGlzLmdldEl0ZW1zKCk7XG4gICAgICAgICAgICBpdGVtcyA9IGl0ZW1zLmZpbHRlcihkID0+ICF0aGlzLm1hdGNoZXNJZE9iaihpZE9iaiwgZCkpO1xuICAgICAgICAgICAgLy8gd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKHRoaXMubmFtZSwgSlNPTi5zdHJpbmdpZnkoaXRlbXMpKTtcbiAgICAgICAgICAgIHRoaXMuc2V0SXRlbXMoaXRlbXMpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMub25EYXRhQ2hhbmdlZChudWxsLCBbaWRPYmpdKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5zeW5jRGVsZXRlZCA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwodGhpcy5nZXREZWxldGVkKCkubWFwKGFzeW5jIChpZE9iaikgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5kYlt0aGlzLm5hbWVdLmRlbGV0ZShpZE9iaik7XG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0RGVsZXRlZChudWxsLCBbXSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMudXBzZXJ0ID0gYXN5bmMgKGRhdGEsIGZyb21fc2VydmVyID0gZmFsc2UpID0+IHtcbiAgICAgICAgICAgIGxldCBpdGVtcyA9IHRoaXMuZ2V0SXRlbXMoKTtcbiAgICAgICAgICAgIGlmIChmcm9tX3NlcnZlciAmJiB0aGlzLmdldERlbGV0ZWQoKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnN5bmNEZWxldGVkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgdXBkYXRlcyA9IFtdLCBpbnNlcnRzID0gW107XG4gICAgICAgICAgICBkYXRhLm1hcChkID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIWZyb21fc2VydmVyKVxuICAgICAgICAgICAgICAgICAgICBkW3RoaXMuc3luY2VkX2ZpZWxkXSA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgbGV0IGV4aXN0aW5nX2lkeCA9IGl0ZW1zLmZpbmRJbmRleChjID0+ICF0aGlzLmlkX2ZpZWxkcy5maW5kKGtleSA9PiBjW2tleV0gIT09IGRba2V5XSkpLCBleGlzdGluZyA9IGl0ZW1zW2V4aXN0aW5nX2lkeF07XG4gICAgICAgICAgICAgICAgaWYgKGV4aXN0aW5nICYmIGV4aXN0aW5nW3RoaXMuc3luY2VkX2ZpZWxkXSA8IGRbdGhpcy5zeW5jZWRfZmllbGRdKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zW2V4aXN0aW5nX2lkeF0gPSB7IC4uLmQgfTtcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlcy5wdXNoKGQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZnJvbV9zZXJ2ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoaXMuc3Vic2NyaXB0aW9ucy5maWx0ZXIocyA9PiBzLmlkT2JqICYmIHRoaXMubWF0Y2hlc0lkT2JqKHMuaWRPYmosIGQpKVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIC5tYXAocyA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIHMub25DaGFuZ2UoeyAuLi5kIH0sIHsgLi4uZCB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2luZ2xlU3Vic2NyaXB0aW9ucy5maWx0ZXIocyA9PiBzLmlkT2JqICYmIHRoaXMubWF0Y2hlc0lkT2JqKHMuaWRPYmosIGQpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAocyA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcy5vbkNoYW5nZSh7IC4uLmQgfSwgeyAuLi5kIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoIWV4aXN0aW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zLnB1c2goeyAuLi5kIH0pO1xuICAgICAgICAgICAgICAgICAgICBpbnNlcnRzLnB1c2goZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8qIFRPRE86IERlbGV0ZXMgZnJvbSBzZXJ2ZXIgKi9cbiAgICAgICAgICAgICAgICAvLyBpZihhbGxvd19kZWxldGVzKXtcbiAgICAgICAgICAgICAgICAvLyAgICAgaXRlbXMgPSB0aGlzLmdldEl0ZW1zKCk7XG4gICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgb25VcGRhdGVzOiBpbnNlcnRzKCAke2luc2VydHMubGVuZ3RofSApIHVwZGF0ZXMoICR7dXBkYXRlcy5sZW5ndGh9ICkgIHRvdGFsKCAke2RhdGEubGVuZ3RofSApYCk7XG4gICAgICAgICAgICBjb25zdCBuZXdEYXRhID0gWy4uLmluc2VydHMsIC4uLnVwZGF0ZXNdO1xuICAgICAgICAgICAgLy8gd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKHRoaXMubmFtZSwgSlNPTi5zdHJpbmdpZnkoaXRlbXMpKTtcbiAgICAgICAgICAgIHRoaXMuc2V0SXRlbXMoaXRlbXMpO1xuICAgICAgICAgICAgdGhpcy5vbkRhdGFDaGFuZ2VkKG5ld0RhdGEsIG51bGwsIGZyb21fc2VydmVyKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLm9uRGF0YUNoYW5nZWQgPSBhc3luYyAobmV3RGF0YSA9IG51bGwsIGRlbGV0ZWREYXRhID0gbnVsbCwgZnJvbV9zZXJ2ZXIgPSBmYWxzZSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtcyA9IHRoaXMuZ2V0SXRlbXMoKTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzLnN1YnNjcmlwdGlvbnMuZmlsdGVyKHMgPT4gIXMuaWRPYmopLm1hcChzID0+eyBzLm9uQ2hhbmdlKGl0ZW1zLCBuZXdEYXRhKSB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLm11bHRpU3Vic2NyaXB0aW9ucy5tYXAocyA9PiB7IHMub25DaGFuZ2UoaXRlbXMsIG5ld0RhdGEpOyB9KTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vbkNoYW5nZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uQ2hhbmdlKGl0ZW1zLCBuZXdEYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgd2luZG93Lm9uYmVmb3JldW5sb2FkID0gY29uZmlybUV4aXQ7XG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gY29uZmlybUV4aXQoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcIkRhdGEgbWF5IGJlIGxvc3QuIEFyZSB5b3Ugc3VyZT9cIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFmcm9tX3NlcnZlciAmJiB0aGlzLmRiU3luYyAmJiB0aGlzLmRiU3luYy5zeW5jRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5pc1NlbmRpbmdEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRoaXMuaXNTZW5kaW5nRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pc1NlbmRpbmdEYXRhID0gc2V0VGltZW91dChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmRiU3luYy5zeW5jRGF0YShuZXdEYXRhLCBkZWxldGVkRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pc1NlbmRpbmdEYXRhID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5vbmJlZm9yZXVubG9hZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH0sIHRoaXMucHVzaERlYm91bmNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh0cnVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLnNldEl0ZW1zID0gKGl0ZW1zKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5zdG9yYWdlVHlwZSA9PT0gU1RPUkFHRV9UWVBFUy5sb2NhbFN0b3JhZ2UpIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0odGhpcy5uYW1lLCBKU09OLnN0cmluZ2lmeShpdGVtcykpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodGhpcy5zdG9yYWdlVHlwZSA9PT0gU1RPUkFHRV9UWVBFUy5hcnJheSkge1xuICAgICAgICAgICAgICAgIHRoaXMuaXRlbXMgPSBpdGVtcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiaW52YWxpZC9taXNzaW5nIHN0b3JhZ2VUeXBlIC0+IFwiICsgdGhpcy5zdG9yYWdlVHlwZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZ2V0SXRlbXMgPSAoc3luY19pbmZvKSA9PiB7XG4gICAgICAgICAgICBsZXQgaXRlbXMgPSBbXTtcbiAgICAgICAgICAgIGlmICh0aGlzLnN0b3JhZ2VUeXBlID09PSBTVE9SQUdFX1RZUEVTLmxvY2FsU3RvcmFnZSkge1xuICAgICAgICAgICAgICAgIGxldCBjYWNoZWRTdHIgPSB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0odGhpcy5uYW1lKTtcbiAgICAgICAgICAgICAgICBpZiAoY2FjaGVkU3RyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtcyA9IEpTT04ucGFyc2UoY2FjaGVkU3RyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMuc3RvcmFnZVR5cGUgPT09IFNUT1JBR0VfVFlQRVMuYXJyYXkpIHtcbiAgICAgICAgICAgICAgICBpdGVtcyA9IHRoaXMuaXRlbXMuc2xpY2UoMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImludmFsaWQvbWlzc2luZyBzdG9yYWdlVHlwZSAtPiBcIiArIHRoaXMuc3RvcmFnZVR5cGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuaWRfZmllbGRzICYmIHRoaXMuc3luY2VkX2ZpZWxkKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc19maWVsZHMgPSBbdGhpcy5zeW5jZWRfZmllbGQsIC4uLnRoaXMuaWRfZmllbGRzLnNvcnQoKV07XG4gICAgICAgICAgICAgICAgaXRlbXMgPSBpdGVtc1xuICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKGQgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gIXRoaXMuZmlsdGVyIHx8ICFPYmplY3Qua2V5cyh0aGlzLmZpbHRlcikuZmluZChrZXkgPT4gZFtrZXldLnRvU3RyaW5nKCkgIT09IHRoaXMuZmlsdGVyW2tleV0udG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLnNvcnQoKGEsIGIpID0+IHNfZmllbGRzLm1hcChrZXkgPT4gYVtrZXldIDwgYltrZXldID8gLTEgOiBhW2tleV0gPiBiW2tleV0gPyAxIDogMCkuZmluZCh2ID0+IHYpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuaXRlbXMgPSBpdGVtcztcbiAgICAgICAgICAgIHJldHVybiBpdGVtcztcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5nZXRCYXRjaCA9IChwYXJhbXMsIHN5bmNfaW5mbykgPT4ge1xuICAgICAgICAgICAgbGV0IGl0ZW1zID0gdGhpcy5nZXRJdGVtcygpO1xuICAgICAgICAgICAgcGFyYW1zID0gcGFyYW1zIHx8IHt9O1xuICAgICAgICAgICAgY29uc3QgeyBmcm9tX3N5bmNlZCwgdG9fc3luY2VkLCBvZmZzZXQgPSAwLCBsaW1pdCA9IG51bGwgfSA9IHBhcmFtcztcbiAgICAgICAgICAgIGxldCByZXMgPSBpdGVtcy5tYXAoYyA9PiAoeyAuLi5jIH0pKVxuICAgICAgICAgICAgICAgIC5maWx0ZXIoYyA9PiAoIWZyb21fc3luY2VkIHx8IGNbdGhpcy5zeW5jZWRfZmllbGRdID49IGZyb21fc3luY2VkKSAmJlxuICAgICAgICAgICAgICAgICghdG9fc3luY2VkIHx8IGNbdGhpcy5zeW5jZWRfZmllbGRdIDw9IHRvX3N5bmNlZCkpO1xuICAgICAgICAgICAgaWYgKG9mZnNldCB8fCBsaW1pdClcbiAgICAgICAgICAgICAgICByZXMgPSByZXMuc3BsaWNlKG9mZnNldCwgbGltaXQgfHwgcmVzLmxlbmd0aCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLmZpbHRlciA9IGZpbHRlcjtcbiAgICAgICAgdGhpcy5vbkNoYW5nZSA9IG9uQ2hhbmdlO1xuICAgICAgICBpZiAoIWRiKVxuICAgICAgICAgICAgdGhyb3cgXCJkYiBtaXNzaW5nXCI7XG4gICAgICAgIHRoaXMuZGIgPSBkYjtcbiAgICAgICAgY29uc3QgeyBpZF9maWVsZHMsIHN5bmNlZF9maWVsZCB9ID0gZGJbdGhpcy5uYW1lXS5fc3luY0luZm87XG4gICAgICAgIGlmICghaWRfZmllbGRzIHx8ICFzeW5jZWRfZmllbGQpXG4gICAgICAgICAgICB0aHJvdyBcImlkX2ZpZWxkcy9zeW5jZWRfZmllbGQgbWlzc2luZ1wiO1xuICAgICAgICB0aGlzLmlkX2ZpZWxkcyA9IGlkX2ZpZWxkcztcbiAgICAgICAgdGhpcy5zeW5jZWRfZmllbGQgPSBzeW5jZWRfZmllbGQ7XG4gICAgICAgIHRoaXMucHVzaERlYm91bmNlID0gcHVzaERlYm91bmNlO1xuICAgICAgICB0aGlzLmlzU2VuZGluZ0RhdGEgPSBudWxsO1xuICAgICAgICB0aGlzLnNraXBGaXJzdFRyaWdnZXIgPSBza2lwRmlyc3RUcmlnZ2VyO1xuICAgICAgICB0aGlzLm11bHRpU3Vic2NyaXB0aW9ucyA9IFtdO1xuICAgICAgICB0aGlzLnNpbmdsZVN1YnNjcmlwdGlvbnMgPSBbXTtcbiAgICAgICAgY29uc3Qgb25TeW5jUmVxdWVzdCA9IChwYXJhbXMsIHN5bmNfaW5mbykgPT4ge1xuICAgICAgICAgICAgbGV0IHJlcyA9IHsgY19scjogbnVsbCwgY19mcjogbnVsbCwgY19jb3VudDogMCB9O1xuICAgICAgICAgICAgbGV0IGJhdGNoID0gdGhpcy5nZXRCYXRjaChwYXJhbXMsIHN5bmNfaW5mbyk7XG4gICAgICAgICAgICBpZiAoYmF0Y2gubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgcmVzID0ge1xuICAgICAgICAgICAgICAgICAgICBjX2ZyOiBiYXRjaFswXSB8fCBudWxsLFxuICAgICAgICAgICAgICAgICAgICBjX2xyOiBiYXRjaFtiYXRjaC5sZW5ndGggLSAxXSB8fCBudWxsLFxuICAgICAgICAgICAgICAgICAgICBjX2NvdW50OiBiYXRjaC5sZW5ndGhcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJvblN5bmNSZXF1ZXN0XCIsIHJlcyk7XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9LCBvblB1bGxSZXF1ZXN0ID0gYXN5bmMgKHBhcmFtcywgc3luY19pbmZvKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5nZXREZWxldGVkKCkubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zeW5jRGVsZXRlZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZGF0YSA9IHRoaXMuZ2V0QmF0Y2gocGFyYW1zLCBzeW5jX2luZm8pO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYG9uUHVsbFJlcXVlc3Q6IHRvdGFsKCR7IGRhdGEubGVuZ3RoIH0pYClcbiAgICAgICAgICAgIHJldHVybiBkYXRhO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmRiU3luYyA9IGRiW3RoaXMubmFtZV0uc3luYyhmaWx0ZXIsIHt9LCB7IG9uU3luY1JlcXVlc3QsIG9uUHVsbFJlcXVlc3QsIG9uVXBkYXRlczogKGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwc2VydChkYXRhLCB0cnVlKTtcbiAgICAgICAgICAgIH0gfSk7XG4gICAgICAgIGlmICh0aGlzLm9uQ2hhbmdlICYmICF0aGlzLnNraXBGaXJzdFRyaWdnZXIpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQodGhpcy5vbkNoYW5nZSwgMCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc3Vic2NyaWJlQWxsKG9uQ2hhbmdlKSB7XG4gICAgICAgIGNvbnN0IHN1YiA9IHsgb25DaGFuZ2UgfSwgdW5zdWJzY3JpYmUgPSAoKSA9PiB7IHRoaXMudW5zdWJzY3JpYmUob25DaGFuZ2UpOyB9O1xuICAgICAgICB0aGlzLm11bHRpU3Vic2NyaXB0aW9ucy5wdXNoKHN1Yik7XG4gICAgICAgIGlmICghdGhpcy5za2lwRmlyc3RUcmlnZ2VyKSB7XG4gICAgICAgICAgICBvbkNoYW5nZSh0aGlzLmdldEl0ZW1zKCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBPYmplY3QuZnJlZXplKHsgdW5zdWJzY3JpYmUgfSk7XG4gICAgfVxuICAgIHN1YnNjcmliZU9uZShpZE9iaiwgb25DaGFuZ2UpIHtcbiAgICAgICAgaWYgKCFpZE9iaiB8fCAhb25DaGFuZ2UpXG4gICAgICAgICAgICB0aHJvdyBcImJhZFwiO1xuICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5maW5kT25lKGlkT2JqKTtcbiAgICAgICAgaWYgKCFpdGVtKVxuICAgICAgICAgICAgdGhyb3cgXCJubyBpdGVtIGZvdW5kXCI7XG4gICAgICAgIGNvbnN0IHN1YiA9IHtcbiAgICAgICAgICAgIG9uQ2hhbmdlLFxuICAgICAgICAgICAgaWRPYmosXG4gICAgICAgICAgICBpdGVtXG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHN5bmNIYW5kbGUgPSB7XG4gICAgICAgICAgICBnZXQ6ICgpID0+IHRoaXMuZmluZE9uZShpZE9iaiksXG4gICAgICAgICAgICB1bnN1YnNjcmliZTogKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMudW5zdWJzY3JpYmUob25DaGFuZ2UpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRlbGV0ZTogKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmRlbGV0ZShpZE9iaik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdXBkYXRlOiBkYXRhID0+IHtcbiAgICAgICAgICAgICAgICAvLyBjb25zdCBuZXdEYXRhID0geyAuLi50aGlzLmZpbmRPbmUoaWRPYmopLCAuLi5kYXRhLCAuLi5pZE9iaiB9O1xuICAgICAgICAgICAgICAgIC8vIG5vdGlmeVN1YnNjcmlwdGlvbnMobmV3RGF0YSwgZGF0YSk7XG4gICAgICAgICAgICAgICAgLy8gdGhpcy51cHNlcnQoW25ld0RhdGFdKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZU9uZShpZE9iaiwgZGF0YSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdXBkYXRlRnVsbDogZGF0YSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV3RGF0YSA9IHsgLi4uZGF0YSwgLi4uaWRPYmogfTtcbiAgICAgICAgICAgICAgICB0aGlzLm5vdGlmeVN1YnNjcmlwdGlvbnMoaWRPYmosIG5ld0RhdGEsIGRhdGEpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBzZXJ0KFtuZXdEYXRhXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuc2luZ2xlU3Vic2NyaXB0aW9ucy5wdXNoKHN1Yik7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4gb25DaGFuZ2UoaXRlbSwgaXRlbSksIDApO1xuICAgICAgICByZXR1cm4gT2JqZWN0LmZyZWV6ZSh7IC4uLnN5bmNIYW5kbGUgfSk7XG4gICAgfVxuICAgIHVwZGF0ZU9uZShpZE9iaiwgbmV3RGF0YSkge1xuICAgICAgICBjb25zdCBpdGVtID0geyAuLi50aGlzLmZpbmRPbmUoaWRPYmopLCAuLi5uZXdEYXRhLCAuLi5pZE9iaiB9O1xuICAgICAgICB0aGlzLm5vdGlmeVN1YnNjcmlwdGlvbnMoaWRPYmosIGl0ZW0sIG5ld0RhdGEpO1xuICAgICAgICB0aGlzLnVwc2VydChbaXRlbV0pO1xuICAgIH1cbiAgICBmaW5kT25lKGlkT2JqKSB7XG4gICAgICAgIHRoaXMuZ2V0SXRlbXMoKTtcbiAgICAgICAgbGV0IGl0ZW1JZHggPSAtMTtcbiAgICAgICAgaWYgKHR5cGVvZiBpZE9iaiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBpdGVtSWR4ID0gdGhpcy5pdGVtcy5maW5kSW5kZXgoaWRPYmopO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaXRlbUlkeCA9IHRoaXMuaXRlbXMuZmluZEluZGV4KGQgPT4gdGhpcy5tYXRjaGVzSWRPYmooaWRPYmosIGQpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5pdGVtc1tpdGVtSWR4XTtcbiAgICB9XG4gICAgZ2V0SWRPYmooZCkge1xuICAgICAgICBsZXQgcmVzID0ge307XG4gICAgICAgIHRoaXMuaWRfZmllbGRzLm1hcChrZXkgPT4ge1xuICAgICAgICAgICAgcmVzW2tleV0gPSBkW2tleV07XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cbiAgICBtYXRjaGVzSWRPYmooaWRPYmosIGQpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKGlkT2JqKS5sZW5ndGggJiYgIU9iamVjdC5rZXlzKGlkT2JqKS5maW5kKGtleSA9PiBkW2tleV0gIT09IGlkT2JqW2tleV0pO1xuICAgIH1cbiAgICBkZWxldGVBbGwoKSB7XG4gICAgICAgIHRoaXMuZ2V0SXRlbXMoKS5tYXAodGhpcy5nZXRJZE9iaikubWFwKHRoaXMuZGVsZXRlKTtcbiAgICB9XG4gICAgc2V0RGVsZXRlZChpZE9iaiwgZnVsbEFycmF5KSB7XG4gICAgICAgIGxldCBkZWxldGVkID0gW107XG4gICAgICAgIGlmIChmdWxsQXJyYXkpXG4gICAgICAgICAgICBkZWxldGVkID0gZnVsbEFycmF5O1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGRlbGV0ZWQgPSB0aGlzLmdldERlbGV0ZWQoKTtcbiAgICAgICAgICAgIGRlbGV0ZWQucHVzaChpZE9iaik7XG4gICAgICAgIH1cbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKHRoaXMubmFtZSArIFwiXyQkcHNxbCQkX2RlbGV0ZWRcIiwgZGVsZXRlZCk7XG4gICAgfVxuICAgIGdldERlbGV0ZWQoKSB7XG4gICAgICAgIGNvbnN0IGRlbFN0ciA9IHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbSh0aGlzLm5hbWUgKyBcIl8kJHBzcWwkJF9kZWxldGVkXCIpIHx8ICdbXSc7XG4gICAgICAgIHJldHVybiBKU09OLnBhcnNlKGRlbFN0cik7XG4gICAgfVxufVxuZXhwb3J0cy5TeW5jZWRUYWJsZSA9IFN5bmNlZFRhYmxlO1xuIl0sInNvdXJjZVJvb3QiOiIifQ==