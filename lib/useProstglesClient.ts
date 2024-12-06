
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Stefan L. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  omitKeys,
  type DBSchema,
  type DBSchemaTable,
  type MethodHandler
} from "prostgles-types";

import type { ManagerOptions, Socket, SocketOptions } from "socket.io-client";
import type { AuthHandler } from "./Auth";
import { SyncedTable } from "./SyncedTable/SyncedTable";
import { prostgles, type DBHandlerClient, type InitOptions } from "./prostgles";
import { getIO, getReact, useAsyncEffectQueue, useIsMounted, useMemoDeep } from "./react-hooks";

type OnReadyParams<DBSchema> = {
  dbo: DBHandlerClient<DBSchema>;
  methods: MethodHandler | undefined; 
  tableSchema: DBSchemaTable[] | undefined; 
  auth: AuthHandler | undefined;
  isReconnect: boolean;
  socket: Socket;
}
type HookInitOpts = Omit<InitOptions<DBSchema>, "onReady" | "socket"> & {
  socketOptions?: Partial<ManagerOptions & SocketOptions> & { uri?: string; };
  skip?: boolean;
};
type ProstglesClientState<PGC> = 
| { isLoading: true; error?: undefined; }
| { isLoading: false; error?: undefined; } & PGC 
| { isLoading: false; error: Error | string; };

export const useProstglesClient = <DBSchema>({ skip, socketOptions, ...initOpts }: HookInitOpts = {}): ProstglesClientState<OnReadyParams<DBSchema>> => {
  const { useRef, useState } = getReact(true);
  const [onReadyArgs, setOnReadyArgs] = useState<ProstglesClientState<OnReadyParams<DBSchema>>>({
    isLoading: true
  });
  const getIsMounted = useIsMounted();

  const socketRef = useRef<Socket>();

  const socket = useMemoDeep(() => {
    socketRef.current?.disconnect();
    const io = getIO();
    const opts = {
      reconnectionDelay: 1000,
      reconnection: true,
      ...omitKeys(socketOptions ?? {}, ["uri"]),
    }
    const socket = typeof socketOptions?.uri === "string" ? io(socketOptions.uri, opts) : io(opts);
    socketRef.current = socket;
    return socket;
  }, [socketOptions]);

  useAsyncEffectQueue(async () => {
    if(skip) return undefined;

    await prostgles<DBSchema>({
      socket,
      ...initOpts, 
      onReady: (...args) => {
        if (!getIsMounted()) return;
        const [dbo, methods, tableSchema, auth, isReconnect] = args;
        const onReadyArgs: OnReadyParams<DBSchema> = { 
          dbo, 
          methods,
          tableSchema, 
          auth, 
          isReconnect, 
          socket 
        };
        setOnReadyArgs({ ...onReadyArgs, isLoading: false });
      }
    }, SyncedTable)
    .catch(err => {
      if (!getIsMounted()) return;
      const error = err instanceof Error ? err : new Error(err);
      setOnReadyArgs({ isLoading: false, error });
    });

    return () => {
      socket.disconnect();
    }
    
  }, [initOpts, socket, skip]);

  return onReadyArgs;
}