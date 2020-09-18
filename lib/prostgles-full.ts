import { prostgles as pgls } from "./prostgles";
import { SyncedTable } from "./SyncedTable";
export function prostgles (params) {
    return pgls(params, SyncedTable);
}
// prostgles.SyncedTable = SyncedTable;
// export = prostgles;
// export { SyncedTable };