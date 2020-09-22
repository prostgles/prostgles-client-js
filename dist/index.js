!function(e,t){if("object"==typeof exports&&"object"==typeof module)module.exports=t();else if("function"==typeof define&&define.amd)define([],t);else{var n=t();for(var s in n)("object"==typeof exports?exports:e)[s]=n[s]}}(this,(function(){return function(e){var t={};function n(s){if(t[s])return t[s].exports;var i=t[s]={i:s,l:!1,exports:{}};return e[s].call(i.exports,i,i.exports,n),i.l=!0,i.exports}return n.m=e,n.c=t,n.d=function(e,t,s){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:s})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var s=Object.create(null);if(n.r(s),Object.defineProperty(s,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var i in e)n.d(s,i,function(t){return e[t]}.bind(null,i));return s},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=1)}([function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.prostgles=void 0,t.prostgles=function(e,t){const{socket:n,isReady:s,onDisconnect:i}=e,o="_psqlWS_.";var r=[];return new Promise((e,a)=>{i&&n.on("disconnect",i),n.on(o+"schema",({schema:i,methods:a,fullSchema:l,joinTables:c=[]})=>{let h=JSON.parse(JSON.stringify(i)),u=JSON.parse(JSON.stringify(a)),d={};u.map(e=>{d[e]=function(t){return new Promise((s,i)=>{n.emit(o+"method",{method:e,params:t},(e,t)=>{e?i(e):s(t)})})}}),d=Object.freeze(d),h.sql&&(h.sql=function(e,t,s){return new Promise((i,r)=>{n.emit(o+"sql",{query:e,params:t,options:s},(e,t)=>{e?r(e):i(t)})})}),Object.keys(h).forEach(e=>{Object.keys(h[e]).forEach(s=>{if("sync"===s){h[e]._syncInfo={...h[e][s]},t&&t&&(h[e].getSync=(n,s={})=>new t({name:e,filter:n,db:h,...s})),h[e][s]=function(t,i,a){const{onSyncRequest:l,onPullRequest:c,onUpdates:h}=a;var u,d=this;return n.emit(o,{tableName:e,command:s,param1:t,param2:i,lastUpdated:void 0},(e,t)=>{if(e)console.error(e);else if(t){const{id_fields:e,synced_field:s,channelName:i}=t,o={id_fields:e,synced_field:s};d.sync_info=o,d.channelName=i,d.socket=n,d.syncData=function(e,t,s){n.emit(i,{onSyncRequest:{...l({},o),...{data:e}||{},...{deleted:t}||{}}},s?e=>{s(e)}:null)},n.emit(i,{onSyncRequest:l({},o)},e=>{console.log(e)}),u=function(e,t){e&&(e.data&&e.data.length?Promise.resolve(h(e.data,o)).then(()=>{t&&t({ok:!0})}).catch(e=>{t&&t({err:e})}):e.onSyncRequest?Promise.resolve(l(e.onSyncRequest,o)).then(e=>t({onSyncRequest:e})).catch(e=>{t&&t({err:e})}):e.onPullRequest?Promise.resolve(c(e.onPullRequest,o)).then(e=>{t({data:e})}).catch(e=>{t&&t({err:e})}):console.log("unexpected response"))},r.push({channelName:i,syncHandles:a,socketHandle:u}),n.on(i,u)}}),Object.freeze({unsync:function(){return new Promise((e,t)=>{var s=r.filter(e=>e.channelName===d.channelName);1===s.length?(r=r.filter(e=>e.channelName!==d.channelName),n.emit(d.channelName+"unsync",{},(n,s)=>{n?t(n):e(s)})):s.length>1||console.log("no syncs to unsync from",s),n.removeListener(d.channelName,u)})},syncData:function(e,t){d&&d.syncData&&d.syncData(e,t)}})}}else if("subscribe"===s){h[e][s]=function(t,i,a){var l,c,h=this;return n.emit(o,{tableName:e,command:s,param1:t,param2:i,lastUpdated:void 0},(e,t)=>{e?console.error(e):t&&(l=t.channelName,c=function(e,t){a(e.data),h.channelName=l,h.socket=n},r.push({channelName:l,onChange:a,socketHandle:c}),n.on(l,c))}),Object.freeze({unsubscribe:function(){var e=r.filter(e=>e.channelName===l);1===e.length?(r=r.filter(e=>e.channelName!==l),n.emit(l+"unsubscribe",{},(e,t)=>{})):e.length>1||console.log("no subscriptions to unsubscribe from",e),n.removeListener(l,c)}})}}else h[e][s]=function(t,i,r){return new Promise((a,l)=>{n.emit(o,{tableName:e,command:s,param1:t,param2:i,param3:r},(e,t)=>{e?l(e):a(t)})})}})}),c.map(e=>{function t(t=!0,n,s,i){return{[t?"$leftJoin":"$innerJoin"]:e,filter:n,select:s,...i}}h.innerJoin=h.innerJoin||{},h.leftJoin=h.leftJoin||{},h.innerJoinOne=h.innerJoinOne||{},h.leftJoinOne=h.leftJoinOne||{},h.leftJoin[e]=(e,n,s={})=>t(!0,e,n,s),h.innerJoin[e]=(e,n,s={})=>t(!1,e,n,s),h.leftJoinOne[e]=(e,n,s={})=>t(!0,e,n,{...s,limit:1}),h.innerJoinOne[e]=(e,n,s={})=>t(!1,e,n,{...s,limit:1})}),s(h,d),e(h)})})}},function(e,t,n){"use strict";const s=n(0),i=n(2);function o(e){return s.prostgles(e,i.SyncedTable)}o.SyncedTable=i.SyncedTable,e.exports=o},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.SyncedTable=void 0;const s="array",i="localStorage";t.SyncedTable=class{constructor({name:e,filter:t,onChange:n,db:o,pushDebounce:r=100,skipFirstTrigger:a=!1}){if(this.pushDebounce=100,this.skipFirstTrigger=!1,this.items=[],this.storageType=s,this.itemsObj={},this.notifySubscriptions=(e,t,n)=>{this.singleSubscriptions.filter(t=>t.idObj&&this.matchesIdObj(t.idObj,e)&&Object.keys(t.idObj).length<=Object.keys(e).length).map(e=>{e.onChange(t,n)}),this.multiSubscriptions.map(e=>e.onChange(this.getItems(),[t]))},this.unsubscribe=e=>{this.singleSubscriptions=this.singleSubscriptions.filter(t=>t.onChange!==e),this.multiSubscriptions=this.multiSubscriptions.filter(t=>t.onChange!==e)},this.unsync=()=>{this.dbSync&&this.dbSync.unsync&&this.dbSync.unsync()},this.delete=e=>{let t=this.getItems();return t=t.filter(t=>!this.matchesIdObj(e,t)),this.setItems(t),this.onDataChanged(null,[e])},this.syncDeleted=async()=>{try{return await Promise.all(this.getDeleted().map(async e=>this.db[this.name].delete(e))),this.setDeleted(null,[]),!0}catch(e){throw e}},this.upsert=async(e,t=!1)=>{if(!e)throw"No data provided for upsert";let n=Array.isArray(e)?e:[e],s=this.getItems();t&&this.getDeleted().length&&await this.syncDeleted();let i=[],o=[];n.map(e=>{t||(e[this.synced_field]=Date.now());let n=s.findIndex(t=>!this.id_fields.find(n=>t[n]!==e[n])),r=s[n];r&&r[this.synced_field]<e[this.synced_field]?(s[n]={...e},i.push(e),t&&this.singleSubscriptions.filter(t=>t.idObj&&this.matchesIdObj(t.idObj,e)).map(t=>{t.onChange({...e},{...e})})):r||(s.push({...e}),o.push(e))});const r=[...o,...i];return this.setItems(s),this.onDataChanged(r,null,t),!0},this.onDataChanged=async(e=null,t=null,n=!1)=>{const s=async(e=null,t=null,n=null)=>{e&&(this.isSendingData=this.isSendingData.concat(e)),n&&this.isSendingDataCallbacks.push(n);if(this.isSendingData&&this.isSendingData.length||t){window.onbeforeunload=function(){return"Data may be lost. Are you sure?"};const e=this.isSendingData.slice(0,20);await this.dbSync.syncData(e,t),this.isSendingData.splice(0,20),s()}else window.onbeforeunload=null,this.isSendingDataCallbacks.map(e=>{e()}),this.isSendingDataCallbacks=[]};return new Promise((i,o)=>{const r=this.getItems();this.multiSubscriptions.map(t=>{t.onChange(r,e)}),this.onChange&&this.onChange(r,e),!n&&this.dbSync&&this.dbSync.syncData?s(e,t,()=>{i(!0)}):i(!0)})},this.setItems=e=>{this.storageType===i?window.localStorage.setItem(this.name,JSON.stringify(e)):this.storageType===s?this.items=e:console.log("invalid/missing storageType -> "+this.storageType)},this.getItems=e=>{let t=[];if(this.storageType===i){let e=window.localStorage.getItem(this.name);if(e)try{t=JSON.parse(e)}catch(e){console.error(e)}}else this.storageType===s?t=this.items.slice(0):console.log("invalid/missing storageType -> "+this.storageType);if(this.id_fields&&this.synced_field){const e=[this.synced_field,...this.id_fields.sort()];t=t.filter(e=>!this.filter||!Object.keys(this.filter).find(t=>e[t].toString()!==this.filter[t].toString())).sort((t,n)=>e.map(e=>t[e]<n[e]?-1:t[e]>n[e]?1:0).find(e=>e))}return this.items=t,t},this.getBatch=(e,t)=>{let n=this.getItems();e=e||{};const{from_synced:s,to_synced:i,offset:o=0,limit:r=null}=e;let a=n.map(e=>({...e})).filter(e=>(!s||e[this.synced_field]>=s)&&(!i||e[this.synced_field]<=i));return(o||r)&&(a=a.splice(o,r||a.length)),a},this.name=e,this.filter=t,this.onChange=n,!o)throw"db missing";this.db=o;const{id_fields:l,synced_field:c}=o[this.name]._syncInfo;if(!l||!c)throw"id_fields/synced_field missing";this.id_fields=l,this.synced_field=c,this.pushDebounce=r,this.isSendingData=[],this.isSendingDataCallbacks=[],this.skipFirstTrigger=a,this.multiSubscriptions=[],this.singleSubscriptions=[];this.dbSync=o[this.name].sync(t,{},{onSyncRequest:(e,t)=>{let n={c_lr:null,c_fr:null,c_count:0},s=this.getBatch(e,t);return s.length&&(n={c_fr:s[0]||null,c_lr:s[s.length-1]||null,c_count:s.length}),n},onPullRequest:async(e,t)=>{this.getDeleted().length&&await this.syncDeleted();return this.getBatch(e,t)},onUpdates:e=>{this.upsert(e,!0)}}),this.onChange&&!this.skipFirstTrigger&&setTimeout(this.onChange,0)}subscribeAll(e){const t={onChange:e};return this.multiSubscriptions.push(t),this.skipFirstTrigger||e(this.getItems()),Object.freeze({unsubscribe:()=>{this.unsubscribe(e)}})}subscribeOne(e,t){if(!e||!t)throw"bad";const n=this.findOne(e);if(!n)throw"no item found";const s={onChange:t,idObj:e,item:n},i={get:()=>this.findOne(e),unsubscribe:()=>{this.unsubscribe(t)},delete:()=>this.delete(e),update:t=>{this.updateOne(e,t)},updateFull:t=>{const n={...t,...e};this.notifySubscriptions(e,n,t),this.upsert([n])}};return this.singleSubscriptions.push(s),setTimeout(()=>t(n,n),0),Object.freeze({...i})}updateOne(e,t){const n={...this.findOne(e),...t,...e};this.notifySubscriptions(e,n,t),this.upsert([n])}findOne(e){this.getItems();let t=-1;return t="function"==typeof e?this.items.findIndex(e):this.items.findIndex(t=>this.matchesIdObj(e,t)),this.items[t]}getIdObj(e){let t={};return this.id_fields.map(n=>{t[n]=e[n]}),t}matchesIdObj(e,t){return Object.keys(e).length&&!Object.keys(e).find(n=>t[n]!==e[n])}deleteAll(){this.getItems().map(this.getIdObj).map(this.delete)}setDeleted(e,t){let n=[];t?n=t:(n=this.getDeleted(),n.push(e)),window.localStorage.setItem(this.name+"_$$psql$$_deleted",n)}getDeleted(){const e=window.localStorage.getItem(this.name+"_$$psql$$_deleted")||"[]";return JSON.parse(e)}}}])}));