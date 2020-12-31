import { FieldFilter, getTextPatch, isEmpty, WAL } from "prostgles-types";

const hasWnd =  typeof window !== "undefined";

type FilterFunction = (data: object) => boolean;

export type SyncOptions = {
    select?: FieldFilter;
    handlesOnData?: boolean;
}
export type SyncOneOptions = {
    handlesOnData?: boolean;
}
/**
 * Creates a local synchronized table
 */
export type Sync = (basicFilter: any, options: SyncOptions, onChange: (data: SyncDataItems[]) => any) => MultiSyncHandles;

/**
 * Creates a local synchronized record
 */
export type SyncOne = (basicFilter: any, options: SyncOneOptions, onChange: (data: SyncDataItem[]) => any) => SingleSyncHandles;

export type SyncBatchRequest = {
    from_synced?: string | number;
    to_synced?: string | number;
    offset: number;
    limit: number; 
}

export type ItemUpdate = {
    idObj: any;
    delta: any;
}
export type ItemUpdated = ItemUpdate & {
    oldItem: any;
    newItem: any;
    status: "inserted" | "updated" | "deleted";
    from_server: boolean;
}

/**
 * CRUD handles added if initialised with handlesOnData = true
 */
export type SyncDataItems = {
    [key: string]: any;
    $update?: (newData: any) => any;
    $delete?: () => any;
}
/**
 * CRUD handles added if initialised with handlesOnData = true
 */
export type SyncDataItem = SyncDataItems & {
    $unsync?: () => any;
}

export type MultiSyncHandles = {
    unsync: () => void;
    upsert: (newData: object[]) => any;
}
export type SingleSyncHandles = {
    get: () => object;
    unsync: () => any;
    delete: () => void;
    update: (data: object) => void;
    // set: (data: object) => void;
}
export type SubscriptionSingle = {
    onChange: (data: object, delta: object) => object;
    idObj: object | FilterFunction;
    handlesOnData?: boolean;
    handles?: SingleSyncHandles;
}
export type SubscriptionMulti = {
    onChange: (data: object[], delta: object)=> object[];
    idObj?: object | FilterFunction;
    handlesOnData?: boolean;
    handles?: MultiSyncHandles;
}

const STORAGE_TYPES = {
    array: "array",
    localStorage: "localStorage",
    object: "object"
};

export type MultiChangeListener = (items: SyncDataItems[], delta: object[]) => any;
export type SingleChangeListener = (item: SyncDataItem, delta: object) => any;

export type SyncedTableOptions = {
    name: string;
    filter?: object;
    onChange?: MultiChangeListener;
    db: any;
    pushDebounce?: number; 
    skipFirstTrigger?: boolean; 
    select?: "*" | {};
    storageType: string;

    /* If true then only the delta of text field is sent to server */
    patchText: boolean;
    patchJSON: boolean;
};

export class SyncedTable {

    db: any;
    name:string;
    select?: "*" | {};
    filter?: object;
    onChange: (data: object[], delta: object)=> object[];
    id_fields: string[];
    synced_field: string;
    throttle: number = 100;
    batch_size: number = 50;
    skipFirstTrigger: boolean = false;

    columns: { name: string, data_type: string }[] = [];

    // wal: {
    //     changed: { [key: string]: ItemUpdated },
    //     sending: { [key: string]: ItemUpdated },
    // } = {
    //     changed: {},
    //     sending: {}
    // }
    wal: WAL;

    multiSubscriptions: SubscriptionMulti[];
    singleSubscriptions:  SubscriptionSingle[];
    dbSync: any;
    items: object[] = [];
    storageType: string;
    itemsObj: object = {};
    patchText: boolean;
    patchJSON: boolean;

