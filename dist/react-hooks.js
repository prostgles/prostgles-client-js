"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.__prglReactInstalled = exports.useFetch = exports.useSync = exports.useSubscribe = exports.usePromise = exports.useIsMounted = exports.useEffectAsync = exports.useAsyncEffectQueue = exports.useEffectDeep = exports.useMemoDeep = exports.useDeepCompareMemoize = exports.getIO = exports.getReact = void 0;
const prostgles_types_1 = require("prostgles-types");
let React;
const alertNoReact = (...args) => {
    throw "Must install react";
};
const alertNoReactT = (...args) => {
    throw "Must install react";
};
const getReact = (throwError) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        React !== null && React !== void 0 ? React : (React = require("react"));
    }
    catch (err) { }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (throwError && !React)
        throw new Error("Must install react");
    return React;
};
exports.getReact = getReact;
(0, exports.getReact)();
const { useEffect = alertNoReact, useCallback = alertNoReact, useRef, useState = alertNoReactT,
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
 } = (_a = React) !== null && _a !== void 0 ? _a : {};
const getIO = (throwError = false) => {
    try {
        const io = require("socket.io-client");
        return io;
    }
    catch (err) { }
    if (throwError)
        throw new Error("Must install socket.io-client");
    return {};
};
exports.getIO = getIO;
const useDeepCompareMemoize = (value) => {
    const ref = useRef();
    if (!(0, prostgles_types_1.isEqual)(value, ref.current)) {
        ref.current = value;
    }
    return ref.current;
};
exports.useDeepCompareMemoize = useDeepCompareMemoize;
exports.useMemoDeep = ((callback, deps) => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return React.useMemo(callback, deps === null || deps === void 0 ? void 0 : deps.map(exports.useDeepCompareMemoize));
});
exports.useEffectDeep = ((callback, deps) => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(callback, deps === null || deps === void 0 ? void 0 : deps.map(exports.useDeepCompareMemoize));
});
/**
 * Debounce with execute first
 * Used to ensure subscriptions are always cleaned up
 */
