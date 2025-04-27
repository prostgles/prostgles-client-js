import type { UserLike } from "prostgles-types";
import { type InitOptions } from "./prostgles";
declare function prostgles<DBSchema = void, U extends UserLike = UserLike>(params: InitOptions<DBSchema, U>): Promise<unknown>;
declare namespace prostgles {
    var SyncedTable: typeof import("./SyncedTable/SyncedTable").SyncedTable;
}
export = prostgles;
//# sourceMappingURL=prostgles-full.d.ts.map