    constructor({ name, filter, onChange, db, skipFirstTrigger = false, select = "*", storageType = STORAGE_TYPES.object, patchText = false, patchJSON = false }: SyncedTableOptions){
        this.name = name;
        this.filter = filter;
        this.select = select;
        this.onChange = onChange;
        if(!STORAGE_TYPES[storageType]) throw "Invalid storage type. Expecting one of: " + Object.keys(STORAGE_TYPES).join(", ");
        if(typeof window === "undefined" && storageType === STORAGE_TYPES.localStorage) {
            console.warn("Could not set storageType to localStorage: window object missing\nStorage changed to object");
            storageType = "object";
        }
        this.storageType = storageType;
        this.patchText = patchText
        this.patchJSON = patchJSON;

        if(!db) throw "db missing";
        this.db = db;

        const { id_fields, synced_field, throttle = 100, batch_size = 50 } = db[this.name]._syncInfo;
        if(!id_fields || !synced_field) throw "id_fields/synced_field missing";
        this.id_fields = id_fields;
        this.synced_field = synced_field;
        this.batch_size = batch_size;
        this.throttle = throttle;

        function confirmExit() {  return "Data may be lost. Are you sure?"; }
        this.wal = new WAL({
            id_fields, 
            synced_field, 
            throttle, 
            batch_size,
            onSendStart: () => {
                if(hasWnd) window.onbeforeunload = confirmExit;
            },
            onSend: (data) => this.dbSync.syncData(data),//, deletedData);,
            onSendEnd: () => {
                if(hasWnd) window.onbeforeunload = null;
            }
        });

        this.skipFirstTrigger = skipFirstTrigger;

        this.multiSubscriptions = [];
        this.singleSubscriptions = [];
        
        const onSyncRequest = (params) => {
                
                let res = { c_lr: null, c_fr: null, c_count: 0 };

                let batch = this.getBatch(params);
                if(batch.length){

                    res = {
                        c_fr: this.getRowSyncObj(batch[0]) || null,
                        c_lr: this.getRowSyncObj(batch[batch.length - 1]) || null, 
                        c_count: batch.length
                    };
                }
                
                // console.log("onSyncRequest", res);
                return res;
            },
            onPullRequest = async (params) => {
                
                // if(this.getDeleted().length){
                //     await this.syncDeleted();
                // }
                const data = this.getBatch(params);
                // console.log(`onPullRequest: total(${ data.length })`)
                return data;
            };
        
        db[this.name]._sync(filter, { select }, { onSyncRequest, onPullRequest, onUpdates: (data: any[]) => {

            /* Delta left empty so we can prepare it here */
            let updateItems = data.map(d => ({
                idObj: this.getIdObj(d),
                delta: d
            }));
            this.upsert(updateItems,  true);
        } }).then(s => {
            this.dbSync = s;
        });

        if(db[this.name].getColumns){
            db[this.name].getColumns().then((cols: any) => {
                this.columns = cols;
            });
        }

        if(this.onChange && !this.skipFirstTrigger){
            setTimeout(this.onChange, 0);
        }
    }

    /**
     * Returns a sync handler to all records within the SyncedTable instance
     * @param onChange change listener <(items: object[], delta: object[]) => any >
     * @param handlesOnData If true then $upsert and $unsync handles will be added on each data item. False by default;
     */
    sync(onChange: MultiChangeListener, handlesOnData = false): MultiSyncHandles {
        const handles: MultiSyncHandles = {
                unsync: () => { this.unsubscribe(onChange); },
                upsert: (newData) => {
                    if(newData){
                        const prepareOne = (d) => {
                            return ({
                                idObj: this.getIdObj(d),
                                delta: d
                            });
                        }

                        if(Array.isArray(newData)){
                           this.upsert(newData.map(d => prepareOne(d)));
                        } else {
                            this.upsert([prepareOne(newData)]);
                        }
                    }
                      
                    // this.upsert(newData, newData)
                }
            },
            sub: SubscriptionMulti = { 
                onChange,
                handlesOnData,
                handles
            };

        this.multiSubscriptions.push(sub);
        if(!this.skipFirstTrigger){
            let items = this.getItems();
            onChange(items, items);
        }
        return Object.freeze({ ...handles });
    }

    /**
     * Returns a sync handler to a specific record within the SyncedTable instance
     * @param idObj object containing the target id_fields properties
     * @param onChange change listener <(item: object, delta: object) => any >
     * @param handlesOnData If true then $update, $delete and $unsync handles will be added on the data item. False by default;
     */
    syncOne(idObj: object, onChange: SingleChangeListener, handlesOnData = false): SingleSyncHandles{
        if(!idObj || !onChange) throw `syncOne(idObj, onChange) -> MISSING idObj or onChange`;

        // const getIdObj = () => this.getIdObj(this.findOne(idObj));

        const handles: SingleSyncHandles = {
            get: () => this.getItem(idObj).data,
            unsync: () => {
                this.unsubscribe(onChange)
            },
            delete: () => {
                return this.delete(idObj);
            },
            update: newData => {
                this.upsert([{ idObj, delta: newData }]);                
            }
            // set: data => {
            //     const newData = { ...data, ...idObj }
            //     // this.notifySubscriptions(idObj, newData, data);
            //     this.upsert(newData, newData);
            // }
        };
        const sub: SubscriptionSingle = {
            onChange,
            idObj,
            handlesOnData,
            handles
        };
        

        this.singleSubscriptions.push(sub);           

        return Object.freeze({ ...handles });
    }

