
import { FullFilter, AnyObject, FullFilterBasic } from "./filters";

export const _PG_strings = ['bpchar','char','varchar','text','citext','uuid','bytea','inet','time','timetz','interval','name'] as const;
export const _PG_numbers = ['int2','int4','int8','float4','float8','numeric','money','oid'] as const;
export const _PG_json = ['json', 'jsonb'] as const;
export const _PG_bool = ['bool'] as const;
export const _PG_date = ['date', 'timestamp', 'timestamptz'] as const;
export const _PG_postgis = ['geometry', 'geography'] as const;
export type PG_COLUMN_UDT_DATA_TYPE = 
    | typeof _PG_strings[number] 
    | typeof _PG_numbers[number] 
    | typeof _PG_json[number] 
    | typeof _PG_bool[number] 
    | typeof _PG_date[number] 
    | typeof _PG_postgis[number];
    
export const TS_PG_Types = {
    "string": _PG_strings,
    "number": _PG_numbers,
    "boolean": _PG_bool,
    "Object": _PG_json,
    "Date": _PG_date,
    "Array<number>": _PG_numbers.map(s => `_${s}`),
    "Array<boolean>": _PG_bool.map(s => `_${s}`),
    "Array<string>": _PG_strings.map(s => `_${s}`),
    "Array<Object>": _PG_json.map(s => `_${s}`),
    "Array<Date>": _PG_date.map(s => `_${s}`),
    "any": [],
} as const;
export type TS_COLUMN_DATA_TYPES = keyof typeof TS_PG_Types;

export type ColumnInfo = {
  name: string;

  /**
   * Column display name. Will be first non empty value from i18n data, comment, name 
   */
  label: string;

  /**
   * Column description (if provided)
   */
  comment: string;

  /**
   * Ordinal position of the column within the table (count starts at 1)
   */
  ordinal_position: number;

  /**
   * True if column is nullable. A not-null constraint is one way a column can be known not nullable, but there may be others.
   */
  is_nullable: boolean;

  /**
   * Simplified data type
   */
  data_type: string;

  /**
   * Postgres raw data types. values starting with underscore means it's an array of that data type
   */
  udt_name: PG_COLUMN_UDT_DATA_TYPE;

  /**
   * Element data type
   */
  element_type: string;

  /**
   * Element raw data type
   */
  element_udt_name: string;

  /**
   * PRIMARY KEY constraint on column. A table can have more then one PK
   */
  is_pkey: boolean;

  /**
   * Foreign key constraint 
   */
  references?: {
    ftable: string;
    fcols: string[];
    cols: string[];
  }

  /**
   * true if column has a default value
   * Used for excluding pkey from insert
   */
  has_default: boolean;

  /**
   * Column default value
   */
  column_default?: any;

  min?: string | number;
  max?: string | number;
  hint?: string;
}

export type ValidatedColumnInfo = ColumnInfo & {

  /**
   * TypeScript data type
   */
  tsDataType: TS_COLUMN_DATA_TYPES;

  /**
   * Fields that can be viewed
   */
  select: boolean;

  /**
   * Fields that can be filtered by
   */
  filter: boolean;

  /**
   * Fields that can be inserted
   */
  insert: boolean;

  /**
   * Fields that can be updated
   */
  update: boolean;

  /**
   * Fields that can be used in the delete filter
   */
  delete: boolean;
}

/**
 * List of fields to include or exclude
 */
export declare type FieldFilter = {} | string[] | "*" | "" | {
  [key: string]: (1 | 0 | boolean);
};

export type AscOrDesc = 1 | -1 | boolean;

/**
 * @example
 * { product_name: -1 } -> SORT BY product_name DESC
 * [{ field_name: (1 | -1 | boolean) }]
 * true | 1 -> ascending
 * false | -1 -> descending
 * Array order is maintained
 * if nullEmpty is true then empty text will be replaced to null (so nulls sorting takes effect on it)
 */
