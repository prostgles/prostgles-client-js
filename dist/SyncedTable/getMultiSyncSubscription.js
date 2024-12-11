"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMultiSyncSubscription = void 0;
function getMultiSyncSubscription({ onChange, handlesOnData }) {
    const handles = {
        $unsync: () => {
            return this.unsubscribe(onChange);
        },
        getItems: () => {
            return this.getItems();
        },
        $upsert: (newData) => {
            if (!newData) {
                throw "No data provided for upsert";
            }
            const prepareOne = (d) => {
                return {
                    idObj: this.getIdObj(d),
                    delta: d,
                };
            };
            if (Array.isArray(newData)) {
                this.upsert(newData.map((d) => prepareOne(d)));
            }
            else {
                this.upsert([prepareOne(newData)]);
            }
        },
    };
    const sub = {
        _onChange: onChange,
        handlesOnData,
        handles,
        notify: (_allItems, _allDeltas) => {
            let allItems = [..._allItems];
            const allDeltas = [..._allDeltas];
            if (handlesOnData) {
                allItems = allItems.map((item, i) => {
                    const getItem = (d, idObj) => ({
                        ...d,
                        ...this.makeSingleSyncHandles(idObj, onChange),
                        $get: () => getItem(this.getItem(idObj).data, idObj),
                        $find: (idObject) => getItem(this.getItem(idObject).data, idObject),
                        $update: (newData, opts) => {
                            return this.upsert([{ idObj, delta: newData, opts }]).then((r) => true);
                        },
                        $delete: async () => {
                            return this.delete(idObj);
                        },
                        $cloneMultiSync: (onChange) => this.sync(onChange, handlesOnData),
                    });
                    const idObj = this.getIdObj(item);
                    return getItem(item, idObj);
                });
            }
            return onChange(allItems, allDeltas);
        },
    };
    return { sub, handles };
}
exports.getMultiSyncSubscription = getMultiSyncSubscription;
