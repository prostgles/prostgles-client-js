// TODO add react hooks
import * as React from "react";
import { getKeys, isObject } from "prostgles-types";
import { ViewHandlerClient } from "./prostgles";

const { useEffect, useCallback, useRef, useState } = React ?? {};

export const useEffectAsync = (effect: () => Promise<void | (() => void)>, inputs: any[]) => {
  const onCleanup = useRef({ run: () => {}, didRun: false });
  useEffect(() => {
    effect().then(result => {
      if(typeof result === "function"){
        onCleanup.current.run = result;
        if(onCleanup.current.didRun){
          result();
        }
      }
    });
    return () => { 
      onCleanup.current.didRun = true; 
      onCleanup.current.run(); 
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

export const usePromise = <F extends PromiseFunc | NamedResult>(f: F, dependencyArray: any[] = []):
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
  useEffectAsync(async () => {
    let newD
    if (isNamedObj(f)) {
      newD = await getNamedObjResults(f);
    } else {
      const funcRes = await f();
      const isNObj = isNamedObj(funcRes);
      newD = isNObj ? await getNamedObjResults(funcRes) : isPromiseFunc(funcRes) ? await funcRes() : funcRes;
    }
    if (!getIsMounted()) return;
    setResult(newD);
  }, dependencyArray);

  return result as any;
}

type SubHooks = ViewHandlerClient["subscribeHook"];
//@ts-ignore
export const useSubscribe = <SubHook extends ReturnType<SubHooks>>(
  subHok: SubHook
): undefined | Parameters<Parameters<SubHook["start"]>[0]>[0] => {
  const [data, setData] = useState<undefined | Parameters<Parameters<SubHook["start"]>[0]>[0]>();

  const getIsMounted = useIsMounted();
  useEffectAsync(async () => {
    const sub = await subHok.start(newData => {
      if (!getIsMounted()) return;
      setData(newData);
    });

    return sub.unsubscribe;
  }, subHok.args.map(v => JSON.stringify(v)));

  return data;
}

type SubOneHook = {
  start: ((data: any) => Promise<({
    unsubscribe: VoidFunction;
  })>);
};
export const useSubscribeOne = <S extends SubOneHook>(
  subHook: S
): undefined | Parameters<Parameters<S["start"]>[0]>[0] => {
  const [data, setData] = useState<undefined | Parameters<Parameters<S["start"]>[0]>[0]>();

  const getIsMounted = useIsMounted();
  useEffectAsync(async () => {
    const sub = await subHook.start(newData => {
      if (!getIsMounted()) return;
      setData(newData);
    });

    return sub.unsubscribe;
  }, []);

  return data;
}