import { omitKeys, type DBSchema, type UserLike } from "prostgles-types";

import type { ClientFunctionHandler } from "../getMethods";
import type { Socket } from "socket.io-client";
import { prostgles, type InitOptions, type ClientOnReadyParams } from "../prostgles";
import { getProstglesSocket, type SocketPathOrOptions } from "../getProstglesSocket";
import { getReact } from "./reactImports";
import { useAsyncEffectQueue } from "./useAsyncEffectQueue";
import { useIsMounted } from "./useIsMounted";

export { getIO } from "../getProstglesSocket";

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
  S = void,
  FuncSchema extends ClientFunctionHandler = ClientFunctionHandler,
  U extends UserLike = UserLike,
>({
  skip,
  socketOptions: socketPathOrOptions,
  endpoint,
  token,
  ...initOpts
}: UseProstglesClientProps = {}): ProstglesClientState<ClientOnReadyParams<S, FuncSchema, U>> => {
  const { useRef, useState } = getReact(true);
  const [onReadyArgs, setOnReadyArgs] = useState<
    ProstglesClientState<ClientOnReadyParams<S, FuncSchema, U>>
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
      const socket = getProstglesSocket({
        endpoint,
        token,
        socketOptions: socketPathOrOptions,
        credentials: initOpts.credentials,
      });
      socketRef.current = socket;
      await prostgles<S, FuncSchema, U>({
        socket,
        endpoint,
        ...initOpts,
        onReady: (onReadyArgs) => {
          if (!getIsMounted()) {
            initOpts.onDebug?.({
              type: "onReady.notMounted",
              data: omitKeys(onReadyArgs as ClientOnReadyParams, ["socket"]),
            });
            return;
          }
          initOpts.onDebug?.({
            type: "onReady",
            data: omitKeys(onReadyArgs as ClientOnReadyParams, ["socket"]),
          });
          setOnReadyArgs({ ...onReadyArgs, hasError: false, isLoading: false });
        },
      }).catch((error) => {
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
    [endpoint, initOpts, socketPathOrOptions, skip, token],
    80,
  );

  return onReadyArgs;
};
