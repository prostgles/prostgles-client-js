"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Stefan L. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.useProstglesClient = void 0;
const prostgles_types_1 = require("prostgles-types");
const SyncedTable_1 = require("./SyncedTable/SyncedTable");
const prostgles_1 = require("./prostgles");
const react_hooks_1 = require("./react-hooks");
const useProstglesClient = ({ skip, socketOptions: socketPathOrOptions, ...initOpts } = {}) => {
    const { useRef, useState } = (0, react_hooks_1.getReact)(true);
    const [onReadyArgs, setOnReadyArgs] = useState({
        isLoading: true,
    });
    const getIsMounted = (0, react_hooks_1.useIsMounted)();
    const socketRef = useRef();
    const socketOptions = typeof socketPathOrOptions === "string" ? { path: socketPathOrOptions } : socketPathOrOptions;
    (0, react_hooks_1.useAsyncEffectQueue)(async () => {
        var _a;
        if (skip)
            return undefined;
        (_a = socketRef.current) === null || _a === void 0 ? void 0 : _a.disconnect();
        const io = (0, react_hooks_1.getIO)();
        const opts = {
            reconnectionDelay: 1000,
            reconnection: true,
            ...(0, prostgles_types_1.omitKeys)(socketOptions !== null && socketOptions !== void 0 ? socketOptions : {}, ["uri"]),
        };
        const socket = typeof (socketOptions === null || socketOptions === void 0 ? void 0 : socketOptions.uri) === "string" ? io(socketOptions.uri, opts) : io(opts);
        socketRef.current = socket;
        await (0, prostgles_1.prostgles)({
            socket,
            ...initOpts,
            onReady: (...args) => {
                var _a, _b;
                const [dbo, methods, tableSchema, auth, isReconnect] = args;
                const onReadyArgs = {
                    dbo,
                    methods,
                    tableSchema,
                    auth,
                    isReconnect,
                    socket,
                };
                if (!getIsMounted()) {
                    (_a = initOpts.onDebug) === null || _a === void 0 ? void 0 : _a.call(initOpts, { type: "onReady.notMounted", data: onReadyArgs });
                    return;
                }
                (_b = initOpts.onDebug) === null || _b === void 0 ? void 0 : _b.call(initOpts, { type: "onReady", data: onReadyArgs });
                setOnReadyArgs({ ...onReadyArgs, isLoading: false });
            },
        }, SyncedTable_1.SyncedTable).catch((err) => {
            if (!getIsMounted())
                return;
            const error = err instanceof Error ? err : new Error(err);
            setOnReadyArgs({ isLoading: false, error });
        });
        return () => {
            socket.disconnect();
        };
    }, [initOpts, socketOptions, skip]);
    return onReadyArgs;
};
exports.useProstglesClient = useProstglesClient;
