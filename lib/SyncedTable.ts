import { FieldFilter } from "prostgles-types";

type FilterFunction = (data: object) => boolean;

export type SyncOptions = {
    select: FieldFilter;
    handlesOnData?: boolean;
}
export type SyncOneOptions = {
    handlesOnData: boolean;
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
    set: (data: object) => void;
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
    isSendingData: { 
        [key: string]: { 
            n: object, 
            o: object,
            sending: boolean; 
            // cbs: Function[] 
        } 
    };
    isSendingBatch: {
        items: any[];
        deleted: any[];
        // cb: Function;
    }[]
    multiSubscriptions: SubscriptionMulti[];
    singleSubscriptions:  SubscriptionSingle[];
    dbSync: any;
    items: object[] = [];
    storageType: string;
    itemsObj: object = {};

    constructor({ name, filter, onChange, db, skipFirstTrigger = false, select = "*", storageType = STORAGE_TYPES.object }: SyncedTableOptions){
        this.name = name;
        this.filter = filter;
        this.select = select;
        this.onChange = onChange;
        if(!STORAGE_TYPES[storageType]) throw "Invalid storage type. Expecting one of: " + Object.keys(STORAGE_TYPES).join(", ");
        this.storageType = storageType;

        if(!db) throw "db missing";
        this.db = db;

        const { id_fields, synced_field, throttle = 100, batch_size = 50 } = db[this.name]._syncInfo;
        if(!id_fields || !synced_field) throw "id_fields/synced_field missing";
        this.id_fields = id_fields;
        this.synced_field = synced_field;
        this.batch_size = batch_size;

        this.throttle = throttle;
        this.isSendingData = {};

        this.skipFirstTrigger = skipFirstTrigger;

        this.multiSubscriptions = [];
        this.singleSubscriptions = [];
        
        const onSyncRequest = (params) => {
                
                let res = { c_lr: null, c_fr: null, c_count: 0 };

                let batch = this.getBatch(params);
                if(batch.length){

                    res = {
                        c_fr: batch[0] || null,
                        c_lr: batch[batch.length - 1] || null, 
                        c_count: batch.length
                    };
                }
                
                // console.log("onSyncRequest", res);
                return res;
            },
            onPullRequest = async (params) => {
                
                if(this.getDeleted().length){
                    await this.syncDeleted();
                }
                const data = this.getBatch(params);
                // console.log(`onPullRequest: total(${ data.length })`)
                return data;
            };
        
        db[this.name]._sync(filter, { select }, { onSyncRequest, onPullRequest, onUpdates: (data) => {

            /* Delta left empty so we can prepare it here */
            this.upsert(data, null, true);
        } }).then(s => {
            this.dbSync = s;
        });

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
                        const upsertOne = (d) => {
                            this.updateOne(d, d);
                        }

                        if(Array.isArray(newData)){
                            newData.map(d => upsertOne(d));
                        } else {
                            upsertOne(newData);
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
            update: data => {
                this.updateOne(idObj, data);                
            },
            set: data => {
                const newData = { ...data, ...idObj }
                // this.notifySubscriptions(idObj, newData, data);
                this.upsert(newData, newData);
            }
        };
        const sub: SubscriptionSingle = {
            onChange,
            idObj,
            handlesOnData,
            handles
        };
        

        this.singleSubscriptions.push(sub);

        // const item = this.findOne(idObj);
        // if(!item) {
        //     this.db[this.name].findOne(idObj).then(d => {
        //         onChange(d, d)
        //     }).catch(err => {
        //         throw err;
        //     });
        // } else {
        //     setTimeout(()=>onChange(item, item), 0);
        // }
            

        return Object.freeze({ ...handles });
    }

    /**
     * Notifies multi subs with ALL data + deltas. Attaches handles on data if required
     * @param newData -> updates. Must include id_fields + updates
     */
    private notifyMultiSubscriptions = (newData: object[]) => {

        this.multiSubscriptions.map(s => {
            let items = this.getItems();
            if(s.handlesOnData && s.handles){
                items = items.map(d => ({
                    ...d,
                    $update: (newData: object): Promise<boolean> => {
                        return this.updateOne({ ...d }, newData);
                    },
                    $delete: async (): Promise<boolean> => {
                        try {
                            const idObj = this.getIdObj({ ...d });
                            await this.db[this.name].delete(idObj)
                            return this.delete(idObj);
                        } catch(err) {
                            return Promise.reject(err);
                        }
                    }
                }));
            }
            s.onChange(items, newData);
        });
    }
    notifySingleSubscriptions = (idObj, newData, delta) => {
        this.singleSubscriptions.filter(s => 
            s.idObj &&
            this.matchesIdObj(s.idObj, idObj) && 
            Object.keys(s.idObj).length <= Object.keys(idObj).length)
        .map(s => {
            let newItem = { ...newData };
            if(s.handlesOnData && s.handles){
                newItem.$update = s.handles.update;
                newItem.$delete = s.handles.delete;
                newItem.$unsync = s.handles.unsync;
            }
            s.onChange(newItem, delta);
        });
    };

    /**
     * Update one row locally. id_fields update dissallowed
     * @param idObj object -> item to be updated
     * @param newData object -> new data
     */
    updateOne(idObj: object, newData: object): Promise<boolean> {
        let id = this.getIdObj(idObj);
        return this.upsert({ ...this.getItem(idObj), ...newData, ...id }, { ...newData });
    }

    unsubscribe = (onChange) => {
        this.singleSubscriptions = this.singleSubscriptions.filter(s => s.onChange !== onChange);
        this.multiSubscriptions = this.multiSubscriptions.filter(s => s.onChange !== onChange);
    }

    // findOne(idObj){
    //     this.getItems();
    //     let itemIdx = -1;
    //     if(typeof idObj === "function"){
    //         itemIdx = this.items.findIndex(idObj);
    //     } else if(
    //         (!idObj || !Object.keys(idObj)) &&
    //         this.items.length === 1
    //     ){
    //         itemIdx = 0; 
    //     } else {
    //         itemIdx = this.items.findIndex(d => this.matchesIdObj(idObj, d) )
    //     }
    //     return this.items[itemIdx];
    // }

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

    unsync = () => {
        if(this.dbSync && this.dbSync.unsync) this.dbSync.unsync();
    }

    private matchesIdObj(a, b){
        return Boolean(a && b && !this.id_fields.sort().find(k => a[k] !== b[k]));
        //return Object.keys(idObj).length && !Object.keys(idObj).find(key => d[key] !== idObj[key])
    }


    private setDeleted(idObj, fullArray){
        let deleted: object[] = [];
        
        if(fullArray) deleted = fullArray;
        else {
            deleted = this.getDeleted();
            deleted.push(idObj);
        }
        window.localStorage.setItem(this.name + "_$$psql$$_deleted", <any>deleted);
    }
    private getDeleted(){
        const delStr = window.localStorage.getItem(this.name + "_$$psql$$_deleted") || '[]';
        return JSON.parse(delStr);
    }
    private syncDeleted = async () => {
        try {
            await Promise.all(this.getDeleted().map(async idObj => {
                return this.db[this.name].delete(idObj);
            }));
            this.setDeleted(null, []);
            return true;
        } catch(e){
            throw e;
        }
    }

    /**
     * Returns properties that are present in {n} and are different to {o}
     * @param o current full data item
     * @param n new data item
     */
    private getDelta(o: object, n: object): object {
        if(!o) return { ...n };
        return Object.keys(o)
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
        this.getItems().map(this.getIdObj).map(this.delete);
    }

    private delete = (idObj) => {
        // let items = this.getItems();
        // items = items.filter(d => !this.matchesIdObj(idObj, d) );

        // // window.localStorage.setItem(this.name, JSON.stringify(items));
        // this.setItems(items);
        this.setItem(idObj, null, true, true)
        return this.onDataChanged(null, null, [idObj]);
    }

    /**
     * Upserts data locally and sends to server if required
     * synced_field is populated if data is not from server
     * @param data object | object[] -> data to be updated/inserted. Must include id_fields
     * @param delta object | object[] -> data that has changed. 
     * @param from_server If false then updates will be sent to server
     */
    upsert = async (data: object | object[], delta: object | object[], from_server = false): Promise<boolean> => {
        if(!data) throw "No data provided for upsert";
        
        /* If data has been deleted then wait for it to sync with server before continuing */
        if(from_server && this.getDeleted().length){
            await this.syncDeleted();
        }

        let _data = Array.isArray(data)? data : [data];
        let _delta = Array.isArray(delta)? delta : [delta];

        // let items = this.getItems();

        let updates = [], inserts = [], deltas = [];
        _data.map((_d, i)=> {
            let d = { ..._d };

            /* Add synced if local update */
            if(!from_server) d[this.synced_field] = Date.now();

            let ex = this.getItem(d),
                ex_idx = ex.index,
                existing = ex.data;

            /* Update existing -> Expecting delta */
            if(existing && existing[this.synced_field] < d[this.synced_field]){
                // updates.push(d);

                if(_delta && _delta[i]){
                    deltas.push(_delta[i]);
                } else {
                    deltas.push(this.getDelta(existing, d));
                }
                
            } else if(!existing) {
                deltas.push(d);
            }
            this.setItem(d, ex_idx)

            /* TODO: Deletes from server */
            // if(allow_deletes){
            //     items = this.getItems();
            // }
        });
        // console.log(`onUpdates: inserts( ${inserts.length} ) updates( ${updates.length} )  total( ${data.length} )`);
        const newData = _data.map(d => ({ ...d }));
        
        // window.localStorage.setItem(this.name, JSON.stringify(items));
        // this.setItems(items);
        
        return this.onDataChanged(newData, deltas, null, from_server);
    }

   /**
    * Notifies local subscriptions immediately
    * Sends data to server (if changes are local) 
    * Notifies local subscriptions with old data if server push fails
    * @param newData object[] -> upserted data. Must include id_fields
    * @param delta object[] -> deltas for upserted data
    * @param deletedData 
    * @param from_server 
    */
    isSendingTimeout = null;
    isSending: boolean = false;
    private onDataChanged = async (newData: object[] = null, delta: object[] = null, deletedData = null, from_server = false): Promise<boolean> => {
        const setSending = (rows) => {
                this.isSendingData = this.isSendingData || {};
                rows.map(r => {
                    let idStr = this.getIdStr(r);
                    if(this.isSendingData[idStr]){
                        this.isSendingData[idStr].n = { ...this.isSendingData[idStr].n, ...r };
                        // if(cb) this.isSendingData[idStr].cbs.push(cb);
                    } else {
                        this.isSendingData[idStr] = {
                            o: this.getItem(r),
                            n: r,
                            sending: false
                            // cbs: cb? [cb] : []
                        }
                    }
                });
            },
            getSending = () => {
                return Object.keys(this.isSendingData)
                    .filter(k => !this.isSendingData[k].sending)
                    .slice(0, this.batch_size).map(k => {
                        this.isSendingData[k].sending = true; 
                        return this.isSendingData[k].n;
                    })
            },
            finishSending = (rows, revert = false) => {
                rows.map(r => {
                    const id = this.getIdStr(r);
                    if(revert){

                    } else {
                        if(this.isSendingData[id]){
                            // this.isSendingData[id].cbs.map(cb =>{ cb() })
                            delete this.isSendingData[id];
                        } else {
                            console.warn("isSendingData missing -> Concurrency bug");
                        }
                    }
                })
            },
            pushDataToServer = async (newItems = null, deletedData = null) => {
                
                // if(newItems || deletedData){
                //     this.isSendingBatch.push({
                //         items: newItems,
                //         deleted: deletedData,
                //         cb: callback
                //     });
                // }

                if(!this.isSendingTimeout){
                    this.isSendingTimeout = setTimeout(() => {
                        this.isSendingTimeout = null;
                        if(Object.keys(this.isSendingData).length){
                            pushDataToServer();
                        }
                    }, this.throttle)
                } else if(this.isSending) return;
                this.isSending = true;


                if(newItems) {
                    setSending(newItems);
                }
                // if(callback) this.isSendingDataCallbacks.push(callback);

                if(deletedData || this.isSendingData && Object.keys(this.isSendingData).length){
                    window.onbeforeunload = confirmExit;
                    function confirmExit() {
                        return "Data may be lost. Are you sure?";
                    }
                    const newBatch = getSending(); // this.isSendingData.slice(0, PUSH_BATCH_SIZE);
                    try {
                        await this.dbSync.syncData(newBatch, deletedData);
                        finishSending(newBatch);
                        this.isSending = false;
                        pushDataToServer();
                    } catch(err) {
                        this.isSending = false;
                        console.error(err)
                    }
                } else {
                    window.onbeforeunload = null;
                    // this.isSendingDataCallbacks.map(cb => { cb(); });
                    // this.isSendingDataCallbacks = [];
                }
            };

        return new Promise((resolve, reject) => {

            const items = this.getItems();

            if(newData && newData.length){
                newData.map((d, i)=> {
                    let dlt = {};
                    if(delta && delta.length) dlt = delta[i];
                    this.notifySingleSubscriptions(this.getIdObj({ ...d }), { ...d }, { ...dlt });
                });
            }

            this.notifyMultiSubscriptions(newData);
            if(this.onChange){
                this.onChange(items, newData);
            }

            /* Local updates. Push to server */
            if(!from_server && this.dbSync && this.dbSync.syncData){
                pushDataToServer(newData, deletedData);
                // , () => {
                //     resolve(true);
                // }).catch(reject);
            } else {
                // resolve(true);
            }
            resolve(true);
        });
    }




    getItem(idObj: object): { data?: object, index: number } {
        let data, index = -1;
        if(this.storageType === STORAGE_TYPES.localStorage){
            let items = this.getItems();
            let d = items.find(d => this.matchesIdObj(d, idObj));
            data = { ...d };
        } else if(this.storageType === STORAGE_TYPES.array){
            let d = this.items.find(d => this.matchesIdObj(d, idObj));
            data = { ...d };
        } else {
            this.itemsObj = this.itemsObj || {};
            let d = this.itemsObj[this.getIdStr(idObj)];
            data = { ...d };
        }

        return { data, index };
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
            window.localStorage.setItem(this.name, JSON.stringify(items));
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

    // upsertItem = (item: object, index: number, isFullData: boolean = false) => {
    //     const getExIdx = (arr: object[]): number => arr.findIndex(d => this.matchesIdObj(d, item));
    //     if(this.storageType === STORAGE_TYPES.localStorage){
    //         let items = this.getItems();
    //         let existing_idx = getExIdx(items);
    //         if(items[existing_idx]) items[existing_idx] = isFullData? { ...item } : { ...items[existing_idx], ...item };
    //         else items.push(item);
    //         window.localStorage.setItem(this.name, JSON.stringify(items));
    //     } else if(this.storageType === STORAGE_TYPES.array){
    //         if(this.items.length){
                
    //             if(this.matchesIdObj(item, this.items[index])){
    //                 this.items[index] = isFullData? { ...item } : { ...this.items[index], ...item };
    //             } else {
    //                 const existing_idx = getExIdx(this.items);
    //                 if(typeof existing_idx === "number" && this.matchesIdObj(this.items[existing_idx], item)){

    //                 }
    //             }
    //         }
    //     } else {
    //         this.itemsObj = this.itemsObj || {};
    //         let existing = this.itemsObj[this.getIdStr(item)] || {};
    //         this.itemsObj[this.getIdStr(item)] = isFullData? { ...item } : { ...existing,  ...item };
    //     }
    // }

    /**
     * Sets the current data
     * @param items data
     */
    setItems = (items: object[]): void => {
        if(this.storageType === STORAGE_TYPES.localStorage){
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
                    return !this.filter || !Object.keys(this.filter).find(key => d[key].toString() !== this.filter[key].toString())
                })
                .sort((a, b) => 
                    s_fields.map(key => 
                        a[key] < b[key]? -1 : a[key] > b[key]? 1 : 0
                    ).find(v => v) 
                );
        }
        this.items = items;
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