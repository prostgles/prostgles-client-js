import {
  type AnyObject,
  CHANNELS,
  type DBSchemaTable,
  getAllowedTableMethods,
  includes,
  isObject,
} from "prostgles-types";
import type { getSubscriptionHandler } from "./getSubscriptionHandler";
import type { getSyncHandlerV2 } from "./getSyncHandlerV2";
import { useFetch } from "./hooks/useFetch";
import { useSubscribe } from "./hooks/useSubscribe";
import { useSync } from "./hooks/useSync";
import {
  type AnyFunction,
  type DBHandlerClient,
  type InitOptions,
  type TableHandlerClient,
} from "./prostgles";
import {
  type OnChange,
  type OnChangeOne,
  quickClone,
  type Sync,
  type SyncOne,
  type SyncOneOptions,
  type SyncOptions,
} from "./SyncedTable/SyncedTable";

type Args = {
  tableSchema: DBSchemaTable[] | undefined;
  onDebug: InitOptions["onDebug"];
  socket: InitOptions["socket"];
  syncHandlerV2: ReturnType<typeof getSyncHandlerV2>;
  subscriptionHandler: ReturnType<typeof getSubscriptionHandler>;
};

const prefix = CHANNELS._preffix;

export const getDB = <DBSchema = void>({
  tableSchema,
  onDebug,
  syncHandlerV2,
  subscriptionHandler,
  socket,
}: Args) => {
  /* Building DB object */
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
  const subscribeCommands = ["subscribe", "subscribeOne"] as const;

  const db: Partial<DBHandlerClient> = {};

  const schemaClone = quickClone(tableSchema) ?? [];
  schemaClone.forEach(({ name: tableName, publishInfo, columns }) => {
    const allowedCommands = getAllowedTableMethods({ publishInfo });
    db[tableName] = {};

    const dboTable = db[tableName] as TableHandlerClient;
    allowedCommands
      .sort(
        (a, b) => Number(includes(subscribeCommands, a)) - Number(includes(subscribeCommands, b)),
      )
      .forEach((command) => {
        if (command === "sync") {
          const syncConfig = publishInfo.select?.syncConfig;
          if (!syncConfig) {
            throw `Table ${tableName} does not have syncConfig in publishInfo.select`;
          }
          dboTable._syncInfo = { ...syncConfig };

          const syncOne = (async (
            basicFilter,
            options: SyncOneOptions = { handlesOnData: true },
            onChange: OnChangeOne<AnyObject, SyncOneOptions>,
          ) => {
            await onDebug?.({
              type: "table",
              command: "syncOne",
              tableName,
              data: { basicFilter, options },
            });
            checkSubscriptionArgs(basicFilter, options, onChange);
            return (
              await syncHandlerV2.getTableSyncFunctions({ db, tableName, columns })
            ).addSyncOne(basicFilter, options, onChange);
          }) as SyncOne<AnyObject>;

          const sync = (async (
            basicFilter,
            options: SyncOptions = { handlesOnData: true },
            onChange: OnChange<AnyObject, SyncOptions>,
          ) => {
            await onDebug?.({
              type: "table",
              command: "sync",
              tableName,
              data: { basicFilter, options },
            });
            checkSubscriptionArgs(basicFilter, options, onChange);
            return (await syncHandlerV2.getTableSyncFunctions({ db, tableName, columns })).addSync(
              basicFilter,
              options,
              onChange,
            );
          }) as Sync<AnyObject>;

          dboTable.sync = sync;
          dboTable.syncOne = syncOne;
          dboTable.useSync = (basicFilter, options, hookOptions) =>
            // eslint-disable-next-line react-hooks/rules-of-hooks
            useSync(sync, basicFilter, options, hookOptions);
          dboTable.useSyncOne = (basicFilter, options, hookOptions) =>
            // eslint-disable-next-line react-hooks/rules-of-hooks
            useSync(syncOne, basicFilter, options, hookOptions);
        } else if (subscribeCommands.includes(command as any)) {
          const subFunc = async function (param1 = {}, param2 = {}, onChange, onError) {
            await onDebug?.({
              type: "table",
              command: command as (typeof subscribeCommands)[number],
              tableName,
              data: { param1, param2, onChange, onError },
            });
            checkSubscriptionArgs(param1, param2, onChange, onError);
            return subscriptionHandler.addSub(
              db,
              { tableName, command, param1, param2 },
              onChange,
              onError,
            );
          };
          dboTable[command] = subFunc;
          const SUBSCRIBE_ONE = "subscribeOne";

          /**
           * React hooks
           */
          const handlerName =
            command === "subscribe" ? "useSubscribe"
            : command === "subscribeOne" ? "useSubscribeOne"
            : undefined;
          if (handlerName) {
            dboTable[handlerName] = (filter, options, hookOptions) =>
              // eslint-disable-next-line react-hooks/rules-of-hooks
              useSubscribe(subFunc, command === SUBSCRIBE_ONE, filter, options, hookOptions) as any;
          }

          if (command === SUBSCRIBE_ONE || !subscribeCommands.includes(SUBSCRIBE_ONE)) {
            dboTable[SUBSCRIBE_ONE] = async function (param1, param2, onChange) {
              await onDebug?.({
                type: "table",
                command: SUBSCRIBE_ONE,
                tableName,
                data: { param1, param2, onChange },
              });
              checkSubscriptionArgs(param1, param2, onChange);

              const onChangeOne = (rows) => {
                onChange(rows[0]);
              };
              return subscriptionHandler.addSub(
                db,
                { tableName, command, param1, param2 },
                onChangeOne,
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
                prefix,
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

          const reactHookName =
            command === "findOne" ? "useFindOne"
            : command === "find" ? "useFind"
            : command === "count" ? "useCount"
            : command === "size" ? "useSize"
            : undefined;
          if (reactHookName) {
            dboTable[reactHookName] = (param1, param2, hookOptions) =>
              // eslint-disable-next-line react-hooks/rules-of-hooks
              useFetch(method, [param1, param2], hookOptions);
          }
        }
      });
  });

  return { db: db as Partial<DBHandlerClient<DBSchema>> };
};
