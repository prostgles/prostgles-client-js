import type { AnyObject } from "prostgles-types";
import type {
  $UpdateOpts,
  MultiChangeListener,
  MultiSyncHandles,
  SubscriptionMulti,
  SyncedTable,
} from "./SyncedTable";

type Args = {
  onChange: MultiChangeListener<AnyObject>;
  handlesOnData: boolean;
};
export function getMultiSyncSubscription(this: SyncedTable, { onChange, handlesOnData }: Args) {
  const handles: MultiSyncHandles<AnyObject> = {
    $unsync: () => {
      return this.unsubscribe(onChange);
    },
    getItems: () => {
      return this.getItems();
    },
    $upsert: (newData) => {
      if (!(newData as any)) {
        throw "No data provided for upsert";
      }

      const prepareOne = (d: AnyObject) => {
        return {
          idObj: this.getIdObj(d),
          delta: d,
        };
      };

      if (Array.isArray(newData)) {
        this.upsert(newData.map((d) => prepareOne(d)));
      } else {
        this.upsert([prepareOne(newData)]);
      }
    },
  };

  const sub: SubscriptionMulti<AnyObject> = {
    _onChange: onChange,
    handlesOnData,
    handles,
    notify: (_allItems, _allDeltas) => {
      let allItems = [..._allItems];
      const allDeltas = [..._allDeltas];
      if (handlesOnData) {
        allItems = allItems.map((item, i) => {
          const getItem = (d: AnyObject, idObj: Partial<AnyObject>) => ({
            ...d,
            ...this.makeSingleSyncHandles(idObj, onChange),
            $get: () => getItem(this.getItem(idObj).data!, idObj),
            $find: (idObject: Partial<AnyObject>) =>
              getItem(this.getItem(idObject).data!, idObject),
            $update: (newData: AnyObject, opts: $UpdateOpts): Promise<boolean> => {
              return this.upsert([{ idObj, delta: newData, opts }]).then((r) => true);
            },
            $delete: async (): Promise<boolean> => {
              return this.delete(idObj);
            },
            $cloneMultiSync: (onChange: MultiChangeListener) => this.sync(onChange, handlesOnData),
          });
          const idObj = this.getIdObj(item) as Partial<AnyObject>;
          return getItem(item, idObj);
        });
      }
      return onChange(allItems, allDeltas);
    },
  };

  return { sub, handles };
}
