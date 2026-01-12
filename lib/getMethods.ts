import type { ClientSchema, ServerFunctionHandler, SocketFunctionCall } from "prostgles-types";
import { CHANNELS } from "prostgles-types";
import type { InitOptions } from "./prostgles";

export type FunctionHandle = (args?: Record<string, unknown>) => Promise<unknown>;
export type ClientFunctionHandler = Partial<Record<string, FunctionHandle>>;

export const getMethods = ({
  onDebug,
  methods,
  socket,
}: Pick<InitOptions, "onDebug" | "socket"> & Pick<ClientSchema, "methods">) => {
  let methodSchema: ServerFunctionHandler = {};
  const methodHandlers = {} as ClientFunctionHandler;
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
    methodSchema[name] = {
      description,
      input,
      output,
      run: onRun,
    };
    methodHandlers[name] = onRun;
  });
  methodSchema = Object.freeze(methodSchema);

  return { methodSchema, methodHandlers };
};
