/// <reference types="react" />
import { type SubscriptionHandler } from "prostgles-types";
import type { HookOptions, TableHandlerClient } from "./prostgles";
type ReactT = typeof import("react");
export declare const getReact: (throwError?: boolean) => ReactT;
export declare const getIO: (throwError?: boolean) => typeof import("socket.io-client").io;
export declare const useDeepCompareMemoize: (value: any) => undefined;
export declare const useMemoDeep: typeof import("react").useMemo;
export declare const useEffectDeep: typeof import("react").useEffect;
type EffectFunc = () => Promise<void | (() => void)>;
/**
 * Debounce with execute first
 * Used to ensure subscriptions are always cleaned up
 */
export declare const useAsyncEffectQueue: (effect: EffectFunc, deps: any[]) => void;
export declare const useEffectAsync: (effect: () => Promise<void | (() => void)>, inputs: any[]) => void;
export declare const useIsMounted: () => () => boolean;
type PromiseFunc = () => Promise<any>;
type NamedResult = Record<string, PromiseFunc>;
export declare const usePromise: <F extends PromiseFunc | NamedResult>(f: F, deps?: any[]) => F extends NamedResult ? { [key in keyof F]: Awaited<ReturnType<F[key]>>; } : F extends PromiseFunc ? Awaited<ReturnType<F>> | undefined : undefined;
export declare const useSubscribe: (subFunc: (filter: any, options: any, onData: any, onError: any) => Promise<SubscriptionHandler>, expectsOne: boolean, filter: any, options: any, hookOptions?: HookOptions) => {
    data: any;
    error: any;
    isLoading: boolean;
};
export declare const useSync: (syncFunc: Required<TableHandlerClient>["sync"] | Required<TableHandlerClient>["syncOne"], basicFilter: Parameters<Required<TableHandlerClient>["sync"]>[0], syncOptions: Parameters<Required<TableHandlerClient>["sync"]>[1], hookOptions?: HookOptions) => {
    data: any;
    error: any;
    isLoading: boolean;
};
export declare const useFetch: (fetchFunc: (...args: any) => Promise<any>, args?: any[], hookOptions?: HookOptions) => {
    data: any;
    error: any;
    isLoading: boolean;
};
export declare const __prglReactInstalled: () => boolean;
export {};
//# sourceMappingURL=react-hooks.d.ts.map