    /**
     * Notifies multi subs with ALL data + deltas. Attaches handles on data if required
     * @param newData -> updates. Must include id_fields + updates
     */
    private notifySubscribers = (changes?: ItemUpdated[]) => {

        let _changes = changes;
        // if(!changes) _changes

        let items = [], deltas = [], ids = [];
        _changes.map(({ idObj, newItem, delta }) => {

            /* Single subs do not care about the filter */
            this.singleSubscriptions.filter(s => 
            
                this.matchesIdObj(s.idObj, idObj)
    
                /* What's the point here? That left filter includes the right one?? */
                // && Object.keys(s.idObj).length <= Object.keys(idObj).length
            ).map(s => {
                let ni = { ...newItem };
                if(s.handlesOnData && s.handles){
                    ni.$update = s.handles.update;
                    ni.$delete = s.handles.delete;
                    ni.$unsync = s.handles.unsync;
                }
                s.onChange(ni, delta);
            });

            /* Preparing data for multi subs */
            if(this.matchesFilter(newItem)){
                items.push(newItem);
                deltas.push(delta);
                ids.push(idObj);
            }
        });

        let allItems = [], allDeltas = [];
        this.getItems().map(d => {
            allItems.push({ ...d });
            const dIdx = items.findIndex(_d => this.matchesIdObj(d, _d));
            allDeltas.push(deltas[dIdx]);
        })

        /* Notify main subscription */
        if(this.onChange){
            this.onChange(allItems, allDeltas);
        }

        /* Multisubs must not forget about the original filter */
        this.multiSubscriptions.map(s => {
            if(s.handlesOnData && s.handles){
                allItems = allItems.map((item, i)=> {
                    const idObj = ids[i];
                    return {
                        ...item,
                        $update: (newData: object): Promise<boolean> => {
                            return this.upsert([{ idObj, delta: newData }]).then(r => true);
                        },
                        $delete: async (): Promise<boolean> => {
                            return this.delete(idObj);
                        }
                    };
                });
            }
            s.onChange(allItems, allDeltas);
        });
    }

    unsubscribe = (onChange) => {
        this.singleSubscriptions = this.singleSubscriptions.filter(s => s.onChange !== onChange);
        this.multiSubscriptions = this.multiSubscriptions.filter(s => s.onChange !== onChange);
    }

    private getIdStr(d){
        return this.id_fields.sort().map(key => `${d[key] || ""}`).join(".");
    }
    private getIdObj(d){
        let res = {};
        this.id_fields.sort().map(key => {
            res[key] = d[key];
        });
        return res;
    }
    private getRowSyncObj(d){
        let res = {};
        [this.synced_field, ...this.id_fields].sort().map(key => {
            res[key] = d[key];
        });
        return res;
    }

    unsync = () => {
        if(this.dbSync && this.dbSync.unsync) this.dbSync.unsync();
    }

    destroy = () => {
        this.unsync();
        this.multiSubscriptions = [];
        this.singleSubscriptions = [];
        this.itemsObj = {};
        this.items = [];
        this.onChange = null;
    }

    private matchesFilter(item){
        return Boolean(
            item &&
            (
                !this.filter ||
                isEmpty(this.filter) ||
                !Object.keys(this.filter).find(k => this.filter[k] !== item[k])
            ) 
        );
    }
    private matchesIdObj(a, b){
        return Boolean(a && b && !this.id_fields.sort().find(k => a[k] !== b[k]));
    }

    // TODO: offline-first deletes if allow_delete = true
    // private setDeleted(idObj, fullArray){
    //     let deleted: object[] = [];
        
    //     if(fullArray) deleted = fullArray;
    //     else {
    //         deleted = this.getDeleted();
    //         deleted.push(idObj);
    //     }
    //     if(hasWnd) window.localStorage.setItem(this.name + "_$$psql$$_deleted", <any>deleted);
    // }
    // private getDeleted(){
    //     const delStr = if(hasWnd) window.localStorage.getItem(this.name + "_$$psql$$_deleted") || '[]';
    //     return JSON.parse(delStr);
    // }
    // private syncDeleted = async () => {
    //     try {
    //         await Promise.all(this.getDeleted().map(async idObj => {
    //             return this.db[this.name].delete(idObj);
    //         }));
    //         this.setDeleted(null, []);
    //         return true;
    //     } catch(e){
    //         throw e;
    //     }
    // }

