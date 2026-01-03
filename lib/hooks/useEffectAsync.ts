import { useRef } from "./reactImports";
import { useEffectDeep } from "./useEffectDeep";

export const useEffectAsync = (effect: () => Promise<void | (() => void)>, inputs: any[]) => {
  const onCleanup = useRef({
    cleanup: undefined as undefined | (() => void),
    effect,
    cleanupEffect: undefined as undefined | typeof effect,
  });
  onCleanup.current.effect = effect;
  useEffectDeep(() => {
    effect().then((result) => {
      if (typeof result === "function") {
        onCleanup.current.cleanup = result;
        if (onCleanup.current.cleanupEffect === effect) {
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
};
