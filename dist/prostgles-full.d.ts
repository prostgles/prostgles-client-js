import { InitOptions } from "./prostgles";
declare function prostgles<DBSchema = void>(params: InitOptions<DBSchema>): Promise<unknown>;
declare namespace prostgles {
    var SyncedTable: typeof import("./SyncedTable/SyncedTable").SyncedTable;
}
export = prostgles;
//# sourceMappingURL=prostgles-full.d.ts.map