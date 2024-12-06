import { type DBSchema, type DBSchemaTable, type MethodHandler } from "prostgles-types";
import type { ManagerOptions, Socket, SocketOptions } from "socket.io-client";
import type { AuthHandler } from "./Auth";
import { type DBHandlerClient, type InitOptions } from "./prostgles";
type OnReadyParams<DBSchema> = {
    dbo: DBHandlerClient<DBSchema>;
    methods: MethodHandler | undefined;
    tableSchema: DBSchemaTable[] | undefined;
    auth: AuthHandler | undefined;
    isReconnect: boolean;
    socket: Socket;
};
export type UseProstglesClientProps = Omit<InitOptions<DBSchema>, "onReady" | "socket"> & {
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
    error: Error | string;
};
export declare const useProstglesClient: <DBSchema_1>({ skip, socketOptions, ...initOpts }?: UseProstglesClientProps) => ProstglesClientState<OnReadyParams<DBSchema_1>>;
export {};
//# sourceMappingURL=useProstglesClient.d.ts.map