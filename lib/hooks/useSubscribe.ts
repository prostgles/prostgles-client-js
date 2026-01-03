import type { HookOptions } from "../prostgles";
import { isEqual, type SubscriptionHandler } from "prostgles-types";
import { useRef, useState } from "./reactImports";
import type { DataFetchHookResult } from "./useSync";
import { useIsMounted } from "./useIsMounted";
import { useAsyncEffectQueue } from "./useAsyncEffectQueue";

export const useSubscribe = (
  subFunc: (filter: any, options: any, onData: any, onError: any) => Promise<SubscriptionHandler>,
  expectsOne: boolean,
  filter: any,
  options: any,
  hookOptions?: HookOptions,
) => {
  const { skip } = hookOptions ?? {};
  const defaultLoadingResult = { data: undefined, error: undefined, isLoading: true };
  const [hookResult, setHookResult] = useState<DataFetchHookResult>(defaultLoadingResult);
  const hookResultRef = useRef(hookResult);
  hookResultRef.current = hookResult;

  const getIsMounted = useIsMounted();
  useAsyncEffectQueue(async () => {
    if (!getIsMounted() || skip) return;
    if (!isEqual(hookResultRef.current, defaultLoadingResult)) {
      setHookResult(defaultLoadingResult);
    }
    const setError = (newError) => {
      if (!getIsMounted()) return;
      setHookResult({ data: undefined, error: newError, isLoading: false });
    };
    try {
      const sub = await subFunc(
        filter,
        options,
        (newData) => {
          if (!getIsMounted()) return;
          setHookResult({
            data: expectsOne ? newData[0] : newData,
            error: undefined,
            isLoading: false,
          });
        },
        setError,
      );
      return () => {
        sub.unsubscribe();
      };
    } catch (error) {
      setError(error);
    }
  }, [subFunc, filter, options, skip]);

  return hookResult;
};
