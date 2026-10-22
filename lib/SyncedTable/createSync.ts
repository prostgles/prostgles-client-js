import {
  isEmpty,
  isEqual,
  type ClientSyncHandles,
  type ClientSyncInfo,
  type SyncBatchParams,
} from "prostgles-types";
import { WAL, type WALItem } from "prostgles-types/dist/WAL";
import type { Socket } from "socket.io-client";
import { createSyncDataStore } from "./createSyncDataStore";
import { createSyncStateUtils } from "./createSyncStateUtils";
import { createSyncSubscriptionManager } from "./createSyncSubscriptionManager";
import {
  mergeDeep,
  type ItemUpdate,
  type ItemUpdated,
  type SyncedTableOptions,
} from "./SyncedTable";

export const createSync = async (socket: Socket, options: Omit<SyncedTableOptions, "onReady">) => {
  const stateUtils = createSyncStateUtils(socket, options);
  const { state, onDebug } = stateUtils;

  const store = createSyncDataStore({ ...stateUtils._syncInfo, ...options });

  const onError = (err) => {
    console.error("Sync internal error: ", err);
  };

  const onSyncRequest: ClientSyncHandles["onSyncRequest"] = (syncBatchParams) => {
    let clientSyncInfo: ClientSyncInfo = {
      state: "syncing",
      c_lr: undefined,
      c_fr: undefined,
      c_count: 0,
    };

    const batch = store.getBatch(syncBatchParams);
    const firstRow = batch[0];
    const lastRow = batch[batch.length - 1];
    if (firstRow && lastRow) {
      clientSyncInfo = {
        state: "syncing",
        c_fr: store.getRowSyncObj(firstRow),
        c_lr: store.getRowSyncObj(lastRow),
        c_count: batch.length,
      };
    }

    onDebug({ command: "onUpdates", data: { syncBatchParams, batch, clientSyncInfo } });
    return clientSyncInfo;
  };
  const onPullRequest = async (syncBatchParams: SyncBatchParams) => {
    // if(this.getDeleted().length){
    //     await this.syncDeleted();
    // }
    const data = store.getBatch(syncBatchParams);
    await onDebug({ command: "onPullRequest", data: { syncBatchParams, data } });
    return { data, success: true as const };
  };
  const onUpdates: ClientSyncHandles["onUpdates"] = async (onUpdatesParams) => {
    await onDebug({ command: "onUpdates", data: { onUpdatesParams } });
    if (onUpdatesParams.state === "error" && onUpdatesParams.err) {
      onError(onUpdatesParams.err);
    } else if (onUpdatesParams.state === "synced") {
      if (onUpdatesParams.isSynced && !state.isSynced) {
        state.isSynced = onUpdatesParams.isSynced;
        const items = store.getItems().map((d) => ({ ...d }));
        store.setItems([]);
        const updateItems = items.map((d) => ({
          idObj: store.getIdObj(d),
          delta: { ...d },
        }));
        await upsert(updateItems, true);
        if (!updateItems.length) {
          subscriptionManager.notifyCurrentData();
        }
      }
    } else if (onUpdatesParams.state === "syncing") {
      /* Delta left empty so we can prepare it here */
      const updateItems = onUpdatesParams.data.map((d) => {
        return {
          idObj: store.getIdObj(d),
          delta: d,
        };
      });
      await upsert(updateItems, true);
    } else {
      console.error("Sync onUpdates error:", onUpdatesParams.err);
    }

    return { success: true } as const;
  };

  const clientSyncHandles = { onSyncRequest, onPullRequest, onUpdates };
  let dbSync = await stateUtils.initializeSync(clientSyncHandles);
  let reattaching: Promise<void> | undefined;

  /**
   * Some syncs can be read only. Any changes are local
   */
  const createWal = () => {
    const nextWal = new WAL({
      ...stateUtils._syncInfo,
      onSendStart: () => {
        if (isWindowDefined) {
          window.onbeforeunload = function confirmExit() {
            return "Data may be lost. Are you sure?";
          };
        }
      },
      onSend: async (data, walData) => {
        await reattaching;
        if (state.error || wal !== nextWal) return;
        const _data = walData.map((d) => d.current);
        if (!_data.length) return [];
        return dbSync.syncData(data);
      },
      onSendEnd: () => {
        if (isWindowDefined && wal === nextWal) window.onbeforeunload = null;
      },
    });
    return nextWal;
  };
  let wal = createWal();

  /**
   * Upserts data locally -> notify subs -> sends to server if required
   * synced_field is populated if data is not from server
   * @param items <{ idObj: object, delta: object }[]> Data items that changed
   * @param from_server : <boolean> If false then updates will be sent to server
   */
  const upsert = async (items: ItemUpdate[], from_server = false): Promise<void> => {
    if (state.error) throw state.error;
    const { synced_field } = stateUtils;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if ((!items || !items.length) && !from_server) throw "No data provided for upsert";

    /* If data has been deleted then wait for it to sync with server before continuing */
    // if(from_server && this.getDeleted().length){
    //     await this.syncDeleted();
    // }

    const results: ItemUpdated[] = [];
    let status: ItemUpdated["status"];
    const walItems: WALItem[] = [];
    await Promise.all(
      items.map(async (item, i) => {
        // let d = { ...item.idObj, ...item.delta };
        const oldItem = store.getItem(item.idObj);
        const idObj = store.getIdObj({ ...oldItem, ...item.delta, ...item.idObj });
        let delta = { ...item.delta };

        /* Convert undefined to null because:
          1) JSON.stringify drops these keys
          2) Postgres does not have undefined
      */
        Object.keys(delta).map((k) => {
          if (delta[k] === undefined) delta[k] = null;
        });

        if (!from_server) {
          store.checkItemCols({ ...item.delta, ...item.idObj });
        }

        /* Calc delta if missing or if from server */
        if ((from_server || isEmpty(delta)) && !isEmpty(oldItem)) {
          delta = store.getDelta(oldItem || {}, delta);
        }

        /* Add synced if local update */
        /** Will need to check client clock shift */
        if (!from_server) {
          delta[synced_field] = Date.now();
        }

        let newItem = { ...oldItem, ...delta, ...idObj };
        if (oldItem && !from_server) {
          /**
           * Merge deep
           */
          if (item.opts?.deepMerge) {
            newItem = mergeDeep({ ...oldItem, ...idObj }, { ...delta });
          }
        }

        /* Update existing -> Expecting delta */
        if (oldItem) {
          status = oldItem[synced_field] < newItem[synced_field] ? "updated" : "unchanged";

          /* Insert new item */
        } else {
          status = "inserted";
        }

        store.setItem(newItem);

        // if(!status) throw "changeInfo status missing"
        const changeInfo: ItemUpdated = { idObj, delta, oldItem, newItem, status, from_server };

        /* IF Local updates then Keep any existing oldItem to revert to the earliest working item */
        if (!from_server) {
          walItems.push({
            initial: oldItem,
            current: { ...newItem },
          });
        }
        if (!isEmpty(changeInfo.delta)) {
          results.push(changeInfo);
        }

        /* TODO: Deletes from server */
        // if(allow_deletes){
        //     items = this.getItems();
        // }

        return true;
      }),
    ).catch((err) => {
      console.error("SyncedTable failed upsert: ", err);
    });

    subscriptionManager.notifyWal.addData(
      results.map((d) => ({ initial: d.oldItem, current: d.newItem })),
    );

    /* Push to server */
    if (!from_server && walItems.length) {
      wal.addData(walItems);
    }
  };

  const subscriptionManager = createSyncSubscriptionManager(
    stateUtils._syncInfo,
    store,
    stateUtils,
    upsert,
  );

  const attach = async (schema: Pick<SyncedTableOptions, "db" | "columns">) => {
    state.isSynced = false;
    dbSync.unsync();
    try {
      const nextStateUtils = createSyncStateUtils(socket, { ...options, ...schema });
      const syncConfigChanged = !isEqual(stateUtils._syncInfo, nextStateUtils._syncInfo);
      const syncFieldsChanged =
        !isEqual(stateUtils.id_fields, nextStateUtils.id_fields) ||
        stateUtils.synced_field !== nextStateUtils.synced_field;
      const schemaChanged =
        syncConfigChanged || !isEqual(stateUtils.columns, nextStateUtils.columns);
      Object.assign(stateUtils, nextStateUtils, { state });
      if (schemaChanged || state.error) {
        if (syncConfigChanged || state.error) {
          const pendingItems = !syncFieldsChanged && !state.error ? wal.getPendingItems() : [];
          clearTimeout(wal.isSendingTimeout);
          clearTimeout(wal.willDeleteHistory);
          wal = createWal();
          if (pendingItems.length) {
            void wal.addData(pendingItems);
          }
        }
        Object.assign(
          store,
          createSyncDataStore({ ...stateUtils._syncInfo, ...options, ...schema }),
        );
        subscriptionManager.reset(stateUtils._syncInfo);
      }
      state.error = undefined;
      dbSync = await stateUtils.initializeSync(clientSyncHandles);
      store.setItems([
        ...dbSync.syncInfo.data,
        ...wal.getPendingItems().map(({ current }) => current),
      ]);
      await dbSync.syncData();
    } catch (error) {
      state.error = error;
      store.setItems([]);
      clearTimeout(wal.isSendingTimeout);
      clearTimeout(wal.willDeleteHistory);
      subscriptionManager.reset(stateUtils._syncInfo);
      subscriptionManager.notifyError(error);
      throw error;
    }
  };

  const reAttach = (schema: Pick<SyncedTableOptions, "db" | "columns">) => {
    reattaching = (reattaching ?? Promise.resolve())
      .catch(() => undefined)
      .then(() => attach(schema));
    return reattaching;
  };

  store.setItems(dbSync.syncInfo.data);
  /** TODO */
  // if (!dbSync.syncInfo.isSynced) {
  dbSync.syncData();
  // } else {
  //   state.isSynced = true;
  // }

  return { sync: subscriptionManager.sync, syncOne: subscriptionManager.syncOne, reAttach };
};

const isWindowDefined = typeof window !== "undefined";
