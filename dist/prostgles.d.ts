export declare type InitOptions = {
    socket: any;
    onReady: (dbo: any, methods: any) => any;
    onDisconnect?: (socket: any) => any;
};
export declare function prostgles(initOpts: InitOptions, syncedTable: any): Promise<unknown>;
//# sourceMappingURL=prostgles.d.ts.map