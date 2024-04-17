import { SubscriptionHandler } from "prostgles-types";
import { TableHandlerClient } from "./prostgles";
export declare const getReact: (throwError?: boolean) => typeof import("react");
export declare const getIO: (throwError?: boolean) => typeof import("socket.io-client").io;
export declare const isEqual: (x: any, y: any) => boolean;
export declare const useDeepCompareMemoize: (value: any) => undefined;
export declare const useEffectDeep: (callback: any, deps: any) => void;
/**
 * Debounce with execute first
 * Used to ensure subscriptions are always cleaned up
 */
export declare const useAsyncEffectQueue: (effect: () => Promise<void | (() => void)>, deps: any[]) => void;
export declare const useEffectAsync: (effect: () => Promise<void | (() => void)>, inputs: any[]) => void;
export declare function useIsMounted(): any;
type PromiseFunc = () => Promise<any>;
type NamedResult = Record<string, PromiseFunc>;
export declare const usePromise: <F extends PromiseFunc | NamedResult>(f: F, deps?: any[]) => F extends NamedResult ? { [key in keyof F]: Awaited<ReturnType<F[key]>>; } : F extends PromiseFunc ? Awaited<ReturnType<F>> | undefined : undefined;
export declare const useSubscribe: (subFunc: (filter: any, options: any, onData: any, onError: any) => Promise<SubscriptionHandler>, expectsOne: boolean, filter: any, options: any) => {
    data: any;
    error: any;
    isLoading: any;
};
export declare const useSync: (syncFunc: Required<TableHandlerClient>["sync"] | Required<TableHandlerClient>["syncOne"], basicFilter: Parameters<Required<TableHandlerClient>["sync"]>[0], syncOptions: Parameters<Required<TableHandlerClient>["sync"]>[1]) => {
    data: any;
    error: any;
    isLoading: any;
};
export declare const useFetch: (fetchFunc: (...args: any) => Promise<any>, args?: any[]) => {
    data: any;
    error: any;
    isLoading: any;
};
export declare const __prglReactInstalled: () => boolean;
export {};
//# sourceMappingURL=react-hooks.d.ts.map