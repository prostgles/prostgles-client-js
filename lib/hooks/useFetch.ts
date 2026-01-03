import type { HookOptions } from "../prostgles";
import { useState } from "./reactImports";
import { useAsyncEffectQueue } from "./useAsyncEffectQueue";
import { useIsMounted } from "./useIsMounted";
import type { DataFetchHookResult } from "./useSync";

export const useFetch = (
  fetchFunc: (...args: any) => Promise<any>,
  args: any[] = [],
  hookOptions?: HookOptions,
) => {
  const { skip, deps = [] } = hookOptions ?? {};
  const defaultLoadingResult = { data: undefined, error: undefined, isLoading: true };
  const [{ data, error, isLoading }, setResult] =
    useState<DataFetchHookResult>(defaultLoadingResult);
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
  }, [fetchFunc, ...args, ...deps]);
  return { data, error, isLoading };
};
