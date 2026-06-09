import {
  CHANNEL_PREFIX,
  isEqual,
  type ClientSyncHandles,
  type ReplicationState,
} from "prostgles-types";
import { FunctionQueuer } from "./FunctionQueuer";
import type { AnyFunction, InitOptions, SyncInfo, SyncParams } from "./prostgles";
import { debug } from "./prostgles";
import type { DbTableSync, SyncedTable } from "./SyncedTable/SyncedTable";

type SyncConfig = SyncParams & {
  onCall: AnyFunction;
  syncInfo: SyncInfo;
  clientSyncHandles: ClientSyncHandles[];
};

export const getSyncHandler = ({ socket, onDebug }: Pick<InitOptions, "socket" | "onDebug">) => {
  const syncedTables = new Map<string, Promise<SyncedTable>>();
  const syncs = new Map<string, SyncConfig>();

  const destroySyncs = async () => {
    debug("destroySyncs", { syncedTables });
    syncs.clear();
    Array.from(syncedTables.values()).forEach((s) => {
      s.then((s) => s.destroy());
    });
    syncedTables.clear();
  };

  function _unsync(channelName: string, triggers: ClientSyncHandles) {
    debug("_unsync", { channelName, triggers });
    return new Promise((resolve, reject) => {
      const sync = syncs.get(channelName);
      if (sync) {
        sync.clientSyncHandles = sync.clientSyncHandles.filter(
          (tr) =>
            tr.onPullRequest !== triggers.onPullRequest &&
            tr.onSyncRequest !== triggers.onSyncRequest &&
            tr.onUpdates !== triggers.onUpdates,
        );

        if (!sync.clientSyncHandles.length) {
          socket.emit(channelName + "unsync", {}, (err: any, res: any) => {
            if (err) reject(err);
            else resolve(res);
          });
          socket.removeListener(channelName, sync.onCall);
          syncs.delete(channelName);
        }
      }
    });
  }
  function addServerSync(
    { tableName, command, param1 = {}, param2 }: SyncParams,
    onSyncRequest: ClientSyncHandles["onSyncRequest"],
  ): Promise<SyncInfo> {
    return new Promise<SyncInfo>((resolve, reject) => {
      socket.emit(
        CHANNEL_PREFIX,
        {
          tableName,
          command,
          param1,
          param2,
        } satisfies ReplicationState["channels"]["CHANNEL_PREFIX"]["client.emit"]["data"],
        (
          err: any,
          syncInfo: ReplicationState["channels"]["CHANNEL_PREFIX"]["client.emit"]["server.response"]["data"],
        ) => {
          onDebug?.({
            type: "table",
            command: "sync",
            tableName,
            data: { param1, param2 },
          });
          if (err) {
            console.error(err);
            reject(err);
          } else if (syncInfo as unknown) {
            const { id_fields, synced_field, channelName } = syncInfo;

            socket.emit(channelName, { onSyncRequest: onSyncRequest({}) }, (response: any) => {
              console.log(response);
            });
            resolve({ id_fields, synced_field, channelName });
          }
        },
      );
    });
  }

  const addSyncQueuer = new FunctionQueuer(_addSync, ([{ tableName }]) => tableName);
  async function addSync(params: SyncParams, triggers: ClientSyncHandles): Promise<any> {
    return addSyncQueuer.run([params, triggers]);
  }
  async function _addSync(
    { tableName, command, param1, param2 }: SyncParams,
    clientSyncHandlers: ClientSyncHandles,
  ): Promise<any> {
    const { onSyncRequest } = clientSyncHandlers;

    function makeHandler(channelName: string) {
      const unsync = function () {
        _unsync(channelName, clientSyncHandlers);
      };

      const syncData: DbTableSync["syncData"] = function (data, deleted, cb) {
        socket.emit(
          channelName,
          {
            onSyncRequest: {
              ...onSyncRequest({}),
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

      return Object.freeze({ unsync, syncData });
    }

    const matchingSync = Array.from(syncs.entries()).find(([ch, s]) => {
      return (
        s.tableName === tableName &&
        isEqual(s.param1, param1) &&
        isEqual(s.param2.select, param2.select)
      );
    });

    if (matchingSync) {
      const [existingChannel, existingSync] = matchingSync;
      existingSync.clientSyncHandles.push(clientSyncHandlers);
      return makeHandler(existingChannel);
    } else {
      const sync_info = await addServerSync({ tableName, command, param1, param2 }, onSyncRequest);
      const { channelName } = sync_info;
      const onCall = function (data: any | undefined, cb: AnyFunction) {
        /*               
            Client will:
            1. Send last_synced     on(onSyncRequest)
            2. Send data >= server_synced   on(onPullRequest)
            3. Send data on CRUD    emit(data.data)
            4. Upsert data.data     on(data.data)
        */
        if (!data) return;

        const matchingSync = syncs.get(channelName);
        if (!matchingSync) return;

        matchingSync.clientSyncHandles.map(({ onUpdates, onSyncRequest, onPullRequest }) => {
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
        });
      };
      syncs.set(channelName, {
        tableName,
        command,
        param1,
        param2,
        clientSyncHandles: [clientSyncHandlers],
        syncInfo: sync_info,
        onCall,
      });

      socket.on(channelName, onCall);
      return makeHandler(channelName);
    }
  }

  const reAttachAll = async () => {
    let reAttached = 0;
    Array.from(syncs.entries()).forEach(async ([ch, s]) => {
      const firstTrigger = s.clientSyncHandles[0];
      if (firstTrigger) {
        try {
          await addServerSync(s, firstTrigger.onSyncRequest);
          socket.on(ch, s.onCall);
          reAttached++;
        } catch (err) {
          console.error("There was an issue reconnecting olf subscriptions", err);
        }
      }
    });
    if (reAttached) {
      console.log("reAttached", reAttached, " syncs", syncs);
    }
  };

  return {
    destroySyncs,
    syncedTables,
    addSync,
    reAttachAll,
  };
};
