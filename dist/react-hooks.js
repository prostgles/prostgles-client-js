"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.__prglReactInstalled = exports.useSubscribeOne = exports.useSubscribe = exports.usePromise = exports.useIsMounted = exports.useEffectAsync = exports.useAsyncEffectQueue = exports.useEffectDeep = exports.useDeepCompareMemoize = exports.isEqual = void 0;
const prostgles_types_1 = require("prostgles-types");
let React;
try {
    React = require("react");
}
catch (err) {
}
const alertNoReact = (...args) => { throw "Must install react"; };
const alertNoReactT = (...args) => { throw "Must install react"; };
const { useEffect = alertNoReact, useCallback = alertNoReact, useRef = alertNoReactT, useState = alertNoReactT } = React !== null && React !== void 0 ? React : {};
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
const useAsyncEffectQueue = (effect, deps) => {
    const latestEffect = { effect, deps, didCleanup: false };
    const queue = useRef({
        activeEffect: undefined,
        latestEffect
    });
    queue.current.latestEffect = latestEffect;
    const runAsyncEffect = async (queue) => {
        if (queue.current.latestEffect && !queue.current.activeEffect) {
            queue.current.activeEffect = queue.current.latestEffect;
            queue.current.latestEffect = undefined;
            queue.current.activeEffect.resolvedCleanup = { run: await queue.current.activeEffect.effect() };
            if (queue.current.activeEffect.didCleanup) {
                cleanup();
            }
        }
    };
    const cleanup = async () => {
        var _a, _b, _c;
        if (!((_a = queue.current.activeEffect) === null || _a === void 0 ? void 0 : _a.resolvedCleanup))
            return;
        await ((_c = (_b = queue.current.activeEffect.resolvedCleanup).run) === null || _c === void 0 ? void 0 : _c.call(_b));
        queue.current.activeEffect = undefined;
        runAsyncEffect(queue);
    };
    (0, exports.useEffectDeep)(() => {
        runAsyncEffect(queue);
        return () => {
            var _a, _b;
            if (((_a = queue.current.activeEffect) === null || _a === void 0 ? void 0 : _a.effect) === effect) {
                queue.current.activeEffect.didCleanup = true;
                if (queue.current.activeEffect.resolvedCleanup) {
                    cleanup();
                }
            }
            if (((_b = queue.current.latestEffect) === null || _b === void 0 ? void 0 : _b.effect) === effect) {
                queue.current.latestEffect.didCleanup = true;
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
        let newD;
        if (isNamedObj(f)) {
            newD = await getNamedObjResults(f);
        }
        else {
            const funcRes = await f();
            const isNObj = isNamedObj(funcRes);
            newD = isNObj ? await getNamedObjResults(funcRes) : isPromiseFunc(funcRes) ? await funcRes() : funcRes;
        }
        if (!getIsMounted())
            return;
        setResult(newD);
    }, deps);
    return result;
};
exports.usePromise = usePromise;
//@ts-ignore
const useSubscribe = (subHok) => {
    const [data, setData] = useState();
    const getIsMounted = useIsMounted();
    (0, exports.useAsyncEffectQueue)(async () => {
        const sub = await subHok.start(newData => {
            if (!getIsMounted())
                return;
            setData(newData);
        });
        return sub.unsubscribe;
    }, subHok.args.map(v => JSON.stringify(v)));
    return data;
};
exports.useSubscribe = useSubscribe;
const useSubscribeOne = (subHook) => {
    const [data, setData] = useState();
    const getIsMounted = useIsMounted();
    (0, exports.useAsyncEffectQueue)(async () => {
        const sub = await subHook.start(newData => {
            if (!getIsMounted())
                return;
            setData(newData);
        });
        return sub.unsubscribe;
    }, []);
    return data;
};
exports.useSubscribeOne = useSubscribeOne;
const __prglReactInstalled = () => Boolean(React && useRef);
exports.__prglReactInstalled = __prglReactInstalled;
