import type { UserLike } from "prostgles-types";
import { prostgles as pgls, type InitOptions } from "./prostgles";
import { SyncedTable } from "./SyncedTable/SyncedTable";
import type { ClientFunctionHandler } from "./getMethods";

function prostgles<
  DBSchema = void,
  FuncSchema extends ClientFunctionHandler = ClientFunctionHandler,
  U extends UserLike = UserLike,
>(params: InitOptions<DBSchema, FuncSchema, U>) {
  return pgls(params as any, SyncedTable);
}

export {
  type DBHandlerClient,
  type ClientOnReadyParams as OnReadyParams,
  type ProstglesClientState,
  type TableHandlerClient,
  type ViewHandlerClient,
  type InitOptions,
  asName,
} from "./prostgles";
export { SyncedTable };
export * from "./hooks/useSync";
export * from "./hooks/useSubscribe";
export * from "./hooks/useProstglesClient";
export * from "./hooks/usePromise";
export * from "./hooks/useIsMounted";
export * from "./hooks/useFetch";
export * from "./hooks/useEffectDeep";
export * from "./hooks/useEffectAsync";
export * from "./hooks/useAsyncEffectQueue";
export { useAuthState, ERR_CODE_MESSAGES } from "./auth/useAuthState";
export type { ClientFunctionHandler, FunctionHandle } from "./getMethods";
export default prostgles;
