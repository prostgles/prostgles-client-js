export declare type InitOptions = {
    socket: any;
    isReady: (dbo: any, methods: any) => Promise<any>;
    onDisconnect: (socket: any) => any;
};
export declare function prostgles(initOpts: InitOptions, syncedTable: any): Promise<unknown>;
//# sourceMappingURL=prostgles.d.ts.map