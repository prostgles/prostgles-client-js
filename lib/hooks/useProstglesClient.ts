import { type DBSchema, type UserLike } from "prostgles-types";

import type { ClientFunctionHandler } from "lib/getMethods";
import type { ManagerOptions, Socket, SocketOptions } from "socket.io-client";
import { prostgles, type InitOptions, type ClientOnReadyParams } from "../prostgles";
import { SyncedTable } from "../SyncedTable/SyncedTable";
import { getReact } from "./reactImports";
import { useAsyncEffectQueue } from "./useAsyncEffectQueue";
import { useIsMounted } from "./useIsMounted";

type IO = typeof import("socket.io-client").default;
export const getIO = (throwError = false) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const io = require("socket.io-client") as IO;
    return io;
  } catch (err) {}
  if (throwError) throw new Error("Must install socket.io-client");
  return {} as IO;
};

type SocketPathOrOptions = Partial<ManagerOptions & SocketOptions>;

export type UseProstglesClientProps = Omit<InitOptions<DBSchema>, "onReady" | "socket"> & {
  /**
   * Websocket API token
   */
  token?: string;
  socketOptions?: SocketPathOrOptions;
  skip?: boolean;
};
export type ProstglesClientState<PGC> =
  | { isLoading: true; hasError: false; error?: undefined }
  | ({ isLoading: false; hasError: false; error?: undefined } & PGC)
  | { isLoading: false; hasError: true; error: unknown };

export const useProstglesClient = <
  DBSchema,
  FuncSchema extends ClientFunctionHandler = ClientFunctionHandler,
  U extends UserLike = UserLike,
>({
  skip,
  socketOptions: socketPathOrOptions,
  endpoint,
  token,
  ...initOpts
}: UseProstglesClientProps = {}): ProstglesClientState<
  ClientOnReadyParams<DBSchema, FuncSchema, U>
> => {
  const { useRef, useState } = getReact(true);
  const [onReadyArgs, setOnReadyArgs] = useState<
    ProstglesClientState<ClientOnReadyParams<DBSchema, FuncSchema, U>>
  >({
    isLoading: true,
    hasError: false,
  });
  const getIsMounted = useIsMounted();

  const socketRef = useRef<Socket>();
  useAsyncEffectQueue(
    async () => {
      if (skip) return undefined;

      socketRef.current?.disconnect();
      const io = getIO();
      const socketOptions =
        typeof socketPathOrOptions === "string" ?
          { path: socketPathOrOptions }
        : socketPathOrOptions;
      const socketOptionsWithDefaults: SocketPathOrOptions = {
        withCredentials: initOpts.credentials && initOpts.credentials !== "omit",
        ...socketOptions,
        reconnectionDelay: 1000,
        reconnection: true,
      };

      socketOptionsWithDefaults.path ??= `/ws-api`;
      if (token) {
        socketOptionsWithDefaults.auth = { token };
      }
      const socket =
        endpoint ? io(endpoint, socketOptionsWithDefaults) : io(socketOptionsWithDefaults);
      socketRef.current = socket;
      await prostgles<DBSchema, FuncSchema, U>(
        {
          socket,
          endpoint,
          ...initOpts,
          onReady: (onReadyArgs) => {
            if (!getIsMounted()) {
              initOpts.onDebug?.({
                type: "onReady.notMounted",
                data: onReadyArgs as any,
              });
              return;
            }
            initOpts.onDebug?.({ type: "onReady", data: onReadyArgs as any });
            setOnReadyArgs({ ...onReadyArgs, hasError: false, isLoading: false });
          },
        },
        SyncedTable,
      ).catch((error) => {
        if (!getIsMounted()) return;
        setOnReadyArgs({ isLoading: false, error, hasError: true });
      });

      return () => {
        socket.disconnect();
        socket.emit = () => {
          throw "Socket disconnected";
        };
      };
    },
    [initOpts, socketPathOrOptions, skip],
    80,
  );

  return onReadyArgs;
};
