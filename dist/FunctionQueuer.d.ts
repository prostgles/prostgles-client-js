type Func = (...args: any[]) => any;
export declare class FunctionQueuer<F extends Func> {
    private queue;
    private func;
    private groupBy?;
    constructor(func: F, groupBy?: (args: Parameters<F>) => string);
    private isRunning;
    run(args: Parameters<F>): Promise<ReturnType<F>>;
    startQueueJob: () => Promise<void>;
}
export {};
//# sourceMappingURL=FunctionQueuer.d.ts.map