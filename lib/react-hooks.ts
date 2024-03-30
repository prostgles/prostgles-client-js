import { AnyObject, SubscriptionHandler, getKeys, isObject } from "prostgles-types";
import { TableHandlerClient } from "./prostgles";
let React: typeof import("react") | undefined;


const alertNoReact = (...args: any[]): any => { throw "Must install react" }
const alertNoReactT = <T>(...args: any[]): any => { throw "Must install react" }
export const getReact = (throwError?: boolean): typeof import("react") => {
  try {
    React ??= require("react");
  } catch(err){
  
  }
  if(throwError && !React) throw new Error("Must install react");
  return React as any;
};
getReact();
const { useEffect = alertNoReact, useCallback = alertNoReact, useRef, useState = alertNoReactT } = React! ?? {};

export const isEqual = function (x, y) {
  if (x === y) {
    return true;
    
  } else if ((typeof x == "object" && x != null) && (typeof y == "object" && y != null)) {
    if (Object.keys(x).length != Object.keys(y).length){
      return false;
    }

    for (const prop in x) {
      if (y.hasOwnProperty(prop)){  
        if (! isEqual(x[prop], y[prop])){
          return false;
        }
      } else return false;
    }
    
    return true;
  } else {
    return false;
  }
}

export const useDeepCompareMemoize = (value: any) => {
  const ref = useRef();

  if (!isEqual(value, ref.current)) {
    ref.current = value
  }

  return ref.current
}

export const useEffectDeep = (callback, deps) => {
  useEffect(
    callback,
    deps.map(useDeepCompareMemoize)
  )
}

type AsyncCleanup = void | (() => void | Promise<void>)
type AsyncActiveEffect = {
  effect: () => Promise<AsyncCleanup>;
  deps: any[];
  didCleanup: boolean;
  resolvedCleanup?: {
    run: AsyncCleanup;
  };
};
type AsyncEffectQueue = {
  latestEffect: undefined | AsyncActiveEffect;
  activeEffect: undefined | AsyncActiveEffect;
}

/**
 * Debounce with execute first
 * Used to ensure subscriptions are always cleaned up 
 */
