!function(e,t){if("object"==typeof exports&&"object"==typeof module)module.exports=t();else if("function"==typeof define&&define.amd)define([],t);else{var s=t();for(var n in s)("object"==typeof exports?exports:e)[n]=s[n]}}(this||window,(function(){return function(e){var t={};function s(n){if(t[n])return t[n].exports;var i=t[n]={i:n,l:!1,exports:{}};return e[n].call(i.exports,i,i.exports,s),i.l=!0,i.exports}return s.m=e,s.c=t,s.d=function(e,t,n){s.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},s.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},s.t=function(e,t){if(1&t&&(e=s(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(s.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var i in e)s.d(n,i,function(t){return e[t]}.bind(null,i));return n},s.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return s.d(t,"a",t),t},s.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},s.p="",s(s.s=1)}([function(e,t,s){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.prostgles=void 0,t.prostgles=function(e,t){const{socket:s,onReady:n,onDisconnect:i,onReconnect:r}=e,a="_psqlWS_.";let o={},l={},c={},h=!1;function d(e,t){o[e]&&(o[e].handlers=o[e].handlers.filter(e=>e!==t),o[e].handlers.length||(s.emit(e+"unsubscribe",{},(e,t)=>{}),s.removeListener(e,o[e].onCall),delete o[e]))}function u({tableName:e,command:t,param1:n,param2:i},r){return new Promise((o,l)=>{s.emit(a,{tableName:e,command:t,param1:n,param2:i},(e,t)=>{if(e)console.error(e),l(e);else if(t){const{id_fields:e,synced_field:n,channelName:i}=t;s.emit(i,{onSyncRequest:r({},t)},e=>{console.log(e)}),o({id_fields:e,synced_field:n,channelName:i})}})})}function m({tableName:e,command:t,param1:n,param2:i}){return new Promise((r,o)=>{s.emit(a,{tableName:e,command:t,param1:n,param2:i},(e,t)=>{e?(console.error(e),o(e)):t&&r(t.channelName)})})}async function f({tableName:e,command:t,param1:n,param2:i},r){const{onPullRequest:a,onSyncRequest:o,onUpdates:l}=r;function h(e,t){return Object.freeze({unsync:function(){!function(e,t){new Promise((n,i)=>{c[e]&&(c[e].triggers=c[e].triggers.filter(e=>e.onPullRequest!==t.onPullRequest&&e.onSyncRequest!==t.onSyncRequest&&e.onUpdates!==t.onUpdates),c[e].triggers.length||(s.emit(e+"unsync",{},(e,t)=>{e?i(e):n(t)}),s.removeListener(e,c[e].onCall),delete c[e]))})}(e,r)},syncData:function(n,i,r){s.emit(e,{onSyncRequest:{...o({},t),...{data:n}||{},...{deleted:i}||{}}},r?e=>{r(e)}:null)}})}const d=Object.keys(c).find(s=>{let r=c[s];return r.tableName===e&&r.command===t&&JSON.stringify(r.param1||{})===JSON.stringify(n||{})&&JSON.stringify(r.param2||{})===JSON.stringify(i||{})});if(d)return c[d].triggers.push(r),h(d,c[d].syncInfo);{const a=await u({tableName:e,command:t,param1:n,param2:i},o),{channelName:l,synced_field:d,id_fields:f}=a;function m(e,t){e&&c[l]&&c[l].triggers.map(({onUpdates:s,onSyncRequest:n,onPullRequest:i})=>{e.data&&e.data.length?Promise.resolve(s(e.data,a)).then(()=>{t&&t({ok:!0})}).catch(e=>{t&&t({err:e})}):e.onSyncRequest?Promise.resolve(n(e.onSyncRequest,a)).then(e=>t({onSyncRequest:e})).catch(e=>{t&&t({err:e})}):e.onPullRequest?Promise.resolve(i(e.onPullRequest,a)).then(e=>{t({data:e})}).catch(e=>{t&&t({err:e})}):console.log("unexpected response")})}return c[l]={tableName:e,command:t,param1:n,param2:i,triggers:[r],syncInfo:a,onCall:m},s.on(l,m),h(l,a)}}return new Promise((e,p)=>{i&&s.on("disconnect",i),s.on(a+"schema",({schema:i,methods:p,fullSchema:g,auth:y,rawSQL:b,joinTables:O=[],err:S})=>{if(S)throw S;Object.values(o).map(e=>e.destroy()),o={},c={},Object.values(l).map(e=>{e&&e.destroy&&e.destroy()}),l={},h&&r&&r(s),h=!0;let j=JSON.parse(JSON.stringify(i)),w=JSON.parse(JSON.stringify(p)),_={},I={};y&&(I={...y},["login","logout","register"].map(e=>{y[e]&&(I[e]=function(t){return new Promise((n,i)=>{s.emit(a+e,t,(e,t)=>{e?i(e):n(t)})})})})),w.map(e=>{_[e]=function(...t){return new Promise((n,i)=>{s.emit(a+"method",{method:e,params:t},(e,t)=>{e?i(e):n(t)})})}}),_=Object.freeze(_),b&&(j.sql=function(e,t,n){return new Promise((i,r)=>{s.emit(a+"sql",{query:e,params:t,options:n},(e,t)=>{e?r(e):i(t)})})});const N=["subscribe","subscribeOne"];Object.keys(j).forEach(e=>{Object.keys(j[e]).sort((e,t)=>N.includes(e)-N.includes(t)).forEach(n=>{if(["find","findOne"].includes(n)&&(j[e].getJoinedTables=function(){return(O||[]).filter(t=>Array.isArray(t)&&t.includes(e)).flat().filter(t=>t!==e)}),"sync"===n){if(j[e]._syncInfo={...j[e][n]},t){j[e].getSync=(s,n={})=>new t({name:e,filter:s,db:j,...n});const s=(s={},n={})=>{const i=`${e}.${JSON.stringify(s)}.${JSON.stringify(n)}`;return l[i]||(l[i]=new t({name:e,filter:s,db:j,...n})),l[i]};j[e].sync=(e,t={handlesOnData:!0,select:"*"},n)=>s(e,t).sync(n,t),j[e].syncOne=(e,t={handlesOnData:!0},n)=>s(e,t).syncOne(e,n,t.handlesOnData)}j[e]._sync=function(t,s,i){return f({tableName:e,command:n,param1:t,param2:s},i)}}else N.includes(n)?j[e][n]=function(t,i,r){return async function(e,{tableName:t,command:n,param1:i,param2:r},a){function l(s){let n={unsubscribe:function(){d(s,a)}};return e[t].update&&(n={...n,update:function(s,n){return e[t].update(i,s,n)}}),e[t].delete&&(n={...n,delete:function(s){return e[t].delete(i,s)}}),Object.freeze(n)}const c=Object.keys(o).find(e=>{let s=o[e];return s.tableName===t&&s.command===n&&JSON.stringify(s.param1||{})===JSON.stringify(i||{})&&JSON.stringify(s.param2||{})===JSON.stringify(r||{})});if(c)return o[c].handlers.push(a),o[c].handlers.includes(a)&&console.warn("Duplicate subscription handler was added for:",o[c]),l(c);{const e=await m({tableName:t,command:n,param1:i,param2:r});let c=function(t,s){o[e].handlers.map(e=>{e(t.data)})};return s.on(e,c),o[e]={tableName:t,command:n,param1:i,param2:r,onCall:c,handlers:[a],destroy:()=>{o[e]&&(Object.values(o[e]).map(t=>{t.handlers.map(t=>d(e,t))}),delete o[e])}},l(e)}}(j,{tableName:e,command:n,param1:t,param2:i},r)}:j[e][n]=function(t,i,r){return new Promise((o,l)=>{s.emit(a,{tableName:e,command:n,param1:t,param2:i,param3:r},(e,t)=>{e?l(e):o(t)})})}})}),o&&Object.keys(o).length&&Object.keys(o).map(async e=>{try{let t=o[e];await m(t),s.on(e,t.onCall)}catch(e){console.error("There was an issue reconnecting olf subscriptions",e)}}),c&&Object.keys(c).length&&Object.keys(c).filter(e=>c[e].triggers&&c[e].triggers.length).map(async e=>{try{let t=c[e];await u(t,t.triggers[0].onSyncRequest),s.on(e,t.onCall)}catch(e){console.error("There was an issue reconnecting olf subscriptions",e)}}),O.flat().map(e=>{function t(t=!0,s,n,i){return{[t?"$leftJoin":"$innerJoin"]:e,filter:s,select:n,...i}}j.innerJoin=j.innerJoin||{},j.leftJoin=j.leftJoin||{},j.innerJoinOne=j.innerJoinOne||{},j.leftJoinOne=j.leftJoinOne||{},j.leftJoin[e]=(e,s,n={})=>t(!0,e,s,n),j.innerJoin[e]=(e,s,n={})=>t(!1,e,s,n),j.leftJoinOne[e]=(e,s,n={})=>t(!0,e,s,{...n,limit:1}),j.innerJoinOne[e]=(e,s,n={})=>t(!1,e,s,{...n,limit:1})});try{n(j,_,g,I)}catch(S){console.error("Prostgles: Error within onReady: \n",S)}e(j)})})}},function(e,t,s){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.prostgles=void 0;const n=s(0),i=s(2);t.prostgles=function(e){return n.prostgles(e,i.SyncedTable)}},function(e,t,s){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.SyncedTable=void 0;const n={array:"array",localStorage:"localStorage",object:"object"};function i(e){for(var t in e)return!1;return!0}t.SyncedTable=class{constructor({name:e,filter:t,onChange:s,db:r,skipFirstTrigger:a=!1,select:o="*",storageType:l=n.object}){if(this.throttle=100,this.batch_size=50,this.skipFirstTrigger=!1,this.wal={changed:{},sending:{}},this.items=[],this.itemsObj={},this.notifySubscribers=e=>{let t=[],s=[],n=[];e.map(({idObj:e,newItem:i,delta:r})=>{this.singleSubscriptions.filter(t=>this.matchesIdObj(t.idObj,e)).map(e=>{let t={...i};e.handlesOnData&&e.handles&&(t.$update=e.handles.update,t.$delete=e.handles.delete,t.$unsync=e.handles.unsync),e.onChange(t,r)}),this.matchesFilter(i)&&(t.push(i),s.push(r),n.push(e))}),this.onChange&&this.onChange(t,s),this.multiSubscriptions.map(e=>{e.handlesOnData&&e.handles&&(t=t.map((e,t)=>{const s=n[t];return{...e,$update:e=>this.upsert([{idObj:s,delta:e}]).then(e=>!0),$delete:async()=>this.delete(s)}})),e.onChange(t,s)})},this.unsubscribe=e=>{this.singleSubscriptions=this.singleSubscriptions.filter(t=>t.onChange!==e),this.multiSubscriptions=this.multiSubscriptions.filter(t=>t.onChange!==e)},this.unsync=()=>{this.dbSync&&this.dbSync.unsync&&this.dbSync.unsync()},this.destroy=()=>{this.unsync(),this.multiSubscriptions=[],this.singleSubscriptions=[],this.itemsObj={},this.items=[],this.onChange=null},this.delete=async e=>{const t=this.getIdObj(e);return await this.db[this.name].delete(t),this.setItem(t,null,!0,!0),this.notifySubscribers(),!0},this.upsert=async(e,t=!1)=>{if(!e||!e.length)throw"No data provided for upsert";let s,n=[];e.map((e,r)=>{let a={...e.idObj},o={...e.delta},l=this.getItem(a),c=l.index,h=l.data;!t&&!i(o)||i(h)||(o=this.getDelta(h||{},o)),t||(o[this.synced_field]=Date.now());let d={...h,...o,...a};h&&h[this.synced_field]<d[this.synced_field]?s="updated":h||(s="inserted"),this.setItem(d,c);let u={idObj:a,delta:o,oldItem:h,newItem:d,status:s,from_server:t};t||(this.wal.changed[a]?this.wal.changed[a]={...u,oldItem:this.wal.changed[a].oldItem}:this.wal.changed[a]=u),n.push(u)}),this.notifySubscribers(n)},this.pushDataToServer=async()=>{if(this.isSendingTimeout||this.wal.sending&&!i(this.wal.sending))return;if(!this.wal.changed||i(this.wal.changed))return;let e=[];Object.keys(this.wal.changed).slice(0,this.batch_size).map(t=>{let s={...this.wal.changed[t]};this.wal.sending[t]=s,e.push({...s.delta,...s.idObj}),delete this.wal.changed[t]}),this.isSendingTimeout=setTimeout(()=>{this.isSendingTimeout=null,i(this.wal.changed)||this.pushDataToServer()},this.throttle),window.onbeforeunload=function(){return"Data may be lost. Are you sure?"};try{await this.dbSync.syncData(e),i(this.wal.changed)?window.onbeforeunload=null:this.pushDataToServer()}catch(e){console.error(e)}},this.isSendingTimeout=null,this.isSending=!1,this.setItems=e=>{this.storageType===n.localStorage?window.localStorage.setItem(this.name,JSON.stringify(e)):this.storageType===n.array?this.items=e:this.itemsObj=e.reduce((e,t)=>({...e,[this.getIdStr(t)]:t}),{})},this.getItems=()=>{let e=[];if(this.storageType===n.localStorage){let t=window.localStorage.getItem(this.name);if(t)try{e=JSON.parse(t)}catch(e){console.error(e)}}else e=this.storageType===n.array?this.items.slice(0):Object.values(this.itemsObj);if(!this.id_fields||!this.synced_field)throw"id_fields AND/OR synced_field missing";{const t=[this.synced_field,...this.id_fields.sort()];e=e.filter(e=>!this.filter||!Object.keys(this.filter).find(t=>e[t]!==this.filter[t])).sort((e,s)=>t.map(t=>e[t]<s[t]?-1:e[t]>s[t]?1:0).find(e=>e))}return this.items=e.filter(e=>i(this.filter)||this.matchesFilter(e)),e.map(e=>({...e}))},this.getBatch=({from_synced:e,to_synced:t,offset:s,limit:n}={offset:0,limit:null})=>{let i=this.getItems().map(e=>({...e})).filter(s=>(!e||s[this.synced_field]>=e)&&(!t||s[this.synced_field]<=t));return(s||n)&&(i=i.splice(s,n||i.length)),i},this.name=e,this.filter=t,this.select=o,this.onChange=s,!n[l])throw"Invalid storage type. Expecting one of: "+Object.keys(n).join(", ");if(this.storageType=l,!r)throw"db missing";this.db=r;const{id_fields:c,synced_field:h,throttle:d=100,batch_size:u=50}=r[this.name]._syncInfo;if(!c||!h)throw"id_fields/synced_field missing";this.id_fields=c,this.synced_field=h,this.batch_size=u,this.throttle=d,this.skipFirstTrigger=a,this.multiSubscriptions=[],this.singleSubscriptions=[];r[this.name]._sync(t,{select:o},{onSyncRequest:e=>{let t={c_lr:null,c_fr:null,c_count:0},s=this.getBatch(e);return s.length&&(t={c_fr:s[0]||null,c_lr:s[s.length-1]||null,c_count:s.length}),t},onPullRequest:async e=>this.getBatch(e),onUpdates:e=>{let t=e.map(e=>({idObj:this.getIdObj(e),delta:e}));this.upsert(t,!0)}}).then(e=>{this.dbSync=e}),this.onChange&&!this.skipFirstTrigger&&setTimeout(this.onChange,0)}sync(e,t=!1){const s={unsync:()=>{this.unsubscribe(e)},upsert:e=>{if(e){const t=e=>({idObj:this.getIdObj(e),delta:e});Array.isArray(e)?this.upsert(e.map(e=>t(e))):this.upsert([t(e)])}}},n={onChange:e,handlesOnData:t,handles:s};if(this.multiSubscriptions.push(n),!this.skipFirstTrigger){let t=this.getItems();e(t,t)}return Object.freeze({...s})}syncOne(e,t,s=!1){if(!e||!t)throw"syncOne(idObj, onChange) -> MISSING idObj or onChange";const n={get:()=>this.getItem(e).data,unsync:()=>{this.unsubscribe(t)},delete:()=>this.delete(e),update:t=>{this.upsert([{idObj:e,delta:t}])}},i={onChange:t,idObj:e,handlesOnData:s,handles:n};return this.singleSubscriptions.push(i),Object.freeze({...n})}getIdStr(e){return this.id_fields.sort().map(t=>""+(e[t]||"")).join(".")}getIdObj(e){let t={};return this.id_fields.sort().map(s=>{t[s]=e[s]}),t}matchesFilter(e){return Boolean(e&&(!this.filter||i(this.filter)||!Object.keys(this.filter).find(t=>this.filter[t]!==e[t])))}matchesIdObj(e,t){return Boolean(e&&t&&!this.id_fields.sort().find(s=>e[s]!==t[s]))}getDelta(e,t){return e?Object.keys(e).filter(e=>!this.id_fields.includes(e)).reduce((s,n)=>{let i={};return n in t&&t[n]!==e[n]&&(i={[n]:t[n]}),{...s,...i}},{}):{...t}}deleteAll(){this.getItems().map(this.delete)}getItem(e){let t;if(this.storageType===n.localStorage){t=this.getItems().find(t=>this.matchesIdObj(t,e))}else this.storageType===n.array?t=this.items.find(t=>this.matchesIdObj(t,e)):(this.itemsObj=this.itemsObj||{},t=this.itemsObj[this.getIdStr(e)]);return{data:t?{...t}:t,index:-1}}setItem(e,t,s=!1,i=!1){if(this.storageType===n.localStorage){let n=this.getItems();if(i)n=n.filter(t=>!this.matchesIdObj(t,e));else{let i=t;n[i]?n[i]=s?{...e}:{...n[i],...e}:n.push(e)}window.localStorage.setItem(this.name,JSON.stringify(n))}else if(this.storageType===n.array)i?this.items=this.items.filter(t=>!this.matchesIdObj(t,e)):this.items[t]?this.items[t]=s?{...e}:{...this.items[t],...e}:this.items.push(e);else if(this.itemsObj=this.itemsObj||{},i)delete this.itemsObj[this.getIdStr(e)];else{let t=this.itemsObj[this.getIdStr(e)]||{};this.itemsObj[this.getIdStr(e)]=s?{...e}:{...t,...e}}}}}])}));