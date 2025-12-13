import { prostgles as pgls, type InitOptions } from "./prostgles";
import { SyncedTable } from "./SyncedTable/SyncedTable";
export function prostgles(params: InitOptions) {
  return pgls(params as any, SyncedTable);
}
