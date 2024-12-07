import type { ClientSchema, MethodHandler } from "prostgles-types";
import { CHANNELS } from "prostgles-types";
import type { InitOptions } from "./prostgles";

export const getMethods = ({ onDebug, methods, socket }: Pick<InitOptions, "onDebug" | "socket"> & Pick<ClientSchema, "methods">) => {

  let methodsObj: MethodHandler = {};
  const _methods: typeof methods = JSON.parse(JSON.stringify(methods));
  _methods.map(method => {
    /** New method def */
    const isBasic = typeof method === "string";
    const methodName = isBasic ? method : method.name;
    const onRun = async function (...params) {
      await onDebug?.({ type: "method", command: methodName, data: { params } });
      return new Promise((resolve, reject) => {
        socket.emit(CHANNELS.METHOD, { method: methodName, params }, (err, res) => {
          if (err) reject(err);
          else resolve(res);
        });
      })
    }
    methodsObj[methodName] = isBasic ? onRun : {
      ...method,
      run: onRun
    };
  });
  methodsObj = Object.freeze(methodsObj);

  return { methodsObj };
}