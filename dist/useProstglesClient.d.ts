import { type DBSchema, type DBSchemaTable, type MethodHandler, type AnyObject } from "prostgles-types";
import type { ManagerOptions, SocketOptions } from "socket.io-client";
import { type Auth, type DBHandlerClient, type InitOptions } from "./prostgles";
type OnReadyParams<DBSchema> = {
    dbo: DBHandlerClient<DBSchema>;
    methods: MethodHandler | undefined;
    tableSchema: DBSchemaTable[] | undefined;
    auth: Auth | undefined;
    isReconnect: boolean;
};
type HookInitOpts = Omit<InitOptions<DBSchema>, "onReady" | "socket"> & {
    socketOptions?: Partial<ManagerOptions & SocketOptions> & {
        uri?: string;
    };
    skip?: boolean;
};
type ProstglesClientState<PGC> = {
    isLoading: true;
    error?: undefined;
} | {
    isLoading: false;
    error?: undefined;
} & PGC | {
    isLoading: false;
    error: AnyObject | string;
};
export declare const useProstglesClient: <DBSchema_1>({ skip, socketOptions, ...initOpts }?: HookInitOpts) => ProstglesClientState<OnReadyParams<DBSchema_1>>;
export {};
//# sourceMappingURL=useProstglesClient.d.ts.map