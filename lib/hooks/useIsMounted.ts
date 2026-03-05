import { reactImports } from "../hooks/reactImports";
const { useEffect, useRef, useCallback } = reactImports;

export const useIsMounted = () => {
  const isMountedRef = useRef(true);
  const isMounted = useCallback(() => isMountedRef.current, []);

  useEffect(() => {
    /** React 18 Strict Mode fix (new strict mode restores the previous state on the second mount) */
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return isMounted;
};
