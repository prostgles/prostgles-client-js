import { useEffectDeep } from "./useEffectDeep";
import { useRef } from "./reactImports";

type EffectData = { effect: EffectFunc; deps: any[] };

type EffectFunc = () => Promise<void | (() => void)>;

type ActiveEffect =
  | { state: "resolving"; effect: EffectFunc }
  | { state: "resolved"; effect: EffectFunc; cleanup: () => Promise<void> }
  | { state: "cleaning"; effect: EffectFunc };

/**
 * Debounce with execute first
 * Used to ensure subscriptions are always cleaned up
 */
export const useAsyncEffectQueue = (effect: EffectFunc, deps: any[]) => {
  const newEffect = useRef<EffectData>();
  const activeEffect = useRef<ActiveEffect>();

  const onRender = async () => {
    /**
     * Await and cleanup previous effect
     * */
    if (activeEffect.current?.state === "resolved") {
      const { cleanup, effect } = activeEffect.current;
      activeEffect.current = { state: "cleaning", effect };
      await cleanup().catch(console.error);
      activeEffect.current = undefined;
    }

    /**
     * Start new effect
     */
    if (newEffect.current && !activeEffect.current) {
      const currentEffect = newEffect.current;
      const { effect } = currentEffect;
      activeEffect.current = { state: "resolving", effect };
      const cleanup = await effect()
        .then((run) => {
          /* Wrapped in a promise to ensure cleanup is awaited */
          return async () => {
            await run?.();
          };
        })
        .catch((e) => {
          console.error(e);
          return async () => {};
        });
      activeEffect.current = { state: "resolved", effect, cleanup };
      if (currentEffect !== newEffect.current) {
        onRender();
      }
    }
  };

  useEffectDeep(() => {
    newEffect.current = { effect, deps };
    onRender();
    return () => {
      newEffect.current = undefined;
      onRender();
    };
  }, deps);
};
