import { prostgles as pgls } from "./prostgles";
import { SyncedTable } from "./SyncedTable";
const prostgles = (params) => {
    return pgls(params, SyncedTable);
} 
export default prostgles;
export { SyncedTable };