import { InitOptions } from "./prostgles";
declare function prostgles<DBSchema>(params: InitOptions): Promise<unknown>;
declare namespace prostgles {
    var SyncedTable: typeof import("./SyncedTable").SyncedTable;
}
export = prostgles;
//# sourceMappingURL=prostgles-full.d.ts.map