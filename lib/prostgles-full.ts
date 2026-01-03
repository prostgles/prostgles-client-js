import type { UserLike } from "prostgles-types";
import { prostgles as pgls, type InitOptions } from "./prostgles";
import { SyncedTable } from "./SyncedTable/SyncedTable";

function prostgles<DBSchema = void, U extends UserLike = UserLike>(
  params: InitOptions<DBSchema, U>,
) {
  return pgls(params as any, SyncedTable);
}

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
export default prostgles;
