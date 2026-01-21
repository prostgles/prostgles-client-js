import { useEffectDeep } from "./useEffectDeep";
import { useRef } from "./reactImports";

type EffectData = { id: number; effect: EffectFunc; deps: any[] };

type EffectFunc = () => Promise<void | (() => void)>;

type ActiveEffect =
  | { id: number; state: "resolving"; effect: EffectFunc }
  | { id: number; state: "resolved"; effect: EffectFunc; cleanup: () => Promise<void> }
  | { id: number; state: "cleaning"; effect: EffectFunc }
  | { id: number; state: "cleaned"; effect: EffectFunc };

/**
 * Debounce with execute first
 * Used to ensure subscriptions are always cleaned up
 */
export const useAsyncEffectQueue = (effect: EffectFunc, deps: any[], debounce?: number) => {
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
      activeEffect.current = { id, state: "cleaned", effect };
    }

    /**
     * Start new effect
     */
    if (
      newEffect.current &&
      (!activeEffect.current || activeEffect.current.state === "cleaned") &&
      activeEffect.current?.id !== newEffect.current.id
    ) {
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

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleRender = () => {
    if (!debounce) {
      onRender();
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onRender();
    }, debounce);
  };

  useEffectDeep(() => {
    isMounted.current = true;
    newEffect.current = { effect, deps, id: ++idRef.current };
    scheduleRender();
    return () => {
      isMounted.current = false;
      scheduleRender();
    };
  }, deps);
};
