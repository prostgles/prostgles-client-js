import type { AnyObject, EqualityFilter, FieldFilter, NormalizedRow, ValidatedColumnInfo } from "prostgles-types";
import type { DBHandlerClient, SyncDebugEvent } from "../prostgles";
type OmittedSyncProps = "onDebug" | "name" | "filter" | "db" | "onError";
export type SyncOptions = Partial<Omit<SyncedTableOptions, OmittedSyncProps>> & {
    select?: FieldFilter;
    handlesOnData?: boolean;
};
export type SyncOneOptions = Partial<Omit<SyncedTableOptions, OmittedSyncProps>> & {
    handlesOnData?: boolean;
};
export type OnErrorHandler = (error: any) => void;
/**
 * Creates a local synchronized table
 */
export type OnChange<T extends Record<string, unknown>, Opts extends SyncOptions> = (data: SyncDataItem<T, Opts>[], delta?: Partial<NormalizedRow<T>>[]) => any;
export type SyncHandler<T> = {
    $unsync: () => void;
    $upsert: (newData: T[]) => void | Promise<void>;
    getItems: () => T[];
};
export type Sync<T extends AnyObject = AnyObject> = <TD extends T, Opts extends SyncOptions>(basicFilter: EqualityFilter<TD>, options: SyncOptions, onChange: OnChange<TD, Opts>) => Promise<SyncHandler<TD>>;
export type OnChangeOne<T extends Record<string, unknown>, Opts extends SyncOptions> = (data: SyncDataItem<T, Opts>, delta?: Partial<NormalizedRow<T>>) => void | Promise<void>;
/**
 * Creates a local synchronized record
 */
export type SyncOne<T extends AnyObject = AnyObject> = <TD extends T, Opts extends SyncOneOptions>(basicFilter: Partial<TD>, options: Opts, onChange: OnChangeOne<TD, Opts>) => Promise<SingleSyncHandles<TD, Opts["handlesOnData"]>>;
export type SyncBatchRequest = {
    from_synced?: string | number;
    to_synced?: string | number;
    offset: number;
    limit: number;
};
export type ItemUpdate = {
    idObj: AnyObject;
    delta: AnyObject;
    opts?: $UpdateOpts;
};
export type ItemUpdated = ItemUpdate & {
    oldItem: any;
    newItem: any;
    status: "inserted" | "updated" | "deleted" | "unchanged";
    from_server: boolean;
};
export type CloneSync<T extends AnyObject, Full extends boolean | undefined> = (onChange: SingleChangeListener<T, Full>, onError?: (error: any) => void) => SingleSyncHandles<T, Full>;
export type CloneMultiSync<T extends AnyObject> = (onChange: MultiChangeListener<T>, onError?: (error: any) => void) => MultiSyncHandles<T>;
export type $UpdateOpts = {
    deepMerge: boolean;
};
type DeepPartial<T> = T extends Array<any> ? T : T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;
/**
 * CRUD handles added if initialised with handlesOnData = true
 */
export type SingleSyncHandles<T extends AnyObject = AnyObject, Full extends boolean | undefined = false> = {
    $get: () => NormalizedRow<T> | undefined;
    $find: (idObj: Partial<NormalizedRow<T>>) => NormalizedRow<T> | undefined;
    $unsync: () => void;
    $delete: () => void;
    $update: <OPTS extends $UpdateOpts>(newData: OPTS extends {
        deepMerge: true;
    } ? DeepPartial<T> : Partial<T>, opts?: OPTS) => Promise<void>;
    $cloneSync: CloneSync<T, Full>;
    $cloneMultiSync: CloneMultiSync<T>;
};
type PickFieldFilterFields<T extends AnyObject, F extends SyncOptions["select"]> = F extends "" ? Record<string, never> : F extends Record<string, 1> ? Pick<T, keyof F & string> : F extends Record<string, 0> ? Omit<T, keyof F> : T;
export type SyncDataItem<T extends AnyObject, Opts extends Pick<SyncOptions, "handlesOnData" | "select">> = PickFieldFilterFields<NormalizedRow<T>, Opts["select"]> & (Opts["handlesOnData"] extends true ? SingleSyncHandles<NormalizedRow<T>, Opts["handlesOnData"]> : Partial<SingleSyncHandles<NormalizedRow<T>, Opts["handlesOnData"]>>);
export type MultiSyncHandles<T extends AnyObject> = {
    $unsync: () => void;
    $upsert: (newData: NormalizedRow<T>[]) => any;
    getItems: () => AnyObject[];
};
export type SubscriptionSingle<T extends AnyObject = AnyObject, Full extends boolean = false> = {
    _onChange: SingleChangeListener<T, Full>;
    notify: (data: T, delta?: DeepPartial<NormalizedRow<T>>) => void | Promise<void>;
    idObj: Partial<T>;
    handlesOnData?: boolean;
    handles?: SingleSyncHandles<T, Full>;
};
export type SubscriptionMulti<T extends AnyObject = AnyObject> = {
    _onChange: MultiChangeListener<T>;
    notify: (data: T[], delta: DeepPartial<T>[]) => T[];
    idObj?: Partial<T>;
    handlesOnData?: boolean;
    handles?: MultiSyncHandles<T>;
};
export type MultiChangeListener<T extends AnyObject = AnyObject> = (items: NormalizedRow<T>[], delta: DeepPartial<T>[]) => any;
export type SingleChangeListener<T extends AnyObject = AnyObject, Full extends boolean | undefined = false> = (item: SyncDataItem<T, {
    handlesOnData: Full;
}>, delta?: DeepPartial<NormalizedRow<T>>) => void | Promise<void>;
export type SyncedTableOptions = {
    /**
     * Table name
     */
    name: string;
    /**
     * Basic filter
     */
    filter: undefined | EqualityFilter<AnyObject>;
    /**
     * Data change listener.
     * Called on first sync and every time the data changes
     */
    onChange?: MultiChangeListener;
    db: DBHandlerClient | Partial<DBHandlerClient>;
    select: FieldFilter | undefined;
    columns: ValidatedColumnInfo[];
    onDebug?: (event: SyncDebugEvent) => Promise<void> | void;
};
export type DbTableSync = {
    unsync: () => void;
    syncData: (data?: AnyObject[], deleted?: AnyObject[], cb?: (err?: any) => void) => void;
};
export declare const mergeDeep: (_target: Record<string, unknown> | undefined, _source: Record<string, unknown> | undefined) => {
    [x: string]: unknown;
};
export declare const quickClone: <T>(obj: T) => T;
export {};
//# sourceMappingURL=SyncedTable.d.ts.map