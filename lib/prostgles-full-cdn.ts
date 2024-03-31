import { prostgles as pgls, InitOptions } from "./prostgles";
import { SyncedTable } from "./SyncedTable/SyncedTable";
export function prostgles (params: InitOptions) {
    return pgls(params as any, SyncedTable);
}