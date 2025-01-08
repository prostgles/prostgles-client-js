import { type SubscriptionHandler, getKeys, isEqual, isObject } from "prostgles-types";
import type { HookOptions, TableHandlerClient } from "./prostgles";
type ReactT = typeof import("react");
let React: ReactT;

const alertNoReact = (...args: any[]): any => {
  throw "Must install react";
};
const alertNoReactT = <T>(...args: any[]): any => {
  throw "Must install react";
};
export const getReact = (throwError?: boolean): ReactT => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    React ??= require("react");
  } catch (err) {}
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (throwError && !React) throw new Error("Must install react");
  return React as any;
};
getReact();
const {
  useEffect = alertNoReact as (typeof React)["useEffect"],
  useCallback = alertNoReact as (typeof React)["useCallback"],
  useRef,
  useState = alertNoReactT as (typeof React)["useState"],
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
} = React! ?? {};

type IO = typeof import("socket.io-client").default;
export const getIO = (throwError = false) => {
  try {
    const io = require("socket.io-client") as IO;
    return io;
  } catch (err) {}
  if (throwError) throw new Error("Must install socket.io-client");
  return {} as IO;
};

export const useDeepCompareMemoize = (value: any) => {
  const ref = useRef();

  if (!isEqual(value, ref.current)) {
    ref.current = value;
  }

  return ref.current;
};

export const useMemoDeep = ((callback, deps) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useMemo(callback, deps?.map(useDeepCompareMemoize));
}) as ReactT["useMemo"];

export const useEffectDeep = ((callback, deps) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(callback, deps?.map(useDeepCompareMemoize));
}) as ReactT["useEffect"];

type AsyncCleanup = void | (() => void | Promise<void>);
type AsyncActiveEffect = {
  effect: () => Promise<AsyncCleanup>;
  deps: any[];
  didCleanup: boolean;
  resolvedCleanup?: Promise<{
    run: AsyncCleanup;
  }>;
};
type AsyncEffectQueue = {
  newEffect: undefined | AsyncActiveEffect;
  activeEffect: undefined | (AsyncActiveEffect & { finishedCleanup?: boolean });
  history: Pick<AsyncActiveEffect, "effect" | "deps">[];
};

type EffectFunc = () => Promise<void | (() => void)>;

/**
 * Debounce with execute first
 * Used to ensure subscriptions are always cleaned up
 */
