import { prostgles as pgls, InitOptions } from "./prostgles";
import { SyncedTable } from "./SyncedTable";
function prostgles<DBSchema = void>(params: InitOptions<DBSchema>) {
    //@ts-ignore
    return pgls(params, SyncedTable);
}
prostgles.SyncedTable = SyncedTable;

// export { InitOptions, DBHandlerClient };
// export default prostgles;
export = prostgles;


// export { SyncedTable };