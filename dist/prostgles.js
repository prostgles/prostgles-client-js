!function(e,t){if("object"==typeof exports&&"object"==typeof module)module.exports=t();else if("function"==typeof define&&define.amd)define([],t);else{var n=t();for(var s in n)("object"==typeof exports?exports:e)[s]=n[s]}}(this,(function(){return function(e){var t={};function n(s){if(t[s])return t[s].exports;var i=t[s]={i:s,l:!1,exports:{}};return e[s].call(i.exports,i,i.exports,n),i.l=!0,i.exports}return n.m=e,n.c=t,n.d=function(e,t,s){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:s})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var s=Object.create(null);if(n.r(s),Object.defineProperty(s,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var i in e)n.d(s,i,function(t){return e[t]}.bind(null,i));return s},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=1)}([function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.prostgles=void 0,t.prostgles=function({socket:e,isReady:t=((e,t)=>{}),onDisconnect:n}){const s="_psqlWS_.";var i=[];return new Promise((o,r)=>{n&&e.on("disconnect",n),e.on(s+"schema",({schema:n,methods:r,fullSchema:l,joinTables:a=[]})=>{let c=JSON.parse(JSON.stringify(n)),h=JSON.parse(JSON.stringify(r)),u={};h.map(t=>{u[t]=function(n){return new Promise((i,o)=>{e.emit(s+"method",{method:t,params:n},(e,t)=>{e?o(e):i(t)})})}}),u=Object.freeze(u),c.sql&&(c.sql=function(t,n,i){return new Promise((o,r)=>{e.emit(s+"sql",{query:t,params:n,options:i},(e,t)=>{e?r(e):o(t)})})}),Object.keys(c).forEach(t=>{Object.keys(c[t]).forEach(n=>{if("sync"===n){c[t]._syncInfo={...c[t][n]},c[t][n]=function(o,r,l){const{onSyncRequest:a,onPullRequest:c,onUpdates:h}=l;var u,d=this;return e.emit(s,{tableName:t,command:n,param1:o,param2:r,lastUpdated:void 0},(t,n)=>{if(t)console.error(t);else if(n){const{id_fields:t,synced_field:s,channelName:o}=n,r={id_fields:t,synced_field:s};d.sync_info=r,d.channelName=o,d.socket=e,d.syncData=function(t,n,s){e.emit(o,{onSyncRequest:{...a({},r),...{data:t}||{},...{deleted:n}||{}}},s?e=>{s(e)}:null)},e.emit(o,{onSyncRequest:a({},r)},e=>{console.log(e)}),u=function(e,t){e&&(e.data&&e.data.length?Promise.resolve(h(e.data,r)).then(()=>{t&&t({ok:!0})}).catch(e=>{t&&t({err:e})}):e.onSyncRequest?Promise.resolve(a(e.onSyncRequest,r)).then(e=>t({onSyncRequest:e})).catch(e=>{t&&t({err:e})}):e.onPullRequest?Promise.resolve(c(e.onPullRequest,r)).then(e=>{t({data:e})}).catch(e=>{t&&t({err:e})}):console.log("unexpected response"))},i.push({channelName:o,syncHandles:l,socketHandle:u}),e.on(o,u)}}),Object.freeze({unsync:function(){return new Promise((t,n)=>{var s=i.filter(e=>e.channelName===d.channelName);1===s.length?(i=i.filter(e=>e.channelName!==d.channelName),e.emit(d.channelName+"unsync",{},(e,s)=>{e?n(e):t(s)})):s.length>1||console.log("no syncs to unsync from",s),e.removeListener(d.channelName,u)})},syncData:function(e,t){d&&d.syncData&&d.syncData(e,t)}})}}else if("subscribe"===n){c[t][n]=function(o,r,l){var a,c,h=this;return e.emit(s,{tableName:t,command:n,param1:o,param2:r,lastUpdated:void 0},(t,n)=>{t?console.error(t):n&&(a=n.channelName,c=function(t,n){l(t.data),h.channelName=a,h.socket=e},i.push({channelName:a,onChange:l,socketHandle:c}),e.on(a,c))}),Object.freeze({unsubscribe:function(){var t=i.filter(e=>e.channelName===a);1===t.length?(i=i.filter(e=>e.channelName!==a),e.emit(a+"unsubscribe",{},(e,t)=>{})):t.length>1||console.log("no subscriptions to unsubscribe from",t),e.removeListener(a,c)}})}}else c[t][n]=function(i,o,r){return new Promise((l,a)=>{e.emit(s,{tableName:t,command:n,param1:i,param2:o,param3:r},(e,t)=>{e?a(e):l(t)})})}})}),a.map(e=>{function t(t=!0,n,s,i){return{[t?"$leftJoin":"$innerJoin"]:e,filter:n,select:s,...i}}c.innerJoin=c.innerJoin||{},c.leftJoin=c.leftJoin||{},c.innerJoinOne=c.innerJoinOne||{},c.leftJoinOne=c.leftJoinOne||{},c.leftJoin[e]=(e,n,s={})=>t(!0,e,n,s),c.innerJoin[e]=(e,n,s={})=>t(!1,e,n,s),c.leftJoinOne[e]=(e,n,s={})=>t(!0,e,n,{...s,limit:1}),c.innerJoinOne[e]=(e,n,s={})=>t(!1,e,n,{...s,limit:1})}),t(c,u),o(c)})})}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.SyncedTable=t.prostgles=void 0;const s=n(0);Object.defineProperty(t,"prostgles",{enumerable:!0,get:function(){return s.prostgles}});const i=n(2);Object.defineProperty(t,"SyncedTable",{enumerable:!0,get:function(){return i.SyncedTable}})},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.SyncedTable=void 0;const s="array",i="localStorage";t.SyncedTable=class{constructor({name:e,filter:t,onChange:n,db:o,pushDebounce:r=100,skipFirstTrigger:l=!1}){if(this.pushDebounce=100,this.skipFirstTrigger=!1,this.items=[],this.storageType=s,this.itemsObj={},this.notifySubscriptions=(e,t,n)=>{this.singleSubscriptions.filter(t=>t.idObj&&this.matchesIdObj(t.idObj,e)&&Object.keys(t.idObj).length<=Object.keys(e).length).map(e=>{e.onChange(t,n)})},this.unsubscribe=e=>{this.singleSubscriptions=this.singleSubscriptions.filter(t=>t.onChange!==e),this.multiSubscriptions=this.multiSubscriptions.filter(t=>t.onChange!==e)},this.unsync=()=>{this.dbSync&&this.dbSync.unsync&&this.dbSync.unsync()},this.delete=e=>{let t=this.getItems();return t=t.filter(t=>!this.matchesIdObj(e,t)),this.setItems(t),this.onDataChanged(null,[e])},this.syncDeleted=async()=>{try{return await Promise.all(this.getDeleted().map(async e=>this.db[this.name].delete(e))),this.setDeleted(null,[]),!0}catch(e){throw e}},this.upsert=async(e,t=!1)=>{let n=this.getItems();t&&this.getDeleted().length&&await this.syncDeleted();let s=[],i=[];e.map(e=>{t||(e[this.synced_field]=Date.now());let o=n.findIndex(t=>!this.id_fields.find(n=>t[n]!==e[n])),r=n[o];r&&r[this.synced_field]<e[this.synced_field]?(n[o]={...e},s.push(e),t&&this.singleSubscriptions.filter(t=>t.idObj&&this.matchesIdObj(t.idObj,e)).map(t=>{t.onChange({...e},{...e})})):r||(n.push({...e}),i.push(e))});const o=[...i,...s];return this.setItems(n),this.onDataChanged(o,null,t),!0},this.onDataChanged=async(e=null,t=null,n=!1)=>new Promise((s,i)=>{const o=this.getItems();this.multiSubscriptions.map(t=>{t.onChange(o,e)}),this.onChange&&this.onChange(o,e),window.onbeforeunload=function(){return"Data may be lost. Are you sure?"},!n&&this.dbSync&&this.dbSync.syncData&&(this.isSendingData&&window.clearTimeout(this.isSendingData),this.isSendingData=window.setTimeout(async()=>{await this.dbSync.syncData(e,t),s(!0),this.isSendingData=null,window.onbeforeunload=null},this.pushDebounce)),s(!0)}),this.setItems=e=>{this.storageType===i?window.localStorage.setItem(this.name,JSON.stringify(e)):this.storageType===s?this.items=e:console.log("invalid/missing storageType -> "+this.storageType)},this.getItems=e=>{let t=[];if(this.storageType===i){let e=window.localStorage.getItem(this.name);if(e)try{t=JSON.parse(e)}catch(e){console.error(e)}}else this.storageType===s?t=this.items.slice(0):console.log("invalid/missing storageType -> "+this.storageType);if(this.id_fields&&this.synced_field){const e=[this.synced_field,...this.id_fields.sort()];t=t.filter(e=>!this.filter||!Object.keys(this.filter).find(t=>e[t].toString()!==this.filter[t].toString())).sort((t,n)=>e.map(e=>t[e]<n[e]?-1:t[e]>n[e]?1:0).find(e=>e))}return this.items=t,t},this.getBatch=(e,t)=>{let n=this.getItems();e=e||{};const{from_synced:s,to_synced:i,offset:o=0,limit:r=null}=e;let l=n.map(e=>({...e})).filter(e=>(!s||e[this.synced_field]>=s)&&(!i||e[this.synced_field]<=i));return(o||r)&&(l=l.splice(o,r||l.length)),l},this.name=e,this.filter=t,this.onChange=n,!o)throw"db missing";this.db=o;const{id_fields:a,synced_field:c}=o[this.name]._syncInfo;if(!a||!c)throw"id_fields/synced_field missing";this.id_fields=a,this.synced_field=c,this.pushDebounce=r,this.isSendingData=null,this.skipFirstTrigger=l,this.multiSubscriptions=[],this.singleSubscriptions=[];this.dbSync=o[this.name].sync(t,{},{onSyncRequest:(e,t)=>{let n={c_lr:null,c_fr:null,c_count:0},s=this.getBatch(e,t);return s.length&&(n={c_fr:s[0]||null,c_lr:s[s.length-1]||null,c_count:s.length}),n},onPullRequest:async(e,t)=>{this.getDeleted().length&&await this.syncDeleted();return this.getBatch(e,t)},onUpdates:e=>{this.upsert(e,!0)}}),this.onChange&&!this.skipFirstTrigger&&setTimeout(this.onChange,0)}subscribeAll(e){const t={onChange:e};return this.multiSubscriptions.push(t),this.skipFirstTrigger||e(this.getItems()),Object.freeze({unsubscribe:()=>{this.unsubscribe(e)}})}subscribeOne(e,t){if(!e||!t)throw"bad";const n=this.findOne(e);if(!n)throw"no item found";const s={onChange:t,idObj:e,item:n},i={get:()=>this.findOne(e),unsubscribe:()=>{this.unsubscribe(t)},delete:()=>this.delete(e),update:t=>{this.updateOne(e,t)},updateFull:t=>{const n={...t,...e};this.notifySubscriptions(e,n,t),this.upsert([n])}};return this.singleSubscriptions.push(s),setTimeout(()=>t(n,n),0),Object.freeze({...i})}updateOne(e,t){const n={...this.findOne(e),...t,...e};this.notifySubscriptions(e,n,t),this.upsert([n])}findOne(e){this.getItems();let t=-1;return t="function"==typeof e?this.items.findIndex(e):this.items.findIndex(t=>this.matchesIdObj(e,t)),this.items[t]}getIdObj(e){let t={};return this.id_fields.map(n=>{t[n]=e[n]}),t}matchesIdObj(e,t){return Object.keys(e).length&&!Object.keys(e).find(n=>t[n]!==e[n])}deleteAll(){this.getItems().map(this.getIdObj).map(this.delete)}setDeleted(e,t){let n=[];t?n=t:(n=this.getDeleted(),n.push(e)),window.localStorage.setItem(this.name+"_$$psql$$_deleted",n)}getDeleted(){const e=window.localStorage.getItem(this.name+"_$$psql$$_deleted")||"[]";return JSON.parse(e)}}}])}));