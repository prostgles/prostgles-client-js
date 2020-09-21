import { prostgles as pgls, InitOptions } from "./prostgles";
import { SyncedTable } from "./SyncedTable";
function prostgles (params: InitOptions) {
    return pgls(params, SyncedTable);
}
prostgles.SyncedTable = SyncedTable;
export = prostgles;
// export { SyncedTable };