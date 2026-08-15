import {
  CHANNEL_PREFIX,
  getSyncChannelName,
  ReplicationProtocol,
  type ClientSyncHandles,
} from "prostgles-types";
import type { Socket } from "socket.io-client";
import { type SyncDebugEvent } from "../prostgles";
import type { DbTableSync, SyncedTableOptions } from "./SyncedTable";

export const createSyncStateUtils = (socket: Socket, options: SyncedTableOptions) => {
  const state = { isSynced: false };
  const { db, name, select = "*", filter = {}, columns } = options;
  const channelName = getSyncChannelName({ filter, select, tableName: name });
  const onDebug = (evt: Omit<SyncDebugEvent, "type" | "tableName" | "channelName" | "options">) =>
    options.onDebug?.({
      ...evt,
      type: "sync",
      tableName: name,
      channelName,
      options,
    });

  onDebug({ command: "create", data: { name, filter, select } });

  const tableHandler = db[name];
  if (!tableHandler) {
    throw `${name} table not found in db`;
  }

  const { _syncInfo } = tableHandler;
  if (!_syncInfo) {
    throw `${name} table does not support sync`;
  }
  const { id_fields, synced_field, throttle = 100, batch_size = 50 } = _syncInfo;
  if (!id_fields.length || !synced_field) {
    throw "id_fields/synced_field missing";
  }

  const initializeSync = async (handles: ClientSyncHandles) => {
    const syncInfo = await new Promise<ReplicationProtocol.CreateSchemaResponse>(
      (resolve, reject) => {
        socket.emit(
          CHANNEL_PREFIX,
          {
            tableName: name,
            command: "sync",
            param1: filter,
            param2: { select },
          } satisfies ReplicationProtocol.CreateSchemaRequest,
          (err: any, syncInfo: ReplicationProtocol.CreateSchemaResponse) => {
            if (err) {
              console.error(err);
              reject(err);
            } else {
              resolve(syncInfo);
            }
          },
        );
      },
    );

    const handlers = ReplicationProtocol.getClientHandlers(channelName, socket, {
      PullRequest: handles.onPullRequest,
      ServerSyncRequest: handles.onSyncRequest,
      UpdateRequest: handles.onUpdates,
    });

    const syncData: DbTableSync["syncData"] = async (data) => {
      const { c_count, c_fr, c_lr } = await handles.onSyncRequest({});
      handlers.ClientSyncRequest(
        data && c_fr && c_lr ?
          { state: "syncing-data", c_count, c_fr, c_lr, data }
        : { state: "syncing", c_count, c_fr, c_lr },
      );
    };
    const unsync = () => {
      return new Promise((resolve, reject) => {
        socket.emit(channelName + "unsync", {}, (err: any, res: any) => {
          if (err) reject(err);
          else resolve(res);
        });
        socket.removeAllListeners(channelName);
      });
    };

    return { syncInfo, unsync, syncData, handlers };
  };

  return {
    state,
    onDebug,
    id_fields,
    synced_field,
    throttle,
    batch_size,
    columns,
    _syncInfo,
    initializeSync,
    filter,
    select,
    tableHandler,
  };
};
