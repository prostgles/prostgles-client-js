import { getKeys, isObject } from "prostgles-types";
import { useState } from "./reactImports";
import { useAsyncEffectQueue } from "./useAsyncEffectQueue";
import { useIsMounted } from "./useIsMounted";

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
  const isNamedObj = (val: unknown): val is NamedResult => {
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
