import type { SyncInfo } from "lib/prostgles";
import {
  getKeys,
  isDefined,
  isEmpty,
  isEqual,
  isObject,
  type AnyObject,
  type SyncBatchParams,
} from "prostgles-types";
import { quickClone, type SyncedTableOptions } from "./SyncedTable";

export const createSyncDataStore = ({
  id_fields,
  synced_field,
  filter,
  columns,
}: Pick<SyncInfo, "id_fields" | "synced_field"> &
  Pick<SyncedTableOptions, "filter" | "columns">) => {
  const itemsMap = new Map<string, AnyObject>();

  const idFieldsSorted = id_fields.sort();
  const syncFieldSorted = [synced_field, ...id_fields].sort();

  const getIdStr = (d: AnyObject) => {
    return idFieldsSorted.map((key) => `${d[key] || ""}`).join(".");
  };
  const getIdObj = (d: AnyObject) => {
    const res: AnyObject = {};
    idFieldsSorted.map((key) => {
      res[key] = d[key];
    });
    return res;
  };
  const getRowSyncObj = (d: AnyObject) => {
    const res: AnyObject = {};
    syncFieldSorted.map((key) => {
      res[key] = d[key];
    });
    return res;
  };

  /**
   * Returns the current data ordered by synced_field ASC and matching the main filter;
   */
  const getItems = <T extends AnyObject = AnyObject>(): T[] => {
    let items: T[] = [];

    items = Array.from(itemsMap.values()).map((d) => ({ ...(d as T) }));

    const syncFields = [synced_field, ...id_fields.sort()];
    items = items
      .filter((d) => {
        return !filter || !getKeys(filter).find((key) => d[key] !== filter![key]);
      })
      .sort((a, b) =>
        syncFields
          .map(
            (key) =>
              (a[key] < b[key] ? -1
              : a[key] > b[key] ? 1
              : 0) as any,
          )
          .find((v) => v),
      );

    return quickClone(items);
  };

  const getBatch = (
    { from_synced, to_synced, offset, limit }: SyncBatchParams = { offset: 0, limit: undefined },
  ) => {
    const items = getItems();
    let res = items
      .map((c) => ({ ...c }))
      .filter(
        (c) =>
          (!Number.isFinite(from_synced) || +c[synced_field] >= +from_synced!) &&
          (!Number.isFinite(to_synced) || +c[synced_field] <= +to_synced!),
      );

    if (offset || limit) {
      res = res.splice(offset ?? 0, limit || res.length);
    }
    return res;
  };
  const setItem = (_item: AnyObject, isFullData = false, deleteItem = false) => {
    const item = quickClone(_item);

    const id = getIdStr(item);
    if (deleteItem) {
      itemsMap.delete(id);
    } else {
      const existing = itemsMap.get(id) ?? {};
      itemsMap.set(id, isFullData ? { ...item } : { ...existing, ...item });
    }
  };
  const setItems = (_items: AnyObject[]): void => {
    const items = quickClone(_items);
    itemsMap.clear();
    items.forEach((item) => {
      const id = getIdStr(item);
      itemsMap.set(id, { ...item });
    });
  };

  const getItem = <T = AnyObject>(idObj: Partial<T>): T | undefined => {
    const d = itemsMap.get(getIdStr(idObj)) as T | undefined;

    return quickClone(d);
  };

  /**
   * Ensures that all object keys match valid column names
   */
  const checkItemCols = (item: AnyObject) => {
    if (columns.length) {
      const badCols = Object.keys({ ...item }).filter((k) => !columns.find((c) => c.name === k));
      if (badCols.length) {
        throw `Unexpected columns in sync item update: ` + badCols.join(", ");
      }
    }
  };

  const getDelta = (o: AnyObject, n: AnyObject): AnyObject => {
    if (isEmpty(o)) return { ...n };
    return Object.fromEntries(
      Object.entries({ ...n })
        .filter(([k]) => !id_fields.includes(k))
        .map(([k, v]) => {
          if (!isEqual(v, o[k])) {
            const vClone =
              isObject(v) ? { ...v }
              : Array.isArray(v) ? v.slice(0)
              : v;
            return [k, vClone];
          }
        })
        .filter(isDefined),
    );
  };

  const matchesFilter = (item: AnyObject | undefined) => {
    return Boolean(
      item &&
        (!filter || isEmpty(filter) || !Object.keys(filter).find((k) => filter![k] !== item[k])),
    );
  };
  const matchesIdObj = (a: AnyObject | undefined, b: AnyObject | undefined) => {
    return Boolean(a && b && !id_fields.sort().find((k) => a[k] !== b[k]));
  };

  return {
    getItems,
    getBatch,
    getIdObj,
    getRowSyncObj,
    getDelta,
    setItems,
    checkItemCols,
    setItem,
    getItem,
    matchesIdObj,
    matchesFilter,
  };
};
