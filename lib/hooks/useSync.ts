import type { HookOptions, TableHandlerClient } from "../prostgles";
import { useState } from "./reactImports";
import { useAsyncEffectQueue } from "./useAsyncEffectQueue";
import { useIsMounted } from "./useIsMounted";

export type DataFetchHookResult =
  | { data: any; error?: undefined; isLoading: false }
  | { data?: undefined; error: unknown; isLoading: false }
  | { data?: undefined; error?: undefined; isLoading: true };

export const useSync = (
  syncFunc: Required<TableHandlerClient>["sync"] | Required<TableHandlerClient>["syncOne"],
  basicFilter: Parameters<Required<TableHandlerClient>["sync"]>[0],
  syncOptions: Parameters<Required<TableHandlerClient>["sync"]>[1],
  hookOptions?: HookOptions,
) => {
  const { skip } = hookOptions ?? {};
  const defaultLoadingResult = { data: undefined, error: undefined, isLoading: true };
  const [{ data, error, isLoading }, setResult] =
    useState<DataFetchHookResult>(defaultLoadingResult);
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
