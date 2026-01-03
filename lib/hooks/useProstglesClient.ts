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
import { getIO, useAsyncEffectQueue, useIsMounted } from "./react-hooks";
import { getReact } from "./reactImports";

export type OnReadyParams<DBSchema, U extends UserLike = UserLike> = {
  dbo: DBHandlerClient<DBSchema>;
  methods: MethodHandler | undefined;
  tableSchema: DBSchemaTable[] | undefined;
  auth: AuthHandler<U>;
  isReconnect: boolean;
  socket: Socket;
};

type SocketPathOrOptions = string | (Partial<ManagerOptions & SocketOptions> & { uri?: string });

export type UseProstglesClientProps = Omit<InitOptions<DBSchema>, "onReady" | "socket"> & {
  /**
   * Socket.IO path or options
   */
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
    const opts = {
      reconnectionDelay: 1000,
      reconnection: true,
      ...omitKeys(socketOptions ?? {}, ["uri"]),
    };
    const socket = typeof socketOptions?.uri === "string" ? io(socketOptions.uri, opts) : io(opts);
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
