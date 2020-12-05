!function(e,t){if("object"==typeof exports&&"object"==typeof module)module.exports=t();else if("function"==typeof define&&define.amd)define([],t);else{var n=t();for(var s in n)("object"==typeof exports?exports:e)[s]=n[s]}}(this||window,(function(){return function(e){var t={};function n(s){if(t[s])return t[s].exports;var i=t[s]={i:s,l:!1,exports:{}};return e[s].call(i.exports,i,i.exports,n),i.l=!0,i.exports}return n.m=e,n.c=t,n.d=function(e,t,s){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:s})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var s=Object.create(null);if(n.r(s),Object.defineProperty(s,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var i in e)n.d(s,i,function(t){return e[t]}.bind(null,i));return s},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=1)}([function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.prostgles=void 0,t.prostgles=function(e,t){const{socket:n,onReady:s,onDisconnect:i}=e,r="_psqlWS_.";let a={},o={},l={};function c({tableName:e,command:t,param1:s,param2:i},a){return new Promise((o,l)=>{n.emit(r,{tableName:e,command:t,param1:s,param2:i},(e,t)=>{if(e)console.error(e),l(e);else if(t){const{id_fields:e,synced_field:s,channelName:i}=t;n.emit(i,{onSyncRequest:a({},t)},e=>{console.log(e)}),o({id_fields:e,synced_field:s,channelName:i})}})})}function d({tableName:e,command:t,param1:s,param2:i}){return new Promise((a,o)=>{n.emit(r,{tableName:e,command:t,param1:s,param2:i},(e,t)=>{e?(console.error(e),o(e)):t&&a(t.channelName)})})}async function h({tableName:e,command:t,param1:s,param2:i},r){const{onPullRequest:a,onSyncRequest:o,onUpdates:d}=r;function h(e,t){return Object.freeze({unsync:function(){!function(e,t){new Promise((s,i)=>{l[e]&&(l[e].triggers=l[e].triggers.filter(e=>e.onPullRequest!==t.onPullRequest&&e.onSyncRequest!==t.onSyncRequest&&e.onUpdates!==t.onUpdates),l[e].triggers.length||(n.emit(e+"unsync",{},(e,t)=>{e?i(e):s(t)}),n.removeListener(e,l[e].onCall),delete l[e]))})}(e,r)},syncData:function(s,i,r){n.emit(e,{onSyncRequest:{...o({},t),...{data:s}||{},...{deleted:i}||{}}},r?e=>{r(e)}:null)}})}const u=Object.keys(l).find(n=>{let r=l[n];return r.tableName===e&&r.command===t&&JSON.stringify(r.param1||{})===JSON.stringify(s||{})&&JSON.stringify(r.param2||{})===JSON.stringify(i||{})});if(u)return l[u].triggers.push(r),h(u,l[u].syncInfo);{const a=await c({tableName:e,command:t,param1:s,param2:i},o),{channelName:d,synced_field:u,id_fields:f}=a;function m(e,t){e&&l[d]&&l[d].triggers.map(({onUpdates:n,onSyncRequest:s,onPullRequest:i})=>{e.data&&e.data.length?Promise.resolve(n(e.data,a)).then(()=>{t&&t({ok:!0})}).catch(e=>{t&&t({err:e})}):e.onSyncRequest?Promise.resolve(s(e.onSyncRequest,a)).then(e=>t({onSyncRequest:e})).catch(e=>{t&&t({err:e})}):e.onPullRequest?Promise.resolve(i(e.onPullRequest,a)).then(e=>{t({data:e})}).catch(e=>{t&&t({err:e})}):console.log("unexpected response")})}return l[d]={tableName:e,command:t,param1:s,param2:i,triggers:[r],syncInfo:a,onCall:m},n.on(d,m),h(d,a)}}async function u(e,{tableName:t,command:s,param1:i,param2:r},o){function l(s){let r={unsubscribe:function(){!function(e,t){a[e]&&(a[e].handlers=a[e].handlers.filter(e=>e!==t),a[e].handlers.length||(n.emit(e+"unsubscribe",{},(e,t)=>{}),n.removeListener(e,a[e].onCall),delete a[e]))}(s,o)}};return e[t].update&&(r={...r,update:function(n,s){return e[t].update(i,n,s)}}),e[t].delete&&(r={...r,delete:function(n){return e[t].delete(i,n)}}),Object.freeze(r)}const c=Object.keys(a).find(e=>{let n=a[e];return n.tableName===t&&n.command===s&&JSON.stringify(n.param1||{})===JSON.stringify(i||{})&&JSON.stringify(n.param2||{})===JSON.stringify(r||{})});if(c)return a[c].handlers.push(o),a[c].handlers.includes(o)&&console.warn("Duplicate subscription handler was added for:",a[c]),l(c);{const e=await d({tableName:t,command:s,param1:i,param2:r});let c=function(t,n){a[e].handlers.map(e=>{e(t.data)})};return n.on(e,c),a[e]={tableName:t,command:s,param1:i,param2:r,onCall:c,handlers:[o]},l(e)}}return new Promise((e,m)=>{i&&n.on("disconnect",i),n.on(r+"schema",({schema:i,methods:m,fullSchema:f,auth:g,rawSQL:p,joinTables:y=[]})=>{let b=JSON.parse(JSON.stringify(i)),O=JSON.parse(JSON.stringify(m)),S={},j={};g&&(j={...g},["login","logout","register"].map(e=>{g[e]&&(j[e]=function(t){return new Promise((s,i)=>{n.emit(r+e,t,(e,t)=>{e?i(e):s(t)})})})})),O.map(e=>{S[e]=function(...t){return new Promise((s,i)=>{n.emit(r+"method",{method:e,params:t},(e,t)=>{e?i(e):s(t)})})}}),S=Object.freeze(S),p&&(b.sql=function(e,t,s){return new Promise((i,a)=>{n.emit(r+"sql",{query:e,params:t,options:s},(e,t)=>{e?a(e):i(t)})})});const _=["subscribe","subscribeOne"];Object.keys(b).forEach(e=>{Object.keys(b[e]).sort((e,t)=>_.includes(e)-_.includes(t)).forEach(s=>{if("sync"===s){if(b[e]._syncInfo={...b[e][s]},t){b[e].getSync=(n,s={})=>new t({name:e,filter:n,db:b,...s});const n=n=>{const s=`${e}.${JSON.stringify(n||{})}`;return o[s]||(o[s]=new t({name:e,filter:n,db:b})),o[s]};b[e].sync=(e,t,s=!1)=>n(e).sync(t,s),b[e].syncOne=(e,t,s=!1)=>n(e).syncOne(e,t,s)}b[e]._sync=function(t,n,i){return h({tableName:e,command:s,param1:t,param2:n},i)}}else _.includes(s)?b[e][s]=function(t,n,i){return u(b,{tableName:e,command:s,param1:t,param2:n},i)}:b[e][s]=function(t,i,a){return new Promise((o,l)=>{n.emit(r,{tableName:e,command:s,param1:t,param2:i,param3:a},(e,t)=>{e?l(e):o(t)})})}})}),a&&Object.keys(a).length&&Object.keys(a).map(async e=>{try{let t=a[e];await d(t),n.on(e,t.onCall)}catch(e){console.error("There was an issue reconnecting olf subscriptions",e)}}),l&&Object.keys(l).length&&Object.keys(l).filter(e=>l[e].triggers&&l[e].triggers.length).map(async e=>{try{let t=l[e];await c(t,t.triggers[0].onSyncRequest),n.on(e,t.onCall)}catch(e){console.error("There was an issue reconnecting olf subscriptions",e)}}),y.map(e=>{function t(t=!0,n,s,i){return{[t?"$leftJoin":"$innerJoin"]:e,filter:n,select:s,...i}}b.innerJoin=b.innerJoin||{},b.leftJoin=b.leftJoin||{},b.innerJoinOne=b.innerJoinOne||{},b.leftJoinOne=b.leftJoinOne||{},b.leftJoin[e]=(e,n,s={})=>t(!0,e,n,s),b.innerJoin[e]=(e,n,s={})=>t(!1,e,n,s),b.leftJoinOne[e]=(e,n,s={})=>t(!0,e,n,{...s,limit:1}),b.innerJoinOne[e]=(e,n,s={})=>t(!1,e,n,{...s,limit:1})});try{s(b,S,f,j)}catch(e){console.error("Prostgles: Error within onReady: \n",e)}e(b)})})}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.prostgles=void 0;const s=n(0),i=n(2);t.prostgles=function(e){return s.prostgles(e,i.SyncedTable)}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.SyncedTable=void 0;const s="array",i="localStorage";t.SyncedTable=class{constructor({name:e,filter:t,onChange:n,db:r,pushDebounce:a=100,skipFirstTrigger:o=!1}){if(this.pushDebounce=100,this.skipFirstTrigger=!1,this.items=[],this.storageType=s,this.itemsObj={},this.notifyMultiSubscriptions=(e,t)=>{this.multiSubscriptions.map(t=>{let n=this.getItems();t.handlesOnData&&t.handles&&(n=n.map(e=>({...e,$update:t=>this.updateOne({...e},t),$delete:e=>this.delete(this.getIdObj(e))}))),t.onChange(n,e)})},this.notifySingleSubscriptions=(e,t,n)=>{this.singleSubscriptions.filter(t=>t.idObj&&this.matchesIdObj(t.idObj,e)&&Object.keys(t.idObj).length<=Object.keys(e).length).map(e=>{let s={...t};e.handlesOnData&&e.handles&&(s.$update=e.handles.update,s.$delete=e.handles.delete,s.$unsync=e.handles.unsync),e.onChange(s,n)})},this.unsubscribe=e=>{this.singleSubscriptions=this.singleSubscriptions.filter(t=>t.onChange!==e),this.multiSubscriptions=this.multiSubscriptions.filter(t=>t.onChange!==e)},this.unsync=()=>{this.dbSync&&this.dbSync.unsync&&this.dbSync.unsync()},this.delete=e=>{let t=this.getItems();return t=t.filter(t=>!this.matchesIdObj(e,t)),this.setItems(t),this.onDataChanged(null,null,[e])},this.syncDeleted=async()=>{try{return await Promise.all(this.getDeleted().map(async e=>this.db[this.name].delete(e))),this.setDeleted(null,[]),!0}catch(e){throw e}},this.upsert=async(e,t,n=!1)=>{if(!e)throw"No data provided for upsert";n&&this.getDeleted().length&&await this.syncDeleted();let s=Array.isArray(e)?e:[e],i=Array.isArray(t)?t:[t],r=this.getItems(),a=[],o=[],l=[];s.map((e,t)=>{let s={...e};n||(s[this.synced_field]=Date.now());let c=r.findIndex(e=>!this.id_fields.find(t=>e[t]!==s[t])),d=r[c];d&&d[this.synced_field]<s[this.synced_field]?(r[c]={...s},a.push(s),i&&i[t]?l.push(i[t]):l.push(s)):d||(r.push({...s}),o.push(s),l.push(s))});const c=[...o,...a].map(e=>({...e}));return this.setItems(r),this.onDataChanged(c,l,null,n)},this.onDataChanged=async(e=null,t=null,n=null,s=!1)=>{const i=(e,t)=>{this.isSendingData=this.isSendingData||{},e.map(e=>{let n=JSON.stringify(this.getIdObj(e));this.isSendingData[n]?(this.isSendingData[n].n={...this.isSendingData[n].n,...e},t&&this.isSendingData[n].cbs.push(t)):this.isSendingData[n]={o:this.findOne(this.getIdObj(e)),n:e,cbs:t?[t]:[]}})},r=()=>Object.keys(this.isSendingData).slice(0,20).map(e=>this.isSendingData[e].n),a=(e,t=!1)=>{e.map(e=>{t||(this.isSendingData[JSON.stringify(this.getIdObj(e))].cbs.map(e=>{e()}),delete this.isSendingData[JSON.stringify(this.getIdObj(e))])})},o=async(e=null,t=null,n=null)=>{if(e&&i(e,n),t||this.isSendingData&&Object.keys(this.isSendingData).length){window.onbeforeunload=function(){return"Data may be lost. Are you sure?"};const e=r();try{await this.dbSync.syncData(e,t),a(e),o()}catch(e){console.error(e)}}else window.onbeforeunload=null};return new Promise((i,r)=>{const a=this.getItems();e&&e.length&&(e.map((e,n)=>{let s={};t&&t.length&&(s=t[n]),this.notifySingleSubscriptions(this.getIdObj({...e}),{...e},{...s})}),this.notifyMultiSubscriptions(a,e)),this.onChange&&this.onChange(a,e),!s&&this.dbSync&&this.dbSync.syncData?o(e,n,()=>{i(!0)}):i(!0)})},this.setItems=e=>{this.storageType===i?window.localStorage.setItem(this.name,JSON.stringify(e)):this.storageType===s?this.items=e:console.log("invalid/missing storageType -> "+this.storageType)},this.getItems=e=>{let t=[];if(this.storageType===i){let e=window.localStorage.getItem(this.name);if(e)try{t=JSON.parse(e)}catch(e){console.error(e)}}else this.storageType===s?t=this.items.slice(0):console.log("invalid/missing storageType -> "+this.storageType);if(this.id_fields&&this.synced_field){const e=[this.synced_field,...this.id_fields.sort()];t=t.filter(e=>!this.filter||!Object.keys(this.filter).find(t=>e[t].toString()!==this.filter[t].toString())).sort((t,n)=>e.map(e=>t[e]<n[e]?-1:t[e]>n[e]?1:0).find(e=>e))}return this.items=t,t.map(e=>({...e}))},this.getBatch=e=>{let t=this.getItems();e=e||{};const{from_synced:n,to_synced:s,offset:i=0,limit:r=null}=e;let a=t.map(e=>({...e})).filter(e=>(!n||e[this.synced_field]>=n)&&(!s||e[this.synced_field]<=s));return(i||r)&&(a=a.splice(i,r||a.length)),a},this.name=e,this.filter=t,this.onChange=n,!r)throw"db missing";this.db=r;const{id_fields:l,synced_field:c}=r[this.name]._syncInfo;if(!l||!c)throw"id_fields/synced_field missing";this.id_fields=l,this.synced_field=c,this.pushDebounce=a,this.isSendingData={},this.skipFirstTrigger=o,this.multiSubscriptions=[],this.singleSubscriptions=[];r[this.name]._sync(t,{},{onSyncRequest:e=>{let t={c_lr:null,c_fr:null,c_count:0},n=this.getBatch(e);return n.length&&(t={c_fr:n[0]||null,c_lr:n[n.length-1]||null,c_count:n.length}),t},onPullRequest:async e=>{this.getDeleted().length&&await this.syncDeleted();return this.getBatch(e)},onUpdates:e=>{this.upsert(e,e,!0)}}).then(e=>{this.dbSync=e}),this.onChange&&!this.skipFirstTrigger&&setTimeout(this.onChange,0)}sync(e,t=!1){const n={unsync:()=>{this.unsubscribe(e)},upsert:e=>this.upsert(e,e)},s={onChange:e,handlesOnData:t,handles:n};return this.multiSubscriptions.push(s),this.skipFirstTrigger||e(this.getItems()),Object.freeze({...n})}syncOne(e,t,n=!1){if(!e||!t)throw"syncOne(idObj, onChange) -> MISSING idObj or onChange";const s=()=>this.getIdObj(this.findOne(e)),i={get:()=>this.findOne(e),unsync:()=>{this.unsubscribe(t)},delete:()=>this.delete(s()),update:e=>{this.updateOne(s(),e)},set:t=>{const n={...t,...e};this.upsert(n,n)}},r={onChange:t,idObj:e,handlesOnData:n,handles:i};return this.singleSubscriptions.push(r),Object.freeze({...i})}updateOne(e,t){let n=this.getIdObj(e);return this.upsert({...this.findOne(n),...t,...n},{...t})}findOne(e){this.getItems();let t=-1;return t="function"==typeof e?this.items.findIndex(e):e&&Object.keys(e)||1!==this.items.length?this.items.findIndex(t=>this.matchesIdObj(e,t)):0,this.items[t]}getIdObj(e){let t={};return this.id_fields.sort().map(n=>{t[n]=e[n]}),t}matchesIdObj(e,t){return Object.keys(e).length&&!Object.keys(e).find(n=>t[n]!==e[n])}deleteAll(){this.getItems().map(this.getIdObj).map(this.delete)}setDeleted(e,t){let n=[];t?n=t:(n=this.getDeleted(),n.push(e)),window.localStorage.setItem(this.name+"_$$psql$$_deleted",n)}getDeleted(){const e=window.localStorage.getItem(this.name+"_$$psql$$_deleted")||"[]";return JSON.parse(e)}}}])}));