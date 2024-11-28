"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postAuthData = exports.setupAuth = void 0;
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
    const loginSignupOptions = {
        login: undefined,
        prefferedLogin: "",
        register: undefined,
        providers: authConfig === null || authConfig === void 0 ? void 0 : authConfig.providers,
    };
    if (authConfig) {
        const { providers, register, loginType } = authConfig;
        const withProvider = (0, prostgles_types_1.isEmpty)(providers) ? undefined : providers && Object.entries(providers).reduce((acc, [provider, { url }]) => {
            acc[provider] = () => {
                window.location.assign(url);
            };
            return acc;
        }, {});
        const addSearchInCaseItHasReturnUrl = (url) => {
            const { search } = window.location;
            return url + search;
        };
        loginSignupOptions.login = {
            withProvider,
            ...(loginType && {
                [loginType]: async (params) => {
                    return (0, exports.postAuthData)(addSearchInCaseItHasReturnUrl("/login"), params);
                },
            }),
        };
        loginSignupOptions.register = (register === null || register === void 0 ? void 0 : register.type) ? {
            [register.type]: (params) => {
                return (0, exports.postAuthData)(addSearchInCaseItHasReturnUrl(register.url), params);
            }
        } : undefined;
    }
    if (!(authConfig === null || authConfig === void 0 ? void 0 : authConfig.user)) {
        return {
            isLoggedin: false,
            user: undefined,
            ...loginSignupOptions
        };
    }
    return {
        isLoggedin: true,
        user: authConfig.user,
        logout: () => {
            window.location.assign("/logout");
        },
        ...loginSignupOptions
    };
};
exports.setupAuth = setupAuth;
const postAuthData = async (path, data) => {
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
        if (typeof error === "string") {
            return { success: false, error };
        }
        return error;
    }
    const responseObject = await rawResponse.json().catch(async () => ({ message: await rawResponse.text() })).catch(() => ({ message: rawResponse.statusText }));
    if (rawResponse.redirected) {
        return { ...responseObject, success: true, redirect_url: rawResponse.url };
    }
    return responseObject;
};
exports.postAuthData = postAuthData;