export const useAsyncEffectQueue = (effect: () => Promise<void | (() => void)>, deps: any[]) => {
  const latestEffect = { effect, deps, didCleanup: false }
  const queue = useRef<AsyncEffectQueue>({
    activeEffect: undefined,
    latestEffect
  });
  queue.current.latestEffect = latestEffect;

  const runAsyncEffect = async (queue: React.MutableRefObject<AsyncEffectQueue>) => {
    if(
      queue.current.latestEffect && 
      (!queue.current.activeEffect || queue.current.activeEffect.resolvedCleanup)
    ){
      await queue.current.activeEffect?.resolvedCleanup?.run?.();
      queue.current.activeEffect = queue.current.latestEffect as AsyncActiveEffect | undefined;
      queue.current.latestEffect = undefined;
      /**
       * latestEffect might have since been cleaned up
       */
      if(!queue.current.activeEffect) return;
      const run = await queue.current.activeEffect.effect();
      if(!queue.current.activeEffect) {
        await run?.();
        return;
      }
      queue.current.activeEffect.resolvedCleanup = { run };
      if(queue.current.activeEffect.didCleanup){
        cleanupActiveEffect();
      }
    }
  }
  const cleanupActiveEffect = async () => {
    await queue.current.activeEffect?.resolvedCleanup?.run?.();
    queue.current.activeEffect = undefined;
    runAsyncEffect(queue)
  }

  useEffectDeep(() => {
    runAsyncEffect(queue);
    return () => { 
      if(queue.current.activeEffect?.effect === effect){
        queue.current.activeEffect.didCleanup = true;
        cleanupActiveEffect();
      }
      if(queue.current.latestEffect?.effect === effect){
        queue.current.latestEffect = undefined;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
export const useEffectAsync = (effect: () => Promise<void | (() => void)>, inputs: any[]) => {
  const onCleanup = useRef({ 
    cleanup: undefined as undefined | (() => void), 
    effect, 
    cleanupEffect: undefined as undefined | typeof effect, 
  });
  onCleanup.current.effect = effect;
  useEffectDeep(() => {
    effect().then(result => {
      if(typeof result === "function"){
        onCleanup.current.cleanup = result;
        if(onCleanup.current.cleanupEffect === effect){
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
}

export function useIsMounted() {
  const isMountedRef = useRef(true);
  const isMounted = useCallback(() => isMountedRef.current, []);

  useEffect(() => {
    return () => void (isMountedRef.current = false);
  }, []);

  return isMounted;
}

type PromiseFunc = () => Promise<any>
type NamedResult = Record<string, PromiseFunc>;

export const usePromise = <F extends PromiseFunc | NamedResult>(f: F, deps: any[] = []):
  F extends NamedResult ? { [key in keyof F]: Awaited<ReturnType<F[key]>> } :
  F extends PromiseFunc ? undefined | Awaited<ReturnType<F>> :
  undefined => {
  const isPromiseFunc = (val: any): val is PromiseFunc => {
    try {
      return typeof val === "function" || val instanceof Promise
    } catch (e) {
      console.error(e);
    }
    return false;
  };
  const isNamedObj = (val: any): val is NamedResult => {
    try {
      return isObject(val) && !isPromiseFunc(val)
    } catch (e) {
      console.error(e);
    }
    return false;
  };
  const getNamedObjResults = async <Val extends NamedResult>(val: Val): Promise<Record<keyof Val, any>> => {
    const data = {} as Record<keyof Val, any>;
    const keys = getKeys(val);
    for await (const key of keys) {
      const prop = val[key] as string | Function | Promise<any>;
      data[key] = typeof prop === "function" ? await prop() : await prop
    }
    return data;
  }
  const [result, setResult] = useState(isNamedObj(f) ? {} : undefined);
  const getIsMounted = useIsMounted();
  useAsyncEffectQueue(async () => {
    let promiseResult
    if (isNamedObj(f)) {
      promiseResult = await getNamedObjResults(f);
    } else {
      const funcRes = await f();
      const isNObj = isNamedObj(funcRes);
      promiseResult = isNObj ? await getNamedObjResults(funcRes) : isPromiseFunc(funcRes) ? await funcRes() : funcRes;
    }
    if (!getIsMounted()) return;
    setResult(promiseResult);
  }, deps);

  return result as any;
}

type SubHooks = (param1?: {}, param2?: {}, onError?: any) => {
  start: (newData: any) => Promise<SubscriptionHandler>;
  args: any[];
};

export const useSubscribe = <SubHook extends ReturnType<SubHooks>>(
  subHook: SubHook
): undefined | Parameters<Parameters<SubHook["start"]>[0]>[0] => {
  const [data, setData] = useState<undefined | Parameters<Parameters<SubHook["start"]>[0]>[0]>();

  const getIsMounted = useIsMounted();
  useAsyncEffectQueue(async () => {
    const sub = await subHook.start(newData => {
      if (!getIsMounted()) return;
      setData(newData);
    });

    return sub.unsubscribe;
  }, subHook.args);

  return data;
}

type HookResult = 
| { data: any; error?: undefined; isLoading: false; } 
| { data?: undefined; error: any; isLoading: false; }
| { data?: undefined; error?: undefined; isLoading: true; };

export const useSubscribeV2 = (
  subFunc: (filter: any, options: any, onData: any, onError: any) => Promise<SubscriptionHandler>,
  expectsOne: boolean,
  filter: any,
  options: any
) => {
  const defaultLoadingResult = { data: undefined, error: undefined, isLoading: true };
  const [{ data, error, isLoading }, setResult] = useState<HookResult>(defaultLoadingResult);
  const getIsMounted = useIsMounted();
  useAsyncEffectQueue(async () => {
    setResult(defaultLoadingResult);
    const sub = await subFunc(
      filter,
      options,
      newData => {
        if (!getIsMounted()) return;
        setResult({ data: expectsOne? newData[0] : newData, error: undefined });
      },
      newError => {
        if (!getIsMounted()) return;
        setResult({ data: undefined, error: newError });
      }
    );

    return sub.unsubscribe;
  }, [subFunc, filter, options]);

  return { data, error, isLoading };
}

export const useSync = (
  sync: Required<TableHandlerClient>["sync"] | Required<TableHandlerClient>["syncOne"], 
  basicFilter: Parameters<Required<TableHandlerClient>["sync"]>[0],
  syncOptions: Parameters<Required<TableHandlerClient>["sync"]>[1],
) => {
  const defaultLoadingResult = { data: undefined, error: undefined, isLoading: true };
  const [{ data, error, isLoading }, setResult] = useState<HookResult>(defaultLoadingResult);
  const getIsMounted = useIsMounted();
  useAsyncEffectQueue(async () => {
    setResult(defaultLoadingResult);
    const syncHandlers = await sync(
      basicFilter, 
      syncOptions, 
      newData => {
        if (!getIsMounted()) return;
        setResult({ data: newData, error: undefined, isLoading: false });
      }, 
      newError => {
        if (!getIsMounted()) return;
        setResult({ data: undefined, error: newError, isLoading: false });
      }
    );
    return syncHandlers.$unsync();
  }, [sync, basicFilter, syncOptions]);
  return { data, error, isLoading };
}

export const useFetch = (fetchFunc: (...args: any) => Promise<any>, args: any[] = []) => {
  const defaultLoadingResult = { data: undefined, error: undefined, isLoading: true };
  const [{ data, error, isLoading }, setResult] = useState<HookResult>(defaultLoadingResult);
  const getIsMounted = useIsMounted();
  useAsyncEffectQueue(async () => {
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
}

export const __prglReactInstalled = () => Boolean(React && useRef);

