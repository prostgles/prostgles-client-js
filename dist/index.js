!function(e,t){if("object"==typeof exports&&"object"==typeof module)module.exports=t();else if("function"==typeof define&&define.amd)define([],t);else{var n=t();for(var i in n)("object"==typeof exports?exports:e)[i]=n[i]}}(this||window,(()=>(()=>{var e={133:(e,t,n)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.SyncedTable=t.debug=void 0;const i=n(792),s="DEBUG_SYNCEDTABLE",r="undefined"!=typeof window;t.debug=function(...e){r&&window[s]&&window[s](...e)};const o={array:"array",localStorage:"localStorage",object:"object"};class a{constructor({name:e,filter:n,onChange:s,onReady:a,db:c,skipFirstTrigger:d=!1,select:h="*",storageType:u="object",patchText:f=!1,patchJSON:m=!1,onError:g}){if(this.throttle=100,this.batch_size=50,this.skipFirstTrigger=!1,this.columns=[],this._multiSubscriptions=[],this._singleSubscriptions=[],this.items=[],this.itemsObj={},this.isSynced=!1,this.updatePatches=async e=>{var t,n;let s=e.map((e=>e.current)),r=[],o=[];if(this.columns&&this.columns.length&&(null===(t=this.tableHandler)||void 0===t?void 0:t.updateBatch)&&(this.patchText||this.patchJSON)){const t=this.columns.filter((e=>"text"===e.data_type));if(this.patchText&&t.length){s=[];const n=[this.synced_field,...this.id_fields];await Promise.all(e.slice(0).map((async(e,a)=>{const{current:l,initial:c}={...e};let d;c&&(t.map((e=>{!n.includes(e.name)&&e.name in l&&(null!=d||(d={...l}),d[e.name]=(0,i.getTextPatch)(c[e.name],l[e.name]))})),d&&this.wal&&(o.push(d),r.push([this.wal.getIdObj(d),this.wal.getDeltaObj(d)]))),d||s.push(l)})))}}if(r.length)try{await(null===(n=this.tableHandler)||void 0===n?void 0:n.updateBatch(r))}catch(e){console.log("failed to patch update",e),s=s.concat(o)}return s.filter((e=>e))},this._notifySubscribers=(e=[])=>{if(!this.isSynced)return;let t=[],n=[],i=[];if(e.map((({idObj:e,newItem:s,delta:r})=>{this.singleSubscriptions.filter((t=>this.matchesIdObj(t.idObj,e))).map((async e=>{try{await e.notify(s,r)}catch(e){console.error("SyncedTable failed to notify: ",e)}})),this.matchesFilter(s)&&(t.push(s),n.push(r),i.push(e))})),this.onChange||this.multiSubscriptions.length){let e=[],i=[];if(this.getItems().map((s=>{e.push({...s});const r=t.findIndex((e=>this.matchesIdObj(s,e)));i.push(n[r])})),this.onChange)try{this.onChange(e,i)}catch(e){console.error("SyncedTable failed to notify onChange: ",e)}this.multiSubscriptions.map((async t=>{try{await t.notify(e,i)}catch(e){console.error("SyncedTable failed to notify: ",e)}}))}},this.unsubscribe=e=>(this.singleSubscriptions=this.singleSubscriptions.filter((t=>t._onChange!==e)),this.multiSubscriptions=this.multiSubscriptions.filter((t=>t._onChange!==e)),(0,t.debug)("unsubscribe",this),"ok"),this.unsync=()=>{this.dbSync&&this.dbSync.unsync&&this.dbSync.unsync()},this.destroy=()=>{this.unsync(),this.multiSubscriptions=[],this.singleSubscriptions=[],this.itemsObj={},this.items=[],this.onChange=void 0},this.delete=async(e,t=!1)=>{var n;const i=this.getIdObj(e);return this.setItem(i,void 0,!0,!0),!t&&(null===(n=this.tableHandler)||void 0===n?void 0:n.delete)&&await this.tableHandler.delete(i),this._notifySubscribers(),!0},this.checkItemCols=e=>{if(this.columns&&this.columns.length){const t=Object.keys({...e}).filter((e=>!this.columns.find((t=>t.name===e))));if(t.length)throw"Unexpected columns in sync item update: "+t.join(", ")}},this.upsert=async(e,t=!1)=>{var n,s;if(!(e&&e.length||t))throw"No data provided for upsert";let r,o=[],a=[];await Promise.all(e.map((async(e,n)=>{var s;let c={...e.idObj},d={...e.delta};Object.keys(d).map((e=>{void 0===d[e]&&(d[e]=null)})),t||this.checkItemCols({...e.delta,...e.idObj});let h=this.getItem(c),u=h.index,f=h.data;!t&&!(0,i.isEmpty)(d)||(0,i.isEmpty)(f)||(d=this.getDelta(f||{},d)),t||(d[this.synced_field]=Date.now());let m={...f,...d,...c};f&&!t&&(null===(s=e.opts)||void 0===s?void 0:s.deepMerge)&&(m=l({...f,...c},{...d})),r=f?f[this.synced_field]<m[this.synced_field]?"updated":"unchanged":"inserted",this.setItem(m,u);let g={idObj:c,delta:d,oldItem:f,newItem:m,status:r,from_server:t};return t||a.push({initial:f,current:{...m}}),g.delta&&!(0,i.isEmpty)(g.delta)&&o.push(g),!0}))).catch((e=>{console.error("SyncedTable failed upsert: ",e)})),null===(n=this.notifyWal)||void 0===n||n.addData(o.map((e=>({initial:e.oldItem,current:e.newItem})))),!t&&a.length&&(null===(s=this.wal)||void 0===s||s.addData(a))},this.setItems=e=>{if(this.storageType===o.localStorage){if(!r)throw"Cannot access window object. Choose another storage method (array OR object)";window.localStorage.setItem(this.name,JSON.stringify(e))}else this.storageType===o.array?this.items=e:this.itemsObj=e.reduce(((e,t)=>({...e,[this.getIdStr(t)]:{...t}})),{})},this.getItems=()=>{let e=[];if(this.storageType===o.localStorage){if(!r)throw"Cannot access window object. Choose another storage method (array OR object)";let t=window.localStorage.getItem(this.name);if(t)try{e=JSON.parse(t)}catch(e){console.error(e)}}else e=this.storageType===o.array?this.items.map((e=>({...e}))):Object.values({...this.itemsObj});if(!this.id_fields||!this.synced_field)throw"id_fields AND/OR synced_field missing";{const t=[this.synced_field,...this.id_fields.sort()];e=e.filter((e=>!this.filter||!(0,i.getKeys)(this.filter).find((t=>e[t]!==this.filter[t])))).sort(((e,n)=>t.map((t=>e[t]<n[t]?-1:e[t]>n[t]?1:0)).find((e=>e))))}return e.map((e=>({...e})))},this.getBatch=({from_synced:e,to_synced:t,offset:n,limit:i}={offset:0,limit:void 0})=>{let s=this.getItems().map((e=>({...e}))).filter((n=>(!Number.isFinite(e)||+n[this.synced_field]>=+e)&&(!Number.isFinite(t)||+n[this.synced_field]<=+t)));return(n||i)&&(s=s.splice(null!=n?n:0,i||s.length)),s},this.name=e,this.filter=n,this.select=h,this.onChange=s,!o[u])throw"Invalid storage type. Expecting one of: "+Object.keys(o).join(", ");if(r||u!==o.localStorage||(console.warn("Could not set storageType to localStorage: window object missing\nStorage changed to object"),u="object"),this.storageType=u,this.patchText=f,this.patchJSON=m,!c)throw"db missing";this.db=c;const{id_fields:p,synced_field:y,throttle:b=100,batch_size:S=50}=c[this.name]._syncInfo;if(!p||!y)throw"id_fields/synced_field missing";this.id_fields=p,this.synced_field=y,this.batch_size=S,this.throttle=b,this.skipFirstTrigger=d,this.multiSubscriptions=[],this.singleSubscriptions=[],this.onError=g||function(e){console.error("Sync internal error: ",e)};const _={id_fields:p,synced_field:y,throttle:b};c[this.name]._sync(n,{select:h},{onSyncRequest:e=>{let t={c_lr:void 0,c_fr:void 0,c_count:0},n=this.getBatch(e);return n.length&&(t={c_fr:this.getRowSyncObj(n[0]),c_lr:this.getRowSyncObj(n[n.length-1]),c_count:n.length}),t},onPullRequest:async e=>this.getBatch(e),onUpdates:async e=>{var t;if("err"in e&&e.err)null===(t=this.onError)||void 0===t||t.call(this,e.err);else if("isSynced"in e&&e.isSynced&&!this.isSynced){this.isSynced=e.isSynced;let t=this.getItems().map((e=>({...e})));this.setItems([]);const n=t.map((e=>({idObj:this.getIdObj(e),delta:{...e}})));await this.upsert(n,!0)}else if("data"in e){let t=e.data.map((e=>({idObj:this.getIdObj(e),delta:e})));await this.upsert(t,!0)}else console.error("Unexpected onUpdates");return!0}}).then((e=>{function t(){return"Data may be lost. Are you sure?"}this.dbSync=e,this.wal=new i.WAL({..._,batch_size:S,onSendStart:()=>{r&&(window.onbeforeunload=t)},onSend:async(e,t)=>(await this.updatePatches(t)).length?this.dbSync.syncData(e):[],onSendEnd:()=>{r&&(window.onbeforeunload=null)}}),this.notifyWal=new i.WAL({..._,batch_size:1/0,throttle:5,onSend:async(e,t)=>{this._notifySubscribers(t.map((e=>{var t;return{delta:this.getDelta(null!==(t=e.initial)&&void 0!==t?t:{},e.current),idObj:this.getIdObj(e.current),newItem:e.current}})))}}),a()})),c[this.name].getColumns&&c[this.name].getColumns().then((e=>{this.columns=e})),this.onChange&&!this.skipFirstTrigger&&setTimeout(this.onChange,0),(0,t.debug)(this)}set multiSubscriptions(e){(0,t.debug)(e,this._multiSubscriptions),this._multiSubscriptions=e.slice(0)}get multiSubscriptions(){return this._multiSubscriptions}set singleSubscriptions(e){(0,t.debug)(e,this._singleSubscriptions),this._singleSubscriptions=e.slice(0)}get singleSubscriptions(){return this._singleSubscriptions}static create(e){return new Promise(((t,n)=>{try{const n=new a({...e,onReady:()=>{setTimeout((()=>{t(n)}),0)}})}catch(e){n(e)}}))}sync(e,t=!0){const n={$unsync:()=>this.unsubscribe(e),getItems:()=>this.getItems(),$upsert:e=>{if(e){const t=e=>({idObj:this.getIdObj(e),delta:e});Array.isArray(e)?this.upsert(e.map((e=>t(e)))):this.upsert([t(e)])}}},i={_onChange:e,handlesOnData:t,handles:n,notify:(n,i)=>{let s=[...n],r=[...i];return t&&(s=s.map(((n,i)=>{const s=(n,i)=>({...n,...this.makeSingleSyncHandles(i,e),$get:()=>s(this.getItem(i).data,i),$find:e=>s(this.getItem(e).data,e),$update:(e,t)=>this.upsert([{idObj:i,delta:e,opts:t}]).then((e=>!0)),$delete:async()=>this.delete(i),$cloneMultiSync:e=>this.sync(e,t)}),r=this.getIdObj(n);return s(n,r)}))),e(s,r)}};return this.multiSubscriptions.push(i),this.skipFirstTrigger||setTimeout((()=>{let e=this.getItems();i.notify(e,e)}),0),Object.freeze({...n})}makeSingleSyncHandles(e,n){if(!e||!n)throw"syncOne(idObj, onChange) -> MISSING idObj or onChange";const i={$get:()=>this.getItem(e).data,$find:e=>this.getItem(e).data,$unsync:()=>this.unsubscribe(n),$delete:()=>this.delete(e),$update:(n,i)=>{this.singleSubscriptions.length||this.multiSubscriptions.length||(console.warn("No sync listeners"),(0,t.debug)("nosync",this._singleSubscriptions,this._multiSubscriptions)),this.upsert([{idObj:e,delta:n,opts:i}])},$cloneSync:t=>this.syncOne(e,t),$cloneMultiSync:e=>this.sync(e,!0)};return i}syncOne(e,t,n=!0){const i=this.makeSingleSyncHandles(e,t),s={_onChange:t,idObj:e,handlesOnData:n,handles:i,notify:(e,s)=>{let r={...e};return n&&(r.$get=i.$get,r.$find=i.$find,r.$update=i.$update,r.$delete=i.$delete,r.$unsync=i.$unsync,r.$cloneSync=i.$cloneSync),t(r,s)}};return this.singleSubscriptions.push(s),setTimeout((()=>{let e=i.$get();e&&s.notify(e,e)}),0),Object.freeze({...i})}getIdStr(e){return this.id_fields.sort().map((t=>`${e[t]||""}`)).join(".")}getIdObj(e){let t={};return this.id_fields.sort().map((n=>{t[n]=e[n]})),t}getRowSyncObj(e){let t={};return[this.synced_field,...this.id_fields].sort().map((n=>{t[n]=e[n]})),t}matchesFilter(e){return Boolean(e&&(!this.filter||(0,i.isEmpty)(this.filter)||!Object.keys(this.filter).find((t=>this.filter[t]!==e[t]))))}matchesIdObj(e,t){return Boolean(e&&t&&!this.id_fields.sort().find((n=>e[n]!==t[n])))}getDelta(e,t){return(0,i.isEmpty)(e)?{...t}:Object.keys({...e,...t}).filter((e=>!this.id_fields.includes(e))).reduce(((n,i)=>{let s={};if(i in t&&t[i]!==e[i]){let n={[i]:t[i]};t[i]&&e[i]&&"object"==typeof e[i]?JSON.stringify(t[i])!==JSON.stringify(e[i])&&(s=n):s=n}return{...n,...s}}),{})}deleteAll(){this.getItems().map((e=>this.delete(e)))}get tableHandler(){const e=this.db[this.name];if(e.update&&e.updateBatch)return e}getItem(e){let t;return this.storageType===o.localStorage?t=this.getItems().find((t=>this.matchesIdObj(t,e))):this.storageType===o.array?t=this.items.find((t=>this.matchesIdObj(t,e))):(this.itemsObj=this.itemsObj||{},t={...this.itemsObj}[this.getIdStr(e)]),{data:t?{...t}:t,index:-1}}setItem(e,t,n=!1,i=!1){if(this.storageType===o.localStorage){let s=this.getItems();i?s=s.filter((t=>!this.matchesIdObj(t,e))):void 0!==t&&s[t]?s[t]=n?{...e}:{...s[t],...e}:s.push(e),r&&window.localStorage.setItem(this.name,JSON.stringify(s))}else if(this.storageType===o.array)i?this.items=this.items.filter((t=>!this.matchesIdObj(t,e))):void 0===t||this.items[t]?void 0!==t&&(this.items[t]=n?{...e}:{...this.items[t],...e}):this.items.push(e);else if(this.itemsObj=this.itemsObj||{},i)delete this.itemsObj[this.getIdStr(e)];else{let t=this.itemsObj[this.getIdStr(e)]||{};this.itemsObj[this.getIdStr(e)]=n?{...e}:{...t,...e}}}}function l(e,t){let n=Object.assign({},e);return(0,i.isObject)(e)&&(0,i.isObject)(t)&&Object.keys(t).forEach((s=>{(0,i.isObject)(t[s])?s in e?n[s]=l(e[s],t[s]):Object.assign(n,{[s]:t[s]}):Object.assign(n,{[s]:t[s]})})),n}t.SyncedTable=a,t.default=l},274:(e,t,n)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.prostgles=t.debug=void 0;const i=n(792),s="DEBUG_SYNCEDTABLE",r="undefined"!=typeof window;t.debug=function(...e){r&&window[s]&&window[s](...e)},t.prostgles=function(e,n){const{socket:s,onReady:r,onDisconnect:o,onReconnect:a,onSchemaChange:l=!0}=e;if((0,t.debug)("prostgles",{initOpts:e}),l){let e;"function"==typeof l&&(e=l),s.removeAllListeners(i.CHANNELS.SCHEMA_CHANGED),e&&s.on(i.CHANNELS.SCHEMA_CHANGED,e)}const c=i.CHANNELS._preffix;let d,h={},u={},f={},m={},g=!1;function p(e,n){return(0,t.debug)("_unsubscribe",{channelName:e,handler:n}),new Promise(((t,i)=>{h[e]?(h[e].handlers=h[e].handlers.filter((e=>e!==n)),h[e].handlers.length||(s.emit(e+"unsubscribe",{},((e,t)=>{e&&console.error(e)})),s.removeListener(e,h[e].onCall),delete h[e]),t(!0)):t(!0)}))}function y({tableName:e,command:t,param1:n,param2:i},r){return new Promise(((o,a)=>{s.emit(c,{tableName:e,command:t,param1:n,param2:i},((e,t)=>{if(e)console.error(e),a(e);else if(t){const{id_fields:e,synced_field:n,channelName:i}=t;s.emit(i,{onSyncRequest:r({})},(e=>{console.log(e)})),o({id_fields:e,synced_field:n,channelName:i})}}))}))}function b({tableName:e,command:t,param1:n,param2:i}){return new Promise(((r,o)=>{s.emit(c,{tableName:e,command:t,param1:n,param2:i},((e,t)=>{e?(console.error(e),o(e)):t&&r(t.channelName)}))}))}async function S(e,{tableName:t,command:n,param1:i,param2:r},o,a){function l(n){let s={unsubscribe:function(){return p(n,o)},filter:{...i}};return e[t].update&&(s={...s,update:function(n,s){return e[t].update(i,n,s)}}),e[t].delete&&(s={...s,delete:function(n){return e[t].delete(i,n)}}),Object.freeze(s)}const c=Object.keys(h).find((e=>{let s=h[e];return s.tableName===t&&s.command===n&&JSON.stringify(s.param1||{})===JSON.stringify(i||{})&&JSON.stringify(s.param2||{})===JSON.stringify(r||{})}));if(c)return h[c].handlers.push(o),setTimeout((()=>{o&&(null==h?void 0:h[c].lastData)&&o(null==h?void 0:h[c].lastData)}),10),l(c);{const e=await b({tableName:t,command:n,param1:i,param2:r});let c=function(t,n){h[e]?t.data?(h[e].lastData=t.data,h[e].handlers.map((e=>{e(t.data)}))):t.err?h[e].errorHandlers.map((e=>{e(t.err)})):console.error("INTERNAL ERROR: Unexpected data format from subscription: ",t):console.warn("Orphaned subscription: ",e)},d=a||function(t){console.error(`Uncaught error within running subscription \n ${e}`,t)};return s.on(e,c),h[e]={lastData:void 0,tableName:t,command:n,param1:i,param2:r,onCall:c,handlers:[o],errorHandlers:[d],destroy:()=>{h[e]&&(Object.values(h[e]).map((t=>{t&&t.handlers&&t.handlers.map((t=>p(e,t)))})),delete h[e])}},l(e)}}return new Promise(((e,l)=>{o&&s.on("disconnect",o),s.on(i.CHANNELS.SCHEMA,(({schema:o,methods:p,tableSchema:_,auth:O,rawSQL:j,joinTables:v=[],err:w})=>{if(w)throw l(w),w;(0,t.debug)("destroySyncs",{subscriptions:h,syncedTables:u}),Object.values(h).map((e=>e.destroy())),h={},f={},Object.values(u).map((e=>{e&&e.destroy&&e.destroy()})),u={},g&&a&&a(s),g=!0;let N=JSON.parse(JSON.stringify(o)),C=JSON.parse(JSON.stringify(p)),T={},E={};if(O){if(O.pathGuard){const e=e=>{var t,n;(null==e?void 0:e.shouldReload)&&"undefined"!=typeof window&&(null===(n=null===(t=null===window||void 0===window?void 0:window.location)||void 0===t?void 0:t.reload)||void 0===n||n.call(t))};s.emit(i.CHANNELS.AUTHGUARD,JSON.stringify(window.location),((t,n)=>{e(n)})),s.removeAllListeners(i.CHANNELS.AUTHGUARD),s.on(i.CHANNELS.AUTHGUARD,(t=>{e(t)}))}E={...O},[i.CHANNELS.LOGIN,i.CHANNELS.LOGOUT,i.CHANNELS.REGISTER].map((e=>{O[e]&&(E[e]=function(t){return new Promise(((n,i)=>{s.emit(c+e,t,((e,t)=>{e?i(e):n(t)}))}))})}))}C.map((e=>{T[e]=function(...t){return new Promise(((n,r)=>{s.emit(i.CHANNELS.METHOD,{method:e,params:t},((e,t)=>{e?r(e):n(t)}))}))}})),T=Object.freeze(T),j&&(N.sql=function(e,t,n){return new Promise(((r,o)=>{s.emit(i.CHANNELS.SQL,{query:e,params:t,options:n},((e,t)=>{if(e)o(e);else if(n&&"noticeSubscription"===n.returnType&&t&&Object.keys(t).sort().join()===["socketChannel","socketUnsubChannel"].sort().join()&&!Object.values(t).find((e=>"string"!=typeof e))){const e=t,n=t=>(((e,t)=>{d=d||{config:t,listeners:[]},d.listeners.length||(s.removeAllListeners(t.socketChannel),s.on(t.socketChannel,(e=>{d&&d.listeners&&d.listeners.length?d.listeners.map((t=>{t(e)})):s.emit(t.socketUnsubChannel,{})}))),d.listeners.push(e)})(t,e),{...e,removeListener:()=>(e=>{d&&(d.listeners=d.listeners.filter((t=>t!==e)),!d.listeners.length&&d.config&&d.config.socketUnsubChannel&&s&&s.emit(d.config.socketUnsubChannel,{}))})(t)}),i={...e,addListener:n};r(i)}else if(n&&n.returnType&&"statement"===n.returnType||!t||Object.keys(t).sort().join()!==["socketChannel","socketUnsubChannel","notifChannel"].sort().join()||Object.values(t).find((e=>"string"!=typeof e)))r(t);else{const e=e=>(((e,t)=>{m=m||{},m[t.notifChannel]?m[t.notifChannel].listeners.push(e):(m[t.notifChannel]={config:t,listeners:[e]},s.removeAllListeners(t.socketChannel),s.on(t.socketChannel,(e=>{m[t.notifChannel]&&m[t.notifChannel].listeners&&m[t.notifChannel].listeners.length?m[t.notifChannel].listeners.map((t=>{t(e)})):s.emit(m[t.notifChannel].config.socketUnsubChannel,{})})))})(e,t),{...t,removeListener:()=>((e,t)=>{m&&m[t.notifChannel]&&(m[t.notifChannel].listeners=m[t.notifChannel].listeners.filter((t=>t!==e)),!m[t.notifChannel].listeners.length&&m[t.notifChannel].config&&m[t.notifChannel].config.socketUnsubChannel&&s&&(s.emit(m[t.notifChannel].config.socketUnsubChannel,{}),delete m[t.notifChannel]))})(e,t)}),n={...t,addListener:e};r(n)}}))}))});const I=e=>"[object Object]"===Object.prototype.toString.call(e),P=(e,t,n,i)=>{if(!I(e)||!I(t)||"function"!=typeof n||i&&"function"!=typeof i)throw"Expecting: ( basicFilter<object>, options<object>, onChange<function> , onError?<function>) but got something else"},A=["subscribe","subscribeOne"];Object.keys(N).forEach((e=>{Object.keys(N[e]).sort(((e,t)=>A.includes(e)-A.includes(t))).forEach((i=>{if(["find","findOne"].includes(i)&&(N[e].getJoinedTables=function(){return(v||[]).filter((t=>Array.isArray(t)&&t.includes(e))).flat().filter((t=>t!==e))}),"sync"===i){if(N[e]._syncInfo={...N[e][i]},n){N[e].getSync=(t,i={})=>n.create({name:e,filter:t,db:N,...i});const t=async(t={},i={},s)=>{const r=`${e}.${JSON.stringify(t)}.${JSON.stringify(i)}`;return u[r]||(u[r]=await n.create({...i,name:e,filter:t,db:N,onError:s})),u[r]};N[e].sync=async(e,n={handlesOnData:!0,select:"*"},i,s)=>{P(e,n,i,s);const r=await t(e,n,s);return await r.sync(i,n.handlesOnData)},N[e].syncOne=async(e,n={handlesOnData:!0},i,s)=>{P(e,n,i,s);const r=await t(e,n,s);return await r.syncOne(e,i,n.handlesOnData)}}N[e]._sync=function(n,r,o){return async function({tableName:e,command:n,param1:i,param2:r},o){const{onPullRequest:a,onSyncRequest:l,onUpdates:c}=o;function d(e){return Object.freeze({unsync:function(){!function(e,n){(0,t.debug)("_unsync",{channelName:e,triggers:n}),new Promise(((t,i)=>{f[e]&&(f[e].triggers=f[e].triggers.filter((e=>e.onPullRequest!==n.onPullRequest&&e.onSyncRequest!==n.onSyncRequest&&e.onUpdates!==n.onUpdates)),f[e].triggers.length||(s.emit(e+"unsync",{},((e,n)=>{e?i(e):t(n)})),s.removeListener(e,f[e].onCall),delete f[e]))}))}(e,o)},syncData:function(t,n,i){s.emit(e,{onSyncRequest:{...l({}),...{data:t}||{},...{deleted:n}||{}}},i?e=>{i(e)}:null)}})}const h=Object.keys(f).find((t=>{let s=f[t];return s.tableName===e&&s.command===n&&JSON.stringify(s.param1||{})===JSON.stringify(i||{})&&JSON.stringify(s.param2||{})===JSON.stringify(r||{})}));if(h)return f[h].triggers.push(o),d(h);{const u=await y({tableName:e,command:n,param1:i,param2:r},l),{channelName:m,synced_field:g,id_fields:p}=u;function b(t,n){t&&f[m]&&f[m].triggers.map((({onUpdates:i,onSyncRequest:s,onPullRequest:r})=>{t.data?Promise.resolve(i(t)).then((()=>{n&&n({ok:!0})})).catch((t=>{n?n({err:t}):console.error(e+" onUpdates error",t)})):t.onSyncRequest?Promise.resolve(s(t.onSyncRequest)).then((e=>n({onSyncRequest:e}))).catch((t=>{n?n({err:t}):console.error(e+" onSyncRequest error",t)})):t.onPullRequest?Promise.resolve(r(t.onPullRequest)).then((e=>{n({data:e})})).catch((t=>{n?n({err:t}):console.error(e+" onPullRequest error",t)})):console.log("unexpected response")}))}return f[m]={tableName:e,command:n,param1:i,param2:r,triggers:[o],syncInfo:u,onCall:b},s.on(m,b),d(m)}}({tableName:e,command:i,param1:n,param2:r},o)}}else if(A.includes(i)){N[e][i]=function(t,n,s,r){return P(t,n,s,r),S(N,{tableName:e,command:i,param1:t,param2:n},s,r)};const t="subscribeOne";i!==t&&A.includes(t)||(N[e][t]=function(t,n,s,r){return P(t,n,s,r),S(N,{tableName:e,command:i,param1:t,param2:n},(e=>{s(e[0])}),r)})}else N[e][i]=function(t,n,r){return new Promise(((o,a)=>{s.emit(c,{tableName:e,command:i,param1:t,param2:n,param3:r},((e,t)=>{e?a(e):o(t)}))}))}}))})),h&&Object.keys(h).length&&Object.keys(h).map((async e=>{try{let t=h[e];await b(t),s.on(e,t.onCall)}catch(e){console.error("There was an issue reconnecting old subscriptions",e)}})),f&&Object.keys(f).length&&Object.keys(f).filter((e=>f[e].triggers&&f[e].triggers.length)).map((async e=>{try{let t=f[e];await y(t,t.triggers[0].onSyncRequest),s.on(e,t.onCall)}catch(e){console.error("There was an issue reconnecting olf subscriptions",e)}})),v.flat().map((e=>{function t(t=!0,n,i,s){return{[t?"$leftJoin":"$innerJoin"]:e,filter:n,select:i,...s}}N.innerJoin=N.innerJoin||{},N.leftJoin=N.leftJoin||{},N.innerJoinOne=N.innerJoinOne||{},N.leftJoinOne=N.leftJoinOne||{},N.leftJoin[e]=(e,n,i={})=>t(!0,e,n,i),N.innerJoin[e]=(e,n,i={})=>t(!1,e,n,i),N.leftJoinOne[e]=(e,n,i={})=>t(!0,e,n,{...i,limit:1}),N.innerJoinOne[e]=(e,n,i={})=>t(!1,e,n,{...i,limit:1})})),(async()=>{try{await r(N,T,_,E)}catch(e){console.error("Prostgles: Error within onReady: \n",e),l(e)}e(N)})()}))}))}},792:function(e){var t;this||window,t=()=>(()=>{"use strict";var e={444:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.EXISTS_KEYS=t.GeomFilter_Funcs=t.GeomFilterKeys=t.ArrayFilterOperands=t.TextFilter_FullTextSearchFilterKeys=t.TextFilterFTSKeys=t.TextFilterKeys=t.CompareInFilterKeys=t.CompareFilterKeys=void 0,t.CompareFilterKeys=["=","$eq","<>",">",">=","<=","$eq","$ne","$gt","$gte","$lte"],t.CompareInFilterKeys=["$in","$nin"],t.TextFilterKeys=["$ilike","$like"],t.TextFilterFTSKeys=["@@","@>","<@","$contains","$containedBy"],t.TextFilter_FullTextSearchFilterKeys=["to_tsquery","plainto_tsquery","phraseto_tsquery","websearch_to_tsquery"],t.ArrayFilterOperands=[...t.TextFilterFTSKeys,"&&","$overlaps"],t.GeomFilterKeys=["~","~=","@","|&>","|>>",">>","=","<<|","<<","&>","&<|","&<","&&&","&&"];const n=["ST_MakeEnvelope","ST_MakePolygon"];t.GeomFilter_Funcs=n.concat(n.map((e=>e.toLowerCase()))),t.EXISTS_KEYS=["$exists","$notExists","$existsJoined","$notExistsJoined"]},590:function(e,t,n){var i=this&&this.__createBinding||(Object.create?function(e,t,n,i){void 0===i&&(i=n);var s=Object.getOwnPropertyDescriptor(t,n);s&&!("get"in s?!t.__esModule:s.writable||s.configurable)||(s={enumerable:!0,get:function(){return t[n]}}),Object.defineProperty(e,i,s)}:function(e,t,n,i){void 0===i&&(i=n),e[i]=t[n]}),s=this&&this.__exportStar||function(e,t){for(var n in e)"default"===n||Object.prototype.hasOwnProperty.call(t,n)||i(t,e,n)};Object.defineProperty(t,"__esModule",{value:!0}),t.getKeys=t.isObject=t.isDefined=t.get=t.WAL=t.unpatchText=t.stableStringify=t.isEmpty=t.getTextPatch=t.asName=t.RULE_METHODS=t.CHANNELS=t.TS_PG_Types=t._PG_postgis=t._PG_date=t._PG_bool=t._PG_json=t._PG_numbers=t._PG_strings=void 0,t._PG_strings=["bpchar","char","varchar","text","citext","uuid","bytea","inet","time","timetz","interval","name"],t._PG_numbers=["int2","int4","int8","float4","float8","numeric","money","oid"],t._PG_json=["json","jsonb"],t._PG_bool=["bool"],t._PG_date=["date","timestamp","timestamptz"],t._PG_postgis=["geometry","geography"],t.TS_PG_Types={string:t._PG_strings,number:t._PG_numbers,boolean:t._PG_bool,Date:t._PG_date,"Array<number>":t._PG_numbers.map((e=>`_${e}`)),"Array<boolean>":t._PG_bool.map((e=>`_${e}`)),"Array<string>":t._PG_strings.map((e=>`_${e}`)),"Array<Object>":t._PG_json.map((e=>`_${e}`)),"Array<Date>":t._PG_date.map((e=>`_${e}`)),any:[]};const r="_psqlWS_.";t.CHANNELS={SCHEMA_CHANGED:r+"schema-changed",SCHEMA:r+"schema",DEFAULT:r,SQL:"_psqlWS_.sql",METHOD:"_psqlWS_.method",NOTICE_EV:"_psqlWS_.notice",LISTEN_EV:"_psqlWS_.listen",REGISTER:"_psqlWS_.register",LOGIN:"_psqlWS_.login",LOGOUT:"_psqlWS_.logout",AUTHGUARD:"_psqlWS_.authguard",_preffix:r},t.RULE_METHODS={getColumns:["getColumns"],getInfo:["getInfo"],insert:["insert","upsert"],update:["update","upsert","updateBatch"],select:["findOne","find","count","size"],delete:["delete","remove"],sync:["sync","unsync"],subscribe:["unsubscribe","subscribe","subscribeOne"]};var o=n(128);Object.defineProperty(t,"asName",{enumerable:!0,get:function(){return o.asName}}),Object.defineProperty(t,"getTextPatch",{enumerable:!0,get:function(){return o.getTextPatch}}),Object.defineProperty(t,"isEmpty",{enumerable:!0,get:function(){return o.isEmpty}}),Object.defineProperty(t,"stableStringify",{enumerable:!0,get:function(){return o.stableStringify}}),Object.defineProperty(t,"unpatchText",{enumerable:!0,get:function(){return o.unpatchText}}),Object.defineProperty(t,"WAL",{enumerable:!0,get:function(){return o.WAL}}),Object.defineProperty(t,"get",{enumerable:!0,get:function(){return o.get}}),Object.defineProperty(t,"isDefined",{enumerable:!0,get:function(){return o.isDefined}}),Object.defineProperty(t,"isObject",{enumerable:!0,get:function(){return o.isObject}}),Object.defineProperty(t,"getKeys",{enumerable:!0,get:function(){return o.getKeys}}),s(n(444),t)},899:(e,t)=>{function n(e,t){var n=e[0],i=e[1],l=e[2],c=e[3];n=s(n,i,l,c,t[0],7,-680876936),c=s(c,n,i,l,t[1],12,-389564586),l=s(l,c,n,i,t[2],17,606105819),i=s(i,l,c,n,t[3],22,-1044525330),n=s(n,i,l,c,t[4],7,-176418897),c=s(c,n,i,l,t[5],12,1200080426),l=s(l,c,n,i,t[6],17,-1473231341),i=s(i,l,c,n,t[7],22,-45705983),n=s(n,i,l,c,t[8],7,1770035416),c=s(c,n,i,l,t[9],12,-1958414417),l=s(l,c,n,i,t[10],17,-42063),i=s(i,l,c,n,t[11],22,-1990404162),n=s(n,i,l,c,t[12],7,1804603682),c=s(c,n,i,l,t[13],12,-40341101),l=s(l,c,n,i,t[14],17,-1502002290),n=r(n,i=s(i,l,c,n,t[15],22,1236535329),l,c,t[1],5,-165796510),c=r(c,n,i,l,t[6],9,-1069501632),l=r(l,c,n,i,t[11],14,643717713),i=r(i,l,c,n,t[0],20,-373897302),n=r(n,i,l,c,t[5],5,-701558691),c=r(c,n,i,l,t[10],9,38016083),l=r(l,c,n,i,t[15],14,-660478335),i=r(i,l,c,n,t[4],20,-405537848),n=r(n,i,l,c,t[9],5,568446438),c=r(c,n,i,l,t[14],9,-1019803690),l=r(l,c,n,i,t[3],14,-187363961),i=r(i,l,c,n,t[8],20,1163531501),n=r(n,i,l,c,t[13],5,-1444681467),c=r(c,n,i,l,t[2],9,-51403784),l=r(l,c,n,i,t[7],14,1735328473),n=o(n,i=r(i,l,c,n,t[12],20,-1926607734),l,c,t[5],4,-378558),c=o(c,n,i,l,t[8],11,-2022574463),l=o(l,c,n,i,t[11],16,1839030562),i=o(i,l,c,n,t[14],23,-35309556),n=o(n,i,l,c,t[1],4,-1530992060),c=o(c,n,i,l,t[4],11,1272893353),l=o(l,c,n,i,t[7],16,-155497632),i=o(i,l,c,n,t[10],23,-1094730640),n=o(n,i,l,c,t[13],4,681279174),c=o(c,n,i,l,t[0],11,-358537222),l=o(l,c,n,i,t[3],16,-722521979),i=o(i,l,c,n,t[6],23,76029189),n=o(n,i,l,c,t[9],4,-640364487),c=o(c,n,i,l,t[12],11,-421815835),l=o(l,c,n,i,t[15],16,530742520),n=a(n,i=o(i,l,c,n,t[2],23,-995338651),l,c,t[0],6,-198630844),c=a(c,n,i,l,t[7],10,1126891415),l=a(l,c,n,i,t[14],15,-1416354905),i=a(i,l,c,n,t[5],21,-57434055),n=a(n,i,l,c,t[12],6,1700485571),c=a(c,n,i,l,t[3],10,-1894986606),l=a(l,c,n,i,t[10],15,-1051523),i=a(i,l,c,n,t[1],21,-2054922799),n=a(n,i,l,c,t[8],6,1873313359),c=a(c,n,i,l,t[15],10,-30611744),l=a(l,c,n,i,t[6],15,-1560198380),i=a(i,l,c,n,t[13],21,1309151649),n=a(n,i,l,c,t[4],6,-145523070),c=a(c,n,i,l,t[11],10,-1120210379),l=a(l,c,n,i,t[2],15,718787259),i=a(i,l,c,n,t[9],21,-343485551),e[0]=u(n,e[0]),e[1]=u(i,e[1]),e[2]=u(l,e[2]),e[3]=u(c,e[3])}function i(e,t,n,i,s,r){return t=u(u(t,e),u(i,r)),u(t<<s|t>>>32-s,n)}function s(e,t,n,s,r,o,a){return i(t&n|~t&s,e,t,r,o,a)}function r(e,t,n,s,r,o,a){return i(t&s|n&~s,e,t,r,o,a)}function o(e,t,n,s,r,o,a){return i(t^n^s,e,t,r,o,a)}function a(e,t,n,s,r,o,a){return i(n^(t|~s),e,t,r,o,a)}function l(e){var t,n=[];for(t=0;t<64;t+=4)n[t>>2]=e.charCodeAt(t)+(e.charCodeAt(t+1)<<8)+(e.charCodeAt(t+2)<<16)+(e.charCodeAt(t+3)<<24);return n}Object.defineProperty(t,"__esModule",{value:!0}),t.md5=t.md5cycle=void 0,t.md5cycle=n;var c="0123456789abcdef".split("");function d(e){for(var t="",n=0;n<4;n++)t+=c[e>>8*n+4&15]+c[e>>8*n&15];return t}function h(e){return function(e){for(var t=0;t<e.length;t++)e[t]=d(e[t]);return e.join("")}(function(e){var t,i=e.length,s=[1732584193,-271733879,-1732584194,271733878];for(t=64;t<=e.length;t+=64)n(s,l(e.substring(t-64,t)));e=e.substring(t-64);var r=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];for(t=0;t<e.length;t++)r[t>>2]|=e.charCodeAt(t)<<(t%4<<3);if(r[t>>2]|=128<<(t%4<<3),t>55)for(n(s,r),t=0;t<16;t++)r[t]=0;return r[14]=8*i,n(s,r),s}(e))}function u(e,t){return e+t&4294967295}t.md5=h,h("hello")},128:(e,t,n)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.getKeys=t.isDefined=t.isObject=t.get=t.isEmpty=t.WAL=t.unpatchText=t.getTextPatch=t.stableStringify=t.asName=void 0;const i=n(899);function s(e){for(var t in e)return!1;return!0}t.asName=function(e){if(null==e||!e.toString||!e.toString())throw"Expecting a non empty string";return`"${e.toString().replace(/"/g,'""')}"`},t.stableStringify=function(e,t){t||(t={}),"function"==typeof t&&(t={cmp:t});var n,i="boolean"==typeof t.cycles&&t.cycles,s=t.cmp&&(n=t.cmp,function(e){return function(t,i){var s={key:t,value:e[t]},r={key:i,value:e[i]};return n(s,r)}}),r=[];return function e(t){if(t&&t.toJSON&&"function"==typeof t.toJSON&&(t=t.toJSON()),void 0!==t){if("number"==typeof t)return isFinite(t)?""+t:"null";if("object"!=typeof t)return JSON.stringify(t);var n,o;if(Array.isArray(t)){for(o="[",n=0;n<t.length;n++)n&&(o+=","),o+=e(t[n])||"null";return o+"]"}if(null===t)return"null";if(-1!==r.indexOf(t)){if(i)return JSON.stringify("__cycle__");throw new TypeError("Converting circular structure to JSON")}var a=r.push(t)-1,l=Object.keys(t).sort(s&&s(t));for(o="",n=0;n<l.length;n++){var c=l[n],d=e(t[c]);d&&(o&&(o+=","),o+=JSON.stringify(c)+":"+d)}return r.splice(a,1),"{"+o+"}"}}(e)},t.getTextPatch=function(e,t){if(!(e&&t&&e.trim().length&&t.trim().length))return t;if(e===t)return{from:0,to:0,text:"",md5:(0,i.md5)(t)};function n(n=1){let i=n<1?-1:0,s=!1;for(;!s&&Math.abs(i)<=t.length;){const r=n<1?[i]:[0,i];e.slice(...r)!==t.slice(...r)?s=!0:i+=1*Math.sign(n)}return i}let s=n()-1,r=e.length+n(-1)+1,o=t.length+n(-1)+1;return{from:s,to:r,text:t.slice(s,o),md5:(0,i.md5)(t)}},t.unpatchText=function(e,t){if(!t||"string"==typeof t)return t;const{from:n,to:s,text:r,md5:o}=t;if(null===r||null===e)return r;let a=e.slice(0,n)+r+e.slice(s);if(o&&(0,i.md5)(a)!==o)throw"Patch text error: Could not match md5 hash: (original/result) \n"+e+"\n"+a;return a},t.WAL=class{constructor(e){if(this.changed={},this.sending={},this.sentHistory={},this.callbacks=[],this.sort=(e,t)=>{const{orderBy:n}=this.options;return n&&e&&t&&n.map((n=>{if(!(n.fieldName in e)||!(n.fieldName in t))throw"Replication error: \n   some orderBy fields missing from data";let i=n.asc?e[n.fieldName]:t[n.fieldName],s=n.asc?t[n.fieldName]:e[n.fieldName],r=+i-+s,o=i<s?-1:i==s?0:1;return"number"===n.tsDataType&&Number.isFinite(r)?r:o})).find((e=>e))||0},this.isInHistory=e=>{if(!e)throw"Provide item";const t=e[this.options.synced_field];if(!Number.isFinite(+t))throw"Provided item Synced field value is missing/invalid ";const n=this.sentHistory[this.getIdStr(e)],i=n?.[this.options.synced_field];if(n){if(!Number.isFinite(+i))throw"Provided historic item Synced field value is missing/invalid";if(+i==+t)return!0}return!1},this.addData=e=>{s(this.changed)&&this.options.onSendStart&&this.options.onSendStart(),e.map((e=>{var t;const{initial:n,current:i}={...e};if(!i)throw"Expecting { current: object, initial?: object }";const s=this.getIdStr(i);this.changed??(this.changed={}),(t=this.changed)[s]??(t[s]={initial:n,current:i}),this.changed[s].current={...this.changed[s].current,...i}})),this.sendItems()},this.isOnSending=!1,this.isSendingTimeout=void 0,this.willDeleteHistory=void 0,this.sendItems=async()=>{const{DEBUG_MODE:e,onSend:t,onSendEnd:n,batch_size:i,throttle:r,historyAgeSeconds:o=2}=this.options;if(this.isSendingTimeout||this.sending&&!s(this.sending))return;if(!this.changed||s(this.changed))return;let a,l=[],c=[],d={};Object.keys(this.changed).sort(((e,t)=>this.sort(this.changed[e].current,this.changed[t].current))).slice(0,i).map((e=>{let t={...this.changed[e]};this.sending[e]={...t},c.push({...t}),d[e]={...t.current},delete this.changed[e]})),l=c.map((e=>e.current)),e&&console.log(this.options.id," SENDING lr->",l[l.length-1]),this.isSendingTimeout||(this.isSendingTimeout=setTimeout((()=>{this.isSendingTimeout=void 0,s(this.changed)||this.sendItems()}),r)),this.isOnSending=!0;try{await t(l,c),o&&(this.sentHistory={...this.sentHistory,...d},this.willDeleteHistory||(this.willDeleteHistory=setTimeout((()=>{this.willDeleteHistory=void 0,this.sentHistory={}}),1e3*o)))}catch(e){a=e,console.error("WAL onSend failed:",e,l,c)}if(this.isOnSending=!1,this.callbacks.length){const e=Object.keys(this.sending);this.callbacks.forEach(((t,n)=>{t.idStrs=t.idStrs.filter((t=>e.includes(t))),t.idStrs.length||t.cb(a)})),this.callbacks=this.callbacks.filter((e=>e.idStrs.length))}this.sending={},e&&console.log(this.options.id," SENT lr->",l[l.length-1]),s(this.changed)?n&&n(l,c,a):this.sendItems()},this.options={...e},!this.options.orderBy){const{synced_field:t,id_fields:n}=e;this.options.orderBy=[t,...n.sort()].map((e=>({fieldName:e,tsDataType:e===t?"number":"string",asc:!0})))}}isSending(){const e=this.isOnSending||!(s(this.sending)&&s(this.changed));return this.options.DEBUG_MODE&&console.log(this.options.id," CHECKING isSending ->",e),e}getIdStr(e){return this.options.id_fields.sort().map((t=>`${e[t]||""}`)).join(".")}getIdObj(e){let t={};return this.options.id_fields.sort().map((n=>{t[n]=e[n]})),t}getDeltaObj(e){let t={};return Object.keys(e).map((n=>{this.options.id_fields.includes(n)||(t[n]=e[n])})),t}},t.isEmpty=s,t.get=function(e,t){let n=t,i=e;return e?("string"==typeof n&&(n=n.split(".")),n.reduce(((e,t)=>e&&e[t]?e[t]:void 0),i)):e},t.isObject=function(e){return Boolean(e&&"object"==typeof e&&!Array.isArray(e))},t.isDefined=function(e){return null!=e},t.getKeys=function(e){return Object.keys(e)}}},t={};return function n(i){var s=t[i];if(void 0!==s)return s.exports;var r=t[i]={exports:{}};return e[i].call(r.exports,r,r.exports,n),r.exports}(590)})(),e.exports=t()}},t={};function n(i){var s=t[i];if(void 0!==s)return s.exports;var r=t[i]={exports:{}};return e[i].call(r.exports,r,r.exports,n),r.exports}var i={};return(()=>{"use strict";var e=i;Object.defineProperty(e,"__esModule",{value:!0}),e.prostgles=void 0;const t=n(274),s=n(133);e.prostgles=function(e){return(0,t.prostgles)(e,s.SyncedTable)}})(),i})()));