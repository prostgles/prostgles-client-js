import { FullFilter, AnyObject, FullFilterBasic } from "./filters";
export declare const _PG_strings: readonly ["bpchar", "char", "varchar", "text", "citext", "uuid", "bytea", "inet", "time", "timetz", "interval", "name"];
export declare const _PG_numbers: readonly ["int2", "int4", "int8", "float4", "float8", "numeric", "money", "oid"];
export declare const _PG_json: readonly ["json", "jsonb"];
export declare const _PG_bool: readonly ["bool"];
export declare const _PG_date: readonly ["date", "timestamp", "timestamptz"];
export declare const _PG_postgis: readonly ["geometry", "geography"];
export declare type PG_COLUMN_UDT_DATA_TYPE = typeof _PG_strings[number] | typeof _PG_numbers[number] | typeof _PG_json[number] | typeof _PG_bool[number] | typeof _PG_date[number] | typeof _PG_postgis[number];
export declare const TS_PG_Types: {
    readonly string: readonly ["bpchar", "char", "varchar", "text", "citext", "uuid", "bytea", "inet", "time", "timetz", "interval", "name"];
    readonly number: readonly ["int2", "int4", "int8", "float4", "float8", "numeric", "money", "oid"];
    readonly boolean: readonly ["bool"];
    readonly Object: readonly ["json", "jsonb"];
    readonly Date: readonly ["date", "timestamp", "timestamptz"];
    readonly "Array<number>": string[];
    readonly "Array<boolean>": string[];
    readonly "Array<string>": string[];
    readonly "Array<Object>": string[];
    readonly "Array<Date>": string[];
    readonly any: readonly [];
};
export declare type TS_COLUMN_DATA_TYPES = keyof typeof TS_PG_Types;
export declare type ColumnInfo = {
    name: string;
    label: string;
    comment: string;
    ordinal_position: number;
    is_nullable: boolean;
    data_type: string;
    udt_name: PG_COLUMN_UDT_DATA_TYPE;
    element_type: string;
    element_udt_name: string;
    is_pkey: boolean;
    references?: {
        ftable: string;
        fcols: string[];
        cols: string[];
    };
    has_default: boolean;
    column_default?: any;
    min?: string | number;
    max?: string | number;
    hint?: string;
};
export declare type ValidatedColumnInfo = ColumnInfo & {
    tsDataType: TS_COLUMN_DATA_TYPES;
    select: boolean;
    filter: boolean;
    insert: boolean;
    update: boolean;
    delete: boolean;
};
export declare type FieldFilter = {} | string[] | "*" | "" | {
    [key: string]: (1 | 0 | boolean);
};
export declare type AscOrDesc = 1 | -1 | boolean;
export declare type _OrderBy<T = AnyObject> = {
    [K in keyof Partial<T>]: AscOrDesc;
} | {
    [K in keyof Partial<T>]: AscOrDesc;
}[] | {
    key: keyof T;
    asc?: AscOrDesc;
    nulls?: "last" | "first";
    nullEmpty?: boolean;
}[] | Array<keyof T> | keyof T;
export declare type OrderBy<T = AnyObject> = _OrderBy<T> | _OrderBy<AnyObject>;
export declare type Select<T = AnyObject> = {
    [K in keyof Partial<T>]: any;
} | {} | undefined | "" | "*" | AnyObject | Array<keyof T>;
export declare type SelectBasic = {
    [key: string]: any;
} | {} | undefined | "" | "*";
export declare type SelectParamsBasic = {
    select?: SelectBasic;
    limit?: number;
    offset?: number;
    orderBy?: OrderBy;
    groupBy?: boolean;
    returnType?: "row" | "value" | "values";
};
export declare type SelectParams<T = AnyObject> = SelectParamsBasic & {
    select?: Select<T>;
    orderBy?: OrderBy<T>;
};
export declare type SubscribeParams<T = AnyObject> = SelectParams<T> & {
    throttle?: number;
};
export declare type UpdateParams<T = AnyObject> = {
    returning?: Select<T>;
    onConflictDoNothing?: boolean;
    fixIssues?: boolean;
    multi?: boolean;
};
export declare type InsertParams<T = AnyObject> = {
    returning?: Select<T>;
    onConflictDoNothing?: boolean;
    fixIssues?: boolean;
};
export declare type DeleteParams<T = AnyObject> = {
    returning?: Select<T>;
};
export declare type SubscribeParamsBasic = SelectParamsBasic & {
    throttle?: number;
};
export declare type UpdateParamsBasic = {
    returning?: SelectBasic;
    onConflictDoNothing?: boolean;
    fixIssues?: boolean;
    multi?: boolean;
};
export declare type InsertParamsBasic = {
    returning?: SelectBasic;
    onConflictDoNothing?: boolean;
    fixIssues?: boolean;
};
export declare type DeleteParamsBasic = {
    returning?: SelectBasic;
};
export declare type PartialLax<T = AnyObject> = Partial<T> & AnyObject;
export declare type TableInfo = {
    oid: number;
    comment?: string;
    is_media?: boolean;
    has_media?: "one" | "many";
    has_direct_media?: boolean;
    media_table_name?: string;
};
export declare type OnError = (err: any) => void;
export declare type SubscriptionHandler<T = AnyObject> = {
    unsubscribe: () => Promise<any>;
    update?: (newData: T, updateParams: UpdateParams<T>) => Promise<any>;
    delete?: (deleteParams: DeleteParams<T>) => Promise<any>;
    filter: FullFilter<T> | {};
};
export declare type ViewHandler<TD = AnyObject> = {
    getInfo?: (lang?: string) => Promise<TableInfo>;
    getColumns?: (lang?: string) => Promise<ValidatedColumnInfo[]>;
    find: (filter?: FullFilter<TD>, selectParams?: SelectParams<TD>) => Promise<PartialLax<TD>[]>;
    findOne: (filter?: FullFilter<TD>, selectParams?: SelectParams<TD>) => Promise<PartialLax<TD>>;
    subscribe: (filter: FullFilter<TD>, params: SubscribeParams<TD>, onData: (items: PartialLax<TD>[], onError?: OnError) => any) => Promise<SubscriptionHandler<TD>>;
    subscribeOne: (filter: FullFilter<TD>, params: SubscribeParams<TD>, onData: (item: PartialLax<TD>) => any, onError?: OnError) => Promise<SubscriptionHandler<TD>>;
    count: (filter?: FullFilter<TD>) => Promise<number>;
    size: (filter?: FullFilter<TD>, selectParams?: SelectParams<TD>) => Promise<string>;
};
declare type GetUpdateReturnType<O extends UpdateParams, TD> = O extends {
    returning: string;
} ? Promise<PartialLax<TD>> : O extends {
    returning: object;
} ? Promise<PartialLax<TD>> : Promise<void>;
export declare type TableHandler<TD = AnyObject> = ViewHandler<TD> & {
    update: <P extends UpdateParams<TD>>(filter: FullFilter<TD>, newData: PartialLax<TD>, params?: UpdateParams<TD>) => GetUpdateReturnType<P, TD>;
    updateBatch: (data: [FullFilter<TD>, PartialLax<TD>][], params?: UpdateParams<TD>) => Promise<PartialLax<TD> | void>;
    upsert: (filter: FullFilter<TD>, newData: PartialLax<TD>, params?: UpdateParams<TD>) => Promise<PartialLax<TD> | void>;
    insert: <P extends UpdateParams<TD>>(data: (PartialLax<TD> | PartialLax<TD>[]), params?: P) => GetUpdateReturnType<P, TD>;
    delete: <P extends UpdateParams<TD>>(filter?: FullFilter<TD>, params?: DeleteParams<TD>) => GetUpdateReturnType<P, TD>;
};
export declare type ViewHandlerBasic = {
    getInfo?: (lang?: string) => Promise<TableInfo>;
    getColumns?: (lang?: string) => Promise<ValidatedColumnInfo[]>;
    find: <TD = AnyObject>(filter?: FullFilterBasic, selectParams?: SelectParamsBasic) => Promise<PartialLax<TD>[]>;
    findOne: <TD = AnyObject>(filter?: FullFilterBasic, selectParams?: SelectParamsBasic) => Promise<PartialLax<TD>>;
    subscribe: <TD = AnyObject>(filter: FullFilterBasic, params: SubscribeParamsBasic, onData: (items: PartialLax<TD>[], onError?: OnError) => any) => Promise<{
        unsubscribe: () => any;
    }>;
    subscribeOne: <TD = AnyObject>(filter: FullFilterBasic, params: SubscribeParamsBasic, onData: (item: PartialLax<TD>, onError?: OnError) => any) => Promise<{
        unsubscribe: () => any;
    }>;
    count: (filter?: FullFilterBasic) => Promise<number>;
    size: (filter?: FullFilterBasic, selectParams?: SelectParamsBasic) => Promise<string>;
};
export declare type TableHandlerBasic = ViewHandlerBasic & {
    update: <TD = AnyObject>(filter: FullFilterBasic, newData: PartialLax<TD>, params?: UpdateParamsBasic) => Promise<PartialLax<TD> | void>;
    updateBatch: <TD = AnyObject>(data: [FullFilterBasic, PartialLax<TD>][], params?: UpdateParamsBasic) => Promise<PartialLax<TD> | void>;
    upsert: <TD = AnyObject>(filter: FullFilterBasic, newData: PartialLax<TD>, params?: UpdateParamsBasic) => Promise<PartialLax<TD> | void>;
    insert: <TD = AnyObject>(data: (PartialLax<TD> | PartialLax<TD>[]), params?: InsertParamsBasic) => Promise<PartialLax<TD> | void>;
    delete: <TD = AnyObject>(filter?: FullFilterBasic, params?: DeleteParamsBasic) => Promise<PartialLax<TD> | void>;
};
export declare type MethodHandler = {
    [method_name: string]: (...args: any[]) => Promise<AnyObject>;
};
export declare type JoinMaker<TT = AnyObject> = (filter?: FullFilter<TT>, select?: Select<TT>, options?: SelectParams<TT>) => any;
export declare type JoinMakerBasic = (filter?: FullFilterBasic, select?: SelectBasic, options?: SelectParamsBasic) => any;
export declare type TableJoin = {
    [key: string]: JoinMaker;
};
export declare type TableJoinBasic = {
    [key: string]: JoinMakerBasic;
};
export declare type DbJoinMaker = {
    innerJoin: TableJoin;
    leftJoin: TableJoin;
    innerJoinOne: TableJoin;
    leftJoinOne: TableJoin;
};
export declare type SQLResult<T = "object"> = {
    command: "SELECT" | "UPDATE" | "DELETE" | "CREATE" | "ALTER" | "LISTEN" | "UNLISTEN" | "INSERT" | string;
    rowCount: number;
    rows: (T extends "arrayMode" ? any[] : AnyObject)[];
    fields: {
        name: string;
        dataType: string;
        udt_name: PG_COLUMN_UDT_DATA_TYPE;
        tsDataType: TS_COLUMN_DATA_TYPES;
        tableName?: string;
        format: string;
    }[];
    duration: number;
};
export declare type DBEventHandles = {
    socketChannel: string;
    socketUnsubChannel: string;
    addListener: (listener: (event: any) => void) => {
        removeListener: () => void;
    };
};
export declare type GetReturnType<ReturnType extends SQLOptions["returnType"] = ""> = ReturnType extends "row" ? AnyObject : ReturnType extends "rows" ? AnyObject[] : ReturnType extends "value" ? any : ReturnType extends "values" ? any[] : ReturnType extends "statement" ? string : ReturnType extends "noticeSubscription" ? DBEventHandles : SQLResult<ReturnType>;
declare function sql<ReturnType extends SQLOptions["returnType"] = undefined>(query: string, args?: any | any[], options?: {
    returnType: ReturnType;
}, serverSideOptions?: {
    socket: any;
}): Promise<GetReturnType<ReturnType>>;
export declare type SQLHandler = typeof sql;
export declare type DBHandler = {
    [key: string]: Partial<TableHandler>;
} & DbJoinMaker;
export declare type DBHandlerBasic = {
    [key: string]: Partial<TableHandlerBasic>;
} & {
    innerJoin: TableJoinBasic;
    leftJoin: TableJoinBasic;
    innerJoinOne: TableJoinBasic;
    leftJoinOne: TableJoinBasic;
} & {
    sql?: SQLHandler;
};
export declare type DBNoticeConfig = {
    socketChannel: string;
    socketUnsubChannel: string;
};
export declare type DBNotifConfig = DBNoticeConfig & {
    notifChannel: string;
};
export declare type SQLOptions = {
    returnType: SelectParamsBasic["returnType"] | "statement" | "rows" | "noticeSubscription" | "arrayMode" | "";
};
export declare type SQLRequest = {
    query: string;
    params?: any | any[];
    options?: SQLOptions;
};
export declare type NotifSubscription = {
    socketChannel: string;
    socketUnsubChannel: string;
    notifChannel: string;
};
export declare type NoticeSubscription = {
    socketChannel: string;
    socketUnsubChannel: string;
};
export declare const CHANNELS: {
    SCHEMA_CHANGED: string;
    SCHEMA: string;
    DEFAULT: string;
    SQL: string;
    METHOD: string;
    NOTICE_EV: string;
    LISTEN_EV: string;
    REGISTER: string;
    LOGIN: string;
    LOGOUT: string;
    AUTHGUARD: string;
    _preffix: string;
};
export declare type AuthGuardLocation = {
    href: string;
    origin: string;
    protocol: string;
    host: string;
    hostname: string;
    port: string;
    pathname: string;
    search: string;
    hash: string;
};
export declare type AuthGuardLocationResponse = {
    shouldReload: boolean;
};
export declare const RULE_METHODS: {
    readonly getColumns: readonly ["getColumns"];
    readonly getInfo: readonly ["getInfo"];
    readonly insert: readonly ["insert", "upsert"];
    readonly update: readonly ["update", "upsert", "updateBatch"];
    readonly select: readonly ["findOne", "find", "count", "size"];
    readonly delete: readonly ["delete", "remove"];
    readonly sync: readonly ["sync", "unsync"];
    readonly subscribe: readonly ["unsubscribe", "subscribe", "subscribeOne"];
};
declare type methodKey = typeof RULE_METHODS[keyof typeof RULE_METHODS][number];
declare type TableSchemaForClient = Record<string, Partial<Record<methodKey, {} | {
    err: any;
}>>>;
export declare type TableSchema = {
    schema: string;
    name: string;
    oid: number;
    comment: string;
    columns: (ColumnInfo & {
        privileges: {
            privilege_type: "INSERT" | "REFERENCES" | "SELECT" | "UPDATE";
            is_grantable: "YES" | "NO";
        }[];
    })[];
    is_view: boolean;
    parent_tables: string[];
    privileges: {
        insert: boolean;
        select: boolean;
        update: boolean;
        delete: boolean;
    };
};
export declare type ClientSchema = {
    rawSQL: boolean;
    joinTables: string[][];
    auth: AnyObject;
    version: any;
    err?: string;
    fullSchema?: TableSchema[];
    schema: TableSchemaForClient;
    methods: string[];
};
export declare type AuthSocketSchema = {
    user?: AnyObject;
    register?: boolean;
    login?: boolean;
    logout?: boolean;
    pathGuard?: boolean;
};
export type { WALItem, BasicOrderBy, WALItemsObj, WALConfig, TextPatch, SyncTableInfo } from "./util";
export { asName, getTextPatch, isEmpty, stableStringify, unpatchText, WAL, get } from "./util";
export * from "./filters";
export type { ClientExpressData, ClientSyncHandles, ClientSyncInfo, SyncConfig, ClientSyncPullResponse, SyncBatchParams, onUpdatesParams } from "./replication";
//# sourceMappingURL=index.d.ts.map