import { type DBSchema, type DBSchemaTable, type MethodHandler, type UserLike } from "prostgles-types";
import type { ManagerOptions, Socket, SocketOptions } from "socket.io-client";
import type { AuthHandler } from "./Auth";
import { type DBHandlerClient, type InitOptions } from "./prostgles";
type OnReadyParams<DBSchema, U extends UserLike = UserLike> = {
    dbo: DBHandlerClient<DBSchema>;
    methods: MethodHandler | undefined;
    tableSchema: DBSchemaTable[] | undefined;
    auth: AuthHandler<U> | undefined;
    isReconnect: boolean;
    socket: Socket;
};
type SocketPathOrOptions = string | (Partial<ManagerOptions & SocketOptions> & {
    uri?: string;
});
export type UseProstglesClientProps = Omit<InitOptions<DBSchema>, "onReady" | "socket"> & {
    /**
     * Socket.IO path or options
     */
    socketOptions?: SocketPathOrOptions;
    skip?: boolean;
};
type ProstglesClientState<PGC> = {
    isLoading: true;
    hasError?: undefined;
    error?: undefined;
} | ({
    isLoading: false;
    hasError?: false;
    error?: undefined;
} & PGC) | {
    isLoading: false;
    hasError: true;
    error: Error | string;
};
export declare const useProstglesClient: <DBSchema_1>({ skip, socketOptions: socketPathOrOptions, ...initOpts }?: UseProstglesClientProps) => ProstglesClientState<OnReadyParams<DBSchema_1, UserLike>>;
export {};
//# sourceMappingURL=useProstglesClient.d.ts.map