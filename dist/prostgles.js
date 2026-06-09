"use strict";
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
exports.asName = exports.debug = exports.isClientSide = void 0;
exports.prostgles = prostgles;
const prostgles_types_1 = require("prostgles-types");
Object.defineProperty(exports, "asName", { enumerable: true, get: function () { return prostgles_types_1.asName; } });
const getAuthHandler_1 = require("./getAuthHandler");
const getDbHandler_1 = require("./getDbHandler");
const getMethods_1 = require("./getMethods");
const getSqlHandler_1 = require("./getSqlHandler");
const getSubscriptionHandler_1 = require("./getSubscriptionHandler");
const getSyncHandlerV2_1 = require("./getSyncHandlerV2");
const DEBUG_KEY = "DEBUG_SYNCEDTABLE";
exports.isClientSide = typeof window !== "undefined";
const debug = function (...args) {
    if (exports.isClientSide && window[DEBUG_KEY]) {
        window[DEBUG_KEY](...args);
    }
};
exports.debug = debug;
__exportStar(require("./hooks/useEffectDeep"), exports);
__exportStar(require("./hooks/useProstglesClient"), exports);
function prostgles(initOpts) {
    const { endpoint, socket, onReady, onDisconnect, onReconnect, onSchemaChange, onReload, onDebug, credentials, redirect, } = initOpts;
    let schemaAge;
    (0, exports.debug)("prostgles", { initOpts });
    if (onSchemaChange) {
        socket.removeAllListeners(prostgles_types_1.CHANNELS.SCHEMA_CHANGED);
        socket.on(prostgles_types_1.CHANNELS.SCHEMA_CHANGED, onSchemaChange);
    }
    const subscriptionHandler = (0, getSubscriptionHandler_1.getSubscriptionHandler)(initOpts);
    const syncHandlerV2 = (0, getSyncHandlerV2_1.getSyncHandlerV2)(initOpts);
    let state;
    return new Promise((resolve, reject) => {
        socket.removeAllListeners("connect_error");
        socket.on("connect_error", (err) => {
            reject(err);
        });
        socket.removeAllListeners(prostgles_types_1.CHANNELS.CONNECTION);
        socket.on(prostgles_types_1.CHANNELS.CONNECTION, (error) => {
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
            await onDebug?.({ type: "schemaChanged", data: args, state });
            const { joinTables = [], ...clientSchema } = args;
            const { methods, tableSchema, auth: authConfig, rawSQL, err } = clientSchema;
            /** Only destroy existing syncs if schema changed */
            const schemaDidNotChange = schemaAge?.clientSchema && (0, prostgles_types_1.isEqual)(schemaAge.clientSchema, clientSchema);
            if (!schemaDidNotChange) {
                console.warn("syncHandler.destroySyncs()");
                // syncHandler
                //   .destroySyncs()
                //   .catch((error) => console.error("Error while destroying syncs", error));
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
            const auth = (0, getAuthHandler_1.getAuthHandler)({
                authData: authConfig,
                socket,
                onReload,
                endpoint,
                credentials,
                redirect,
            });
            const { methodHandlers, methodSchema } = (0, getMethods_1.getMethods)({ onDebug, methods, socket });
            const { db } = (0, getDbHandler_1.getDB)({
                onDebug,
                syncHandlerV2,
                subscriptionHandler,
                socket,
                tableSchema,
            });
            const sql = rawSQL ? (0, getSqlHandler_1.getSqlHandler)(initOpts).sql : undefined;
            subscriptionHandler.reAttachAll();
            console.warn("syncHandler.reAttachAll()");
            // syncHandler.reAttachAll();
            (async () => {
                try {
                    const onReadyArgs = {
                        db,
                        sql,
                        methods: methodHandlers,
                        methodSchema,
                        tableSchema,
                        auth,
                        socket,
                        isReconnect,
                    };
                    await onDebug?.({
                        type: "onReady.call",
                        data: onReadyArgs,
                        state,
                    });
                    await onReady(onReadyArgs);
                }
                catch (err) {
                    console.error("Prostgles: Error within onReady: \n", err);
                    reject(err);
                }
                resolve(db);
            })();
        });
    });
}
