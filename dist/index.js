!function(e,t){if("object"==typeof exports&&"object"==typeof module)module.exports=t();else if("function"==typeof define&&define.amd)define([],t);else{var n=t();for(var s in n)("object"==typeof exports?exports:e)[s]=n[s]}}(this||window,(function(){return function(e){var t={};function n(s){if(t[s])return t[s].exports;var i=t[s]={i:s,l:!1,exports:{}};return e[s].call(i.exports,i,i.exports,n),i.l=!0,i.exports}return n.m=e,n.c=t,n.d=function(e,t,s){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:s})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var s=Object.create(null);if(n.r(s),Object.defineProperty(s,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var i in e)n.d(s,i,function(t){return e[t]}.bind(null,i));return s},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=1)}([function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.prostgles=void 0,t.prostgles=function(e,t){const{socket:n,onReady:s,onDisconnect:i}=e,r="_psqlWS_.";let a={},o={},l={};function c({tableName:e,command:t,param1:s,param2:i},a){return new Promise((o,l)=>{n.emit(r,{tableName:e,command:t,param1:s,param2:i},(e,t)=>{if(e)console.error(e),l(e);else if(t){const{id_fields:e,synced_field:s,channelName:i}=t;n.emit(i,{onSyncRequest:a({},t)},e=>{console.log(e)}),o({id_fields:e,synced_field:s,channelName:i})}})})}function h({tableName:e,command:t,param1:s,param2:i}){return new Promise((a,o)=>{n.emit(r,{tableName:e,command:t,param1:s,param2:i},(e,t)=>{e?(console.error(e),o(e)):t&&a(t.channelName)})})}async function d({tableName:e,command:t,param1:s,param2:i},r){const{onPullRequest:a,onSyncRequest:o,onUpdates:h}=r;function d(e,t){return Object.freeze({unsync:function(){!function(e,t){new Promise((s,i)=>{l[e]&&(l[e].triggers=l[e].triggers.filter(e=>e.onPullRequest!==t.onPullRequest&&e.onSyncRequest!==t.onSyncRequest&&e.onUpdates!==t.onUpdates),l[e].triggers.length||(n.emit(e+"unsync",{},(e,t)=>{e?i(e):s(t)}),n.removeListener(e,l[e].onCall),delete l[e]))})}(e,r)},syncData:function(s,i,r){n.emit(e,{onSyncRequest:{...o({},t),...{data:s}||{},...{deleted:i}||{}}},r?e=>{r(e)}:null)}})}const u=Object.keys(l).find(n=>{let r=l[n];return r.tableName===e&&r.command===t&&JSON.stringify(r.param1||{})===JSON.stringify(s||{})&&JSON.stringify(r.param2||{})===JSON.stringify(i||{})});if(u)return l[u].triggers.push(r),d(u,l[u].syncInfo);{const a=await c({tableName:e,command:t,param1:s,param2:i},o),{channelName:h,synced_field:u,id_fields:f}=a;function m(e,t){e&&l[h]&&l[h].triggers.map(({onUpdates:n,onSyncRequest:s,onPullRequest:i})=>{e.data&&e.data.length?Promise.resolve(n(e.data,a)).then(()=>{t&&t({ok:!0})}).catch(e=>{t&&t({err:e})}):e.onSyncRequest?Promise.resolve(s(e.onSyncRequest,a)).then(e=>t({onSyncRequest:e})).catch(e=>{t&&t({err:e})}):e.onPullRequest?Promise.resolve(i(e.onPullRequest,a)).then(e=>{t({data:e})}).catch(e=>{t&&t({err:e})}):console.log("unexpected response")})}return l[h]={tableName:e,command:t,param1:s,param2:i,triggers:[r],syncInfo:a,onCall:m},n.on(h,m),d(h,a)}}async function u(e,{tableName:t,command:s,param1:i,param2:r},o){function l(s){let r={unsubscribe:function(){!function(e,t){a[e]&&(a[e].handlers=a[e].handlers.filter(e=>e!==t),a[e].handlers.length||(n.emit(e+"unsubscribe",{},(e,t)=>{}),n.removeListener(e,a[e].onCall),delete a[e]))}(s,o)}};return e[t].update&&(r={...r,update:function(n,s){return e[t].update(i,n,s)}}),e[t].delete&&(r={...r,delete:function(n){return e[t].delete(i,n)}}),Object.freeze(r)}const c=Object.keys(a).find(e=>{let n=a[e];return n.tableName===t&&n.command===s&&JSON.stringify(n.param1||{})===JSON.stringify(i||{})&&JSON.stringify(n.param2||{})===JSON.stringify(r||{})});if(c)return a[c].handlers.push(o),a[c].handlers.includes(o)&&console.warn("Duplicate subscription handler was added for:",a[c]),l(c);{const e=await h({tableName:t,command:s,param1:i,param2:r});let c=function(t,n){a[e].handlers.map(e=>{e(t.data)})};return n.on(e,c),a[e]={tableName:t,command:s,param1:i,param2:r,onCall:c,handlers:[o]},l(e)}}return new Promise((e,m)=>{i&&n.on("disconnect",i),n.on(r+"schema",({schema:i,methods:m,fullSchema:f,auth:g,rawSQL:p,joinTables:y=[],err:b})=>{if(b)throw b;let S=JSON.parse(JSON.stringify(i)),O=JSON.parse(JSON.stringify(m)),j={},_={};g&&(_={...g},["login","logout","register"].map(e=>{g[e]&&(_[e]=function(t){return new Promise((s,i)=>{n.emit(r+e,t,(e,t)=>{e?i(e):s(t)})})})})),O.map(e=>{j[e]=function(...t){return new Promise((s,i)=>{n.emit(r+"method",{method:e,params:t},(e,t)=>{e?i(e):s(t)})})}}),j=Object.freeze(j),p&&(S.sql=function(e,t,s){return new Promise((i,a)=>{n.emit(r+"sql",{query:e,params:t,options:s},(e,t)=>{e?a(e):i(t)})})});const w=["subscribe","subscribeOne"];Object.keys(S).forEach(e=>{Object.keys(S[e]).sort((e,t)=>w.includes(e)-w.includes(t)).forEach(s=>{if(["find","findOne"].includes(s)&&(S[e].getJoinedTables=function(){return(y||[]).filter(t=>Array.isArray(t)&&t.includes(e)).flat().filter(t=>t!==e)}),"sync"===s){if(S[e]._syncInfo={...S[e][s]},t){S[e].getSync=(n,s={})=>new t({name:e,filter:n,db:S,...s});const n=(n={},s={})=>{const i=`${e}.${JSON.stringify(n)}.${JSON.stringify(s)}`;return o[i]||(o[i]=new t({name:e,filter:n,db:S,...s})),o[i]};S[e].sync=(e,t={handlesOnData:!0,select:"*"},s)=>n(e,t).sync(s,t),S[e].syncOne=(e,t={handlesOnData:!0},s)=>n(e,t).syncOne(e,s,t.handlesOnData)}S[e]._sync=function(t,n,i){return d({tableName:e,command:s,param1:t,param2:n},i)}}else w.includes(s)?S[e][s]=function(t,n,i){return u(S,{tableName:e,command:s,param1:t,param2:n},i)}:S[e][s]=function(t,i,a){return new Promise((o,l)=>{n.emit(r,{tableName:e,command:s,param1:t,param2:i,param3:a},(e,t)=>{e?l(e):o(t)})})}})}),a&&Object.keys(a).length&&Object.keys(a).map(async e=>{try{let t=a[e];await h(t),n.on(e,t.onCall)}catch(e){console.error("There was an issue reconnecting olf subscriptions",e)}}),l&&Object.keys(l).length&&Object.keys(l).filter(e=>l[e].triggers&&l[e].triggers.length).map(async e=>{try{let t=l[e];await c(t,t.triggers[0].onSyncRequest),n.on(e,t.onCall)}catch(e){console.error("There was an issue reconnecting olf subscriptions",e)}}),y.flat().map(e=>{function t(t=!0,n,s,i){return{[t?"$leftJoin":"$innerJoin"]:e,filter:n,select:s,...i}}S.innerJoin=S.innerJoin||{},S.leftJoin=S.leftJoin||{},S.innerJoinOne=S.innerJoinOne||{},S.leftJoinOne=S.leftJoinOne||{},S.leftJoin[e]=(e,n,s={})=>t(!0,e,n,s),S.innerJoin[e]=(e,n,s={})=>t(!1,e,n,s),S.leftJoinOne[e]=(e,n,s={})=>t(!0,e,n,{...s,limit:1}),S.innerJoinOne[e]=(e,n,s={})=>t(!1,e,n,{...s,limit:1})});try{s(S,j,f,_)}catch(b){console.error("Prostgles: Error within onReady: \n",b)}e(S)})})}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.prostgles=void 0;const s=n(0),i=n(2);t.prostgles=function(e){return s.prostgles(e,i.SyncedTable)}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.SyncedTable=void 0;const s={array:"array",localStorage:"localStorage",object:"object"};function i(e){for(var t in e)return!1;return!0}t.SyncedTable=class{constructor({name:e,filter:t,onChange:n,db:r,skipFirstTrigger:a=!1,select:o="*",storageType:l=s.object}){if(this.throttle=100,this.batch_size=50,this.skipFirstTrigger=!1,this.items=[],this.itemsObj={},this.notifyMultiSubscriptions=e=>{this.multiSubscriptions.map(t=>{let n=this.getItems();t.handlesOnData&&t.handles&&(n=n.map(e=>({...e,$update:t=>this.updateOne({...e},t),$delete:async()=>{try{const t=this.getIdObj({...e});return await this.db[this.name].delete(t),this.delete(t)}catch(e){return Promise.reject(e)}}}))),t.onChange(n,e)})},this.notifySingleSubscriptions=(e,t,n)=>{this.singleSubscriptions.filter(t=>this.matchesIdObj(t.idObj,e)&&Object.keys(t.idObj).length<=Object.keys(e).length).map(e=>{let s={...t};e.handlesOnData&&e.handles&&(s.$update=e.handles.update,s.$delete=e.handles.delete,s.$unsync=e.handles.unsync),e.onChange(s,n)})},this.unsubscribe=e=>{this.singleSubscriptions=this.singleSubscriptions.filter(t=>t.onChange!==e),this.multiSubscriptions=this.multiSubscriptions.filter(t=>t.onChange!==e)},this.unsync=()=>{this.dbSync&&this.dbSync.unsync&&this.dbSync.unsync()},this.syncDeleted=async()=>{try{return await Promise.all(this.getDeleted().map(async e=>this.db[this.name].delete(e))),this.setDeleted(null,[]),!0}catch(e){throw e}},this.delete=e=>(this.setItem(e,null,!0,!0),this.onDataChanged(null,null,[e])),this.upsert=async(e,t,n=!1)=>{if(!e)throw"No data provided for upsert";n&&this.getDeleted().length&&await this.syncDeleted();let s=Array.isArray(e)?e:[e],i=Array.isArray(t)?t:[t],r=[];s.map((e,t)=>{let s={...e};n||(s[this.synced_field]=Date.now());let a=this.getItem(s),o=a.index,l=a.data;l&&l[this.synced_field]<s[this.synced_field]?i&&i[t]?r.push(i[t]):r.push(this.getDelta(l,s)):l||r.push(s),this.setItem(s,o)});const a=s.map(e=>({...e}));return this.onDataChanged(a,r,null,n)},this.isSendingTimeout=null,this.isSending=!1,this.onDataChanged=async(e=null,t=null,n=null,s=!1)=>{const r=e=>{this.isSendingData=this.isSendingData||{},e.map(e=>{let t=this.getIdStr(e);this.isSendingData[t]?this.isSendingData[t].n={...this.isSendingData[t].n,...e}:this.isSendingData[t]={o:this.getItem(e).data,n:e,sending:!1}})},a=()=>Object.keys(this.isSendingData).filter(e=>!this.isSendingData[e].sending).slice(0,this.batch_size).map(e=>(this.isSendingData[e].sending=!0,this.isSendingData[e].n)),o=(e,t=!1)=>{e.map(e=>{const n=this.getIdStr(e);t||(this.isSendingData[n]?delete this.isSendingData[n]:console.warn("isSendingData missing -> Concurrency bug"))})},l=async(e=null,t=null)=>{if(this.isSendingTimeout){if(this.isSending)return}else this.isSendingTimeout=setTimeout(()=>{this.isSendingTimeout=null,i(this.isSendingData)||l()},this.throttle);if(this.isSending=!0,e&&r(e),t||!i(this.isSendingData)){window.onbeforeunload=function(){return"Data may be lost. Are you sure?"};const e=a();try{await this.dbSync.syncData(e,t),o(e),this.isSending=!1,l()}catch(e){this.isSending=!1,console.error(e)}}else window.onbeforeunload=null};return new Promise((i,r)=>{const a=this.getItems();e&&e.length&&e.map((e,n)=>{let s={};t&&t.length&&(s=t[n]),this.notifySingleSubscriptions(this.getIdObj({...e}),{...e},{...s})}),this.notifyMultiSubscriptions(e),this.onChange&&this.onChange(a,e),!s&&this.dbSync&&this.dbSync.syncData&&l(e,n),i(!0)})},this.setItems=e=>{this.storageType===s.localStorage?window.localStorage.setItem(this.name,JSON.stringify(e)):this.storageType===s.array?this.items=e:this.itemsObj=e.reduce((e,t)=>({...e,[this.getIdStr(t)]:t}),{})},this.getItems=()=>{let e=[];if(this.storageType===s.localStorage){let t=window.localStorage.getItem(this.name);if(t)try{e=JSON.parse(t)}catch(e){console.error(e)}}else e=this.storageType===s.array?this.items.slice(0):Object.values(this.itemsObj);if(this.id_fields&&this.synced_field){const t=[this.synced_field,...this.id_fields.sort()];e=e.filter(e=>!this.filter||!Object.keys(this.filter).find(t=>e[t].toString()!==this.filter[t].toString())).sort((e,n)=>t.map(t=>e[t]<n[t]?-1:e[t]>n[t]?1:0).find(e=>e))}return this.items=e.filter(e=>i(this.filter)||this.matchesFilter(e)),e.map(e=>({...e}))},this.getBatch=({from_synced:e,to_synced:t,offset:n,limit:s}={offset:0,limit:null})=>{let i=this.getItems().map(e=>({...e})).filter(n=>(!e||n[this.synced_field]>=e)&&(!t||n[this.synced_field]<=t));return(n||s)&&(i=i.splice(n,s||i.length)),i},this.name=e,this.filter=t,this.select=o,this.onChange=n,!s[l])throw"Invalid storage type. Expecting one of: "+Object.keys(s).join(", ");if(this.storageType=l,!r)throw"db missing";this.db=r;const{id_fields:c,synced_field:h,throttle:d=100,batch_size:u=50}=r[this.name]._syncInfo;if(!c||!h)throw"id_fields/synced_field missing";this.id_fields=c,this.synced_field=h,this.batch_size=u,this.throttle=d,this.isSendingData={},this.skipFirstTrigger=a,this.multiSubscriptions=[],this.singleSubscriptions=[];r[this.name]._sync(t,{select:o},{onSyncRequest:e=>{let t={c_lr:null,c_fr:null,c_count:0},n=this.getBatch(e);return n.length&&(t={c_fr:n[0]||null,c_lr:n[n.length-1]||null,c_count:n.length}),t},onPullRequest:async e=>{this.getDeleted().length&&await this.syncDeleted();return this.getBatch(e)},onUpdates:e=>{this.upsert(e,null,!0)}}).then(e=>{this.dbSync=e}),this.onChange&&!this.skipFirstTrigger&&setTimeout(this.onChange,0)}sync(e,t=!1){const n={unsync:()=>{this.unsubscribe(e)},upsert:e=>{if(e){const t=e=>{this.updateOne(e,e)};Array.isArray(e)?e.map(e=>t(e)):t(e)}}},s={onChange:e,handlesOnData:t,handles:n};if(this.multiSubscriptions.push(s),!this.skipFirstTrigger){let t=this.getItems();e(t,t)}return Object.freeze({...n})}syncOne(e,t,n=!1){if(!e||!t)throw"syncOne(idObj, onChange) -> MISSING idObj or onChange";const s={get:()=>this.getItem(e).data,unsync:()=>{this.unsubscribe(t)},delete:()=>this.delete(e),update:t=>{this.updateOne(e,t)},set:t=>{const n={...t,...e};this.upsert(n,n)}},i={onChange:t,idObj:e,handlesOnData:n,handles:s};return this.singleSubscriptions.push(i),Object.freeze({...s})}updateOne(e,t){let n=this.getIdObj(e);return this.upsert({...this.getItem(e).data,...t,...n},{...t})}getIdStr(e){return this.id_fields.sort().map(t=>""+(e[t]||"")).join(".")}getIdObj(e){let t={};return this.id_fields.sort().map(n=>{t[n]=e[n]}),t}matchesFilter(e){return Boolean(e&&!Object.keys(this.filter).find(t=>this.filter[t]!==e[t]))}matchesIdObj(e,t){return Boolean(e&&t&&!this.id_fields.sort().find(n=>e[n]!==t[n]))}setDeleted(e,t){let n=[];t?n=t:(n=this.getDeleted(),n.push(e)),window.localStorage.setItem(this.name+"_$$psql$$_deleted",n)}getDeleted(){const e=window.localStorage.getItem(this.name+"_$$psql$$_deleted")||"[]";return JSON.parse(e)}getDelta(e,t){return e?Object.keys(e).filter(e=>!this.id_fields.includes(e)).reduce((n,s)=>{let i={};return s in t&&t[s]!==e[s]&&(i={[s]:t[s]}),{...n,...i}},{}):{...t}}deleteAll(){this.getItems().map(this.getIdObj).map(this.delete)}getItem(e){let t;if(this.storageType===s.localStorage){t=this.getItems().find(t=>this.matchesIdObj(t,e))}else this.storageType===s.array?t=this.items.find(t=>this.matchesIdObj(t,e)):(this.itemsObj=this.itemsObj||{},t=this.itemsObj[this.getIdStr(e)]);return{data:t?{...t}:t,index:-1}}setItem(e,t,n=!1,i=!1){if(this.storageType===s.localStorage){let s=this.getItems();if(i)s=s.filter(t=>!this.matchesIdObj(t,e));else{let i=t;s[i]?s[i]=n?{...e}:{...s[i],...e}:s.push(e)}window.localStorage.setItem(this.name,JSON.stringify(s))}else if(this.storageType===s.array)i?this.items=this.items.filter(t=>!this.matchesIdObj(t,e)):this.items[t]?this.items[t]=n?{...e}:{...this.items[t],...e}:this.items.push(e);else if(this.itemsObj=this.itemsObj||{},i)delete this.itemsObj[this.getIdStr(e)];else{let t=this.itemsObj[this.getIdStr(e)]||{};this.itemsObj[this.getIdStr(e)]=n?{...e}:{...t,...e}}}}}])}));