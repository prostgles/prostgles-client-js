import {
  getSyncChannelName,
  type AnyObject,
  type DBSchemaTable,
  type EqualityFilter,
  type FieldFilter,
  type ValidatedColumnInfo,
} from "prostgles-types";
import type { DBHandlerClient, InitOptions } from "./prostgles";
import { createSync } from "./SyncedTable/createSync";
import type { SingleChangeListener, Sync, SyncOne } from "./SyncedTable/SyncedTable";

export const getSyncHandler = ({ socket, onDebug }: Pick<InitOptions, "socket" | "onDebug">) => {
  let currentSchema: { db: Partial<DBHandlerClient>; tables: DBSchemaTable[] } | undefined;
  const syncs = new Map<
    string,
    {
      options: {
        tableName: string;
        filter: EqualityFilter<AnyObject> | undefined;
        select: FieldFilter | undefined;
      };
      sync: ReturnType<typeof createSync>;
    }
  >();

  const upsertSync = async (
    db: Partial<DBHandlerClient>,
    columns: ValidatedColumnInfo[],
    tableName: string,
    filter: EqualityFilter<AnyObject> | undefined,
    select: FieldFilter | undefined,
  ) => {
    db = currentSchema?.db ?? db;
    columns = currentSchema?.tables.find((table) => table.name === tableName)?.columns ?? columns;
    if (!db[tableName]?._syncInfo) {
      throw new Error(`Table ${tableName} does not support sync`);
    }
    const channelName = getSyncChannelName({
      filter,
      select,
      tableName,
    });

    const syncConfig = syncs.get(channelName) ?? {
      options: { tableName, filter, select },
      sync: createSync(socket, {
        name: tableName,
        filter,
        select,
        onDebug,
        db,
        columns,
      }),
    };
    syncs.set(channelName, syncConfig);
    return syncConfig.sync;
  };

  const getTableSyncFunctions = async ({
    db,
    tableName,
    columns,
  }: {
    db: Partial<DBHandlerClient>;
    tableName: string;
    columns: ValidatedColumnInfo[];
  }) => {
    const addSync = (async (filter, opts, onChange, onError) => {
      const { sync } = await upsertSync(db, columns, tableName, filter, opts.select);

      return sync(onChange as Parameters<Sync<AnyObject>>[2], opts.handlesOnData, onError);
    }) as Sync<AnyObject>;

    const addSyncOne = (async (filter, opts, onChange, onError) => {
      const { syncOne } = await upsertSync(db, columns, tableName, filter, opts.select);

      return syncOne(filter, onChange as SingleChangeListener, opts.handlesOnData, onError);
    }) as SyncOne<AnyObject>;

    return { addSync, addSyncOne };
  };

  const reAttachAll = async (db: Partial<DBHandlerClient>, tables: DBSchemaTable[] = []) => {
    currentSchema = { db, tables };
    for (const { sync, options } of syncs.values()) {
      try {
        const columns = tables.find((table) => table.name === options.tableName)?.columns ?? [];
        await (await sync).reAttach({ db, columns });
      } catch (error) {
        console.error("Failed to reattach sync", error);
      }
    }
  };

  return { getTableSyncFunctions, reAttachAll };
};
