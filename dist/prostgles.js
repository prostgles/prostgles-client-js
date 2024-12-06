"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Stefan L. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prostgles = exports.asName = exports.debug = exports.hasWnd = void 0;
const prostgles_types_1 = require("prostgles-types");
Object.defineProperty(exports, "asName", { enumerable: true, get: function () { return prostgles_types_1.asName; } });
const Auth_1 = require("./Auth");
const react_hooks_1 = require("./react-hooks");
const SQL_1 = require("./SQL");
const subscriptionHandler_1 = require("./subscriptionHandler");
const syncHandler_1 = require("./syncHandler");
const DEBUG_KEY = "DEBUG_SYNCEDTABLE";
exports.hasWnd = typeof window !== "undefined";
const debug = function (...args) {
    if (exports.hasWnd && window[DEBUG_KEY]) {
        window[DEBUG_KEY](...args);
    }
};
exports.debug = debug;
__exportStar(require("./react-hooks"), exports);
__exportStar(require("./useProstglesClient"), exports);
function prostgles(initOpts, syncedTable) {
    const { socket, onReady, onDisconnect, onReconnect, onSchemaChange = true, onReload, onDebug } = initOpts;
    let schemaAge;
    (0, exports.debug)("prostgles", { initOpts });
    if (onSchemaChange) {
        let cb;
        if (typeof onSchemaChange === "function") {
            cb = onSchemaChange;
        }
        socket.removeAllListeners(prostgles_types_1.CHANNELS.SCHEMA_CHANGED);
        if (cb)
            socket.on(prostgles_types_1.CHANNELS.SCHEMA_CHANGED, cb);
    }
    const preffix = prostgles_types_1.CHANNELS._preffix;
    //@ts-ignore
    const subscriptionHandler = (0, subscriptionHandler_1.getSubscriptionHandler)(initOpts);
    const syncHandler = (0, syncHandler_1.getSyncHandler)(initOpts);
    let state;
    const sql = new SQL_1.SQL();
    return new Promise((resolve, reject) => {
        socket.removeAllListeners(prostgles_types_1.CHANNELS.CONNECTION);
        socket.on(prostgles_types_1.CHANNELS.CONNECTION, error => {
            reject(error);
            return "ok";
        });
        if (onDisconnect) {
            socket.on("disconnect", () => {
                state = "disconnected";
                onDisconnect();
            });
        }
        if (onReconnect) {
            /** A reconnect will happen after the server is ready and pushed the schema */
            socket.on("connect", () => {
                if (state === "disconnected") {
                    state = "reconnected";
                }
            });
        }
        /* Schema = published schema */
        socket.on(prostgles_types_1.CHANNELS.SCHEMA, async (args) => {
            await (onDebug === null || onDebug === void 0 ? void 0 : onDebug({ type: "schemaChanged", data: args }));
            const { joinTables = [], ...clientSchema } = args;
            const { schema, methods, tableSchema, auth: authConfig, rawSQL, err } = clientSchema;
            /** Only destroy existing syncs if schema changed */
            const schemaDidNotChange = (schemaAge === null || schemaAge === void 0 ? void 0 : schemaAge.clientSchema) && (0, react_hooks_1.isEqual)(schemaAge.clientSchema, clientSchema);
            if (!schemaDidNotChange) {
                await syncHandler.destroySyncs();
            }
            if ((state === "connected" || state === "reconnected") && onReconnect) {
                onReconnect(socket, err);
                if (err) {
                    console.error(err);
                    return;
                }
                schemaAge = { origin: "onReconnect", date: new Date(), clientSchema };
            }
            else {
                schemaAge = { origin: "onReady", date: new Date(), clientSchema };
            }
            if (err) {
                reject(err);
                return;
            }
            const isReconnect = state === "reconnected";
            state = "connected";
            const dbo = JSON.parse(JSON.stringify(schema));
            const _methods = JSON.parse(JSON.stringify(methods));
            let methodsObj = {};
            const auth = (0, Auth_1.setupAuth)({ authData: authConfig, socket, onReload });
            _methods.map(method => {
                /** New method def */
                const isBasic = typeof method === "string";
                const methodName = isBasic ? method : method.name;
                const onRun = async function (...params) {
                    await (onDebug === null || onDebug === void 0 ? void 0 : onDebug({ type: "method", command: methodName, data: { params } }));
                    return new Promise((resolve, reject) => {
                        socket.emit(prostgles_types_1.CHANNELS.METHOD, { method: methodName, params }, (err, res) => {
                            if (err)
                                reject(err);
                            else
                                resolve(res);
                        });
                    });
                };
                methodsObj[methodName] = isBasic ? onRun : {
                    ...method,
                    run: onRun
                };
            });
            methodsObj = Object.freeze(methodsObj);
            if (rawSQL) {
                sql.setup({ dbo, socket });
            }
            /* Building DBO object */
            const checkSubscriptionArgs = (basicFilter, options, onChange, onError) => {
                if (basicFilter !== undefined && !(0, prostgles_types_1.isObject)(basicFilter) || options !== undefined && !(0, prostgles_types_1.isObject)(options) || !(typeof onChange === "function") || onError !== undefined && typeof onError !== "function") {
                    throw "Expecting: ( basicFilter<object>, options<object>, onChange<function> , onError?<function>) but got something else";
                }
            };
            const sub_commands = ["subscribe", "subscribeOne"];
            (0, prostgles_types_1.getKeys)(dbo).forEach(tableName => {
                const all_commands = Object.keys(dbo[tableName]);
                const dboTable = dbo[tableName];
                all_commands
                    .sort((a, b) => sub_commands.includes(a) - sub_commands.includes(b))
                    .forEach(command => {
                    if (command === "sync") {
                        dboTable._syncInfo = { ...dboTable[command] };
                        if (syncedTable) {
                            dboTable.getSync = async (filter, params = {}) => {
                                await (onDebug === null || onDebug === void 0 ? void 0 : onDebug({ type: "table", command: "getSync", tableName, data: { filter, params } }));
                                return syncedTable.create({
                                    name: tableName,
                                    onDebug: onDebug,
                                    filter,
                                    db: dbo,
                                    ...params
                                });
                            };
                            const upsertSyncTable = async (basicFilter = {}, options = {}, onError) => {
                                const syncName = `${tableName}.${JSON.stringify(basicFilter)}.${JSON.stringify((0, prostgles_types_1.omitKeys)(options, ["handlesOnData"]))}`;
                                if (!syncHandler.syncedTables[syncName]) {
                                    syncHandler.syncedTables[syncName] = await syncedTable.create({
                                        ...options,
                                        onDebug: onDebug,
                                        name: tableName,
                                        filter: basicFilter,
                                        db: dbo,
                                        onError
                                    });
                                }
                                return syncHandler.syncedTables[syncName];
                            };
                            const sync = async (basicFilter, options = { handlesOnData: true, select: "*" }, onChange, onError) => {
                                await (onDebug === null || onDebug === void 0 ? void 0 : onDebug({ type: "table", command: "sync", tableName, data: { basicFilter, options } }));
                                checkSubscriptionArgs(basicFilter, options, onChange, onError);
                                const s = await upsertSyncTable(basicFilter, options, onError);
                                return await s.sync(onChange, options.handlesOnData);
                            };
                            const syncOne = async (basicFilter, options = { handlesOnData: true }, onChange, onError) => {
                                await (onDebug === null || onDebug === void 0 ? void 0 : onDebug({ type: "table", command: "syncOne", tableName, data: { basicFilter, options } }));
                                checkSubscriptionArgs(basicFilter, options, onChange, onError);
                                const s = await upsertSyncTable(basicFilter, options, onError);
                                return await s.syncOne(basicFilter, onChange, options.handlesOnData);
                            };
                            dboTable.sync = sync;
                            dboTable.syncOne = syncOne;
                            // eslint-disable-next-line react-hooks/rules-of-hooks
                            dboTable.useSync = (basicFilter, options) => (0, react_hooks_1.useSync)(sync, basicFilter, options);
                            // eslint-disable-next-line react-hooks/rules-of-hooks
                            dboTable.useSyncOne = (basicFilter, options) => (0, react_hooks_1.useSync)(syncOne, basicFilter, options);
                        }
                        dboTable._sync = async function (param1, param2, syncHandles) {
                            await (onDebug === null || onDebug === void 0 ? void 0 : onDebug({ type: "table", command: "_sync", tableName, data: { param1, param2, syncHandles } }));
                            return syncHandler.addSync({ tableName, command, param1, param2 }, syncHandles);
                        };
                    }
                    else if (sub_commands.includes(command)) {
                        const subFunc = async function (param1 = {}, param2 = {}, onChange, onError) {
                            await (onDebug === null || onDebug === void 0 ? void 0 : onDebug({ type: "table", command: command, tableName, data: { param1, param2, onChange, onError } }));
                            checkSubscriptionArgs(param1, param2, onChange, onError);
                            return subscriptionHandler.addSub(dbo, { tableName, command, param1, param2 }, onChange, onError);
                        };
                        dboTable[command] = subFunc;
                        const SUBONE = "subscribeOne";
                        /**
                         * React hooks
                         */
                        const handlerName = command === "subscribe" ? "useSubscribe" : command === "subscribeOne" ? "useSubscribeOne" : undefined;
                        if (handlerName) {
                            // eslint-disable-next-line react-hooks/rules-of-hooks
                            dboTable[handlerName] = (filter, options) => (0, react_hooks_1.useSubscribe)(subFunc, command === SUBONE, filter, options);
                        }
                        if (command === SUBONE || !sub_commands.includes(SUBONE)) {
                            dboTable[SUBONE] = async function (param1, param2, onChange, onError) {
                                await (onDebug === null || onDebug === void 0 ? void 0 : onDebug({ type: "table", command: "getSync", tableName, data: { param1, param2, onChange, onError } }));
                                checkSubscriptionArgs(param1, param2, onChange, onError);
                                const onChangeOne = (rows) => { onChange(rows[0]); };
                                return subscriptionHandler.addSub(dbo, { tableName, command, param1, param2 }, onChangeOne, onError);
                            };
                        }
                    }
                    else {
                        const method = async function (param1, param2, param3) {
                            await (onDebug === null || onDebug === void 0 ? void 0 : onDebug({ type: "table", command: command, tableName, data: { param1, param2, param3 } }));
                            return new Promise((resolve, reject) => {
                                socket.emit(preffix, { tableName, command, param1, param2, param3 }, 
                                /* Get col definition and re-cast data types?! */
                                (err, res) => {
                                    if (err)
                                        reject(err);
                                    else
                                        resolve(res);
                                });
                            });
                        };
                        dboTable[command] = method;
                        const methodName = command === "findOne" ? "useFindOne" : command === "find" ? "useFind" : command === "count" ? "useCount" : command === "size" ? "useSize" : undefined;
                        if (methodName) {
                            // eslint-disable-next-line react-hooks/rules-of-hooks
                            dboTable[methodName] = (param1, param2, param3) => (0, react_hooks_1.useFetch)(method, [param1, param2, param3]);
                        }
                        if (["find", "findOne"].includes(command)) {
                            dboTable.getJoinedTables = function () {
                                return joinTables
                                    .filter(tb => Array.isArray(tb) && tb.includes(tableName))
                                    .flat()
                                    .filter(t => t !== tableName);
                            };
                        }
                    }
                });
            });
            await subscriptionHandler.reAttachAll();
            await syncHandler.reAttachAll();
            joinTables.flat().map(table => {
                var _a, _b, _c, _d;
                (_a = dbo.innerJoin) !== null && _a !== void 0 ? _a : (dbo.innerJoin = {});
                (_b = dbo.leftJoin) !== null && _b !== void 0 ? _b : (dbo.leftJoin = {});
                (_c = dbo.innerJoinOne) !== null && _c !== void 0 ? _c : (dbo.innerJoinOne = {});
                (_d = dbo.leftJoinOne) !== null && _d !== void 0 ? _d : (dbo.leftJoinOne = {});
                const joinHandlers = (0, prostgles_types_1.getJoinHandlers)(table);
                //@ts-ignore
                dbo.leftJoin[table] = joinHandlers.leftJoin;
                dbo.innerJoin[table] = joinHandlers.innerJoin;
                dbo.leftJoinOne[table] = joinHandlers.leftJoinOne;
                dbo.innerJoinOne[table] = joinHandlers.innerJoinOne;
            });
            (async () => {
                try {
                    await onReady(dbo, methodsObj, tableSchema, auth, isReconnect);
                }
                catch (err) {
                    console.error("Prostgles: Error within onReady: \n", err);
                    reject(err);
                }
                resolve(dbo);
            })();
        });
    });
}
exports.prostgles = prostgles;
