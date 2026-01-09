/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Stefan L. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  omitKeys,
  type DBSchema,
  type DBSchemaTable,
  type MethodHandler,
  type UserLike,
} from "prostgles-types";

import type { ManagerOptions, Socket, SocketOptions } from "socket.io-client";
import type { AuthHandler } from "../getAuthHandler";
import { SyncedTable } from "../SyncedTable/SyncedTable";
import { prostgles, type DBHandlerClient, type InitOptions } from "../prostgles";
import { getReact } from "./reactImports";
import { useIsMounted } from "./useIsMounted";
import { useAsyncEffectQueue } from "./useAsyncEffectQueue";

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

export type OnReadyParams<DBSchema, U extends UserLike = UserLike> = {
  dbo: DBHandlerClient<DBSchema>;
  methods: MethodHandler | undefined;
  tableSchema: DBSchemaTable[] | undefined;
  auth: AuthHandler<U>;
  isReconnect: boolean;
  socket: Socket;
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
  | { isLoading: true; hasError?: undefined; error?: undefined }
  | ({ isLoading: false; hasError?: false; error?: undefined } & PGC)
  | { isLoading: false; hasError: true; error: unknown };

export const useProstglesClient = <DBSchema, U extends UserLike = UserLike>({
  skip,
  socketOptions: socketPathOrOptions,
  endpoint,
  project,
  token,
  ...initOpts
}: UseProstglesClientProps = {}): ProstglesClientState<OnReadyParams<DBSchema, U>> => {
  const { useRef, useState } = getReact(true);
  const [onReadyArgs, setOnReadyArgs] = useState<ProstglesClientState<OnReadyParams<DBSchema>>>({
    isLoading: true,
  });
  const getIsMounted = useIsMounted();

  const socketRef = useRef<Socket>();
  useAsyncEffectQueue(async () => {
    if (skip) return undefined;

    socketRef.current?.disconnect();
    const io = getIO();
    const socketOptions =
      typeof socketPathOrOptions === "string" ? { path: socketPathOrOptions } : socketPathOrOptions;
    const opts: SocketPathOrOptions = {
      ...socketOptions,
      reconnectionDelay: 1000,
      reconnection: true,
    };

    if (project) {
      opts.path = `/ws-api-db/${project}`;
    }
    if (token) {
      opts.query ??= {};
      opts.query.sid_token = token;
    }
    const socket = endpoint ? io(endpoint, opts) : io(opts);
    socketRef.current = socket;
    await prostgles<DBSchema>(
      {
        socket,
        ...initOpts,
        onReady: (...args) => {
          const [dbo, methods, tableSchema, auth, isReconnect] = args;
          const onReadyArgs: OnReadyParams<DBSchema> = {
            dbo,
            methods,
            tableSchema,
            auth,
            isReconnect,
            socket,
          };
          if (!getIsMounted()) {
            initOpts.onDebug?.({ type: "onReady.notMounted", data: onReadyArgs });
            return;
          }
          initOpts.onDebug?.({ type: "onReady", data: onReadyArgs });
          setOnReadyArgs({ ...onReadyArgs, isLoading: false });
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
  }, [initOpts, socketPathOrOptions, skip]);

  return onReadyArgs as ProstglesClientState<OnReadyParams<DBSchema, U>>;
};
