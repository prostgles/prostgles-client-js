"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.__prglReactInstalled = exports.useSubscribeOne = exports.useSubscribe = exports.usePromise = exports.useIsMounted = exports.useEffectAsync = void 0;
// TODO add react hooks
const React = require("react");
const prostgles_types_1 = require("prostgles-types");
const { useEffect, useCallback, useRef, useState } = React !== null && React !== void 0 ? React : {};
const useEffectAsync = (effect, inputs) => {
    const onCleanup = useRef({
        cleanup: undefined,
        effect,
        cleanupEffect: undefined,
    });
    onCleanup.current.effect = effect;
    useEffect(() => {
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
const usePromise = (f, dependencyArray = []) => {
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
    (0, exports.useEffectAsync)(async () => {
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
    }, dependencyArray);
    return result;
};
exports.usePromise = usePromise;
//@ts-ignore
const useSubscribe = (subHok) => {
    const [data, setData] = useState();
    const getIsMounted = useIsMounted();
    (0, exports.useEffectAsync)(async () => {
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
    (0, exports.useEffectAsync)(async () => {
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