const useAsyncEffectQueue = (effect, deps) => {
    // const newEffect = { effect, deps, didCleanup: false }
    const queue = useRef({
        activeEffect: undefined,
        newEffect: undefined,
        history: [],
    });
    const onCleanup = async (effectFunc) => {
        var _a, _b, _c, _d, _e;
        /** New effect did not start. Just remove */
        if (((_a = queue.current.newEffect) === null || _a === void 0 ? void 0 : _a.effect) === effectFunc) {
            queue.current.newEffect = undefined;
            /** Very likely it's an unmount */
        }
        else if (((_b = queue.current.activeEffect) === null || _b === void 0 ? void 0 : _b.effect) === effectFunc) {
            queue.current.activeEffect.didCleanup = true;
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            await ((_e = (_d = (_c = (await queue.current.activeEffect.resolvedCleanup)) === null || _c === void 0 ? void 0 : _c.run) === null || _d === void 0 ? void 0 : _d.call(_c)) === null || _e === void 0 ? void 0 : _e.catch(console.error));
        }
    };
    const onRender = async (newEffect) => {
        var _a, _b, _c, _d;
        queue.current.newEffect = newEffect;
        queue.current.history.push(newEffect);
        /** Need to wait to ensure activeEffect cleanup finished */
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        await ((_d = (_c = (_b = (await ((_a = queue.current.activeEffect) === null || _a === void 0 ? void 0 : _a.resolvedCleanup))) === null || _b === void 0 ? void 0 : _b.run) === null || _c === void 0 ? void 0 : _c.call(_b)) === null || _d === void 0 ? void 0 : _d.catch(console.error));
        queue.current.activeEffect = newEffect;
        queue.current.activeEffect.resolvedCleanup = queue.current.activeEffect
            .effect()
            .then((run) => ({ run }));
    };
    (0, exports.useEffectDeep)(() => {
        const newEffect = { effect, deps, didCleanup: false };
        onRender(newEffect);
        return () => {
            onCleanup(effect);
        };
    }, deps);
};
exports.useAsyncEffectQueue = useAsyncEffectQueue;
const useEffectAsync = (effect, inputs) => {
    const onCleanup = useRef({
        cleanup: undefined,
        effect,
        cleanupEffect: undefined,
    });
    onCleanup.current.effect = effect;
    (0, exports.useEffectDeep)(() => {
        effect().then((result) => {
            if (typeof result === "function") {
                onCleanup.current.cleanup = result;
                if (onCleanup.current.cleanupEffect === effect) {
                    result();
                }
            }
        });
        return () => {
            var _a, _b;
            onCleanup.current.cleanupEffect = effect;
            (_b = (_a = onCleanup.current).cleanup) === null || _b === void 0 ? void 0 : _b.call(_a);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, inputs);
};
exports.useEffectAsync = useEffectAsync;
const useIsMounted = () => {
    const isMountedRef = useRef(true);
    const isMounted = useCallback(() => isMountedRef.current, []);
    useEffect(() => {
        /** React 18 Strict Mode fix (new strict mode restores the previous state on the second mount) */
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);
    return isMounted;
};
exports.useIsMounted = useIsMounted;
const usePromise = (f, deps = []) => {
    const isPromiseFunc = (val) => {
        try {
            return typeof val === "function" || val instanceof Promise;
        }
        catch (e) {
            console.error(e);
        }
        return false;
    };
    const isNamedObj = (val) => {
        try {
            return (0, prostgles_types_1.isObject)(val) && !isPromiseFunc(val);
        }
        catch (e) {
            console.error(e);
        }
        return false;
    };
    const getNamedObjResults = async (val) => {
        const data = {};
        const keys = (0, prostgles_types_1.getKeys)(val);
        for await (const key of keys) {
            const prop = val[key];
            try {
                data[key] = typeof prop === "function" ? await prop() : await prop;
            }
            catch (e) {
                console.error(e);
            }
        }
        return data;
    };
    const [result, setResult] = useState(isNamedObj(f) ? {} : undefined);
    const getIsMounted = (0, exports.useIsMounted)();
    (0, exports.useAsyncEffectQueue)(async () => {
        let promiseResult;
        try {
            if (isNamedObj(f)) {
                promiseResult = await getNamedObjResults(f);
            }
            else {
                const funcRes = await f();
                const isNObj = isNamedObj(funcRes);
                promiseResult =
                    isNObj ? await getNamedObjResults(funcRes)
                        : isPromiseFunc(funcRes) ? await funcRes()
                            : funcRes;
            }
        }
        catch (e) {
            console.error(e);
        }
        if (!getIsMounted())
            return;
        setResult(promiseResult);
    }, deps);
    return result;
};
exports.usePromise = usePromise;
const useSubscribe = (subFunc, expectsOne, filter, options, hookOptions) => {
    const { skip } = hookOptions !== null && hookOptions !== void 0 ? hookOptions : {};
    const defaultLoadingResult = { data: undefined, error: undefined, isLoading: true };
    const [{ data, error, isLoading }, setResult] = useState(defaultLoadingResult);
    const getIsMounted = (0, exports.useIsMounted)();
    (0, exports.useAsyncEffectQueue)(async () => {
        if (!getIsMounted() || skip)
            return;
        setResult(defaultLoadingResult);
        const setError = (newError) => {
            if (!getIsMounted())
                return;
            setResult({ data: undefined, error: newError, isLoading: false });
        };
        try {
            const sub = await subFunc(filter, options, (newData) => {
                if (!getIsMounted())
                    return;
                setResult({
                    data: expectsOne ? newData[0] : newData,
                    error: undefined,
                    isLoading: false,
                });
            }, setError);
            return sub.unsubscribe;
        }
        catch (error) {
            setError(error);
        }
    }, [subFunc, filter, options, skip]);
    return { data, error, isLoading };
};
exports.useSubscribe = useSubscribe;
const useSync = (syncFunc, basicFilter, syncOptions, hookOptions) => {
    const { skip } = hookOptions !== null && hookOptions !== void 0 ? hookOptions : {};
    const defaultLoadingResult = { data: undefined, error: undefined, isLoading: true };
    const [{ data, error, isLoading }, setResult] = useState(defaultLoadingResult);
    const getIsMounted = (0, exports.useIsMounted)();
    (0, exports.useAsyncEffectQueue)(async () => {
        if (!getIsMounted() || skip)
            return;
        const setError = (newError) => {
            if (!getIsMounted())
                return;
            setResult({ data: undefined, error: newError, isLoading: false });
        };
        try {
            const syncHandlers = await syncFunc(basicFilter, syncOptions, (newData) => {
                if (!getIsMounted())
                    return;
                setResult({ data: newData, error: undefined, isLoading: false });
            }, setError);
            return syncHandlers.$unsync;
        }
        catch (error) {
            setError(error);
        }
    }, [syncFunc, basicFilter, syncOptions, skip]);
    return { data, error, isLoading };
};
exports.useSync = useSync;
const useFetch = (fetchFunc, args = [], hookOptions) => {
    const { skip } = hookOptions !== null && hookOptions !== void 0 ? hookOptions : {};
    const defaultLoadingResult = { data: undefined, error: undefined, isLoading: true };
    const [{ data, error, isLoading }, setResult] = useState(defaultLoadingResult);
    const getIsMounted = (0, exports.useIsMounted)();
    (0, exports.useAsyncEffectQueue)(async () => {
        if (!getIsMounted() || skip)
            return;
        setResult(defaultLoadingResult);
        try {
            const newData = await fetchFunc(...args);
            if (!getIsMounted())
                return;
            setResult({ data: newData, error: undefined, isLoading: false });
        }
        catch (error) {
            if (!getIsMounted())
                return;
            setResult({ data: undefined, error, isLoading: false });
        }
    }, args);
    return { data, error, isLoading };
};
exports.useFetch = useFetch;
const __prglReactInstalled = () => Boolean(React && useRef);
exports.__prglReactInstalled = __prglReactInstalled;
