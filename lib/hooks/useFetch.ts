import type { HookOptions } from "../prostgles";
import { reactImports } from "../hooks/reactImports";
const { useEffect, useState } = reactImports;
import { useDeepCompareMemoize } from "./useEffectDeep";
import type { DataFetchHookResult } from "./useSync";

export const useFetch = (
  fetchFunc: (...args: any) => Promise<any>,
  args: any[] = [],
  hookOptions?: HookOptions,
) => {
  const { skip, deps = [] } = hookOptions ?? {};
  const defaultLoadingResult = { data: undefined, error: undefined, isLoading: true };
  const request = useDeepCompareMemoize({ fetchFunc, args, deps, skip: !!skip });
  const [result, setResult] = useState<{
    request: typeof request;
    value: DataFetchHookResult;
  }>();
  useEffect(() => {
    if (request.skip) return;
    let active = true;
    const complete = (value: DataFetchHookResult) => {
      if (active) setResult({ request, value });
    };
    void Promise.resolve()
      .then(() => request.fetchFunc(...request.args))
      .then(
        (data) => complete({ data, error: undefined, isLoading: false }),
        (error: unknown) => complete({ data: undefined, error, isLoading: false }),
      );
    return () => {
      active = false;
    };
  }, [request]);
  const { data, error, isLoading } =
    result?.request === request ? result.value : defaultLoadingResult;
  return { data, error, isLoading };
};
