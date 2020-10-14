export declare type InitOptions = {
    socket: any;
    onReady: (dbo: any, methods?: any, fullSchema?: any) => any;
    onDisconnect?: (socket: any) => any;
};
export declare type SyncTriggers = {
    onSyncRequest: (params: any, sync_info: any) => {
        c_fr: object;
        c_lr: object;
        c_count: number;
    };
    onPullRequest: ({ from_synced, offset, limit }: {
        from_synced: any;
        offset: any;
        limit: any;
    }, sync_info: any) => object[];
    onUpdates: (data: object[], sync_info: any) => any | void;
};
export declare type SyncInfo = {
    id_fields: string[];
    synced_field: string;
    channelName: string;
};
export declare function prostgles(initOpts: InitOptions, syncedTable: any): Promise<unknown>;
//# sourceMappingURL=prostgles.d.ts.map