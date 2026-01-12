import type { ClientSchema, ServerFunctionHandler, SocketFunctionCall } from "prostgles-types";
import { CHANNELS } from "prostgles-types";
import type { InitOptions } from "./prostgles";

export const getMethods = ({
  onDebug,
  methods,
  socket,
}: Pick<InitOptions, "onDebug" | "socket"> & Pick<ClientSchema, "methods">) => {
  let methodsObj: ServerFunctionHandler = {};
  const _methods: typeof methods = JSON.parse(JSON.stringify(methods));
  _methods.map(({ name, description, input, output }) => {
    const onRun = async function (input?: unknown) {
      await onDebug?.({ type: "method", command: name, data: { params: input } });
      return new Promise((resolve, reject) => {
        socket.emit(CHANNELS.METHOD, { name, input } satisfies SocketFunctionCall, (err, res) => {
          if (err) reject(err);
          else resolve(res);
        });
      });
    };
    methodsObj[name] = {
      description,
      input,
      output,
      run: onRun,
    };
  });
  methodsObj = Object.freeze(methodsObj);

  return { methodsObj };
};
