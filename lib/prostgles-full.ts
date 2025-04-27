import type { UserLike } from "prostgles-types";
import { prostgles as pgls, type InitOptions } from "./prostgles";
import { SyncedTable } from "./SyncedTable/SyncedTable";
function prostgles<DBSchema = void, U extends UserLike = UserLike>(
  params: InitOptions<DBSchema, U>,
) {
  return pgls(params as any, SyncedTable);
}
prostgles.SyncedTable = SyncedTable;

export = prostgles;
