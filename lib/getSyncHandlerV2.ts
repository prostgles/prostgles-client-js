import {
  getSyncChannelName,
  type AnyObject,
  type EqualityFilter,
  type FieldFilter,
  type ValidatedColumnInfo,
} from "prostgles-types";
import type { DBHandlerClient, InitOptions } from "./prostgles";
import { createSync } from "./SyncedTable/createSync";
import type { SingleChangeListener, Sync, SyncOne } from "./SyncedTable/SyncedTable";

export const getSyncHandlerV2 = ({ socket, onDebug }: Pick<InitOptions, "socket" | "onDebug">) => {
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
    const channelName = getSyncChannelName({
      filter,
      select,
      tableName,
    });
    syncs.set(
      channelName,
      syncs.get(channelName) ?? {
        options: { tableName, filter, select },
        sync: createSync(socket, {
          name: tableName,
          filter,
          select,
          onDebug,
          db,
          columns,
        }),
      },
    );
    return syncs.get(channelName)!.sync;
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
    const addSync = (async (filter, opts, onChange) => {
      const { sync } = await upsertSync(db, columns, tableName, filter, opts.select);

      return sync(onChange as Parameters<Sync<AnyObject>>[2], opts.handlesOnData);
    }) as Sync<AnyObject>;

    const addSyncOne = (async (filter, opts, onChange) => {
      const { syncOne } = await upsertSync(db, columns, tableName, filter, opts.select);

      return syncOne(filter, onChange as SingleChangeListener, opts.handlesOnData);
    }) as SyncOne<AnyObject>;

    return { addSync, addSyncOne };
  };

  return { getTableSyncFunctions };
};
