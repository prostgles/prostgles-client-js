import { prostgles as pgls, InitOptions } from "./prostgles";
import { SyncedTable } from "./SyncedTable";
function prostgles<DBSchema = void>(params: InitOptions<DBSchema>) { 
    return pgls(params as any, SyncedTable);
}
prostgles.SyncedTable = SyncedTable;

// export { InitOptions, DBHandlerClient };
// export default prostgles;
export = prostgles; 