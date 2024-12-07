import { type AnyObject, CHANNELS, type ClientSchema, getKeys, isObject, omitKeys, type TableSchemaForClient } from "prostgles-types";
import { type InitOptions, type TableHandlerClient, type AnyFunction, type DBHandlerClient, useSync, useSubscribe, useFetch } from "./prostgles";
import type { Sync, SyncedTable, SyncOne, SyncOptions } from "./SyncedTable/SyncedTable";
import type { getSyncHandler } from "./syncHandler";
import type { getSubscriptionHandler } from "./subscriptionHandler";


type Args = {
  schema: TableSchemaForClient; 
  onDebug: InitOptions["onDebug"];
  socket: InitOptions["socket"];
  joinTables: ClientSchema["joinTables"];
  syncedTable: typeof SyncedTable | undefined;
  syncHandler: ReturnType<typeof getSyncHandler>;
  subscriptionHandler: ReturnType<typeof getSubscriptionHandler>;
}

const preffix = CHANNELS._preffix;

export const getDBO = ({ schema, onDebug, syncedTable, syncHandler, subscriptionHandler, socket, joinTables }: Args) => {

  const dbo: Partial<DBHandlerClient> = JSON.parse(JSON.stringify(schema));

  /* Building DBO object */
  const checkSubscriptionArgs = (basicFilter: AnyObject | undefined, options: AnyObject | undefined, onChange: AnyFunction, onError?: AnyFunction) => {
    if (basicFilter !== undefined && !isObject(basicFilter) || options !== undefined && !isObject(options) || !(typeof onChange === "function") || onError !== undefined && typeof onError !== "function") {
      throw "Expecting: ( basicFilter<object>, options<object>, onChange<function> , onError?<function>) but got something else";
    }
  }
  const sub_commands = ["subscribe", "subscribeOne"] as const;
  getKeys(dbo).forEach(tableName => {
    const all_commands = Object.keys(dbo[tableName]!);

    const dboTable = dbo[tableName] as TableHandlerClient;
    all_commands
      .sort((a, b) => <never>sub_commands.includes(a as any) - <never>sub_commands.includes(b as any))
      .forEach(command => {

        if (command === "sync") {
          dboTable._syncInfo = { ...dboTable[command] };
          if (syncedTable) {
            dboTable.getSync = async (filter, params = {}) => {
              await onDebug?.({ type: "table", command: "getSync", tableName, data: { filter, params } });
              return syncedTable.create({ 
                name: tableName, 
                onDebug: onDebug as any, 
                filter, 
                db: dbo, 
                ...params 
              });
            }
            const upsertSyncTable = async (basicFilter = {}, options: SyncOptions = {}, onError) => {
              const syncName = `${tableName}.${JSON.stringify(basicFilter)}.${JSON.stringify(omitKeys(options, ["handlesOnData"]))}`
              if (!syncHandler.syncedTables[syncName]) {
                syncHandler.syncedTables[syncName] = await syncedTable.create({ 
                  ...options, 
                  onDebug: onDebug as any, 
                  name: tableName, 
                  filter: basicFilter, 
                  db: dbo, 
                  onError 
                });
              }
              return syncHandler.syncedTables[syncName]
            }
            const sync: Sync<AnyObject> = async (basicFilter, options = { handlesOnData: true, select: "*" }, onChange, onError) => {
              await onDebug?.({ type: "table", command: "sync", tableName, data: { basicFilter, options } });
              checkSubscriptionArgs(basicFilter, options, onChange, onError);
              const s = await upsertSyncTable(basicFilter, options, onError);
              return await s.sync(onChange, options.handlesOnData);
            }
            const syncOne: SyncOne<AnyObject> = async (basicFilter, options = { handlesOnData: true }, onChange, onError) => {
              await onDebug?.({ type: "table", command: "syncOne", tableName, data: { basicFilter, options } });
              checkSubscriptionArgs(basicFilter, options, onChange, onError);
              const s = await upsertSyncTable(basicFilter, options, onError);
              return await s.syncOne(basicFilter, onChange, options.handlesOnData);
            }
            dboTable.sync = sync;
            dboTable.syncOne = syncOne;
            // eslint-disable-next-line react-hooks/rules-of-hooks
            dboTable.useSync = (basicFilter, options) => useSync(sync, basicFilter, options) as any;
            // eslint-disable-next-line react-hooks/rules-of-hooks
            dboTable.useSyncOne = (basicFilter, options) => useSync(syncOne, basicFilter, options) as any;
          }

          dboTable._sync = async function (param1, param2, syncHandles) {
            await onDebug?.({ type: "table", command: "_sync", tableName, data: { param1, param2, syncHandles } });
            return syncHandler.addSync({ tableName, command, param1, param2 }, syncHandles);
          }
        } else if (sub_commands.includes(command as any)) {
          const subFunc = async function (param1 = {}, param2 = {}, onChange, onError) {
            await onDebug?.({ type: "table", command: command as typeof sub_commands[number], tableName, data: { param1, param2, onChange, onError } });
            checkSubscriptionArgs(param1, param2, onChange, onError);
            return subscriptionHandler.addSub(dbo, { tableName, command, param1, param2 }, onChange, onError);
          };
          dboTable[command] = subFunc;
          const SUBONE = "subscribeOne";

          /**
           * React hooks 
           */
          const handlerName = command === "subscribe" ? "useSubscribe" : command === "subscribeOne"? "useSubscribeOne" : undefined;
          if(handlerName){
            // eslint-disable-next-line react-hooks/rules-of-hooks
            dboTable[handlerName] = (filter, options) => useSubscribe(subFunc, command === SUBONE, filter, options)
          }

          if (command === SUBONE || !sub_commands.includes(SUBONE)) {
            dboTable[SUBONE] = async function (param1, param2, onChange, onError) {
              await onDebug?.({ type: "table", command: "getSync", tableName, data: { param1, param2, onChange, onError } });
              checkSubscriptionArgs(param1, param2, onChange, onError);

              const onChangeOne = (rows) => { onChange(rows[0]) };
              return subscriptionHandler.addSub(dbo, { tableName, command, param1, param2 }, onChangeOne, onError);
            };
          }
        } else {
          const method = async function (param1, param2, param3) {
            await onDebug?.({ type: "table", command: command as any, tableName, data: { param1, param2, param3 } });
            return new Promise((resolve, reject) => {
              socket.emit(preffix,
                { tableName, command, param1, param2, param3 },

                /* Get col definition and re-cast data types?! */
                (err, res) => {
                  if (err) reject(err);
                  else resolve(res);
                }
              );
            })
          }
          dboTable[command] = method;

          const methodName = command === "findOne" ? "useFindOne" : command === "find" ? "useFind" : command === "count" ? "useCount" : command === "size" ? "useSize" : undefined;
          if(methodName){
            // eslint-disable-next-line react-hooks/rules-of-hooks
            dboTable[methodName] = (param1, param2, param3?) => useFetch(method, [param1, param2, param3]);
          }
          if (["find", "findOne"].includes(command)) {
            dboTable.getJoinedTables = function () {
              return joinTables
                .filter(tb => Array.isArray(tb) && tb.includes(tableName))
                .flat()
                .filter(t => t !== tableName);
            }
          }
        }
      })
  });

  return { dbo };
}