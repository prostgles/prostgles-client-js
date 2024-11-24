"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = exports.setupAuth = void 0;
const prostgles_types_1 = require("prostgles-types");
const prostgles_1 = require("./prostgles");
const setupAuth = ({ authData: authConfig, socket, onReload }) => {
    if ((authConfig === null || authConfig === void 0 ? void 0 : authConfig.pathGuard) && prostgles_1.hasWnd) {
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
    if (!(authConfig === null || authConfig === void 0 ? void 0 : authConfig.user)) {
        const { providers, register, loginType } = authConfig !== null && authConfig !== void 0 ? authConfig : {};
        const withProvider = (0, prostgles_types_1.isEmpty)(providers) ? undefined : providers && Object.entries(providers).reduce((acc, [provider, { url }]) => {
            acc[provider] = () => {
                window.location.assign(url);
            };
            return acc;
        }, {});
        return {
            isLoggedin: false,
            user: undefined,
            prefferedLogin: "",
            login: {
                withProvider,
                ...(loginType && {
                    [loginType]: async (params) => {
                        return (0, exports.POST)("/login", params);
                    },
                }),
            },
            register: (register === null || register === void 0 ? void 0 : register.type) ? {
                [register.type]: (params) => {
                    (0, exports.POST)(register.url, params);
                }
            } : undefined
        };
    }
    return {
        isLoggedin: true,
        user: authConfig.user,
        logout: () => {
        },
        prefferedLogin: "",
    };
};
exports.setupAuth = setupAuth;
const POST = async (path, data) => {
    const rawResponse = await fetch(path, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
    if (!rawResponse.ok) {
        const error = await rawResponse.json().catch(() => rawResponse.text()).catch(() => rawResponse.statusText);
        throw new Error(error);
    }
    return rawResponse;
};
exports.POST = POST;
