import type { AnyObject } from "prostgles-types";
import type { MultiChangeListener, MultiSyncHandles, SubscriptionMulti, SyncedTable } from "./SyncedTable";
type Args = {
    onChange: MultiChangeListener<AnyObject>;
    handlesOnData: boolean;
};
export declare function getMultiSyncSubscription(this: SyncedTable, { onChange, handlesOnData }: Args): {
    sub: SubscriptionMulti<AnyObject>;
    handles: MultiSyncHandles<AnyObject>;
};
export {};
//# sourceMappingURL=getMultiSyncSubscription.d.ts.map