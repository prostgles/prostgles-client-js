import { prostgles as pgls, InitOptions, DBHandlerClient } from "./prostgles";
import { SyncedTable } from "./SyncedTable";
function prostgles<DBSchema>(params: InitOptions<DBSchema>) {
    //@ts-ignore
    return pgls(params, SyncedTable);
}
prostgles.SyncedTable = SyncedTable;

// export { InitOptions, DBHandlerClient };
// export default prostgles;
export = prostgles;


// export { SyncedTable };