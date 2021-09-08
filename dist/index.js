!function(e,t){if("object"==typeof exports&&"object"==typeof module)module.exports=t();else if("function"==typeof define&&define.amd)define([],t);else{var n=t();for(var s in n)("object"==typeof exports?exports:e)[s]=n[s]}}(this||window,(function(){return(()=>{var e={133:(e,t,n)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.SyncedTable=t.debug=void 0;const s=n(792),i="DEBUG_SYNCEDTABLE",r="undefined"!=typeof window;t.debug=function(...e){r&&window[i]&&window[i](...e)};const o={array:"array",localStorage:"localStorage",object:"object"};class a{constructor({name:e,filter:n,onChange:i,onReady:a,db:c,skipFirstTrigger:l=!1,select:h="*",storageType:u=o.object,patchText:d=!1,patchJSON:f=!1,onError:m}){if(this.throttle=100,this.batch_size=50,this.skipFirstTrigger=!1,this.columns=[],this.items=[],this.itemsObj={},this.isSynced=!1,this.updatePatches=async e=>{let t=e.map((e=>e.current)),n=[],i=[];if(this.columns&&this.columns.length&&this.db[this.name].updateBatch&&(this.patchText||this.patchJSON)){const r=this.columns.filter((e=>"text"===e.data_type));if(this.patchText&&r.length){t=[];const o=[this.synced_field,...this.id_fields];await Promise.all(e.slice(0).map((async(e,a)=>{const{current:c,initial:l}={...e};let h;l&&(r.map((e=>{!o.includes(e.name)&&e.name in c&&(h=h||{...c},h[e.name]=s.getTextPatch(l[e.name],c[e.name]))})),h&&(i.push(h),n.push([this.wal.getIdObj(h),this.wal.getDeltaObj(h)]))),h||t.push(c)})))}}if(n.length)try{await this.db[this.name].updateBatch(n)}catch(e){console.log("failed to patch update",e),t=t.concat(i)}return t.filter((e=>e))},this.notifySubscribers=(e=[])=>{if(!this.isSynced)return;let t=[],n=[],s=[];e.map((({idObj:e,newItem:i,delta:r})=>{this.singleSubscriptions.filter((t=>this.matchesIdObj(t.idObj,e))).map((async e=>{try{await e.notify(i,r)}catch(e){console.error("SyncedTable failed to notify: ",e)}})),this.matchesFilter(i)&&(t.push(i),n.push(r),s.push(e))}));let i=[],r=[];if(this.getItems().map((e=>{i.push({...e});const s=t.findIndex((t=>this.matchesIdObj(e,t)));r.push(n[s])})),this.onChange)try{this.onChange(i,r)}catch(e){console.error("SyncedTable failed to notify onChange: ",e)}this.multiSubscriptions.map((async e=>{try{await e.notify(i,r)}catch(e){console.error("SyncedTable failed to notify: ",e)}}))},this.unsubscribe=e=>(this.singleSubscriptions=this.singleSubscriptions.filter((t=>t._onChange!==e)),this.multiSubscriptions=this.multiSubscriptions.filter((t=>t._onChange!==e)),t.debug("unsubscribe",this),"ok"),this.unsync=()=>{this.dbSync&&this.dbSync.unsync&&this.dbSync.unsync()},this.destroy=()=>{this.unsync(),this.multiSubscriptions=[],this.singleSubscriptions=[],this.itemsObj={},this.items=[],this.onChange=null},this.delete=async(e,t=!1)=>{const n=this.getIdObj(e);return this.setItem(n,null,!0,!0),t||await this.db[this.name].delete(n),this.notifySubscribers(),!0},this.checkItemCols=e=>{if(this.columns&&this.columns.length){const t=Object.keys({...e}).filter((e=>!this.columns.find((t=>t.name===e))));if(t.length)throw"Unexpected columns in sync item update: "+t.join(", ")}},this.upsert=async(e,t=!1)=>{if(!(e&&e.length||t))throw"No data provided for upsert";let n,i=[],r=[];await Promise.all(e.map((async(e,o)=>{let a={...e.idObj},c={...e.delta};Object.keys(c).map((e=>{void 0===c[e]&&(c[e]=null)})),t||this.checkItemCols({...e.delta,...e.idObj});let l=this.getItem(a),h=l.index,u=l.data;!t&&!s.isEmpty(c)||s.isEmpty(u)||(c=this.getDelta(u||{},c)),t||(c[this.synced_field]=Date.now());let d={...u,...c,...a};u&&u[this.synced_field]<d[this.synced_field]?n="updated":u||(n="inserted"),this.setItem(d,h);let f={idObj:a,delta:c,oldItem:u,newItem:d,status:n,from_server:t};return t||r.push({initial:u,current:{...c,...a}}),i.push(f),!0}))).catch((e=>{console.error("SyncedTable failed upsert: ",e)})),this.notifySubscribers(i),!t&&r.length&&this.wal.addData(r)},this.setItems=e=>{if(this.storageType===o.localStorage){if(!r)throw"Cannot access window object. Choose another storage method (array OR object)";window.localStorage.setItem(this.name,JSON.stringify(e))}else this.storageType===o.array?this.items=e:this.itemsObj=e.reduce(((e,t)=>({...e,[this.getIdStr(t)]:{...t}})),{})},this.getItems=()=>{let e=[];if(this.storageType===o.localStorage){if(!r)throw"Cannot access window object. Choose another storage method (array OR object)";let t=window.localStorage.getItem(this.name);if(t)try{e=JSON.parse(t)}catch(e){console.error(e)}}else e=this.storageType===o.array?this.items.map((e=>({...e}))):Object.values({...this.itemsObj});if(!this.id_fields||!this.synced_field)throw"id_fields AND/OR synced_field missing";{const t=[this.synced_field,...this.id_fields.sort()];e=e.filter((e=>!this.filter||!Object.keys(this.filter).find((t=>e[t]!==this.filter[t])))).sort(((e,n)=>t.map((t=>e[t]<n[t]?-1:e[t]>n[t]?1:0)).find((e=>e))))}return e.map((e=>({...e})))},this.getBatch=({from_synced:e,to_synced:t,offset:n,limit:s}={offset:0,limit:null})=>{let i=this.getItems().map((e=>({...e}))).filter((n=>(!e||n[this.synced_field]>=e)&&(!t||n[this.synced_field]<=t)));return(n||s)&&(i=i.splice(n,s||i.length)),i},this.name=e,this.filter=n,this.select=h,this.onChange=i,this.onChange,!o[u])throw"Invalid storage type. Expecting one of: "+Object.keys(o).join(", ");if(r||u!==o.localStorage||(console.warn("Could not set storageType to localStorage: window object missing\nStorage changed to object"),u="object"),this.storageType=u,this.patchText=d,this.patchJSON=f,!c)throw"db missing";this.db=c;const{id_fields:p,synced_field:g,throttle:y=100,batch_size:b=50}=c[this.name]._syncInfo;if(!p||!g)throw"id_fields/synced_field missing";this.id_fields=p,this.synced_field=g,this.batch_size=b,this.throttle=y,this.skipFirstTrigger=l,this.multiSubscriptions=[],this.singleSubscriptions=[],this.onError=m||function(e){console.error("Sync internal error: ",e)},c[this.name]._sync(n,{select:h},{onSyncRequest:e=>{let t={c_lr:null,c_fr:null,c_count:0},n=this.getBatch(e);return n.length&&(t={c_fr:this.getRowSyncObj(n[0])||null,c_lr:this.getRowSyncObj(n[n.length-1])||null,c_count:n.length}),t},onPullRequest:async e=>this.getBatch(e),onUpdates:({err:e,data:t,isSynced:n})=>{if(e)this.onError(e);else if(n&&!this.isSynced){this.isSynced=n;let e=this.getItems().map((e=>({...e})));this.setItems([]),this.upsert(e.map((e=>({idObj:this.getIdObj(e),delta:{...e}}))),!0)}else{let e=t.map((e=>({idObj:this.getIdObj(e),delta:e})));this.upsert(e,!0)}}}).then((e=>{function t(){return"Data may be lost. Are you sure?"}this.dbSync=e,this.wal=new s.WAL({id_fields:p,synced_field:g,throttle:y,batch_size:b,onSendStart:()=>{r&&(window.onbeforeunload=t)},onSend:async(e,t)=>(await this.updatePatches(t)).length?this.dbSync.syncData(e):[],onSendEnd:()=>{r&&(window.onbeforeunload=null)}}),a()})),c[this.name].getColumns&&c[this.name].getColumns().then((e=>{this.columns=e})),this.onChange&&!this.skipFirstTrigger&&setTimeout(this.onChange,0),t.debug(this)}set multiSubscriptions(e){t.debug(e,this._multiSubscriptions),this._multiSubscriptions=e.slice(0)}get multiSubscriptions(){return this._multiSubscriptions}set singleSubscriptions(e){t.debug(e,this._singleSubscriptions),this._singleSubscriptions=e.slice(0)}get singleSubscriptions(){return this._singleSubscriptions}static create(e){return new Promise(((t,n)=>{try{const n=new a({...e,onReady:()=>{setTimeout((()=>{t(n)}),0)}})}catch(e){n(e)}}))}sync(e,t=!0){const n={unsync:()=>this.unsubscribe(e),upsert:e=>{if(e){const t=e=>({idObj:this.getIdObj(e),delta:e});Array.isArray(e)?this.upsert(e.map((e=>t(e)))):this.upsert([t(e)])}}},s={_onChange:e,handlesOnData:t,handles:n,notify:(n,s)=>{let i=[...n],r=[...s];return t&&(i=i.map(((e,t)=>{const n=(e,t)=>({...e,$get:()=>n(this.getItem(t).data,t),$find:e=>n(this.getItem(e).data,e),$update:e=>this.upsert([{idObj:t,delta:e}]).then((e=>!0)),$delete:async()=>this.delete(t)}),s=this.wal.getIdObj(e);return n(e,s)}))),e(i,r)}};return this.multiSubscriptions.push(s),this.skipFirstTrigger||setTimeout((()=>{let t=this.getItems();e(t,t)}),0),Object.freeze({...n})}syncOne(e,n,s=!0){if(!e||!n)throw"syncOne(idObj, onChange) -> MISSING idObj or onChange";const i={get:()=>this.getItem(e).data,find:e=>this.getItem(e).data,unsync:()=>this.unsubscribe(n),delete:()=>this.delete(e),update:n=>{this.singleSubscriptions.length||(console.warn("No singleSubscriptions"),t.debug("nosync",this._singleSubscriptions)),this.upsert([{idObj:e,delta:n}])},cloneSync:t=>this.syncOne(e,t)},r={_onChange:n,idObj:e,handlesOnData:s,handles:i,notify:(e,t)=>{let r={...e};return s&&(r.$get=i.get,r.$find=i.find,r.$update=i.update,r.$delete=i.delete,r.$unsync=i.unsync,r.$cloneSync=i.cloneSync),n(r,t)}};return this.singleSubscriptions.push(r),setTimeout((()=>{let e=i.get();e&&r.notify(e,e)}),0),Object.freeze({...i})}getIdStr(e){return this.id_fields.sort().map((t=>`${e[t]||""}`)).join(".")}getIdObj(e){let t={};return this.id_fields.sort().map((n=>{t[n]=e[n]})),t}getRowSyncObj(e){let t={};return[this.synced_field,...this.id_fields].sort().map((n=>{t[n]=e[n]})),t}matchesFilter(e){return Boolean(e&&(!this.filter||s.isEmpty(this.filter)||!Object.keys(this.filter).find((t=>this.filter[t]!==e[t]))))}matchesIdObj(e,t){return Boolean(e&&t&&!this.id_fields.sort().find((n=>e[n]!==t[n])))}getDelta(e,t){return s.isEmpty(e)?{...t}:Object.keys({...e,...t}).filter((e=>!this.id_fields.includes(e))).reduce(((n,s)=>{let i={};return s in t&&t[s]!==e[s]&&(i={[s]:t[s]}),{...n,...i}}),{})}deleteAll(){this.getItems().map((e=>this.delete(e)))}getItem(e){let t;return this.storageType===o.localStorage?t=this.getItems().find((t=>this.matchesIdObj(t,e))):this.storageType===o.array?t=this.items.find((t=>this.matchesIdObj(t,e))):(this.itemsObj=this.itemsObj||{},t={...this.itemsObj}[this.getIdStr(e)]),{data:t?{...t}:t,index:-1}}setItem(e,t,n=!1,s=!1){if(this.storageType===o.localStorage){let i=this.getItems();if(s)i=i.filter((t=>!this.matchesIdObj(t,e)));else{let s=t;i[s]?i[s]=n?{...e}:{...i[s],...e}:i.push(e)}r&&window.localStorage.setItem(this.name,JSON.stringify(i))}else if(this.storageType===o.array)s?this.items=this.items.filter((t=>!this.matchesIdObj(t,e))):this.items[t]?this.items[t]=n?{...e}:{...this.items[t],...e}:this.items.push(e);else if(this.itemsObj=this.itemsObj||{},s)delete this.itemsObj[this.getIdStr(e)];else{let t=this.itemsObj[this.getIdStr(e)]||{};this.itemsObj[this.getIdStr(e)]=n?{...e}:{...t,...e}}}}t.SyncedTable=a},274:(e,t,n)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.prostgles=void 0;const s=n(792),i=n(133);t.prostgles=function(e,t){const{socket:n,onReady:r,onDisconnect:o,onReconnect:a,onSchemaChange:c=!0}=e;if(i.debug("prostgles",{initOpts:e}),c){let e;"function"==typeof c&&(e=c),n.removeAllListeners(s.CHANNELS.SCHEMA_CHANGED),e&&n.on(s.CHANNELS.SCHEMA_CHANGED,e)}const l=s.CHANNELS._preffix;let h,u={},d={},f={},m={},p=!1;function g(e,t){return i.debug("_unsubscribe",{channelName:e,handler:t}),new Promise(((s,i)=>{u[e]?(u[e].handlers=u[e].handlers.filter((e=>e!==t)),u[e].handlers.length||(n.emit(e+"unsubscribe",{},((e,t)=>{e&&console.error(e)})),n.removeListener(e,u[e].onCall),delete u[e]),s(!0)):s(!0)}))}function y({tableName:e,command:t,param1:s,param2:i},r){return new Promise(((o,a)=>{n.emit(l,{tableName:e,command:t,param1:s,param2:i},((e,t)=>{if(e)console.error(e),a(e);else if(t){const{id_fields:e,synced_field:s,channelName:i}=t;n.emit(i,{onSyncRequest:r({},t)},(e=>{console.log(e)})),o({id_fields:e,synced_field:s,channelName:i})}}))}))}function b({tableName:e,command:t,param1:s,param2:i}){return new Promise(((r,o)=>{n.emit(l,{tableName:e,command:t,param1:s,param2:i},((e,t)=>{e?(console.error(e),o(e)):t&&r(t.channelName)}))}))}async function S(e,{tableName:t,command:s,param1:i,param2:r},o,a){function c(n){let s={unsubscribe:function(){return g(n,o)},filter:{...i}};return e[t].update&&(s={...s,update:function(n,s){return e[t].update(i,n,s)}}),e[t].delete&&(s={...s,delete:function(n){return e[t].delete(i,n)}}),Object.freeze(s)}const l=Object.keys(u).find((e=>{let n=u[e];return n.tableName===t&&n.command===s&&JSON.stringify(n.param1||{})===JSON.stringify(i||{})&&JSON.stringify(n.param2||{})===JSON.stringify(r||{})}));if(l)return u[l].handlers.push(o),u[l].handlers.includes(o)&&console.warn("Duplicate subscription handler was added for:",u[l]),c(l);{const e=await b({tableName:t,command:s,param1:i,param2:r});let l=function(t,n){u[e]?t.data?u[e].handlers.map((e=>{e(t.data)})):t.err?u[e].errorHandlers.map((e=>{e(t.err)})):console.error("INTERNAL ERROR: Unexpected data format from subscription: ",t):console.warn("Orphaned subscription: ",e)},h=a||function(t){console.error(`Uncaught error within running subscription \n ${e}`,t)};return n.on(e,l),u[e]={tableName:t,command:s,param1:i,param2:r,onCall:l,handlers:[o],errorHandlers:[h],destroy:()=>{u[e]&&(Object.values(u[e]).map((t=>{t&&t.handlers&&t.handlers.map((t=>g(e,t)))})),delete u[e])}},c(e)}}return new Promise(((e,c)=>{o&&n.on("disconnect",o),n.on(s.CHANNELS.SCHEMA,(({schema:o,methods:g,fullSchema:O,auth:_,rawSQL:j,joinTables:w=[],err:C})=>{if(C)throw c(C),C;i.debug("destroySyncs",{subscriptions:u,syncedTables:d}),Object.values(u).map((e=>e.destroy())),u={},f={},Object.values(d).map((e=>{e&&e.destroy&&e.destroy()})),d={},p&&a&&a(n),p=!0;let N=JSON.parse(JSON.stringify(o)),v=JSON.parse(JSON.stringify(g)),I={},T={};_&&(T={..._},[s.CHANNELS.LOGIN,s.CHANNELS.LOGOUT,s.CHANNELS.REGISTER].map((e=>{_[e]&&(T[e]=function(t){return new Promise(((s,i)=>{n.emit(l+e,t,((e,t)=>{e?i(e):s(t)}))}))})}))),v.map((e=>{I[e]=function(...t){return new Promise(((i,r)=>{n.emit(s.CHANNELS.METHOD,{method:e,params:t},((e,t)=>{e?r(e):i(t)}))}))}})),I=Object.freeze(I),j&&(N.sql=function(e,t,i){return new Promise(((r,o)=>{n.emit(s.CHANNELS.SQL,{query:e,params:t,options:i},((e,t)=>{e?o(e):i&&"noticeSubscription"===i.returnType&&t&&Object.keys(t).sort().join()===["socketChannel","socketUnsubChannel"].sort().join()&&!Object.values(t).find((e=>"string"!=typeof e))?r({addListener:e=>(((e,t)=>{h=h||{config:t,listeners:[]},h.listeners.length||(n.removeAllListeners(t.socketChannel),n.on(t.socketChannel,(e=>{h&&h.listeners&&h.listeners.length?h.listeners.map((t=>{t(e)})):n.emit(t.socketUnsubChannel,{})}))),h.listeners.push(e)})(e,t),{...t,removeListener:()=>(e=>{h&&(h.listeners=h.listeners.filter((t=>t!==e)),!h.listeners.length&&h.config&&h.config.socketUnsubChannel&&n&&n.emit(h.config.socketUnsubChannel,{}))})(e)})}):i&&i.returnType&&"statement"===i.returnType||!t||Object.keys(t).sort().join()!==["socketChannel","socketUnsubChannel","notifChannel"].sort().join()||Object.values(t).find((e=>"string"!=typeof e))?r(t):r({addListener:e=>(((e,t)=>{m=m||{},m[t.notifChannel]?m[t.notifChannel].listeners.push(e):(m[t.notifChannel]={config:t,listeners:[e]},n.removeAllListeners(t.socketChannel),n.on(t.socketChannel,(e=>{m[t.notifChannel]&&m[t.notifChannel].listeners&&m[t.notifChannel].listeners.length?m[t.notifChannel].listeners.map((t=>{t(e)})):n.emit(m[t.notifChannel].config.socketUnsubChannel,{})})))})(e,t),{...t,removeListener:()=>((e,t)=>{m&&m[t.notifChannel]&&(m[t.notifChannel].listeners=m[t.notifChannel].listeners.filter((t=>t!==e)),!m[t.notifChannel].listeners.length&&m[t.notifChannel].config&&m[t.notifChannel].config.socketUnsubChannel&&n&&(n.emit(m[t.notifChannel].config.socketUnsubChannel,{}),delete m[t.notifChannel]))})(e,t)})})}))}))});const E=e=>"[object Object]"===Object.prototype.toString.call(e),x=(e,t,n,s)=>{if(!E(e)||!E(t)||"function"!=typeof n||s&&"function"!=typeof s)throw"Expecting: ( basicFilter<object>, options<object>, onChange<function> , onError?<function>) but got something else"},k=["subscribe","subscribeOne"];Object.keys(N).forEach((e=>{Object.keys(N[e]).sort(((e,t)=>k.includes(e)-k.includes(t))).forEach((s=>{if(["find","findOne"].includes(s)&&(N[e].getJoinedTables=function(){return(w||[]).filter((t=>Array.isArray(t)&&t.includes(e))).flat().filter((t=>t!==e))}),"sync"===s){if(N[e]._syncInfo={...N[e][s]},t){N[e].getSync=(n,s={})=>t.create({name:e,filter:n,db:N,...s});const n=async(n={},s={},i)=>{const r=`${e}.${JSON.stringify(n)}.${JSON.stringify(s)}`;return d[r]||(d[r]=await t.create({...s,name:e,filter:n,db:N,onError:i})),d[r]};N[e].sync=async(e,t={handlesOnData:!0,select:"*"},s,i)=>{x(e,t,s,i);const r=await n(e,t,i);return await r.sync(s,t.handlesOnData)},N[e].syncOne=async(e,t={handlesOnData:!0},s,i)=>{x(e,t,s,i);const r=await n(e,t,i);return await r.syncOne(e,s,t.handlesOnData)}}N[e]._sync=function(t,r,o){return async function({tableName:e,command:t,param1:s,param2:r},o){const{onPullRequest:a,onSyncRequest:c,onUpdates:l}=o;function h(e,t){return Object.freeze({unsync:function(){!function(e,t){i.debug("_unsync",{channelName:e,triggers:t}),new Promise(((s,i)=>{f[e]&&(f[e].triggers=f[e].triggers.filter((e=>e.onPullRequest!==t.onPullRequest&&e.onSyncRequest!==t.onSyncRequest&&e.onUpdates!==t.onUpdates)),f[e].triggers.length||(n.emit(e+"unsync",{},((e,t)=>{e?i(e):s(t)})),n.removeListener(e,f[e].onCall),delete f[e]))}))}(e,o)},syncData:function(s,i,r){n.emit(e,{onSyncRequest:{...c({},t),...{data:s}||{},...{deleted:i}||{}}},r?e=>{r(e)}:null)}})}const u=Object.keys(f).find((n=>{let i=f[n];return i.tableName===e&&i.command===t&&JSON.stringify(i.param1||{})===JSON.stringify(s||{})&&JSON.stringify(i.param2||{})===JSON.stringify(r||{})}));if(u)return f[u].triggers.push(o),h(u,f[u].syncInfo);{const i=await y({tableName:e,command:t,param1:s,param2:r},c),{channelName:a,synced_field:l,id_fields:u}=i;function d(t,n){t&&f[a]&&f[a].triggers.map((({onUpdates:s,onSyncRequest:r,onPullRequest:o})=>{t.data?Promise.resolve(s(t,i)).then((()=>{n&&n({ok:!0})})).catch((t=>{n?n({err:t}):console.error(e+" onUpdates error",t)})):t.onSyncRequest?Promise.resolve(r(t.onSyncRequest,i)).then((e=>n({onSyncRequest:e}))).catch((t=>{n?n({err:t}):console.error(e+" onSyncRequest error",t)})):t.onPullRequest?Promise.resolve(o(t.onPullRequest,i)).then((e=>{n({data:e})})).catch((t=>{n?n({err:t}):console.error(e+" onPullRequest error",t)})):console.log("unexpected response")}))}return f[a]={tableName:e,command:t,param1:s,param2:r,triggers:[o],syncInfo:i,onCall:d},n.on(a,d),h(a,i)}}({tableName:e,command:s,param1:t,param2:r},o)}}else if(k.includes(s)){N[e][s]=function(t,n,i,r){return x(t,n,i,r),S(N,{tableName:e,command:s,param1:t,param2:n},i,r)};const t="subscribeOne";s!==t&&k.includes(t)||(N[e][t]=function(t,n,i,r){return x(t,n,i,r),S(N,{tableName:e,command:s,param1:t,param2:n},(e=>{i(e[0])}),r)})}else N[e][s]=function(t,i,r){return new Promise(((o,a)=>{n.emit(l,{tableName:e,command:s,param1:t,param2:i,param3:r},((e,t)=>{e?a(e):o(t)}))}))}}))})),u&&Object.keys(u).length&&Object.keys(u).map((async e=>{try{let t=u[e];await b(t),n.on(e,t.onCall)}catch(e){console.error("There was an issue reconnecting old subscriptions",e)}})),f&&Object.keys(f).length&&Object.keys(f).filter((e=>f[e].triggers&&f[e].triggers.length)).map((async e=>{try{let t=f[e];await y(t,t.triggers[0].onSyncRequest),n.on(e,t.onCall)}catch(e){console.error("There was an issue reconnecting olf subscriptions",e)}})),w.flat().map((e=>{function t(t=!0,n,s,i){return{[t?"$leftJoin":"$innerJoin"]:e,filter:n,select:s,...i}}N.innerJoin=N.innerJoin||{},N.leftJoin=N.leftJoin||{},N.innerJoinOne=N.innerJoinOne||{},N.leftJoinOne=N.leftJoinOne||{},N.leftJoin[e]=(e,n,s={})=>t(!0,e,n,s),N.innerJoin[e]=(e,n,s={})=>t(!1,e,n,s),N.leftJoinOne[e]=(e,n,s={})=>t(!0,e,n,{...s,limit:1}),N.innerJoinOne[e]=(e,n,s={})=>t(!1,e,n,{...s,limit:1})})),(async()=>{try{await r(N,I,O,T)}catch(e){console.error("Prostgles: Error within onReady: \n",e),c(e)}e(N)})()}))}))}},792:function(e){this||window,e.exports=(()=>{"use strict";var e={444:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.EXISTS_KEYS=t.GeomFilter_Funcs=t.GeomFilterKeys=t.TextFilterFTSKeys=t.TextFilter_FullTextSearchFilterKeys=t.CompareInFilterKeys=t.CompareFilterKeys=void 0,t.CompareFilterKeys=["=","$eq","<>",">",">=","<=","$eq","$ne","$gt","$gte","$lte"],t.CompareInFilterKeys=["$in","$nin"],t.TextFilter_FullTextSearchFilterKeys=["to_tsquery","plainto_tsquery","phraseto_tsquery","websearch_to_tsquery"],t.TextFilterFTSKeys=["@@","@>","<@","$contains","$containedBy"],t.GeomFilterKeys=["~","~=","@","|&>","|>>",">>","=","<<|","<<","&>","&<|","&<","&&&","&&"],t.GeomFilter_Funcs=["ST_MakeEnvelope","ST_MakeEnvelope".toLowerCase()],t.EXISTS_KEYS=["$exists","$notExists","$existsJoined","$notExistsJoined"]},590:function(e,t,n){var s=this&&this.__createBinding||(Object.create?function(e,t,n,s){void 0===s&&(s=n),Object.defineProperty(e,s,{enumerable:!0,get:function(){return t[n]}})}:function(e,t,n,s){void 0===s&&(s=n),e[s]=t[n]}),i=this&&this.__exportStar||function(e,t){for(var n in e)"default"===n||Object.prototype.hasOwnProperty.call(t,n)||s(t,e,n)};Object.defineProperty(t,"__esModule",{value:!0}),t.CHANNELS=void 0;const r="_psqlWS_.";t.CHANNELS={SCHEMA_CHANGED:r+"schema-changed",SCHEMA:r+"schema",DEFAULT:r,SQL:"_psqlWS_.sql",METHOD:"_psqlWS_.method",NOTICE_EV:"_psqlWS_.notice",LISTEN_EV:"_psqlWS_.listen",REGISTER:"_psqlWS_.register",LOGIN:"_psqlWS_.login",LOGOUT:"_psqlWS_.logout",_preffix:r},i(n(128),t),i(n(444),t)},899:(e,t)=>{function n(e,t){var n=e[0],s=e[1],c=e[2],l=e[3];n=i(n,s,c,l,t[0],7,-680876936),l=i(l,n,s,c,t[1],12,-389564586),c=i(c,l,n,s,t[2],17,606105819),s=i(s,c,l,n,t[3],22,-1044525330),n=i(n,s,c,l,t[4],7,-176418897),l=i(l,n,s,c,t[5],12,1200080426),c=i(c,l,n,s,t[6],17,-1473231341),s=i(s,c,l,n,t[7],22,-45705983),n=i(n,s,c,l,t[8],7,1770035416),l=i(l,n,s,c,t[9],12,-1958414417),c=i(c,l,n,s,t[10],17,-42063),s=i(s,c,l,n,t[11],22,-1990404162),n=i(n,s,c,l,t[12],7,1804603682),l=i(l,n,s,c,t[13],12,-40341101),c=i(c,l,n,s,t[14],17,-1502002290),n=r(n,s=i(s,c,l,n,t[15],22,1236535329),c,l,t[1],5,-165796510),l=r(l,n,s,c,t[6],9,-1069501632),c=r(c,l,n,s,t[11],14,643717713),s=r(s,c,l,n,t[0],20,-373897302),n=r(n,s,c,l,t[5],5,-701558691),l=r(l,n,s,c,t[10],9,38016083),c=r(c,l,n,s,t[15],14,-660478335),s=r(s,c,l,n,t[4],20,-405537848),n=r(n,s,c,l,t[9],5,568446438),l=r(l,n,s,c,t[14],9,-1019803690),c=r(c,l,n,s,t[3],14,-187363961),s=r(s,c,l,n,t[8],20,1163531501),n=r(n,s,c,l,t[13],5,-1444681467),l=r(l,n,s,c,t[2],9,-51403784),c=r(c,l,n,s,t[7],14,1735328473),n=o(n,s=r(s,c,l,n,t[12],20,-1926607734),c,l,t[5],4,-378558),l=o(l,n,s,c,t[8],11,-2022574463),c=o(c,l,n,s,t[11],16,1839030562),s=o(s,c,l,n,t[14],23,-35309556),n=o(n,s,c,l,t[1],4,-1530992060),l=o(l,n,s,c,t[4],11,1272893353),c=o(c,l,n,s,t[7],16,-155497632),s=o(s,c,l,n,t[10],23,-1094730640),n=o(n,s,c,l,t[13],4,681279174),l=o(l,n,s,c,t[0],11,-358537222),c=o(c,l,n,s,t[3],16,-722521979),s=o(s,c,l,n,t[6],23,76029189),n=o(n,s,c,l,t[9],4,-640364487),l=o(l,n,s,c,t[12],11,-421815835),c=o(c,l,n,s,t[15],16,530742520),n=a(n,s=o(s,c,l,n,t[2],23,-995338651),c,l,t[0],6,-198630844),l=a(l,n,s,c,t[7],10,1126891415),c=a(c,l,n,s,t[14],15,-1416354905),s=a(s,c,l,n,t[5],21,-57434055),n=a(n,s,c,l,t[12],6,1700485571),l=a(l,n,s,c,t[3],10,-1894986606),c=a(c,l,n,s,t[10],15,-1051523),s=a(s,c,l,n,t[1],21,-2054922799),n=a(n,s,c,l,t[8],6,1873313359),l=a(l,n,s,c,t[15],10,-30611744),c=a(c,l,n,s,t[6],15,-1560198380),s=a(s,c,l,n,t[13],21,1309151649),n=a(n,s,c,l,t[4],6,-145523070),l=a(l,n,s,c,t[11],10,-1120210379),c=a(c,l,n,s,t[2],15,718787259),s=a(s,c,l,n,t[9],21,-343485551),e[0]=d(n,e[0]),e[1]=d(s,e[1]),e[2]=d(c,e[2]),e[3]=d(l,e[3])}function s(e,t,n,s,i,r){return t=d(d(t,e),d(s,r)),d(t<<i|t>>>32-i,n)}function i(e,t,n,i,r,o,a){return s(t&n|~t&i,e,t,r,o,a)}function r(e,t,n,i,r,o,a){return s(t&i|n&~i,e,t,r,o,a)}function o(e,t,n,i,r,o,a){return s(t^n^i,e,t,r,o,a)}function a(e,t,n,i,r,o,a){return s(n^(t|~i),e,t,r,o,a)}function c(e){var t,n=[];for(t=0;t<64;t+=4)n[t>>2]=e.charCodeAt(t)+(e.charCodeAt(t+1)<<8)+(e.charCodeAt(t+2)<<16)+(e.charCodeAt(t+3)<<24);return n}Object.defineProperty(t,"__esModule",{value:!0}),t.md5=t.md5cycle=void 0,t.md5cycle=n;var l="0123456789abcdef".split("");function h(e){for(var t="",n=0;n<4;n++)t+=l[e>>8*n+4&15]+l[e>>8*n&15];return t}function u(e){return function(e){for(var t=0;t<e.length;t++)e[t]=h(e[t]);return e.join("")}(function(e){var t,s=e.length,i=[1732584193,-271733879,-1732584194,271733878];for(t=64;t<=e.length;t+=64)n(i,c(e.substring(t-64,t)));e=e.substring(t-64);var r=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];for(t=0;t<e.length;t++)r[t>>2]|=e.charCodeAt(t)<<(t%4<<3);if(r[t>>2]|=128<<(t%4<<3),t>55)for(n(i,r),t=0;t<16;t++)r[t]=0;return r[14]=8*s,n(i,r),i}(e))}function d(e,t){return e+t&4294967295}if(t.md5=u,"5d41402abc4b2a76b9719d911017c592"!=u("hello")){function d(e,t){var n=(65535&e)+(65535&t);return(e>>16)+(t>>16)+(n>>16)<<16|65535&n}}},128:function(e,t,n){var s=this&&this.__awaiter||function(e,t,n,s){return new(n||(n=Promise))((function(i,r){function o(e){try{c(s.next(e))}catch(e){r(e)}}function a(e){try{c(s.throw(e))}catch(e){r(e)}}function c(e){var t;e.done?i(e.value):(t=e.value,t instanceof n?t:new n((function(e){e(t)}))).then(o,a)}c((s=s.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.get=t.isEmpty=t.WAL=t.unpatchText=t.getTextPatch=t.stableStringify=t.asName=void 0;const i=n(899);function r(e){for(var t in e)return!1;return!0}t.asName=function(e){if(null==e||!e.toString||!e.toString())throw"Expecting a non empty string";return`"${e.toString().replace(/"/g,'""')}"`},t.stableStringify=function(e,t){t||(t={}),"function"==typeof t&&(t={cmp:t});var n,s="boolean"==typeof t.cycles&&t.cycles,i=t.cmp&&(n=t.cmp,function(e){return function(t,s){var i={key:t,value:e[t]},r={key:s,value:e[s]};return n(i,r)}}),r=[];return function e(t){if(t&&t.toJSON&&"function"==typeof t.toJSON&&(t=t.toJSON()),void 0!==t){if("number"==typeof t)return isFinite(t)?""+t:"null";if("object"!=typeof t)return JSON.stringify(t);var n,o;if(Array.isArray(t)){for(o="[",n=0;n<t.length;n++)n&&(o+=","),o+=e(t[n])||"null";return o+"]"}if(null===t)return"null";if(-1!==r.indexOf(t)){if(s)return JSON.stringify("__cycle__");throw new TypeError("Converting circular structure to JSON")}var a=r.push(t)-1,c=Object.keys(t).sort(i&&i(t));for(o="",n=0;n<c.length;n++){var l=c[n],h=e(t[l]);h&&(o&&(o+=","),o+=JSON.stringify(l)+":"+h)}return r.splice(a,1),"{"+o+"}"}}(e)},t.getTextPatch=function(e,t){if(!(e&&t&&e.trim().length&&t.trim().length))return t;if(e===t)return{from:0,to:0,text:"",md5:i.md5(t)};function n(n=1){let s=n<1?-1:0,i=!1;for(;!i&&Math.abs(s)<=t.length;){const r=n<1?[s]:[0,s];e.slice(...r)!==t.slice(...r)?i=!0:s+=1*Math.sign(n)}return s}let s=n()-1,r=e.length+n(-1)+1,o=t.length+n(-1)+1;return{from:s,to:r,text:t.slice(s,o),md5:i.md5(t)}},t.unpatchText=function(e,t){if(!t||"string"==typeof t)return t;const{from:n,to:s,text:r,md5:o}=t;if(null===r||null===e)return r;let a=e.slice(0,n)+r+e.slice(s);if(o&&i.md5(a)!==o)throw"Patch text error: Could not match md5 hash: (original/result) \n"+e+"\n"+a;return a},t.WAL=class{constructor(e){if(this.changed={},this.sending={},this.callbacks=[],this.sort=(e,t)=>{const{orderBy:n}=this.options;return n.map((n=>{if(!(n.fieldName in e)||!(n.fieldName in t))throw"Replication error: \n   some orderBy fields missing from data";let s=n.asc?e[n.fieldName]:t[n.fieldName],i=n.asc?t[n.fieldName]:e[n.fieldName],r=s-i,o=s<i?-1:s==i?0:1;return isNaN(r)?o:r})).find((e=>e))},this.addData=(e,t)=>{r(this.changed)&&this.options.onSendStart&&this.options.onSendStart();let n=t?{cb:t,idStrs:[]}:null;e.map((e=>{const{initial:t,current:s}=Object.assign({},e);if(!s)throw"Expecting { current: object, initial?: object }";const i=this.getIdStr(s);n&&n.idStrs.push(i),this.changed=this.changed||{},this.changed[i]=this.changed[i]||{initial:t,current:s},this.changed[i].current=Object.assign(Object.assign({},this.changed[i].current),s)})),this.sendItems()},this.isSendingTimeout=null,this.sendItems=()=>s(this,void 0,void 0,(function*(){const{synced_field:e,onSend:t,onSendEnd:n,batch_size:s,throttle:i}=this.options;if(this.isSendingTimeout||this.sending&&!r(this.sending))return;if(!this.changed||r(this.changed))return;let o,a=[],c=[];Object.keys(this.changed).sort(((e,t)=>this.sort(this.changed[e].current,this.changed[t].current))).slice(0,s).map((e=>{let t=Object.assign({},this.changed[e]);this.sending[e]=t,c.push(Object.assign({},t)),delete this.changed[e]})),a=c.map((e=>e.current)),this.isSendingTimeout=setTimeout((()=>{this.isSendingTimeout=void 0,r(this.changed)||this.sendItems()}),i);try{yield t(a,c)}catch(e){o=e,console.error(e,a,c)}if(this.callbacks.length){const e=Object.keys(this.sending);this.callbacks.forEach(((t,n)=>{t.idStrs=t.idStrs.filter((t=>e.includes(t))),t.idStrs.length||t.cb(o)})),this.callbacks=this.callbacks.filter((e=>e.idStrs.length))}this.sending={},r(this.changed)?n&&n(a,c,o):this.sendItems()})),this.options=Object.assign({},e),!this.options.orderBy){const{synced_field:t,id_fields:n}=e;this.options.orderBy=[t,...n.sort()].map((e=>({fieldName:e,asc:!0})))}}isSending(){return!(r(this.sending)&&r(this.changed))}getIdStr(e){return this.options.id_fields.sort().map((t=>`${e[t]||""}`)).join(".")}getIdObj(e){let t={};return this.options.id_fields.sort().map((n=>{t[n]=e[n]})),t}getDeltaObj(e){let t={};return Object.keys(e).map((n=>{this.options.id_fields.includes(n)||(t[n]=e[n])})),t}},t.isEmpty=r,t.get=function(e,t){let n=t,s=e;return e?("string"==typeof n&&(n=n.split(".")),n.reduce(((e,t)=>e&&e[t]?e[t]:void 0),s)):e}}},t={};return function n(s){if(t[s])return t[s].exports;var i=t[s]={exports:{}};return e[s].call(i.exports,i,i.exports,n),i.exports}(590)})()}},t={};function n(s){var i=t[s];if(void 0!==i)return i.exports;var r=t[s]={exports:{}};return e[s].call(r.exports,r,r.exports,n),r.exports}var s={};return(()=>{"use strict";var e=s;Object.defineProperty(e,"__esModule",{value:!0}),e.prostgles=void 0;const t=n(274),i=n(133);e.prostgles=function(e){return t.prostgles(e,i.SyncedTable)}})(),s})()}));