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
import type { AuthHandler } from "./Auth";
import { SyncedTable } from "./SyncedTable/SyncedTable";
import { prostgles, type DBHandlerClient, type InitOptions } from "./prostgles";
import { getIO, getReact, useAsyncEffectQueue, useIsMounted } from "./react-hooks";

type OnReadyParams<DBSchema, U extends UserLike = UserLike> = {
  dbo: DBHandlerClient<DBSchema>;
  methods: MethodHandler | undefined;
  tableSchema: DBSchemaTable[] | undefined;
  auth: AuthHandler<U> | undefined;
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
type ProstglesClientState<PGC> =
  | { isLoading: true; hasError?: undefined; error?: undefined }
  | ({ isLoading: false; hasError?: false; error?: undefined } & PGC)
  | { isLoading: false; hasError: true; error: Error | string };

export const useProstglesClient = <DBSchema>({
  skip,
  socketOptions: socketPathOrOptions,
  ...initOpts
}: UseProstglesClientProps = {}): ProstglesClientState<OnReadyParams<DBSchema>> => {
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
            initOpts.onDebug?.({ type: "onReady.notMounted", data: onReadyArgs as any });
            return;
          }
          initOpts.onDebug?.({ type: "onReady", data: onReadyArgs as any });
          setOnReadyArgs({ ...onReadyArgs, isLoading: false });
        },
      },
      SyncedTable,
    ).catch((err) => {
      if (!getIsMounted()) return;
      const error = err instanceof Error ? err : new Error(err);
      setOnReadyArgs({ isLoading: false, error, hasError: true });
    });

    return () => {
      socket.disconnect();
    };
  }, [initOpts, socketPathOrOptions, skip]);

  return onReadyArgs;
};
