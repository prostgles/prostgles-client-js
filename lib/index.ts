import {
  defineJoin,
  getActionFunctions,
  ROW_ACTIONS_COLUMN,
  type UserLike,
  type JobControlBinding,
  type JobControlFunctionMetadata,
  type JobControlOperation,
} from "prostgles-types";
import { prostgles as _prostgles, type InitOptions, type ProstglesInitOptions } from "./prostgles";
import type { ClientFunctionHandler } from "./getMethods";

function prostgles<
  DBSchema = void,
  FuncSchema extends ClientFunctionHandler = ClientFunctionHandler,
  U extends UserLike = UserLike,
>(
  params: ProstglesInitOptions<DBSchema, FuncSchema, U>,
): ReturnType<typeof _prostgles<DBSchema, FuncSchema, U>>;
function prostgles<
  DBSchema = void,
  FuncSchema extends ClientFunctionHandler = ClientFunctionHandler,
  U extends UserLike = UserLike,
>(
  params: InitOptions<DBSchema, FuncSchema, U>,
): ReturnType<typeof _prostgles<DBSchema, FuncSchema, U>>;
function prostgles(params: InitOptions<any, any, any> | ProstglesInitOptions<any, any, any>) {
  return _prostgles(params);
}

export {
  type DBHandlerClient,
  type ClientOnReadyParams as OnReadyParams,
  type ProstglesClientState,
  type TableHandlerClient,
  type InitOptions,
  type ProstglesInitOptions,
  asName,
} from "./prostgles";
export * from "./hooks/useSync";
export * from "./hooks/useSubscribe";
export * from "./hooks/useProstglesClient";
export * from "./hooks/usePromise";
export * from "./hooks/useIsMounted";
export * from "./hooks/useFetch";
export * from "./hooks/useEffectDeep";
export * from "./hooks/useEffectAsync";
export * from "./hooks/useAsyncEffectQueue";
export * from "prostgles-types/dist/publishUtils";
export { useAuthState, ERR_CODE_MESSAGES } from "./auth/useAuthState";
export type { SQLHandler } from "prostgles-types";
export { defineJoin };
export type { ClientFunctionHandler, FunctionHandle } from "./getMethods";
export default prostgles;
export { getActionFunctions, ROW_ACTIONS_COLUMN };
export type { JobControlBinding, JobControlFunctionMetadata, JobControlOperation };
