import {
  type AnyObject,
  CHANNELS,
  type ClientSchema,
  type DBSchemaTable,
  getKeys,
  getObjectEntries,
  isObject,
  omitKeys,
  type TableSchemaForClient,
} from "prostgles-types";
import {
  type InitOptions,
  type TableHandlerClient,
  type AnyFunction,
  type DBHandlerClient,
  useSync,
  useSubscribe,
  useFetch,
} from "./prostgles";
import {
  quickClone,
  type Sync,
  type SyncedTable,
  type SyncOne,
  type SyncOptions,
} from "./SyncedTable/SyncedTable";
import type { getSyncHandler } from "./getSyncHandler";
import type { getSubscriptionHandler } from "./getSubscriptionHandler";

type Args = {
  schema: TableSchemaForClient;
  tableSchema: DBSchemaTable[] | undefined;
  onDebug: InitOptions["onDebug"];
  socket: InitOptions["socket"];
  joinTables: ClientSchema["joinTables"];
  syncedTable: typeof SyncedTable | undefined;
  syncHandler: ReturnType<typeof getSyncHandler>;
  subscriptionHandler: ReturnType<typeof getSubscriptionHandler>;
};

const preffix = CHANNELS._preffix;

export const getDBO = ({
  schema,
  tableSchema,
  onDebug,
  syncedTable,
  syncHandler,
  subscriptionHandler,
  socket,
  joinTables,
}: Args) => {
  /* Building DBO object */
  const checkSubscriptionArgs = (
    basicFilter: AnyObject | undefined,
    options: AnyObject | undefined,
    onChange: AnyFunction,
    onError?: AnyFunction,
  ) => {
    if (
      (basicFilter !== undefined && !isObject(basicFilter)) ||
      (options !== undefined && !isObject(options)) ||
      !(typeof onChange === "function") ||
      (onError !== undefined && typeof onError !== "function")
    ) {
      throw "Expecting: ( basicFilter<object>, options<object>, onChange<function> , onError?<function>) but got something else";
    }
  };
  const sub_commands = ["subscribe", "subscribeOne"] as const;

  const dbo: Partial<DBHandlerClient> = {};

  const schemaClone = quickClone(schema);
  getObjectEntries(schemaClone).forEach(([tableName, methods]) => {
    dbo[tableName] ??= {};

    const allowedCommands = getKeys(methods);
    const dboTable = dbo[tableName] as TableHandlerClient;
    allowedCommands
      .sort(
        (a, b) => <never>sub_commands.includes(a as any) - <never>sub_commands.includes(b as any),
      )
      .forEach((command) => {
        if (command === "sync") {
          dboTable._syncInfo = { ...dboTable[command] };
          if (syncedTable) {
            dboTable.getSync = async (filter, params = {}) => {
              await onDebug?.({
                type: "table",
                command: "getSync",
                tableName,
                data: { filter, params },
              });
              return syncedTable.create({
                name: tableName,
                onDebug: onDebug as any,
                filter,
                db: dbo,
                ...params,
              });
            };
            const upsertSyncTable = async (
              basicFilter = {},
              options: SyncOptions = {},
              onError,
            ) => {
              const syncName = `${tableName}.${JSON.stringify(basicFilter)}.${JSON.stringify(omitKeys(options, ["handlesOnData"]))}`;
              if (!syncHandler.syncedTables[syncName]) {
                syncHandler.syncedTables[syncName] = await syncedTable.create({
                  ...options,
                  onDebug: onDebug as any,
                  name: tableName,
                  filter: basicFilter,
                  db: dbo,
                  onError,
                });
              }
              return syncHandler.syncedTables[syncName];
            };
            const sync: Sync<AnyObject> = async (
              basicFilter,
              options = { handlesOnData: true, select: "*" },
              onChange,
              onError,
            ) => {
              await onDebug?.({
                type: "table",
                command: "sync",
                tableName,
                data: { basicFilter, options },
              });
              checkSubscriptionArgs(basicFilter, options, onChange, onError);
              const s = await upsertSyncTable(basicFilter, options, onError);
              return await s.sync(onChange, options.handlesOnData);
            };
            const syncOne: SyncOne<AnyObject> = async (
              basicFilter,
              options = { handlesOnData: true },
              onChange,
              onError,
            ) => {
              await onDebug?.({
                type: "table",
                command: "syncOne",
                tableName,
                data: { basicFilter, options },
              });
              checkSubscriptionArgs(basicFilter, options, onChange, onError);
              const s = await upsertSyncTable(basicFilter, options, onError);
              return await s.syncOne(basicFilter, onChange, options.handlesOnData);
            };
            dboTable.sync = sync;
            dboTable.syncOne = syncOne;
            // eslint-disable-next-line react-hooks/rules-of-hooks
            dboTable.useSync = (basicFilter, options) => useSync(sync, basicFilter, options) as any;
            dboTable.useSyncOne = (basicFilter, options) =>
              // eslint-disable-next-line react-hooks/rules-of-hooks
              useSync(syncOne, basicFilter, options) as any;
          }

          dboTable._sync = async function (param1, param2, syncHandles) {
            await onDebug?.({
              type: "table",
              command: "_sync",
              tableName,
              data: { param1, param2, syncHandles },
            });
            return syncHandler.addSync({ tableName, command, param1, param2 }, syncHandles);
          };
        } else if (sub_commands.includes(command as any)) {
          const subFunc = async function (param1 = {}, param2 = {}, onChange, onError) {
            await onDebug?.({
              type: "table",
              command: command as (typeof sub_commands)[number],
              tableName,
              data: { param1, param2, onChange, onError },
            });
            checkSubscriptionArgs(param1, param2, onChange, onError);
            return subscriptionHandler.addSub(
              dbo,
              { tableName, command, param1, param2 },
              onChange,
              onError,
            );
          };
          dboTable[command] = subFunc;
          const SUBONE = "subscribeOne";

          /**
           * React hooks
           */
          const handlerName =
            command === "subscribe" ? "useSubscribe"
            : command === "subscribeOne" ? "useSubscribeOne"
            : undefined;
          if (handlerName) {
            dboTable[handlerName] = (filter, options) =>
              // eslint-disable-next-line react-hooks/rules-of-hooks
              useSubscribe(subFunc, command === SUBONE, filter, options);
          }

          if (command === SUBONE || !sub_commands.includes(SUBONE)) {
            dboTable[SUBONE] = async function (param1, param2, onChange, onError) {
              await onDebug?.({
                type: "table",
                command: "getSync",
                tableName,
                data: { param1, param2, onChange, onError },
              });
              checkSubscriptionArgs(param1, param2, onChange, onError);

              const onChangeOne = (rows) => {
                onChange(rows[0]);
              };
              return subscriptionHandler.addSub(
                dbo,
                { tableName, command, param1, param2 },
                onChangeOne,
                onError,
              );
            };
          }
        } else {
          const method = async function (param1, param2, param3) {
            if (command === "getColumns" && !param1 && !param2 && !param3) {
              const columns = tableSchema?.find((t) => t.name === tableName)?.columns;
              if (columns) return columns;
            }
            await onDebug?.({
              type: "table",
              command: command as any,
              tableName,
              data: { param1, param2, param3 },
            });
            return new Promise((resolve, reject) => {
              socket.emit(
                preffix,
                { tableName, command, param1, param2, param3 },

                /* Get col definition and re-cast data types?! */
                (err, res) => {
                  if (err) reject(err);
                  else resolve(res);
                },
              );
            });
          };
          dboTable[command] = method;

          const methodName =
            command === "findOne" ? "useFindOne"
            : command === "find" ? "useFind"
            : command === "count" ? "useCount"
            : command === "size" ? "useSize"
            : undefined;
          if (methodName) {
            dboTable[methodName] = (param1, param2, param3?) =>
              // eslint-disable-next-line react-hooks/rules-of-hooks
              useFetch(method, [param1, param2, param3]);
          }
          if (["find", "findOne"].includes(command)) {
            dboTable.getJoinedTables = function () {
              return joinTables
                .filter((tb) => Array.isArray(tb) && tb.includes(tableName))
                .flat()
                .filter((t) => t !== tableName);
            };
          }
        }
      });
  });

  return { dbo };
};
