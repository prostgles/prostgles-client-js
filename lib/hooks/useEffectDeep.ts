import { isEqual } from "prostgles-types";
import { reactImports } from "./reactImports";
const { getReact, useRef } = reactImports;
const React = getReact();
type React = typeof import("react");
export const useDeepCompareMemoize = <T>(value: T): T => {
  const ref = useRef<T>(value);

  if (!isEqual(value, ref.current)) {
    ref.current = value;
  }

  return ref.current;
};

export const useMemoDeep = ((callback, deps) => {
  const memoizedDeps = useDeepCompareMemoize(deps);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useMemo(callback, memoizedDeps);
}) as React["useMemo"];

export const useEffectDeep = ((callback, deps) => {
  const memoizedDeps = useDeepCompareMemoize(deps);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(callback, memoizedDeps);
}) as React["useEffect"];