    /**
     * Returns properties that are present in {n} and are different to {o}
     * @param o current full data item
     * @param n new data item
     */
    private getDelta(o: object, n: object): object {
        if(isEmpty(o)) return { ...n };
        return Object.keys({ ...o, ...n })
            .filter(k => !this.id_fields.includes(k))
            .reduce((a, k) => {
                let delta = {};
                if(k in n && n[k] !== o[k]){
                    delta = { [k]: n[k] };
                }
                return { ...a, ...delta };
            }, {});
    }

    deleteAll(){
        this.getItems().map(this.delete);
    }

    private  delete = async (item) => {

        const idObj = this.getIdObj(item);
        await this.db[this.name].delete(idObj);
        this.setItem(idObj, null, true, true);
        this.notifySubscribers();
        return true
    }

    /**
     * Upserts data locally -> notify subs -> sends to server if required
     * synced_field is populated if data is not from server
     * @param items <{ idObj: object, delta: object }[]> Data items that changed
     * @param from_server : <boolean> If false then updates will be sent to server
     */
    upsert = async (items: ItemUpdate[], from_server = false): Promise<any> => {
        if(!items || !items.length) throw "No data provided for upsert";
        
        /* If data has been deleted then wait for it to sync with server before continuing */
        // if(from_server && this.getDeleted().length){
        //     await this.syncDeleted();
        // }

        let updates = [], inserts = [], deltas = [];
        let results: ItemUpdated[] = [];
        let status;
        let walItems: ItemUpdated[] = [];
        await Promise.all(items.map(async (item, i) => {
            // let d = { ...item.idObj, ...item.delta };
            let idObj = { ...item.idObj };
            let delta = { ...item.delta };


            let oItm = this.getItem(idObj),
                oldIdx = oItm.index,
                oldItem = oItm.data;
            
            /* Calc delta if missing or if from server */
            if((from_server || isEmpty(delta)) && !isEmpty(oldItem)){
                delta = this.getDelta(oldItem || {}, delta)
            }

            /* Add synced if local update */
            if(!from_server) {
                delta[this.synced_field] = Date.now();
            }
            
            let newItem = { ...oldItem, ...delta, ...idObj };

            /* Update existing -> Expecting delta */
            if(oldItem && oldItem[this.synced_field] < newItem[this.synced_field]){
                status = "updated";
               
            /* Insert new item */
            } else if(!oldItem) {
                status = "inserted";
            }
            
            this.setItem(newItem, oldIdx);

            let changeInfo = { idObj, delta, oldItem, newItem, status, from_server };

            // const idStr = this.getIdStr(idObj);
            /* IF Local updates then Keep any existing oldItem to revert to the earliest working item */
            if(!from_server){

                /* Patch server data if necessary and update separately to account for errors */
                let updatedWithPatch = false;
                if(this.columns && this.columns.length && (this.patchText || this.patchJSON)){
                    // const jCols = this.columns.filter(c => c.data_type === "json")
                    const txtCols = this.columns.filter(c => c.data_type === "text");
                    if(this.patchText && txtCols.length && this.db[this.name].update){
                        let patchedDelta;
                        txtCols.map(c => {
                            if(c.name in changeInfo.delta){
                                patchedDelta = patchedDelta || {
                                    ...changeInfo.delta,
                                }
                                patchedDelta[c.name] = getTextPatch(changeInfo.oldItem[c.name], changeInfo.delta[c.name]);
                            }
                        });
                        if(patchedDelta){
                            try {
                                await this.db[this.name].update(idObj, patchedDelta);
                                updatedWithPatch = true;
                            } catch(e) {
                                console.log("failed to patch update", e)
                            }
                            
                        }
                        // console.log("json-stable-stringify ???")
                    }
                }
                
                if(!updatedWithPatch){
                    walItems.push({ ...delta, ...idObj });
                    // if(this.wal.changed[idStr]){
                    //     this.wal.changed[idStr] = {
                    //         ...changeInfo,
                    //         oldItem: this.wal.changed[idStr].oldItem
                    //     }
                    // } else {
                    //     this.wal.changed[idStr] = changeInfo;
                    // }
                }
            }
            results.push(changeInfo);

            /* TODO: Deletes from server */
            // if(allow_deletes){
            //     items = this.getItems();
            // }

            return true;
        }));
        // console.log(`onUpdates: inserts( ${inserts.length} ) updates( ${updates.length} )  total( ${data.length} )`);
        
        this.notifySubscribers(results);
        
        /* Push to server */
        if(!from_server && walItems.length){
            this.wal.addData(walItems);
        }
    }