export type _OrderBy<T = AnyObject> = 
  | { [K in keyof Partial<T>]: AscOrDesc }
  | { [K in keyof Partial<T>]: AscOrDesc }[]
  | { key: keyof T, asc?: AscOrDesc, nulls?: "last" | "first", nullEmpty?: boolean }[] 
  | Array<keyof T>
  | keyof T
  ;

export type OrderBy<T = AnyObject> = 
  | _OrderBy<T>
  | _OrderBy<AnyObject>
  ;

export type Select<T = AnyObject> = 
  | { [K in keyof Partial<T>]: any } 
  | {} 
  | undefined 
  | "" 
  | "*" 
  | AnyObject 
  | Array<keyof T>
  ;
export type SelectBasic = 
  | { [key: string]: any } 
  | {} 
  | undefined 
  | "" 
  | "*" 
  ;

/* Simpler types */

 export type SelectParamsBasic = {
  select?: SelectBasic;
  limit?: number;
  offset?: number;
  orderBy?: OrderBy;

  /**
   * Will group by all non aggregated fields specified in select (or all fields by default)
   */
  groupBy?: boolean;

  returnType?: 

  /**
   * Will return the first row as an object. Will throw an error if more than a row is returned. Use limit: 1 to avoid error.
   */
  | "row"

  /**
    * Will return the first value from the selected field
    */
  | "value"

  /**
    * Will return an array of values from the selected field. Similar to array_agg(field).
    */
  | "values"
 ;
}

export type SelectParams<T = AnyObject> = SelectParamsBasic & {
  select?: Select<T>;
  orderBy?: OrderBy<T>;
}
export type SubscribeParams<T = AnyObject> = SelectParams<T> & {
  throttle?: number;
};

export type UpdateParams<T = AnyObject> = {
  returning?: Select<T>;
  onConflictDoNothing?: boolean;
  fixIssues?: boolean;

  /* true by default. If false the update will fail if affecting more than one row */
  multi?: boolean;
}
export type InsertParams<T = AnyObject> = {
  returning?: Select<T>;
  onConflictDoNothing?: boolean;
  fixIssues?: boolean;
}
export type DeleteParams<T = AnyObject> = {
  returning?: Select<T>;
}

export type SubscribeParamsBasic = SelectParamsBasic & {
  throttle?: number;
};

export type UpdateParamsBasic = {
  returning?: SelectBasic;
  onConflictDoNothing?: boolean;
  fixIssues?: boolean;

  /* true by default. If false the update will fail if affecting more than one row */
  multi?: boolean;
}
export type InsertParamsBasic = {
  returning?: SelectBasic;
  onConflictDoNothing?: boolean;
  fixIssues?: boolean;
}
export type DeleteParamsBasic = {
  returning?: SelectBasic;
}
/**
 * Adds unknown props to object
 * Used in represent data returned from a query that can have arbitrary computed fields
 */

export type PartialLax<T = AnyObject> = Partial<T>  & AnyObject;

export type TableInfo = {
  oid: number;
  comment?: string;
  /**
   * Created by prostgles for managing files
   */
  is_media?: boolean;

  /**
   * How many files are expected at most for each row from this table
   */
  has_media?: "one" | "many";

  /**
   * True if the media relates to this table only (does not relate to some joined table)
   */
  has_direct_media?: boolean;

  /**
   * Name of the table that contains the files
   */
  media_table_name?: string;
}

export type OnError = (err: any) => void;

export type SubscriptionHandler<T = AnyObject> = {
    unsubscribe: () => Promise<any>;
    update?: (newData: T, updateParams: UpdateParams<T>) => Promise<any>;
    delete?: (deleteParams: DeleteParams<T>) => Promise<any>;
    filter: FullFilter<T> | {};
}

