import {
  CHANNEL_PREFIX,
  getSyncChannelName,
  type ClientSyncHandles,
  type ReplicationState,
} from "prostgles-types";
import type { Socket } from "socket.io-client";
import { type AnyFunction, type SyncDebugEvent } from "../prostgles";
import type { DbTableSync, SyncedTableOptions } from "./SyncedTable";

export const createSyncStateUtils = (
  socket: Socket,
  options: Omit<SyncedTableOptions, "onReady">,
) => {
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

  const _sync = async (handles: ClientSyncHandles) => {
    const sync_info = await new Promise<
      ReplicationState["channels"]["CHANNEL_PREFIX"]["client.emit"]["server.response"]["data"]
    >((resolve, reject) => {
      socket.emit(
        CHANNEL_PREFIX,
        {
          tableName: name,
          command: "sync",
          param1: filter,
          param2: { select },
        } satisfies ReplicationState["channels"]["CHANNEL_PREFIX"]["client.emit"]["data"],
        (
          err: any,
          syncInfo: ReplicationState["channels"]["CHANNEL_PREFIX"]["client.emit"]["server.response"]["data"],
        ) => {
          if (err) {
            console.error(err);
            reject(err);
          } else if (syncInfo as unknown) {
            const { channelName } = syncInfo;

            socket.emit(
              channelName,
              { onSyncRequest: handles.onSyncRequest({}) },
              (response: any) => {
                console.log(response);
              },
            );
            resolve(syncInfo);
          }
        },
      );
    });
    const onCall = function (data: any | undefined, cb: AnyFunction) {
      /*               
            Client will:
            1. Send last_synced     on(onSyncRequest)
            2. Send data >= server_synced   on(onPullRequest)
            3. Send data on CRUD    emit(data.data)
            4. Upsert data.data     on(data.data)
        */
      if (!data) return;

      const { onUpdates, onSyncRequest, onPullRequest } = handles;
      // syncedTables.get(channelName)?.then((syncedTable) => {
      //   onDebug?.({
      //     type: "sync",
      //     command:
      //       data.data ? "onUpdates"
      //       : data.onSyncRequest ? "onSyncRequest"
      //       : "onPullRequest",
      //     tableName,
      //     channelName,
      //     data,
      //     options: { n filter, select },
      //   });
      // });
      if (data.data) {
        Promise.resolve(onUpdates(data))
          .then(() => {
            cb({ ok: true });
          })
          .catch((err) => {
            cb({ err });
          });
      } else if (data.onSyncRequest) {
        Promise.resolve(onSyncRequest(data.onSyncRequest))
          .then((res) => cb({ onSyncRequest: res }))
          .catch((err) => {
            cb({ err });
          });
      } else if (data.onPullRequest) {
        Promise.resolve(onPullRequest(data.onPullRequest))
          .then((result) => {
            cb(result);
          })
          .catch((err) => {
            cb({ err });
          });
      } else {
        console.log("unexpected response");
      }
    };

    socket.on(channelName, onCall);

    const syncData: DbTableSync["syncData"] = function (data, deleted, cb) {
      socket.emit(
        channelName,
        {
          onSyncRequest: {
            ...handles.onSyncRequest({}),
            ...{ data },
            ...{ deleted },
          },
        },
        !cb ? null : (
          (response?: any) => {
            cb(response);
          }
        ),
      );
    };
    const unsync = () => {
      return new Promise((resolve, reject) => {
        socket.emit(channelName + "unsync", {}, (err: any, res: any) => {
          if (err) reject(err);
          else resolve(res);
        });
        socket.removeListener(channelName, onCall);
      });
    };

    return { sync_info, unsync, syncData };
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
    _sync,
    filter,
    select,
    tableHandler,
  };
};
