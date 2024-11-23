import { type DBNoticeConfig, type DBNotifConfig } from "prostgles-types";
import type { DBHandlerClient } from "./prostgles";
type Args = {
    socket: any;
    dbo: Partial<DBHandlerClient<void>>;
};
export declare class SQL {
    notifSubs: {
        [key: string]: {
            config: DBNotifConfig;
            listeners: ((notif: any) => void)[];
        };
    };
    removeNotifListener: (listener: any, conf: DBNotifConfig, socket: any) => void;
    addNotifListener: (listener: any, conf: DBNotifConfig, socket: any) => void;
    noticeSubs: {
        listeners: ((notice: any) => void)[];
        config: DBNoticeConfig;
    } | undefined;
    removeNoticeListener: (listener: any, socket: any) => void;
    addNoticeListener: (listener: any, conf: DBNoticeConfig, socket: any) => void;
    setup: ({ socket, dbo }: Args) => Promise<void>;
}
export {};
//# sourceMappingURL=SQL.d.ts.map