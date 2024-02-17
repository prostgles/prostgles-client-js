import { SubscriptionHandler, getKeys, isObject } from "prostgles-types";
import { ViewHandlerClient } from "./prostgles";
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
const { useEffect = alertNoReact, useCallback = alertNoReact, useRef = alertNoReactT, useState = alertNoReactT } = React ?? {};

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
      queue.current.activeEffect = queue.current.latestEffect;
      queue.current.latestEffect = undefined;
      const run = await queue.current.activeEffect.effect();
      queue.current.activeEffect.resolvedCleanup = { run };
      if(queue.current.activeEffect.didCleanup){
        cleanupActiveEffect();
      }
    }
  }
  const cleanupActiveEffect = async () => {
    await queue.current.activeEffect.resolvedCleanup.run?.();
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
  start: (onChange: any) => Promise<SubscriptionHandler>;
  args: any[];
};

export const useSubscribe = <SubHook extends ReturnType<SubHooks>>(
  subHok: SubHook
): undefined | Parameters<Parameters<SubHook["start"]>[0]>[0] => {
  const [data, setData] = useState<undefined | Parameters<Parameters<SubHook["start"]>[0]>[0]>();

  const getIsMounted = useIsMounted();
  useAsyncEffectQueue(async () => {
    const sub = await subHok.start(newData => {
      if (!getIsMounted()) return;
      setData(newData);
    });

    return sub.unsubscribe;
  }, subHok.args);

  return data;
}

type SubOneHook = {
  args: any[];
  start: ((data: any) => Promise<({
    unsubscribe: VoidFunction;
  })>);
};
export const useSubscribeOne = <S extends SubOneHook>(
  subHook: S
): undefined | Parameters<Parameters<S["start"]>[0]>[0] => {
  const [data, setData] = useState<undefined | Parameters<Parameters<S["start"]>[0]>[0]>();

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

export const __prglReactInstalled = () => Boolean(React && useRef);