export type ViewHandler<TD = AnyObject> = {
  getInfo?: (lang?: string) => Promise<TableInfo>;
  getColumns?: (lang?: string) => Promise<ValidatedColumnInfo[]>;
  find: (filter?: FullFilter<TD>, selectParams?: SelectParams<TD>) => Promise<PartialLax<TD>[]>;
  findOne: (filter?: FullFilter<TD>, selectParams?: SelectParams<TD>) => Promise<PartialLax<TD>>;
  subscribe: (filter: FullFilter<TD>, params: SubscribeParams<TD>, onData: (items: PartialLax<TD>[], onError?: OnError) => any) => Promise<SubscriptionHandler<TD>>;
  subscribeOne: (filter: FullFilter<TD>, params: SubscribeParams<TD>, onData: (item: PartialLax<TD>) => any, onError?: OnError) => Promise<SubscriptionHandler<TD>>;
  count: (filter?: FullFilter<TD>) => Promise<number>;
  /**
   * Returns result size in bits
   */
  size: (filter?: FullFilter<TD>, selectParams?: SelectParams<TD>) => Promise<string>;
}

type GetUpdateReturnType<O extends UpdateParams ,TD> = O extends { returning: string }? Promise<PartialLax<TD>> : O extends { returning: object }? Promise<PartialLax<TD>> : Promise<void>;

export type TableHandler<TD = AnyObject> = ViewHandler<TD> & {
  update: <P extends UpdateParams<TD>>(filter: FullFilter<TD>, newData: PartialLax<TD>, params?: UpdateParams<TD>) => GetUpdateReturnType<P ,TD>;
  updateBatch: (data: [FullFilter<TD>, PartialLax<TD>][], params?: UpdateParams<TD>) => Promise<PartialLax<TD> | void>;
  upsert: (filter: FullFilter<TD>, newData: PartialLax<TD>, params?: UpdateParams<TD>) => Promise<PartialLax<TD> | void>;
  insert: <P extends UpdateParams<TD>>(data: (PartialLax<TD> | PartialLax<TD>[]), params?: P ) => GetUpdateReturnType<P ,TD>;
  delete: <P extends UpdateParams<TD>>(filter?: FullFilter<TD>, params?: DeleteParams<TD>) => GetUpdateReturnType<P ,TD>;
}

// (async () => {
//   const c: TableHandler = {} as any;
//   // const c: TableHandler<{ h: number; b: number; c: number; }> = {} as any;
//   // const d = await c.insert({ h: 2});
//   // if(d){
//   //   d.
//   // }

//   // c.subscribe({ h: 2 }, {}, async items => {
//   //   items[0].ddd
//   // });
// })
// c.findOne({ }, { select: { h: 2 }}).then(r => {
//   r.hd;
// });
// c.update({ da: 2 }, { zd: '2' });
// c.subscribe({ x: 10}, {}, d => {
//   d.filter(dd => dd.x === 20);
// })


export type ViewHandlerBasic = {
  getInfo?: (lang?: string) => Promise<TableInfo>;
  getColumns?: (lang?: string) => Promise<ValidatedColumnInfo[]>;
  find: <TD = AnyObject>(filter?: FullFilterBasic, selectParams?: SelectParamsBasic) => Promise<PartialLax<TD>[]>;
  findOne: <TD = AnyObject>(filter?: FullFilterBasic, selectParams?: SelectParamsBasic) => Promise<PartialLax<TD>>;
  subscribe: <TD = AnyObject>(filter: FullFilterBasic, params: SubscribeParamsBasic, onData: (items: PartialLax<TD>[], onError?: OnError) => any) => Promise<{ unsubscribe: () => any }>;
  subscribeOne: <TD = AnyObject>(filter: FullFilterBasic, params: SubscribeParamsBasic, onData: (item: PartialLax<TD>, onError?: OnError) => any) => Promise<{ unsubscribe: () => any }>;
  count: (filter?: FullFilterBasic) => Promise<number>;
  /**
   * Returns result size in bits
   */
  size: (filter?: FullFilterBasic, selectParams?: SelectParamsBasic) => Promise<string>;
}

