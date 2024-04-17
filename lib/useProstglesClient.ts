
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Stefan L. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  type DBSchema,
  type DBSchemaTable,
  type MethodHandler,
  omitKeys
} from "prostgles-types";

import type { ManagerOptions, Socket, SocketOptions } from "socket.io-client";
import { SyncedTable } from "./SyncedTable/SyncedTable";
import { prostgles, type Auth, type DBHandlerClient, type InitOptions } from "./prostgles";
import { getIO, getReact, useAsyncEffectQueue, useIsMounted, useMemoDeep } from "./react-hooks";

type OnReadyParams<DBSchema> = {
  dbo: DBHandlerClient<DBSchema>;
  methods: MethodHandler | undefined; 
  tableSchema: DBSchemaTable[] | undefined; 
  auth: Auth | undefined;
  isReconnect: boolean;
}
type HookInitOpts = Omit<InitOptions<DBSchema>, "onReady" | "socket"> & {
  socketOptions?: Partial<ManagerOptions & SocketOptions> & { uri?: string; };
  skip?: boolean;
};
type ProstglesClientState<PGC> = 
| { isLoading: true; error?: undefined; }
| { isLoading: false; error?: undefined; } & PGC 
| { isLoading: false; error: any; };

export const useProstglesClient = <DBSchema>({ skip, socketOptions, ...initOpts }: HookInitOpts = {}): ProstglesClientState<OnReadyParams<DBSchema>> => {
  const { useRef, useState } = getReact(true);
  const [onReadyArgs, setOnReadyArgs] = useState<ProstglesClientState<OnReadyParams<DBSchema>>>({
    isLoading: true
  });
  const getIsMounted = useIsMounted();

  const socketRef = useRef<Socket>();
  const socket = useMemoDeep(() => {
    if(skip) return undefined;
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
  }, [socketOptions, skip]);

  useAsyncEffectQueue(async () => {
    if(!socket || skip) return;

    //@ts-ignore
    await prostgles({
      socket,
      ...initOpts, 
      onReady: (...args) => {
        if (!getIsMounted()) return;
        const [dbo, methods, tableSchema, auth, isReconnect] = args;
        const onReadyArgs = { dbo, methods,tableSchema, auth, isReconnect } as OnReadyParams<DBSchema>;
        setOnReadyArgs({ ...onReadyArgs, isLoading: false  } satisfies ProstglesClientState<OnReadyParams<DBSchema>>);
      }
    }, SyncedTable)
    .catch(error => {
      if (!getIsMounted()) return;
      setOnReadyArgs({ isLoading: false, error });
    });

    return () => {
      socket.disconnect();
    }
    
  }, [initOpts, socket]);

  return onReadyArgs;
}