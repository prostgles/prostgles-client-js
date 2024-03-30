"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.__prglReactInstalled = exports.useFetch = exports.useSync = exports.useSubscribe = exports.usePromise = exports.useIsMounted = exports.useEffectAsync = exports.useAsyncEffectQueue = exports.useEffectDeep = exports.useDeepCompareMemoize = exports.isEqual = exports.getReact = void 0;
const prostgles_types_1 = require("prostgles-types");
let React;
const alertNoReact = (...args) => { throw "Must install react"; };
const alertNoReactT = (...args) => { throw "Must install react"; };
const getReact = (throwError) => {
    try {
        React !== null && React !== void 0 ? React : (React = require("react"));
    }
    catch (err) {
    }
    if (throwError && !React)
        throw new Error("Must install react");
    return React;
};
exports.getReact = getReact;
(0, exports.getReact)();
const { useEffect = alertNoReact, useCallback = alertNoReact, useRef, useState = alertNoReactT } = (_a = React) !== null && _a !== void 0 ? _a : {};
const isEqual = function (x, y) {
    if (x === y) {
        return true;
    }
    else if ((typeof x == "object" && x != null) && (typeof y == "object" && y != null)) {
        if (Object.keys(x).length != Object.keys(y).length) {
            return false;
        }
        for (const prop in x) {
            if (y.hasOwnProperty(prop)) {
                if (!(0, exports.isEqual)(x[prop], y[prop])) {
                    return false;
                }
            }
            else
                return false;
        }
        return true;
    }
    else {
        return false;
    }
};
exports.isEqual = isEqual;
const useDeepCompareMemoize = (value) => {
    const ref = useRef();
    if (!(0, exports.isEqual)(value, ref.current)) {
        ref.current = value;
    }
    return ref.current;
};
exports.useDeepCompareMemoize = useDeepCompareMemoize;
const useEffectDeep = (callback, deps) => {
    useEffect(callback, deps.map(exports.useDeepCompareMemoize));
};
exports.useEffectDeep = useEffectDeep;
/**
 * Debounce with execute first
 * Used to ensure subscriptions are always cleaned up
 */
const useAsyncEffectQueue = (effect, deps) => {
    const latestEffect = { effect, deps, didCleanup: false };
    const queue = useRef({
        activeEffect: undefined,
        latestEffect
    });
    queue.current.latestEffect = latestEffect;
    const runAsyncEffect = async (queue) => {
        var _a, _b, _c;
        if (queue.current.latestEffect &&
            (!queue.current.activeEffect || queue.current.activeEffect.resolvedCleanup)) {
            await ((_c = (_b = (_a = queue.current.activeEffect) === null || _a === void 0 ? void 0 : _a.resolvedCleanup) === null || _b === void 0 ? void 0 : _b.run) === null || _c === void 0 ? void 0 : _c.call(_b));
            queue.current.activeEffect = queue.current.latestEffect;
            queue.current.latestEffect = undefined;
            /**
             * latestEffect might have since been cleaned up
             */
            if (!queue.current.activeEffect)
                return;
            const run = await queue.current.activeEffect.effect();
            if (!queue.current.activeEffect) {
                await (run === null || run === void 0 ? void 0 : run());
                return;
            }
            queue.current.activeEffect.resolvedCleanup = { run };
            if (queue.current.activeEffect.didCleanup) {
                cleanupActiveEffect();
            }
        }
    };
    const cleanupActiveEffect = async () => {
        var _a, _b, _c;
        await ((_c = (_b = (_a = queue.current.activeEffect) === null || _a === void 0 ? void 0 : _a.resolvedCleanup) === null || _b === void 0 ? void 0 : _b.run) === null || _c === void 0 ? void 0 : _c.call(_b));
        queue.current.activeEffect = undefined;
        runAsyncEffect(queue);
    };
    (0, exports.useEffectDeep)(() => {
        runAsyncEffect(queue);
        return () => {
            var _a, _b;
            if (((_a = queue.current.activeEffect) === null || _a === void 0 ? void 0 : _a.effect) === effect) {
                queue.current.activeEffect.didCleanup = true;
                cleanupActiveEffect();
            }
            if (((_b = queue.current.latestEffect) === null || _b === void 0 ? void 0 : _b.effect) === effect) {
                queue.current.latestEffect = undefined;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        effect().then(result => {
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
function useIsMounted() {
    const isMountedRef = useRef(true);
    const isMounted = useCallback(() => isMountedRef.current, []);
    useEffect(() => {
        return () => void (isMountedRef.current = false);
    }, []);
    return isMounted;
}
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
            data[key] = typeof prop === "function" ? await prop() : await prop;
        }
        return data;
    };
    const [result, setResult] = useState(isNamedObj(f) ? {} : undefined);
    const getIsMounted = useIsMounted();
    (0, exports.useAsyncEffectQueue)(async () => {
        let promiseResult;
        if (isNamedObj(f)) {
            promiseResult = await getNamedObjResults(f);
        }
        else {
            const funcRes = await f();
            const isNObj = isNamedObj(funcRes);
            promiseResult = isNObj ? await getNamedObjResults(funcRes) : isPromiseFunc(funcRes) ? await funcRes() : funcRes;
        }
        if (!getIsMounted())
            return;
        setResult(promiseResult);
    }, deps);
    return result;
};
exports.usePromise = usePromise;
const useSubscribe = (subFunc, expectsOne, filter, options) => {
    const defaultLoadingResult = { data: undefined, error: undefined, isLoading: true };
    const [{ data, error, isLoading }, setResult] = useState(defaultLoadingResult);
    const getIsMounted = useIsMounted();
    (0, exports.useAsyncEffectQueue)(async () => {
        if (!getIsMounted())
            return;
        setResult(defaultLoadingResult);
        const setError = (newError) => {
            if (!getIsMounted())
                return;
            setResult({ data: undefined, error: newError, isLoading: false });
        };
        try {
            const sub = await subFunc(filter, options, newData => {
                if (!getIsMounted())
                    return;
                setResult({ data: expectsOne ? newData[0] : newData, error: undefined, isLoading: false });
            }, setError);
            return sub.unsubscribe;
        }
        catch (error) {
            setError(error);
        }
    }, [subFunc, filter, options]);
    return { data, error, isLoading };
};
exports.useSubscribe = useSubscribe;
const useSync = (syncFunc, basicFilter, syncOptions) => {
    const defaultLoadingResult = { data: undefined, error: undefined, isLoading: true };
    const [{ data, error, isLoading }, setResult] = useState(defaultLoadingResult);
    const getIsMounted = useIsMounted();
    (0, exports.useAsyncEffectQueue)(async () => {
        if (!getIsMounted())
            return;
        setResult(defaultLoadingResult);
        const setError = newError => {
            if (!getIsMounted())
                return;
            setResult({ data: undefined, error: newError, isLoading: false });
        };
        try {
            const syncHandlers = await syncFunc(basicFilter, syncOptions, newData => {
                if (!getIsMounted())
                    return;
                setResult({ data: newData, error: undefined, isLoading: false });
            }, setError);
            return syncHandlers.$unsync;
        }
        catch (error) {
            setError(error);
        }
    }, [syncFunc, basicFilter, syncOptions]);
    return { data, error, isLoading };
};
exports.useSync = useSync;
const useFetch = (fetchFunc, args = []) => {
    const defaultLoadingResult = { data: undefined, error: undefined, isLoading: true };
    const [{ data, error, isLoading }, setResult] = useState(defaultLoadingResult);
    const getIsMounted = useIsMounted();
    (0, exports.useAsyncEffectQueue)(async () => {
        if (!getIsMounted())
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