export type TableHandlerBasic = ViewHandlerBasic & {
  update: <TD = AnyObject>(filter: FullFilterBasic, newData: PartialLax<TD>, params?: UpdateParamsBasic) => Promise<PartialLax<TD> | void>;
  updateBatch: <TD = AnyObject>(data: [FullFilterBasic, PartialLax<TD>][], params?: UpdateParamsBasic) => Promise<PartialLax<TD> | void>;
  upsert: <TD = AnyObject>(filter: FullFilterBasic, newData: PartialLax<TD>, params?: UpdateParamsBasic) => Promise<PartialLax<TD> | void>;
  insert: <TD = AnyObject>(data: (PartialLax<TD> | PartialLax<TD>[]), params?: InsertParamsBasic) => Promise<PartialLax<TD> | void>;
  delete: <TD = AnyObject>(filter?: FullFilterBasic, params?: DeleteParamsBasic) => Promise<PartialLax<TD> | void>;
}

export type MethodHandler = {
  [method_name: string]: (...args: any[]) => Promise<AnyObject>
}

export type JoinMaker<TT = AnyObject> = (filter?: FullFilter<TT>, select?: Select<TT>, options?: SelectParams<TT>) => any;
export type JoinMakerBasic = (filter?: FullFilterBasic, select?: SelectBasic, options?: SelectParamsBasic) => any;

export type TableJoin = {
  [key: string]: JoinMaker;
}
export type TableJoinBasic = {
  [key: string]: JoinMakerBasic;
}

export type DbJoinMaker = {
  innerJoin: TableJoin;
  leftJoin: TableJoin;
  innerJoinOne: TableJoin;
  leftJoinOne: TableJoin;
}

export type SQLResult<T = "object"> = {
  command: "SELECT" | "UPDATE" | "DELETE" | "CREATE" | "ALTER" | "LISTEN" | "UNLISTEN" | "INSERT" | string;
  rowCount: number;
  rows: (T extends "arrayMode"? any[] : AnyObject)[];
  fields: {
      name: string;
      dataType: string;
      udt_name: PG_COLUMN_UDT_DATA_TYPE;
      tsDataType: TS_COLUMN_DATA_TYPES;
      tableName?: string;
      format: string;
  }[];
  duration: number;
}
export type DBEventHandles = {
  socketChannel: string;
  socketUnsubChannel: string;
  addListener: (listener: (event: any) => void) => { removeListener: () => void; } 
};

export type GetReturnType<ReturnType extends SQLOptions["returnType"] = ""> = 
  ReturnType extends "row"? AnyObject :
  ReturnType extends "rows"? AnyObject[] :
  ReturnType extends "value"? any :
  ReturnType extends "values"? any[] :
  ReturnType extends "statement"? string :
  ReturnType extends "noticeSubscription"? DBEventHandles :
  // ReturnType extends undefined? SQLResult :
  SQLResult<ReturnType>;

/**
 * 
 * @param query <string> query. e.g.: SELECT * FROM users;
 * @param params <any[] | object> query arguments to be escaped. e.g.: { name: 'dwadaw' }
 * @param options <object> { returnType: "statement" | "rows" | "noticeSubscription" }
 */
function sql<ReturnType extends SQLOptions["returnType"] = undefined>(
  query: string, 
  args?: any | any[], 
  options?: {
    returnType: ReturnType
  },
  serverSideOptions?: {
    socket: any
  }
): Promise<GetReturnType<ReturnType>> {
  return "" as unknown as any;
}

// sql("",{}, { returnType: ""}).then(res => {
//   res.rows
// })

export type SQLHandler = typeof sql;

export type DBHandler = {
  [key: string]: Partial<TableHandler>;
} & DbJoinMaker;


/**
 * Simpler DBHandler types to reduce load on TS
 */
export type DBHandlerBasic = {
  [key: string]: Partial<TableHandlerBasic>;
} & {
  innerJoin: TableJoinBasic;
  leftJoin: TableJoinBasic;
  innerJoinOne: TableJoinBasic;
  leftJoinOne: TableJoinBasic;
} & {
  sql?: SQLHandler
}



/**
 * Other
 */

export type DBNoticeConfig = {
  socketChannel: string;
  socketUnsubChannel: string;
}

export type DBNotifConfig = DBNoticeConfig & {
  notifChannel: string;
}