export const useAsyncEffectQueue = (effect: EffectFunc, deps: any[]) => {
  // const newEffect = { effect, deps, didCleanup: false }
  const queue = useRef<AsyncEffectQueue>({
    activeEffect: undefined,
    newEffect: undefined,
    history: [],
  });

  const onCleanup = async (effectFunc: EffectFunc) => {
    /** New effect did not start. Just remove */
    if (queue.current.newEffect?.effect === effectFunc) {
      queue.current.newEffect = undefined;

      /** Very likely it's an unmount */
    } else if (queue.current.activeEffect?.effect === effectFunc) {
      queue.current.activeEffect.didCleanup = true;
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      await (await queue.current.activeEffect.resolvedCleanup)?.run?.()?.catch(console.error);
    }
  };

  const onRender = async (newEffect: AsyncActiveEffect) => {
    queue.current.newEffect = newEffect;
    queue.current.history.push(newEffect);

    /** Need to wait to ensure activeEffect cleanup finished */
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    await (await queue.current.activeEffect?.resolvedCleanup)?.run?.()?.catch(console.error);

    queue.current.activeEffect = newEffect;
    queue.current.activeEffect.resolvedCleanup = queue.current.activeEffect
      .effect()
      .then((run) => ({ run }));
  };

  useEffectDeep(() => {
    const newEffect = { effect, deps, didCleanup: false };
    onRender(newEffect);
    return () => {
      onCleanup(effect);
    };
  }, deps);
};
export const useEffectAsync = (effect: () => Promise<void | (() => void)>, inputs: any[]) => {
  const onCleanup = useRef({
    cleanup: undefined as undefined | (() => void),
    effect,
    cleanupEffect: undefined as undefined | typeof effect,
  });
  onCleanup.current.effect = effect;
  useEffectDeep(() => {
    effect().then((result) => {
      if (typeof result === "function") {
        onCleanup.current.cleanup = result;
        if (onCleanup.current.cleanupEffect === effect) {
          result();
        }
      }
    });
    return () => {
      onCleanup.current.cleanupEffect = effect;
      onCleanup.current.cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, inputs);
};

export const useIsMounted = () => {
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

type PromiseFunc = () => Promise<any>;
type NamedResult = Record<string, PromiseFunc>;

export const usePromise = <F extends PromiseFunc | NamedResult>(
  f: F,
  deps: any[] = [],
): F extends NamedResult ? { [key in keyof F]: Awaited<ReturnType<F[key]>> }
: F extends PromiseFunc ? undefined | Awaited<ReturnType<F>>
: undefined => {
  const isPromiseFunc = (val: any): val is PromiseFunc => {
    try {
      return typeof val === "function" || val instanceof Promise;
    } catch (e) {
      console.error(e);
    }
    return false;
  };
  const isNamedObj = (val: any): val is NamedResult => {
    try {
      return isObject(val) && !isPromiseFunc(val);
    } catch (e) {
      console.error(e);
    }
    return false;
  };
  const getNamedObjResults = async <Val extends NamedResult>(
    val: Val,
  ): Promise<Record<keyof Val, any>> => {
    const data = {} as Record<keyof Val, any>;
    const keys = getKeys(val);
    for await (const key of keys) {
      const prop = val[key] as string | ((...args: any[]) => any) | Promise<any>;
      try {
        data[key] = typeof prop === "function" ? await prop() : await prop;
      } catch (e) {
        console.error(e);
      }
    }
    return data;
  };
  const [result, setResult] = useState(isNamedObj(f) ? {} : undefined);
  const getIsMounted = useIsMounted();
  useAsyncEffectQueue(async () => {
    let promiseResult;

    try {
      if (isNamedObj(f)) {
        promiseResult = await getNamedObjResults(f);
      } else {
        const funcRes = await f();
        const isNObj = isNamedObj(funcRes);
        promiseResult =
          isNObj ? await getNamedObjResults(funcRes)
          : isPromiseFunc(funcRes) ? await funcRes()
          : funcRes;
      }
    } catch (e) {
      console.error(e);
    }
    if (!getIsMounted()) return;
    setResult(promiseResult);
  }, deps);

  return result as any;
};

type HookResult =
  | { data: any; error?: undefined; isLoading: false }
  | { data?: undefined; error: any; isLoading: false }
  | { data?: undefined; error?: undefined; isLoading: true };

export const useSubscribe = (
  subFunc: (filter: any, options: any, onData: any, onError: any) => Promise<SubscriptionHandler>,
  expectsOne: boolean,
  filter: any,
  options: any,
  hookOptions?: HookOptions,
) => {
  const { skip } = hookOptions ?? {};
  const defaultLoadingResult = { data: undefined, error: undefined, isLoading: true };
  const [{ data, error, isLoading }, setResult] = useState<HookResult>(defaultLoadingResult);
  const getIsMounted = useIsMounted();
  useAsyncEffectQueue(async () => {
    if (!getIsMounted() || skip) return;
    setResult(defaultLoadingResult);
    const setError = (newError) => {
      if (!getIsMounted()) return;
      setResult({ data: undefined, error: newError, isLoading: false });
    };
    try {
      const sub = await subFunc(
        filter,
        options,
        (newData) => {
          if (!getIsMounted()) return;
          setResult({
            data: expectsOne ? newData[0] : newData,
            error: undefined,
            isLoading: false,
          });
        },
        setError,
      );
      return sub.unsubscribe;
    } catch (error) {
      setError(error);
    }
  }, [subFunc, filter, options, skip]);

  return { data, error, isLoading };
};

export const useSync = (
  syncFunc: Required<TableHandlerClient>["sync"] | Required<TableHandlerClient>["syncOne"],
  basicFilter: Parameters<Required<TableHandlerClient>["sync"]>[0],
  syncOptions: Parameters<Required<TableHandlerClient>["sync"]>[1],
  hookOptions?: HookOptions,
) => {
  const { skip } = hookOptions ?? {};
  const defaultLoadingResult = { data: undefined, error: undefined, isLoading: true };
  const [{ data, error, isLoading }, setResult] = useState<HookResult>(defaultLoadingResult);
  const getIsMounted = useIsMounted();
  useAsyncEffectQueue(async () => {
    if (!getIsMounted() || skip) return;
    const setError = (newError) => {
      if (!getIsMounted()) return;
      setResult({ data: undefined, error: newError, isLoading: false });
    };
    try {
      const syncHandlers = await syncFunc(
        basicFilter,
        syncOptions,
        (newData) => {
          if (!getIsMounted()) return;
          setResult({ data: newData, error: undefined, isLoading: false });
        },
        setError,
      );
      return syncHandlers.$unsync;
    } catch (error) {
      setError(error);
    }
  }, [syncFunc, basicFilter, syncOptions, skip]);
  return { data, error, isLoading };
};

export const useFetch = (
  fetchFunc: (...args: any) => Promise<any>,
  args: any[] = [],
  hookOptions?: HookOptions,
) => {
  const { skip } = hookOptions ?? {};
  const defaultLoadingResult = { data: undefined, error: undefined, isLoading: true };
  const [{ data, error, isLoading }, setResult] = useState<HookResult>(defaultLoadingResult);
  const getIsMounted = useIsMounted();
  useAsyncEffectQueue(async () => {
    if (!getIsMounted() || skip) return;
    setResult(defaultLoadingResult);
    try {
      const newData = await fetchFunc(...args);
      if (!getIsMounted()) return;
      setResult({ data: newData, error: undefined, isLoading: false });
    } catch (error) {
      if (!getIsMounted()) return;
      setResult({ data: undefined, error, isLoading: false });
    }
  }, args);
  return { data, error, isLoading };
};

export const __prglReactInstalled = () => Boolean((React as any) && useRef);
