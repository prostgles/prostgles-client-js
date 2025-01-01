import { CHANNELS, isEqual, type ClientSyncHandles } from "prostgles-types";
import { FunctionQueuer } from "./FunctionQueuer";
import type { AnyFunction, CoreParams, InitOptions, SyncInfo } from "./prostgles";
import { debug } from "./prostgles";
import type { DbTableSync } from "./SyncedTable/SyncedTable";

type SyncConfig = CoreParams & {
  onCall: AnyFunction;
  syncInfo: SyncInfo;
  triggers: ClientSyncHandles[];
};
type Syncs = {
  [channelName: string]: SyncConfig;
};

const preffix = CHANNELS._preffix;

export const getSyncHandler = ({ socket, onDebug }: Pick<InitOptions, "socket" | "onDebug">) => {
  let syncedTables: Record<string, any> = {};
  let syncs: Syncs = {};

  const destroySyncs = async () => {
    debug("destroySyncs", { syncedTables });
    syncs = {};
    Object.values(syncedTables).map((s: any) => {
      if (s && s.destroy) s.destroy();
    });
    syncedTables = {};
  };

  function _unsync(channelName: string, triggers: ClientSyncHandles) {
    debug("_unsync", { channelName, triggers });
    return new Promise((resolve, reject) => {
      if (syncs[channelName]) {
        syncs[channelName]!.triggers = syncs[channelName]!.triggers.filter(
          (tr) =>
            tr.onPullRequest !== triggers.onPullRequest &&
            tr.onSyncRequest !== triggers.onSyncRequest &&
            tr.onUpdates !== triggers.onUpdates,
        );

        if (!syncs[channelName]!.triggers.length) {
          socket.emit(channelName + "unsync", {}, (err: any, res: any) => {
            if (err) reject(err);
            else resolve(res);
          });
          socket.removeListener(channelName, syncs[channelName]!.onCall);
          delete syncs[channelName];
        }
      }
    });
  }
  function addServerSync(
    { tableName, command, param1, param2 }: CoreParams,
    onSyncRequest: ClientSyncHandles["onSyncRequest"],
  ): Promise<SyncInfo> {
    return new Promise((resolve, reject) => {
      socket.emit(preffix, { tableName, command, param1, param2 }, (err: any, res: SyncInfo) => {
        if (err) {
          console.error(err);
          reject(err);
        } else if (res as any) {
          const { id_fields, synced_field, channelName } = res;

          socket.emit(channelName, { onSyncRequest: onSyncRequest({}) }, (response: any) => {
            console.log(response);
          });
          resolve({ id_fields, synced_field, channelName });
        }
      });
    });
  }

  const addSyncQueuer = new FunctionQueuer(_addSync, ([{ tableName }]) => tableName);
  async function addSync(params: CoreParams, triggers: ClientSyncHandles): Promise<any> {
    return addSyncQueuer.run([params, triggers]);
  }
  async function _addSync(
    { tableName, command, param1, param2 }: CoreParams,
    triggers: ClientSyncHandles,
  ): Promise<any> {
    const { onSyncRequest } = triggers;

    function makeHandler(channelName: string) {
      const unsync = function () {
        _unsync(channelName, triggers);
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

    const existingChannel = Object.keys(syncs).find((ch) => {
      const s = syncs[ch];
      return (
        s &&
        s.tableName === tableName &&
        s.command === command &&
        isEqual(s.param1, param1) &&
        isEqual(s.param2, param2)
      );
    });

    if (existingChannel) {
      syncs[existingChannel]!.triggers.push(triggers);
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

        if (!syncs[channelName]) return;

        syncs[channelName]!.triggers.map(({ onUpdates, onSyncRequest, onPullRequest }) => {
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
              .then((arr) => {
                cb({ data: arr });
              })
              .catch((err) => {
                cb({ err });
              });
          } else {
            console.log("unexpected response");
          }
        });
      };
      syncs[channelName] = {
        tableName,
        command,
        param1,
        param2,
        triggers: [triggers],
        syncInfo: sync_info,
        onCall,
      };

      socket.on(channelName, onCall);
      return makeHandler(channelName);
    }
  }

  const reAttachAll = async () => {
    let reAttached = 0;
    Object.entries(syncs).forEach(async ([ch, s]) => {
      const firstTrigger = s.triggers[0];
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
