import { isEqual } from "prostgles-types";
import { React, useEffect, useRef, type ReactT } from "./reactImports";

export const useDeepCompareMemoize = (value: unknown) => {
  const ref = useRef<unknown>();

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
