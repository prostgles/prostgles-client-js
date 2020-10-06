!function(e,t){if("object"==typeof exports&&"object"==typeof module)module.exports=t();else if("function"==typeof define&&define.amd)define([],t);else{var n=t();for(var s in n)("object"==typeof exports?exports:e)[s]=n[s]}}(this||window,(function(){return function(e){var t={};function n(s){if(t[s])return t[s].exports;var i=t[s]={i:s,l:!1,exports:{}};return e[s].call(i.exports,i,i.exports,n),i.l=!0,i.exports}return n.m=e,n.c=t,n.d=function(e,t,s){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:s})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var s=Object.create(null);if(n.r(s),Object.defineProperty(s,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var i in e)n.d(s,i,function(t){return e[t]}.bind(null,i));return s},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=1)}([function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.prostgles=void 0,t.prostgles=function(e,t){const{socket:n,onReady:s,onDisconnect:i}=e,r="_psqlWS_.";var o=[];let a={};return new Promise((e,l)=>{i&&n.on("disconnect",i),n.on(r+"schema",({schema:i,methods:l,fullSchema:c,joinTables:h=[]})=>{let d=JSON.parse(JSON.stringify(i)),u=JSON.parse(JSON.stringify(l)),f={};u.map(e=>{f[e]=function(...t){return new Promise((s,i)=>{n.emit(r+"method",{method:e,params:t},(e,t)=>{e?i(e):s(t)})})}}),f=Object.freeze(f),d.sql&&(d.sql=function(e,t,s){return new Promise((i,o)=>{n.emit(r+"sql",{query:e,params:t,options:s},(e,t)=>{e?o(e):i(t)})})});const m=["subscribe","subscribeOne"];Object.keys(d).forEach(e=>{Object.keys(d[e]).sort((e,t)=>m.includes(e)-m.includes(t)).forEach(s=>{if("sync"===s){if(d[e]._syncInfo={...d[e][s]},t){d[e].getSync=(n,s={})=>new t({name:e,filter:n,db:d,...s});const n=n=>{const s=`${e}.${JSON.stringify(n||{})}`;return a[s]||(a[s]=new t({name:e,filter:n,db:d})),a[s]};d[e].sync=(e,t,s=!1)=>n(e).sync(t,s),d[e].syncOne=(e,t,s=!1)=>n(e).syncOne(e,t,s)}d[e]._sync=function(t,i,a){const{onSyncRequest:l,onPullRequest:c,onUpdates:h}=a;var d,u=this;return n.emit(r,{tableName:e,command:s,param1:t,param2:i,lastUpdated:void 0},(e,t)=>{if(e)console.error(e);else if(t){const{id_fields:e,synced_field:s,channelName:i}=t,r={id_fields:e,synced_field:s};u.sync_info=r,u.channelName=i,u.socket=n,u.syncData=function(e,t,s){n.emit(i,{onSyncRequest:{...l({},r),...{data:e}||{},...{deleted:t}||{}}},s?e=>{s(e)}:null)},n.emit(i,{onSyncRequest:l({},r)},e=>{console.log(e)}),d=function(e,t){e&&(e.data&&e.data.length?Promise.resolve(h(e.data,r)).then(()=>{t&&t({ok:!0})}).catch(e=>{t&&t({err:e})}):e.onSyncRequest?Promise.resolve(l(e.onSyncRequest,r)).then(e=>t({onSyncRequest:e})).catch(e=>{t&&t({err:e})}):e.onPullRequest?Promise.resolve(c(e.onPullRequest,r)).then(e=>{t({data:e})}).catch(e=>{t&&t({err:e})}):console.log("unexpected response"))},o.push({channelName:i,syncHandles:a,socketHandle:d}),n.on(i,d)}}),Object.freeze({unsync:function(){return new Promise((e,t)=>{var s=o.filter(e=>e.channelName===u.channelName);1===s.length?(o=o.filter(e=>e.channelName!==u.channelName),n.emit(u.channelName+"unsync",{},(n,s)=>{n?t(n):e(s)})):s.length>1||console.log("no syncs to unsync from",s),n.removeListener(u.channelName,d)})},syncData:function(e,t){u&&u.syncData&&u.syncData(e,t)}})}}else if(m.includes(s)){d[e][s]=function(t,i,a){var l,c,h=this;function u(){var e=o.filter(e=>e.channelName===l);1===e.length?(o=o.filter(e=>e.channelName!==l),n.emit(l+"unsubscribe",{},(e,t)=>{})):e.length>1||console.log("no subscriptions to unsubscribe from",e),n.removeListener(l,c)}n.emit(r,{tableName:e,command:s,param1:t,param2:i,lastUpdated:void 0},(e,t)=>{e?console.error(e):t&&(l=t.channelName,c=function(e,t){a(e.data),h.channelName=l,h.socket=n},o.push({channelName:l,onChange:a,socketHandle:c}),n.on(l,c))});let f={unsubscribe:u};if(d[e].update){f={unsubscribe:u,update:function(n){return d[e].update(t,n)}}}return Object.freeze(f)}}else d[e][s]=function(t,i,o){return new Promise((a,l)=>{n.emit(r,{tableName:e,command:s,param1:t,param2:i,param3:o},(e,t)=>{e?l(e):a(t)})})}})}),h.map(e=>{function t(t=!0,n,s,i){return{[t?"$leftJoin":"$innerJoin"]:e,filter:n,select:s,...i}}d.innerJoin=d.innerJoin||{},d.leftJoin=d.leftJoin||{},d.innerJoinOne=d.innerJoinOne||{},d.leftJoinOne=d.leftJoinOne||{},d.leftJoin[e]=(e,n,s={})=>t(!0,e,n,s),d.innerJoin[e]=(e,n,s={})=>t(!1,e,n,s),d.leftJoinOne[e]=(e,n,s={})=>t(!0,e,n,{...s,limit:1}),d.innerJoinOne[e]=(e,n,s={})=>t(!1,e,n,{...s,limit:1})});try{s(d,f)}catch(e){console.error("Prostgles: Error within onReady: \n",e)}e(d)})})}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.prostgles=void 0;const s=n(0),i=n(2);t.prostgles=function(e){return s.prostgles(e,i.SyncedTable)}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.SyncedTable=void 0;const s="array",i="localStorage";t.SyncedTable=class{constructor({name:e,filter:t,onChange:n,db:r,pushDebounce:o=100,skipFirstTrigger:a=!1}){if(this.pushDebounce=100,this.skipFirstTrigger=!1,this.items=[],this.storageType=s,this.itemsObj={},this.notifyMultiSubscriptions=(e,t)=>{this.multiSubscriptions.map(t=>{let n=this.getItems();t.handlesOnData&&t.handles&&(n=n.map(e=>({...e,$update:t=>this.updateOne({...e},t),$delete:e=>this.delete(this.getIdObj(e))}))),t.onChange(n,e)})},this.notifySingleSubscriptions=(e,t,n)=>{this.singleSubscriptions.filter(t=>t.idObj&&this.matchesIdObj(t.idObj,e)&&Object.keys(t.idObj).length<=Object.keys(e).length).map(e=>{let s={...t};e.handlesOnData&&e.handles&&(s.$update=e.handles.update,s.$delete=e.handles.delete,s.$unsync=e.handles.unsync),e.onChange(s,n)})},this.unsubscribe=e=>{this.singleSubscriptions=this.singleSubscriptions.filter(t=>t.onChange!==e),this.multiSubscriptions=this.multiSubscriptions.filter(t=>t.onChange!==e)},this.unsync=()=>{this.dbSync&&this.dbSync.unsync&&this.dbSync.unsync()},this.delete=e=>{let t=this.getItems();return t=t.filter(t=>!this.matchesIdObj(e,t)),this.setItems(t),this.onDataChanged(null,null,[e])},this.syncDeleted=async()=>{try{return await Promise.all(this.getDeleted().map(async e=>this.db[this.name].delete(e))),this.setDeleted(null,[]),!0}catch(e){throw e}},this.upsert=async(e,t,n=!1)=>{if(!e)throw"No data provided for upsert";n&&this.getDeleted().length&&await this.syncDeleted();let s=Array.isArray(e)?e:[e],i=Array.isArray(t)?t:[t],r=this.getItems(),o=[],a=[],l=[];s.map((e,t)=>{let s={...e};n||(s[this.synced_field]=Date.now());let c=r.findIndex(e=>!this.id_fields.find(t=>e[t]!==s[t])),h=r[c];h&&h[this.synced_field]<s[this.synced_field]?(r[c]={...s},o.push(s),i&&i[t]?l.push(i[t]):l.push(s)):h||(r.push({...s}),a.push(s),l.push(s))});const c=[...a,...o].map(e=>({...e}));return this.setItems(r),this.onDataChanged(c,l,null,n)},this.onDataChanged=async(e=null,t=null,n=null,s=!1)=>{const i=(e,t)=>{this.isSendingData=this.isSendingData||{},e.map(e=>{let n=JSON.stringify(this.getIdObj(e));this.isSendingData[n]?(this.isSendingData[n].n={...this.isSendingData[n].n,...e},t&&this.isSendingData[n].cbs.push(t)):this.isSendingData[n]={o:this.findOne(this.getIdObj(e)),n:e,cbs:t?[t]:[]}})},r=()=>Object.keys(this.isSendingData).slice(0,20).map(e=>this.isSendingData[e].n),o=(e,t=!1)=>{e.map(e=>{t||(this.isSendingData[JSON.stringify(this.getIdObj(e))].cbs.map(e=>{e()}),delete this.isSendingData[JSON.stringify(this.getIdObj(e))])})},a=async(e=null,t=null,n=null)=>{if(e&&i(e,n),t||this.isSendingData&&Object.keys(this.isSendingData).length){window.onbeforeunload=function(){return"Data may be lost. Are you sure?"};const e=r();try{await this.dbSync.syncData(e,t),o(e),a()}catch(e){console.error(e)}}else window.onbeforeunload=null};return new Promise((i,r)=>{const o=this.getItems();e&&e.length&&(e.map((e,n)=>{let s={};t&&t.length&&(s=t[n]),this.notifySingleSubscriptions(this.getIdObj({...e}),{...e},{...s})}),this.notifyMultiSubscriptions(o,e)),this.onChange&&this.onChange(o,e),!s&&this.dbSync&&this.dbSync.syncData?a(e,n,()=>{i(!0)}):i(!0)})},this.setItems=e=>{this.storageType===i?window.localStorage.setItem(this.name,JSON.stringify(e)):this.storageType===s?this.items=e:console.log("invalid/missing storageType -> "+this.storageType)},this.getItems=e=>{let t=[];if(this.storageType===i){let e=window.localStorage.getItem(this.name);if(e)try{t=JSON.parse(e)}catch(e){console.error(e)}}else this.storageType===s?t=this.items.slice(0):console.log("invalid/missing storageType -> "+this.storageType);if(this.id_fields&&this.synced_field){const e=[this.synced_field,...this.id_fields.sort()];t=t.filter(e=>!this.filter||!Object.keys(this.filter).find(t=>e[t].toString()!==this.filter[t].toString())).sort((t,n)=>e.map(e=>t[e]<n[e]?-1:t[e]>n[e]?1:0).find(e=>e))}return this.items=t,t.map(e=>({...e}))},this.getBatch=(e,t)=>{let n=this.getItems();e=e||{};const{from_synced:s,to_synced:i,offset:r=0,limit:o=null}=e;let a=n.map(e=>({...e})).filter(e=>(!s||e[this.synced_field]>=s)&&(!i||e[this.synced_field]<=i));return(r||o)&&(a=a.splice(r,o||a.length)),a},this.name=e,this.filter=t,this.onChange=n,!r)throw"db missing";this.db=r;const{id_fields:l,synced_field:c}=r[this.name]._syncInfo;if(!l||!c)throw"id_fields/synced_field missing";this.id_fields=l,this.synced_field=c,this.pushDebounce=o,this.isSendingData={},this.skipFirstTrigger=a,this.multiSubscriptions=[],this.singleSubscriptions=[];this.dbSync=r[this.name]._sync(t,{},{onSyncRequest:(e,t)=>{let n={c_lr:null,c_fr:null,c_count:0},s=this.getBatch(e,t);return s.length&&(n={c_fr:s[0]||null,c_lr:s[s.length-1]||null,c_count:s.length}),n},onPullRequest:async(e,t)=>{this.getDeleted().length&&await this.syncDeleted();return this.getBatch(e,t)},onUpdates:e=>{this.upsert(e,e,!0)}}),this.onChange&&!this.skipFirstTrigger&&setTimeout(this.onChange,0)}sync(e,t=!1){const n={unsync:()=>{this.unsubscribe(e)},upsert:e=>this.upsert(e,e)},s={onChange:e,handlesOnData:t,handles:n};return this.multiSubscriptions.push(s),this.skipFirstTrigger||e(this.getItems()),Object.freeze({...n})}syncOne(e,t,n=!1){if(!e||!t)throw"syncOne(idObj, onChange) -> MISSING idObj or onChange";const s={get:()=>this.findOne(e),unsync:()=>{this.unsubscribe(t)},delete:()=>this.delete(e),update:t=>{this.updateOne(e,t)},set:t=>{const n={...t,...e};this.upsert(n,n)}},i={onChange:t,idObj:e,handlesOnData:n,handles:s};return this.singleSubscriptions.push(i),Object.freeze({...s})}updateOne(e,t){let n=this.getIdObj(e);return this.upsert({...this.findOne(n),...t,...n},{...t})}findOne(e){this.getItems();let t=-1;return t="function"==typeof e?this.items.findIndex(e):this.items.findIndex(t=>this.matchesIdObj(e,t)),this.items[t]}getIdObj(e){let t={};return this.id_fields.sort().map(n=>{t[n]=e[n]}),t}matchesIdObj(e,t){return Object.keys(e).length&&!Object.keys(e).find(n=>t[n]!==e[n])}deleteAll(){this.getItems().map(this.getIdObj).map(this.delete)}setDeleted(e,t){let n=[];t?n=t:(n=this.getDeleted(),n.push(e)),window.localStorage.setItem(this.name+"_$$psql$$_deleted",n)}getDeleted(){const e=window.localStorage.getItem(this.name+"_$$psql$$_deleted")||"[]";return JSON.parse(e)}}}])}));