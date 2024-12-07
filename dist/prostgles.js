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
const getDbHandler_1 = require("./getDbHandler");
const getMethods_1 = require("./getMethods");
const getSqlHandler_1 = require("./getSqlHandler");
const react_hooks_1 = require("./react-hooks");
const getSubscriptionHandler_1 = require("./getSubscriptionHandler");
const getSyncHandler_1 = require("./getSyncHandler");
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
    const subscriptionHandler = (0, getSubscriptionHandler_1.getSubscriptionHandler)(initOpts);
    const syncHandler = (0, getSyncHandler_1.getSyncHandler)(initOpts);
    const sqlHandler = (0, getSqlHandler_1.getSqlHandler)(initOpts);
    let state;
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
            await (onDebug === null || onDebug === void 0 ? void 0 : onDebug({ type: "schemaChanged", data: args, state }));
            const { joinTables = [], ...clientSchema } = args;
            const { schema, methods, tableSchema, auth: authConfig, rawSQL, err } = clientSchema;
            /** Only destroy existing syncs if schema changed */
            const schemaDidNotChange = (schemaAge === null || schemaAge === void 0 ? void 0 : schemaAge.clientSchema) && (0, react_hooks_1.isEqual)(schemaAge.clientSchema, clientSchema);
            if (!schemaDidNotChange) {
                syncHandler.destroySyncs()
                    .catch(error => console.error("Error while destroying syncs", error));
            }
            if (err) {
                console.error("Error on schema change:", err);
            }
            if ((state === "connected" || state === "reconnected") && onReconnect) {
                onReconnect(socket, err);
                if (err) {
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
            const auth = (0, Auth_1.setupAuth)({ authData: authConfig, socket, onReload });
            const { methodsObj } = (0, getMethods_1.getMethods)({ onDebug, methods, socket });
            const { dbo } = (0, getDbHandler_1.getDBO)({
                schema,
                onDebug,
                syncedTable,
                syncHandler,
                subscriptionHandler,
                socket,
                joinTables,
            });
            if (rawSQL) {
                dbo.sql = sqlHandler.sql;
            }
            subscriptionHandler.reAttachAll();
            syncHandler.reAttachAll();
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
                    const onReadyArgs = { dbo, methods: methodsObj, tableSchema, auth, isReconnect };
                    await (onDebug === null || onDebug === void 0 ? void 0 : onDebug({ type: "onReady.call", data: onReadyArgs, state }));
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
