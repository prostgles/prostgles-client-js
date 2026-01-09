import { useEffectDeep } from "./useEffectDeep";
import { useRef } from "./reactImports";

type EffectData = { id: number; effect: EffectFunc; deps: any[] };

type EffectFunc = () => Promise<void | (() => void)>;

type ActiveEffect =
  | { id: number; state: "resolving"; effect: EffectFunc }
  | { id: number; state: "resolved"; effect: EffectFunc; cleanup: () => Promise<void> }
  | { id: number; state: "cleaning"; effect: EffectFunc };

/**
 * Debounce with execute first
 * Used to ensure subscriptions are always cleaned up
 */
export const useAsyncEffectQueue = (effect: EffectFunc, deps: any[]) => {
  const idRef = useRef(0);
  const isMounted = useRef(true);
  const newEffect = useRef<EffectData>();
  const activeEffect = useRef<ActiveEffect>();

  const onRender = async () => {
    /**
     * Await and cleanup previous effect
     * */
    if (activeEffect.current?.state === "resolved") {
      const { cleanup, effect, id } = activeEffect.current;
      activeEffect.current = { id, state: "cleaning", effect };
      await cleanup().catch(console.error);
      activeEffect.current = undefined;
    }

    /**
     * Start new effect
     */
    if (newEffect.current && !activeEffect.current) {
      const currentEffect = newEffect.current;
      const { effect, id } = currentEffect;
      activeEffect.current = { id, state: "resolving", effect };
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
      activeEffect.current = { id, state: "resolved", effect, cleanup };
      if (!isMounted.current || currentEffect !== newEffect.current) {
        onRender();
      }
    }
  };

  useEffectDeep(() => {
    isMounted.current = true;
    newEffect.current = { effect, deps, id: ++idRef.current };
    onRender();
    return () => {
      isMounted.current = false;
      onRender();
    };
  }, deps);
};
