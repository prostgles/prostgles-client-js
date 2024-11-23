"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAuth = void 0;
const prostgles_types_1 = require("prostgles-types");
const prostgles_1 = require("./prostgles");
const setupAuth = ({ authData: authConfig, socket, onReload }) => {
    const emit = (channel, params) => {
        return new Promise((resolve, reject) => {
            socket.emit(channel, params, (err, res) => {
                if (err)
                    reject(err);
                else
                    resolve(res);
            });
        });
    };
    if (!(authConfig === null || authConfig === void 0 ? void 0 : authConfig.user)) {
        return {
            isLoggedin: false,
            user: undefined,
            prefferedLogin: "",
            login: {
                withEmailAndPassword: (params) => emit(prostgles_types_1.CHANNELS.LOGIN, { type: "withPassword", params }),
                withMagicLink: (params) => emit(prostgles_types_1.CHANNELS.LOGIN, { type: "magicLink", params }),
                withProvider: (provider) => {
                    var _a, _b;
                    const url = (_b = (_a = authConfig === null || authConfig === void 0 ? void 0 : authConfig.providers) === null || _a === void 0 ? void 0 : _a[provider]) === null || _b === void 0 ? void 0 : _b.url;
                    if (!url)
                        throw new Error(`Provider ${provider} not enabled`);
                    window.location.assign(url);
                }
            },
            register: (authConfig === null || authConfig === void 0 ? void 0 : authConfig.register) ? {
                [authConfig.register]: (params) => emit(prostgles_types_1.CHANNELS.REGISTER, { type: authConfig.register, params })
            } : undefined
        };
    }
    if (authConfig.pathGuard && prostgles_1.hasWnd) {
        const doReload = (res) => {
            if (res === null || res === void 0 ? void 0 : res.shouldReload) {
                if (onReload)
                    onReload();
                else if (prostgles_1.hasWnd) {
                    window.location.reload();
                }
            }
        };
        socket.emit(prostgles_types_1.CHANNELS.AUTHGUARD, JSON.stringify(window.location), (err, res) => {
            doReload(res);
        });
        socket.removeAllListeners(prostgles_types_1.CHANNELS.AUTHGUARD);
        socket.on(prostgles_types_1.CHANNELS.AUTHGUARD, (res) => {
            doReload(res);
        });
    }
    return {
        isLoggedin: true,
        user: authConfig.user,
        logout: () => emit(prostgles_types_1.CHANNELS.LOGOUT, {}),
        prefferedLogin: "",
    };
};
exports.setupAuth = setupAuth;
