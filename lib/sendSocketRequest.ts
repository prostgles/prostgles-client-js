import type { InitOptions } from "./prostgles";

export const sendSocketRequest = <Result = unknown>(
  socket: InitOptions["socket"],
  channel: string,
  request: unknown,
) =>
  new Promise<Result>((resolve, reject) => {
    const onDisconnect = () => {
      // Heartbeat expiry can buffer the request before emitting "disconnect".
      socket.sendBuffer = socket.sendBuffer.filter(
        ({ data }) => data?.[0] !== channel || data[1] !== request,
      );
      reject(new Error("Socket disconnected before receiving a response"));
    };
    if (!socket.connected) {
      onDisconnect();
      return;
    }
    socket.once("disconnect", onDisconnect);
    try {
      socket.emit(channel, request, (error: unknown, result: Result) => {
        socket.off("disconnect", onDisconnect);
        if (error) reject(error);
        else resolve(result);
      });
    } catch (error) {
      socket.off("disconnect", onDisconnect);
      reject(error);
    }
  });