    /* Returns an item by idObj from the local store */
    getItem(idObj: object): { data?: object, index: number } {
        let index = -1, d;
        if(this.storageType === STORAGE_TYPES.localStorage){
            let items = this.getItems();
            d = items.find(d => this.matchesIdObj(d, idObj));
        } else if(this.storageType === STORAGE_TYPES.array){
            d = this.items.find(d => this.matchesIdObj(d, idObj));
        } else {
            this.itemsObj = this.itemsObj || {};
            d = this.itemsObj[this.getIdStr(idObj)];
        }

        return { data: d? { ...d } : d, index };
    }

    /**
     * 
     * @param item data to be inserted/updated/deleted. Must include id_fields
     * @param index (optional) index within array
     * @param isFullData 
     * @param deleteItem 
     */
    setItem(item: object, index: number, isFullData: boolean = false, deleteItem: boolean = false){
        const getExIdx = (arr: object[]): number => index;// arr.findIndex(d => this.matchesIdObj(d, item));
        if(this.storageType === STORAGE_TYPES.localStorage){
            let items = this.getItems();
            if(!deleteItem){
                let existing_idx = getExIdx(items);
                if(items[existing_idx]) items[existing_idx] = isFullData? { ...item } : { ...items[existing_idx], ...item };
                else items.push(item);
            } else items = items.filter(d => !this.matchesIdObj(d, item));
            if(hasWnd) window.localStorage.setItem(this.name, JSON.stringify(items));
        } else if(this.storageType === STORAGE_TYPES.array){
            if(!deleteItem){
                if(!this.items[index]){
                    this.items.push(item);
                } else {
                    this.items[index] = isFullData? { ...item } : { ...this.items[index], ...item };
                }
            } else this.items = this.items.filter(d => !this.matchesIdObj(d, item));
        } else {
            this.itemsObj = this.itemsObj || {};
            if(!deleteItem){
                let existing = this.itemsObj[this.getIdStr(item)] || {};
                this.itemsObj[this.getIdStr(item)] = isFullData? { ...item } : { ...existing,  ...item };
            } else {
                delete this.itemsObj[this.getIdStr(item)];
            }
        }
    }

    /**
     * Sets the current data
     * @param items data
     */
    setItems = (items: object[]): void => {
        if(this.storageType === STORAGE_TYPES.localStorage){
            if(!hasWnd) throw "Cannot access window object. Choose another storage method (array OR object)";
            window.localStorage.setItem(this.name, JSON.stringify(items));
        } else if(this.storageType === STORAGE_TYPES.array){
            this.items = items;
        } else {
            this.itemsObj = items.reduce((a, v) => ({
                ...a,
                [this.getIdStr(v)]: v,
            }), {});
        }
    }

    /**
     * Returns the current data ordered by synced_field ASC and matching the main filter;
     */
    getItems = (): object[] => {

        let items = [];

        if(this.storageType === STORAGE_TYPES.localStorage){
            if(!hasWnd) throw "Cannot access window object. Choose another storage method (array OR object)";
            let cachedStr = window.localStorage.getItem(this.name);
            if(cachedStr){
                try {
                    items = JSON.parse(cachedStr);
                } catch(e){
                    console.error(e);
                }
            }
        } else if(this.storageType === STORAGE_TYPES.array){
            items = this.items.slice(0);
        } else {
            items = Object.values(this.itemsObj);
        }

        if(this.id_fields && this.synced_field){
            const s_fields = [this.synced_field, ...this.id_fields.sort()];
            items = items
                .filter(d => {
                    return !this.filter || !Object.keys(this.filter)
                        .find(key => 
                            d[key] !== this.filter[key]
                            // typeof d[key] === typeof this.filter[key] && 
                            // d[key].toString && this.filter[key].toString &&
                            // d[key].toString() !== this.filter[key].toString()
                        );
                })
                .sort((a, b) => 
                    s_fields.map(key => 
                        a[key] < b[key]? -1 : a[key] > b[key]? 1 : 0
                    ).find(v => v) 
                );
        } else throw "id_fields AND/OR synced_field missing"
        this.items = items.filter(d => isEmpty(this.filter) || this.matchesFilter(d));
        return items.map(d => ({ ...d }));
    }

    /**
     * Sync data request
     * @param param0: SyncBatchRequest
     */
    getBatch = ({ from_synced, to_synced, offset, limit }: SyncBatchRequest = { offset: 0, limit: null}) => {
        let items = this.getItems();
        // params = params || {};
        // const { from_synced, to_synced, offset = 0, limit = null } = params;
        let res = items.map(c => ({ ...c }))
            .filter(c =>
                (!from_synced || c[this.synced_field] >= from_synced) &&
                (!to_synced || c[this.synced_field] <= to_synced)
            );

        if(offset || limit) res = res.splice(offset, limit || res.length);

        return res;
    }
}