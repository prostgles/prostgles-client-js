export declare const isEqual: (x: any, y: any) => any;
export declare const useDeepCompareMemoize: (value: any) => undefined;
export declare const useEffectDeep: (callback: any, deps: any) => void;
export declare const useAsyncEffectQueue: (effect: () => Promise<void | (() => void)>, deps: any[]) => void;
export declare const useEffectAsync: (effect: () => Promise<void | (() => void)>, inputs: any[]) => void;
export declare function useIsMounted(): () => boolean;
type PromiseFunc = () => Promise<any>;
type NamedResult = Record<string, PromiseFunc>;
export declare const usePromise: <F extends PromiseFunc | NamedResult>(f: F, dependencyArray?: any[]) => F extends NamedResult ? F extends infer T extends NamedResult ? { [key in keyof T]: Awaited<ReturnType<F[key]>>; } : never : F extends PromiseFunc ? Awaited<ReturnType<F>> | undefined : undefined;
export declare const useSubscribe: <SubHook extends {
    start: (onChange: (items: Required<import("prostgles-types").AnyObject>[]) => any) => Promise<import("prostgles-types").SubscriptionHandler>;
    args: [filter?: import("prostgles-types").FullFilter<import("prostgles-types").AnyObject, void> | undefined, options?: import("prostgles-types").SubscribeParams<import("prostgles-types").AnyObject> | undefined, onError?: import("prostgles-types").OnError | undefined];
}>(subHok: SubHook) => Parameters<Parameters<SubHook["start"]>[0]>[0] | undefined;
type SubOneHook = {
    start: ((data: any) => Promise<({
        unsubscribe: VoidFunction;
    })>);
};
export declare const useSubscribeOne: <S extends SubOneHook>(subHook: S) => Parameters<Parameters<S["start"]>[0]>[0] | undefined;
export declare const __prglReactInstalled: () => boolean;
export {};
//# sourceMappingURL=react-hooks.d.ts.map