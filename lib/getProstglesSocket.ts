import type { ManagerOptions, SocketOptions } from "socket.io-client";

type IO = typeof import("socket.io-client").default;

export type SocketPathOrOptions = string | Partial<ManagerOptions & SocketOptions>;

export const getIO = (throwError = false) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const io = require("socket.io-client") as IO;
    return io;
  } catch (err) {}
  if (throwError) throw new Error("Must install socket.io-client");
  return {} as IO;
};

export const getProstglesSocket = ({
  endpoint,
  token,
  socketOptions: socketPathOrOptions,
  credentials,
}: {
  endpoint?: string;
  token?: string;
  socketOptions?: SocketPathOrOptions;
  credentials?: RequestCredentials;
}) => {
  const io = getIO(true);
  const socketOptions =
    typeof socketPathOrOptions === "string" ? { path: socketPathOrOptions } : socketPathOrOptions;
  const socketOptionsWithDefaults: Partial<ManagerOptions & SocketOptions> = {
    withCredentials: credentials !== undefined && credentials !== "omit",
    ...socketOptions,
    reconnectionDelay: 1000,
    reconnection: true,
  };

  socketOptionsWithDefaults.path ??= "/ws-api";
  if (token) {
    socketOptionsWithDefaults.auth = { token };
  }

  return endpoint ? io(endpoint, socketOptionsWithDefaults) : io(socketOptionsWithDefaults);
};