export type SQLOptions = {
  /**
   * Return type
   */
  returnType: SelectParamsBasic["returnType"] | "statement" | "rows" | "noticeSubscription" | "arrayMode" | "";
} ;

export type SQLRequest = {
  query: string;
  params?: any | any[];
  options?:  SQLOptions
}

export type NotifSubscription = {
  socketChannel: string;
  socketUnsubChannel: string;
  notifChannel: string;
}

export type NoticeSubscription = {
  socketChannel: string;
  socketUnsubChannel: string;
}

const preffix = "_psqlWS_.";
export const CHANNELS = {
  SCHEMA_CHANGED: preffix + "schema-changed",
  SCHEMA: preffix + "schema",


  DEFAULT: preffix,
  SQL: `${preffix}sql`,
  METHOD: `${preffix}method`,
  NOTICE_EV: `${preffix}notice`,
  LISTEN_EV: `${preffix}listen`,

  /* Auth channels */
  REGISTER: `${preffix}register`,
  LOGIN: `${preffix}login`,
  LOGOUT: `${preffix}logout`,
  AUTHGUARD: `${preffix}authguard`,

  _preffix: preffix,
}

export type AuthGuardLocation = {
  href:     string;
  origin:   string;
  protocol: string;
  host:     string;
  hostname: string;
  port:     string;
  pathname: string;
  search:   string;
  hash:     string;
}
export type AuthGuardLocationResponse = {
  shouldReload: boolean;
}

export const RULE_METHODS = {
  "getColumns": ["getColumns"], 
  "getInfo": ["getInfo"], 
  "insert": ["insert", "upsert"], 
  "update": ["update", "upsert", "updateBatch"], 
  "select": ["findOne", "find", "count", "size"], 
  "delete": ["delete", "remove"],
  "sync": ["sync", "unsync"], 
  "subscribe": ["unsubscribe", "subscribe", "subscribeOne"],  
} as const

export type MethodKey = typeof RULE_METHODS[keyof typeof RULE_METHODS][number]
export type TableSchemaForClient = Record<string, Partial<Record<MethodKey, {} | { err: any }>>>;

/* Schema */
export type TableSchema = {
  schema: string;
  name: string;
  oid: number;
  comment: string;
  columns: (ColumnInfo & {
    privileges: {
      privilege_type: "INSERT" | "REFERENCES" | "SELECT" | "UPDATE";// | "DELETE";
      is_grantable: "YES" | "NO"
    }[];
  })[];
  is_view: boolean;
  parent_tables: string[];
  privileges: {
    insert: boolean;
    select: boolean;
    update: boolean;
    delete: boolean;
  }
}

export type ClientSchema = { 
  rawSQL: boolean;
  joinTables: string[][];
  auth: AnyObject;
  version: any;
  err?: string;
  fullSchema?: TableSchema[];
  schema: TableSchemaForClient;
  methods: string[];
}

/**
 * Auth object sent from server to client
 */
export type AuthSocketSchema = {
  /**
   * User data as returned from server auth.getClientUser
   */
  user?: AnyObject;

  register?: boolean;
  login?: boolean;
  logout?: boolean;

  /**
   * If server auth publicRoutes is set up and AuthGuard is not explicitly disabled ( disableSocketAuthGuard: true ):
   *  on each connect/reconnect the client pathname is checked and page reloaded if it's not a public page and the client is not logged in
   */
  pathGuard?: boolean;
};

// import { md5 } from "./md5";
// export { get, getTextPatch, unpatchText, isEmpty, WAL, WALConfig, asName } from "./util";
export type { WALItem, BasicOrderBy, WALItemsObj, WALConfig, TextPatch, SyncTableInfo } from "./util";
export { asName, getTextPatch, isEmpty, stableStringify, unpatchText, WAL, get } from "./util";
export * from "./filters";
export type { ClientExpressData, ClientSyncHandles, ClientSyncInfo, SyncConfig, ClientSyncPullResponse, SyncBatchParams, onUpdatesParams } from "./replication";
