"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRequest = exports.setupAuth = void 0;
const prostgles_types_1 = require("prostgles-types");
const prostgles_1 = require("./prostgles");
const setupAuth = ({ authData: authConfig, socket, onReload }) => {
    if ((authConfig === null || authConfig === void 0 ? void 0 : authConfig.pathGuard) && prostgles_1.hasWnd) {
        const doReload = (res) => {
            if (res === null || res === void 0 ? void 0 : res.shouldReload) {
                if (onReload)
                    onReload();
                else if (prostgles_1.hasWnd) {
                    console.log("prostgles page reload due to authguard", res);
                    setTimeout(() => {
                        window.location.reload();
                    }, 200);
                }
            }
        };
        socket.emit(prostgles_types_1.CHANNELS.AUTHGUARD, JSON.stringify(window.location), (_err, res) => {
            doReload(res);
        });
        socket.removeAllListeners(prostgles_types_1.CHANNELS.AUTHGUARD);
        socket.on(prostgles_types_1.CHANNELS.AUTHGUARD, (res) => {
            doReload(res);
        });
    }
    const loginSignupOptions = {
        loginType: authConfig === null || authConfig === void 0 ? void 0 : authConfig.loginType,
        login: undefined,
        prefferedLogin: undefined,
        loginWithProvider: undefined,
        signupWithEmailAndPassword: undefined,
        providers: authConfig === null || authConfig === void 0 ? void 0 : authConfig.providers,
    };
    if (authConfig) {
        const { providers, signupWithEmailAndPassword, loginType } = authConfig;
        loginSignupOptions.loginWithProvider =
            (0, prostgles_types_1.isEmpty)(providers) ? undefined : (providers &&
                Object.entries(providers).reduce((acc, [provider, { url }]) => {
                    acc[provider] = () => {
                        window.location.assign(url);
                    };
                    return acc;
                }, {}));
        const addSearchInCaseItHasReturnUrl = (url) => {
            const { search } = window.location;
            return url + search;
        };
        loginSignupOptions.login =
            loginType &&
                (async (params) => {
                    return (0, exports.authRequest)(addSearchInCaseItHasReturnUrl("/login"), params);
                });
        loginSignupOptions.signupWithEmailAndPassword =
            signupWithEmailAndPassword &&
                ((params) => {
                    return (0, exports.authRequest)(addSearchInCaseItHasReturnUrl(signupWithEmailAndPassword.url), params);
                });
    }
    if (!(authConfig === null || authConfig === void 0 ? void 0 : authConfig.user)) {
        return {
            isLoggedin: false,
            user: undefined,
            ...loginSignupOptions,
        };
    }
    return {
        isLoggedin: true,
        user: authConfig.user,
        logout: () => {
            window.location.assign("/logout");
        },
        ...loginSignupOptions,
    };
};
exports.setupAuth = setupAuth;
const authRequest = async (path, data, method) => {
    const rawResponse = await fetch(path, {
        method: method !== null && method !== void 0 ? method : "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        ...(method !== "GET" && { body: JSON.stringify(data) }),
    });
    if (!rawResponse.ok) {
        const error = await rawResponse
            .json()
            .catch(() => rawResponse.text())
            .catch(() => rawResponse.statusText);
        if (typeof error === "string") {
            return { success: false, code: "something-went-wrong", message: error };
        }
        return error;
    }
    const responseObject = await rawResponse
        .json()
        .catch(async () => ({ message: await rawResponse.text() }))
        .catch(() => ({ message: rawResponse.statusText }));
    if (rawResponse.redirected) {
        return { ...responseObject, success: true, redirect_url: rawResponse.url };
    }
    return responseObject;
};
exports.authRequest = authRequest;
