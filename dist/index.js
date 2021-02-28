!function(e,t){if("object"==typeof exports&&"object"==typeof module)module.exports=t();else if("function"==typeof define&&define.amd)define([],t);else{var n=t();for(var i in n)("object"==typeof exports?exports:e)[i]=n[i]}}(this||window,(function(){return function(e){var t={};function n(i){if(t[i])return t[i].exports;var s=t[i]={i:i,l:!1,exports:{}};return e[i].call(s.exports,s,s.exports,n),s.l=!0,s.exports}return n.m=e,n.c=t,n.d=function(e,t,i){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:i})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var i=Object.create(null);if(n.r(i),Object.defineProperty(i,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var s in e)n.d(i,s,function(t){return e[t]}.bind(null,s));return i},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=1)}([function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.prostgles=void 0,t.prostgles=function(e,t){const{socket:n,onReady:i,onDisconnect:s,onReconnect:r}=e,o="_psqlWS_.";let a={},c={},l={},h=!1;function d(e,t){a[e]&&(a[e].handlers=a[e].handlers.filter(e=>e!==t),a[e].handlers.length||(n.emit(e+"unsubscribe",{},(e,t)=>{}),n.removeListener(e,a[e].onCall),delete a[e]))}function u({tableName:e,command:t,param1:i,param2:s},r){return new Promise((a,c)=>{n.emit(o,{tableName:e,command:t,param1:i,param2:s},(e,t)=>{if(e)console.error(e),c(e);else if(t){const{id_fields:e,synced_field:i,channelName:s}=t;n.emit(s,{onSyncRequest:r({},t)},e=>{console.log(e)}),a({id_fields:e,synced_field:i,channelName:s})}})})}function f({tableName:e,command:t,param1:i,param2:s}){return new Promise((r,a)=>{n.emit(o,{tableName:e,command:t,param1:i,param2:s},(e,t)=>{e?(console.error(e),a(e)):t&&r(t.channelName)})})}async function m({tableName:e,command:t,param1:i,param2:s},r){const{onPullRequest:o,onSyncRequest:a,onUpdates:c}=r;function h(e,t){return Object.freeze({unsync:function(){!function(e,t){new Promise((i,s)=>{l[e]&&(l[e].triggers=l[e].triggers.filter(e=>e.onPullRequest!==t.onPullRequest&&e.onSyncRequest!==t.onSyncRequest&&e.onUpdates!==t.onUpdates),l[e].triggers.length||(n.emit(e+"unsync",{},(e,t)=>{e?s(e):i(t)}),n.removeListener(e,l[e].onCall),delete l[e]))})}(e,r)},syncData:function(i,s,r){n.emit(e,{onSyncRequest:{...a({},t),...{data:i}||{},...{deleted:s}||{}}},r?e=>{r(e)}:null)}})}const d=Object.keys(l).find(n=>{let r=l[n];return r.tableName===e&&r.command===t&&JSON.stringify(r.param1||{})===JSON.stringify(i||{})&&JSON.stringify(r.param2||{})===JSON.stringify(s||{})});if(d)return l[d].triggers.push(r),h(d,l[d].syncInfo);{const o=await u({tableName:e,command:t,param1:i,param2:s},a),{channelName:c,synced_field:d,id_fields:m}=o;function f(e,t){e&&l[c]&&l[c].triggers.map(({onUpdates:n,onSyncRequest:i,onPullRequest:s})=>{e.data?Promise.resolve(n(e,o)).then(()=>{t&&t({ok:!0})}).catch(e=>{t&&t({err:e})}):e.onSyncRequest?Promise.resolve(i(e.onSyncRequest,o)).then(e=>t({onSyncRequest:e})).catch(e=>{t&&t({err:e})}):e.onPullRequest?Promise.resolve(s(e.onPullRequest,o)).then(e=>{t({data:e})}).catch(e=>{t&&t({err:e})}):console.log("unexpected response")})}return l[c]={tableName:e,command:t,param1:i,param2:s,triggers:[r],syncInfo:o,onCall:f},n.on(c,f),h(c,o)}}return new Promise((e,p)=>{s&&n.on("disconnect",s),n.on(o+"schema",({schema:s,methods:p,fullSchema:g,auth:y,rawSQL:b,joinTables:O=[],err:S})=>{if(S)throw S;Object.values(a).map(e=>e.destroy()),a={},l={},Object.values(c).map(e=>{e&&e.destroy&&e.destroy()}),c={},h&&r&&r(n),h=!0;let j=JSON.parse(JSON.stringify(s)),_=JSON.parse(JSON.stringify(p)),w={},I={};y&&(I={...y},["login","logout","register"].map(e=>{y[e]&&(I[e]=function(t){return new Promise((i,s)=>{n.emit(o+e,t,(e,t)=>{e?s(e):i(t)})})})})),_.map(e=>{w[e]=function(...t){return new Promise((i,s)=>{n.emit(o+"method",{method:e,params:t},(e,t)=>{e?s(e):i(t)})})}}),w=Object.freeze(w),b&&(j.sql=function(e,t,i){return new Promise((s,r)=>{n.emit(o+"sql",{query:e,params:t,options:i},(e,t)=>{e?r(e):s(t)})})});const N=e=>"[object Object]"===Object.prototype.toString.call(e),v=(e,t,n)=>{if(!N(e)||!N(t)||"function"!=typeof n)throw"Expecting: ( basicFilter<object>, options<object>, onChange<function> ) but got something else"},T=["subscribe","subscribeOne"];Object.keys(j).forEach(e=>{Object.keys(j[e]).sort((e,t)=>T.includes(e)-T.includes(t)).forEach(i=>{if(["find","findOne"].includes(i)&&(j[e].getJoinedTables=function(){return(O||[]).filter(t=>Array.isArray(t)&&t.includes(e)).flat().filter(t=>t!==e)}),"sync"===i){if(j[e]._syncInfo={...j[e][i]},t){j[e].getSync=(n,i={})=>t.create({name:e,filter:n,db:j,...i});const n=async(n={},i={})=>{const s=`${e}.${JSON.stringify(n)}.${JSON.stringify(i)}`;return c[s]||(c[s]=await t.create({...i,name:e,filter:n,db:j})),c[s]};j[e].sync=async(e,t,i)=>{v(e,t,i);const s=await n(e,t);return await s.sync(i,t)},j[e].syncOne=async(e,t,i)=>{v(e,t,i);const s=await n(e,t);return await s.syncOne(e,i,t.handlesOnData)}}j[e]._sync=function(t,n,s){return m({tableName:e,command:i,param1:t,param2:n},s)}}else T.includes(i)?j[e][i]=function(t,s,r){return v(t,s,r),async function(e,{tableName:t,command:i,param1:s,param2:r},o){function c(n){let i={unsubscribe:function(){d(n,o)}};return e[t].update&&(i={...i,update:function(n,i){return e[t].update(s,n,i)}}),e[t].delete&&(i={...i,delete:function(n){return e[t].delete(s,n)}}),Object.freeze(i)}const l=Object.keys(a).find(e=>{let n=a[e];return n.tableName===t&&n.command===i&&JSON.stringify(n.param1||{})===JSON.stringify(s||{})&&JSON.stringify(n.param2||{})===JSON.stringify(r||{})});if(l)return a[l].handlers.push(o),a[l].handlers.includes(o)&&console.warn("Duplicate subscription handler was added for:",a[l]),c(l);{const e=await f({tableName:t,command:i,param1:s,param2:r});let l=function(t,n){a[e].handlers.map(e=>{e(t.data)})};return n.on(e,l),a[e]={tableName:t,command:i,param1:s,param2:r,onCall:l,handlers:[o],destroy:()=>{a[e]&&(Object.values(a[e]).map(t=>{t&&t.handlers&&t.handlers.map(t=>d(e,t))}),delete a[e])}},c(e)}}(j,{tableName:e,command:i,param1:t,param2:s},r)}:j[e][i]=function(t,s,r){return new Promise((a,c)=>{n.emit(o,{tableName:e,command:i,param1:t,param2:s,param3:r},(e,t)=>{e?c(e):a(t)})})}})}),a&&Object.keys(a).length&&Object.keys(a).map(async e=>{try{let t=a[e];await f(t),n.on(e,t.onCall)}catch(e){console.error("There was an issue reconnecting olf subscriptions",e)}}),l&&Object.keys(l).length&&Object.keys(l).filter(e=>l[e].triggers&&l[e].triggers.length).map(async e=>{try{let t=l[e];await u(t,t.triggers[0].onSyncRequest),n.on(e,t.onCall)}catch(e){console.error("There was an issue reconnecting olf subscriptions",e)}}),O.flat().map(e=>{function t(t=!0,n,i,s){return{[t?"$leftJoin":"$innerJoin"]:e,filter:n,select:i,...s}}j.innerJoin=j.innerJoin||{},j.leftJoin=j.leftJoin||{},j.innerJoinOne=j.innerJoinOne||{},j.leftJoinOne=j.leftJoinOne||{},j.leftJoin[e]=(e,n,i={})=>t(!0,e,n,i),j.innerJoin[e]=(e,n,i={})=>t(!1,e,n,i),j.leftJoinOne[e]=(e,n,i={})=>t(!0,e,n,{...i,limit:1}),j.innerJoinOne[e]=(e,n,i={})=>t(!1,e,n,{...i,limit:1})});try{i(j,w,g,I)}catch(S){console.error("Prostgles: Error within onReady: \n",S)}e(j)})})}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.prostgles=void 0;const i=n(0),s=n(2);t.prostgles=function(e){return i.prostgles(e,s.SyncedTable)}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.SyncedTable=void 0;const i=n(3),s="undefined"!=typeof window,r={array:"array",localStorage:"localStorage",object:"object"};class o{constructor({name:e,filter:t,onChange:n,onReady:o,db:a,skipFirstTrigger:c=!1,select:l="*",storageType:h=r.object,patchText:d=!1,patchJSON:u=!1}){if(this.throttle=100,this.batch_size=50,this.skipFirstTrigger=!1,this.columns=[],this.items=[],this.itemsObj={},this.isSynced=!1,this.notifySubscribers=(e=[])=>{if(!this.isSynced)return;let t=[],n=[],i=[];e.map(({idObj:e,newItem:s,delta:r})=>{this.singleSubscriptions.filter(t=>this.matchesIdObj(t.idObj,e)).map(e=>{e.notify(s,r)}),this.matchesFilter(s)&&(t.push(s),n.push(r),i.push(e))});let s=[],r=[];this.getItems().map(e=>{s.push({...e});const i=t.findIndex(t=>this.matchesIdObj(e,t));r.push(n[i])}),this.onChange&&this.onChange(s,r),this.multiSubscriptions.map(e=>{e.notify(s,r)})},this.unsubscribe=e=>{this.singleSubscriptions=this.singleSubscriptions.filter(t=>t._onChange!==e),this.multiSubscriptions=this.multiSubscriptions.filter(t=>t._onChange!==e)},this.unsync=()=>{this.dbSync&&this.dbSync.unsync&&this.dbSync.unsync()},this.destroy=()=>{this.unsync(),this.multiSubscriptions=[],this.singleSubscriptions=[],this.itemsObj={},this.items=[],this.onChange=null},this.delete=async(e,t=!1)=>{const n=this.getIdObj(e);return this.setItem(n,null,!0,!0),t||await this.db[this.name].delete(n),this.notifySubscribers(),!0},this.upsert=async(e,t=!1)=>{if(!(e&&e.length||t))throw"No data provided for upsert";let n,s=[],r=[];await Promise.all(e.map(async(e,o)=>{let a={...e.idObj},c={...e.delta},l=this.getItem(a),h=l.index,d=l.data;!t&&!i.isEmpty(c)||i.isEmpty(d)||(c=this.getDelta(d||{},c)),t||(c[this.synced_field]=Date.now());let u={...d,...c,...a};d&&d[this.synced_field]<u[this.synced_field]?n="updated":d||(n="inserted"),this.setItem(u,h);let f={idObj:a,delta:c,oldItem:d,newItem:u,status:n,from_server:t};if(!t){let e=!1;if(this.columns&&this.columns.length&&(this.patchText||this.patchJSON)){const t=this.columns.filter(e=>"text"===e.data_type);if(this.patchText&&t.length&&this.db[this.name].update){let n;if(t.map(e=>{e.name in f.delta&&(n=n||{...f.delta},n[e.name]=i.getTextPatch(f.oldItem[e.name],f.delta[e.name]))}),n)try{await this.db[this.name].update(a,n),e=!0}catch(e){console.log("failed to patch update",e)}}}e||r.push({...c,...a})}return s.push(f),!0})),this.notifySubscribers(s),!t&&r.length&&this.wal.addData(r)},this.setItems=e=>{if(this.storageType===r.localStorage){if(!s)throw"Cannot access window object. Choose another storage method (array OR object)";window.localStorage.setItem(this.name,JSON.stringify(e))}else this.storageType===r.array?this.items=e:this.itemsObj=e.reduce((e,t)=>({...e,[this.getIdStr(t)]:{...t}}),{})},this.getItems=()=>{let e=[];if(this.storageType===r.localStorage){if(!s)throw"Cannot access window object. Choose another storage method (array OR object)";let t=window.localStorage.getItem(this.name);if(t)try{e=JSON.parse(t)}catch(e){console.error(e)}}else e=this.storageType===r.array?this.items.map(e=>({...e})):Object.values({...this.itemsObj});if(!this.id_fields||!this.synced_field)throw"id_fields AND/OR synced_field missing";{const t=[this.synced_field,...this.id_fields.sort()];e=e.filter(e=>!this.filter||!Object.keys(this.filter).find(t=>e[t]!==this.filter[t])).sort((e,n)=>t.map(t=>e[t]<n[t]?-1:e[t]>n[t]?1:0).find(e=>e))}return e.map(e=>({...e}))},this.getBatch=({from_synced:e,to_synced:t,offset:n,limit:i}={offset:0,limit:null})=>{let s=this.getItems().map(e=>({...e})).filter(n=>(!e||n[this.synced_field]>=e)&&(!t||n[this.synced_field]<=t));return(n||i)&&(s=s.splice(n,i||s.length)),s},this.name=e,this.filter=t,this.select=l,this.onChange=n,!r[h])throw"Invalid storage type. Expecting one of: "+Object.keys(r).join(", ");if("undefined"==typeof window&&h===r.localStorage&&(console.warn("Could not set storageType to localStorage: window object missing\nStorage changed to object"),h="object"),this.storageType=h,this.patchText=d,this.patchJSON=u,!a)throw"db missing";this.db=a;const{id_fields:f,synced_field:m,throttle:p=100,batch_size:g=50}=a[this.name]._syncInfo;if(!f||!m)throw"id_fields/synced_field missing";this.id_fields=f,this.synced_field=m,this.batch_size=g,this.throttle=p,this.skipFirstTrigger=c,this.multiSubscriptions=[],this.singleSubscriptions=[];a[this.name]._sync(t,{select:l},{onSyncRequest:e=>{let t={c_lr:null,c_fr:null,c_count:0},n=this.getBatch(e);return n.length&&(t={c_fr:this.getRowSyncObj(n[0])||null,c_lr:this.getRowSyncObj(n[n.length-1])||null,c_count:n.length}),t},onPullRequest:async e=>this.getBatch(e),onUpdates:({data:e,isSynced:t})=>{if(t&&!this.isSynced){this.isSynced=t;let e=this.getItems().map(e=>({...e}));this.setItems([]),this.upsert(e.map(e=>({idObj:this.getIdObj(e),delta:{...e}})),!0)}else{let t=e.map(e=>({idObj:this.getIdObj(e),delta:e}));this.upsert(t,!0)}}}).then(e=>{function t(){return"Data may be lost. Are you sure?"}this.dbSync=e,this.wal=new i.WAL({id_fields:f,synced_field:m,throttle:p,batch_size:g,onSendStart:()=>{s&&(window.onbeforeunload=t)},onSend:e=>this.dbSync.syncData(e),onSendEnd:()=>{s&&(window.onbeforeunload=null)}}),o()}),a[this.name].getColumns&&a[this.name].getColumns().then(e=>{this.columns=e}),this.onChange&&!this.skipFirstTrigger&&setTimeout(this.onChange,0)}static create(e){return new Promise((t,n)=>{try{const n=new o({...e,onReady:()=>{setTimeout(()=>{t(n)},0)}})}catch(e){n(e)}})}sync(e,t=!1){const n={unsync:()=>{this.unsubscribe(e)},upsert:e=>{if(e){const t=e=>({idObj:this.getIdObj(e),delta:e});Array.isArray(e)?this.upsert(e.map(e=>t(e))):this.upsert([t(e)])}}},i={_onChange:e,handlesOnData:t,handles:n,notify:(n,i)=>{let s=[...n],r=[...i];return t&&(s=s.map((e,t)=>{const n=this.wal.getIdObj(e);return{...e,$update:e=>this.upsert([{idObj:n,delta:e}]).then(e=>!0),$delete:async()=>this.delete(n)}})),e(s,r)}};if(this.multiSubscriptions.push(i),!this.skipFirstTrigger){let t=this.getItems();e(t,t)}return Object.freeze({...n})}syncOne(e,t,n=!1){if(!e||!t)throw"syncOne(idObj, onChange) -> MISSING idObj or onChange";const i={get:()=>this.getItem(e).data,unsync:()=>{this.unsubscribe(t)},delete:()=>this.delete(e),update:t=>{this.upsert([{idObj:e,delta:t}])}},s={_onChange:t,idObj:e,handlesOnData:n,handles:i,notify:(e,s)=>{let r={...e};return n&&(r.$update=i.update,r.$delete=i.delete,r.$unsync=i.unsync),t(r,s)}};this.singleSubscriptions.push(s);let r=i.get();return r&&s.notify(r,r),Object.freeze({...i})}getIdStr(e){return this.id_fields.sort().map(t=>""+(e[t]||"")).join(".")}getIdObj(e){let t={};return this.id_fields.sort().map(n=>{t[n]=e[n]}),t}getRowSyncObj(e){let t={};return[this.synced_field,...this.id_fields].sort().map(n=>{t[n]=e[n]}),t}matchesFilter(e){return Boolean(e&&(!this.filter||i.isEmpty(this.filter)||!Object.keys(this.filter).find(t=>this.filter[t]!==e[t])))}matchesIdObj(e,t){return Boolean(e&&t&&!this.id_fields.sort().find(n=>e[n]!==t[n]))}getDelta(e,t){return i.isEmpty(e)?{...t}:Object.keys({...e,...t}).filter(e=>!this.id_fields.includes(e)).reduce((n,i)=>{let s={};return i in t&&t[i]!==e[i]&&(s={[i]:t[i]}),{...n,...s}},{})}deleteAll(){this.getItems().map(e=>this.delete(e))}getItem(e){let t;if(this.storageType===r.localStorage){t=this.getItems().find(t=>this.matchesIdObj(t,e))}else this.storageType===r.array?t=this.items.find(t=>this.matchesIdObj(t,e)):(this.itemsObj=this.itemsObj||{},t={...this.itemsObj}[this.getIdStr(e)]);return{data:t?{...t}:t,index:-1}}setItem(e,t,n=!1,i=!1){if(this.storageType===r.localStorage){let r=this.getItems();if(i)r=r.filter(t=>!this.matchesIdObj(t,e));else{let i=t;r[i]?r[i]=n?{...e}:{...r[i],...e}:r.push(e)}s&&window.localStorage.setItem(this.name,JSON.stringify(r))}else if(this.storageType===r.array)i?this.items=this.items.filter(t=>!this.matchesIdObj(t,e)):this.items[t]?this.items[t]=n?{...e}:{...this.items[t],...e}:this.items.push(e);else if(this.itemsObj=this.itemsObj||{},i)delete this.itemsObj[this.getIdStr(e)];else{let t=this.itemsObj[this.getIdStr(e)]||{};this.itemsObj[this.getIdStr(e)]=n?{...e}:{...t,...e}}}}t.SyncedTable=o},function(e,t,n){this||window,e.exports=(()=>{"use strict";var e={590:(e,t,n)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.WAL=t.isEmpty=t.unpatchText=t.getTextPatch=t.AGGREGATION_FUNCTIONS=t.FIELD_FILTER_TYPES=void 0,t.FIELD_FILTER_TYPES=["$ilike","$gte"],t.AGGREGATION_FUNCTIONS=["$max","$min","$count"];var i=n(128);Object.defineProperty(t,"getTextPatch",{enumerable:!0,get:function(){return i.getTextPatch}}),Object.defineProperty(t,"unpatchText",{enumerable:!0,get:function(){return i.unpatchText}}),Object.defineProperty(t,"isEmpty",{enumerable:!0,get:function(){return i.isEmpty}}),Object.defineProperty(t,"WAL",{enumerable:!0,get:function(){return i.WAL}})},899:(e,t)=>{function n(e,t){var n=e[0],i=e[1],c=e[2],l=e[3];n=s(n,i,c,l,t[0],7,-680876936),l=s(l,n,i,c,t[1],12,-389564586),c=s(c,l,n,i,t[2],17,606105819),i=s(i,c,l,n,t[3],22,-1044525330),n=s(n,i,c,l,t[4],7,-176418897),l=s(l,n,i,c,t[5],12,1200080426),c=s(c,l,n,i,t[6],17,-1473231341),i=s(i,c,l,n,t[7],22,-45705983),n=s(n,i,c,l,t[8],7,1770035416),l=s(l,n,i,c,t[9],12,-1958414417),c=s(c,l,n,i,t[10],17,-42063),i=s(i,c,l,n,t[11],22,-1990404162),n=s(n,i,c,l,t[12],7,1804603682),l=s(l,n,i,c,t[13],12,-40341101),c=s(c,l,n,i,t[14],17,-1502002290),n=r(n,i=s(i,c,l,n,t[15],22,1236535329),c,l,t[1],5,-165796510),l=r(l,n,i,c,t[6],9,-1069501632),c=r(c,l,n,i,t[11],14,643717713),i=r(i,c,l,n,t[0],20,-373897302),n=r(n,i,c,l,t[5],5,-701558691),l=r(l,n,i,c,t[10],9,38016083),c=r(c,l,n,i,t[15],14,-660478335),i=r(i,c,l,n,t[4],20,-405537848),n=r(n,i,c,l,t[9],5,568446438),l=r(l,n,i,c,t[14],9,-1019803690),c=r(c,l,n,i,t[3],14,-187363961),i=r(i,c,l,n,t[8],20,1163531501),n=r(n,i,c,l,t[13],5,-1444681467),l=r(l,n,i,c,t[2],9,-51403784),c=r(c,l,n,i,t[7],14,1735328473),n=o(n,i=r(i,c,l,n,t[12],20,-1926607734),c,l,t[5],4,-378558),l=o(l,n,i,c,t[8],11,-2022574463),c=o(c,l,n,i,t[11],16,1839030562),i=o(i,c,l,n,t[14],23,-35309556),n=o(n,i,c,l,t[1],4,-1530992060),l=o(l,n,i,c,t[4],11,1272893353),c=o(c,l,n,i,t[7],16,-155497632),i=o(i,c,l,n,t[10],23,-1094730640),n=o(n,i,c,l,t[13],4,681279174),l=o(l,n,i,c,t[0],11,-358537222),c=o(c,l,n,i,t[3],16,-722521979),i=o(i,c,l,n,t[6],23,76029189),n=o(n,i,c,l,t[9],4,-640364487),l=o(l,n,i,c,t[12],11,-421815835),c=o(c,l,n,i,t[15],16,530742520),n=a(n,i=o(i,c,l,n,t[2],23,-995338651),c,l,t[0],6,-198630844),l=a(l,n,i,c,t[7],10,1126891415),c=a(c,l,n,i,t[14],15,-1416354905),i=a(i,c,l,n,t[5],21,-57434055),n=a(n,i,c,l,t[12],6,1700485571),l=a(l,n,i,c,t[3],10,-1894986606),c=a(c,l,n,i,t[10],15,-1051523),i=a(i,c,l,n,t[1],21,-2054922799),n=a(n,i,c,l,t[8],6,1873313359),l=a(l,n,i,c,t[15],10,-30611744),c=a(c,l,n,i,t[6],15,-1560198380),i=a(i,c,l,n,t[13],21,1309151649),n=a(n,i,c,l,t[4],6,-145523070),l=a(l,n,i,c,t[11],10,-1120210379),c=a(c,l,n,i,t[2],15,718787259),i=a(i,c,l,n,t[9],21,-343485551),e[0]=u(n,e[0]),e[1]=u(i,e[1]),e[2]=u(c,e[2]),e[3]=u(l,e[3])}function i(e,t,n,i,s,r){return t=u(u(t,e),u(i,r)),u(t<<s|t>>>32-s,n)}function s(e,t,n,s,r,o,a){return i(t&n|~t&s,e,t,r,o,a)}function r(e,t,n,s,r,o,a){return i(t&s|n&~s,e,t,r,o,a)}function o(e,t,n,s,r,o,a){return i(t^n^s,e,t,r,o,a)}function a(e,t,n,s,r,o,a){return i(n^(t|~s),e,t,r,o,a)}function c(e){var t,n=[];for(t=0;t<64;t+=4)n[t>>2]=e.charCodeAt(t)+(e.charCodeAt(t+1)<<8)+(e.charCodeAt(t+2)<<16)+(e.charCodeAt(t+3)<<24);return n}Object.defineProperty(t,"__esModule",{value:!0}),t.md5=t.md5cycle=void 0,t.md5cycle=n;var l="0123456789abcdef".split("");function h(e){for(var t="",n=0;n<4;n++)t+=l[e>>8*n+4&15]+l[e>>8*n&15];return t}function d(e){return function(e){for(var t=0;t<e.length;t++)e[t]=h(e[t]);return e.join("")}(function(e){var t,i=e.length,s=[1732584193,-271733879,-1732584194,271733878];for(t=64;t<=e.length;t+=64)n(s,c(e.substring(t-64,t)));e=e.substring(t-64);var r=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];for(t=0;t<e.length;t++)r[t>>2]|=e.charCodeAt(t)<<(t%4<<3);if(r[t>>2]|=128<<(t%4<<3),t>55)for(n(s,r),t=0;t<16;t++)r[t]=0;return r[14]=8*i,n(s,r),s}(e))}function u(e,t){return e+t&4294967295}if(t.md5=d,"5d41402abc4b2a76b9719d911017c592"!=d("hello")){function u(e,t){var n=(65535&e)+(65535&t);return(e>>16)+(t>>16)+(n>>16)<<16|65535&n}}},128:function(e,t,n){var i=this&&this.__awaiter||function(e,t,n,i){return new(n||(n=Promise))((function(s,r){function o(e){try{c(i.next(e))}catch(e){r(e)}}function a(e){try{c(i.throw(e))}catch(e){r(e)}}function c(e){var t;e.done?s(e.value):(t=e.value,t instanceof n?t:new n((function(e){e(t)}))).then(o,a)}c((i=i.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.isEmpty=t.WAL=t.unpatchText=t.getTextPatch=t.stableStringify=void 0;const s=n(899);function r(e){for(var t in e)return!1;return!0}t.stableStringify=function(e,t){t||(t={}),"function"==typeof t&&(t={cmp:t});var n,i="boolean"==typeof t.cycles&&t.cycles,s=t.cmp&&(n=t.cmp,function(e){return function(t,i){var s={key:t,value:e[t]},r={key:i,value:e[i]};return n(s,r)}}),r=[];return function e(t){if(t&&t.toJSON&&"function"==typeof t.toJSON&&(t=t.toJSON()),void 0!==t){if("number"==typeof t)return isFinite(t)?""+t:"null";if("object"!=typeof t)return JSON.stringify(t);var n,o;if(Array.isArray(t)){for(o="[",n=0;n<t.length;n++)n&&(o+=","),o+=e(t[n])||"null";return o+"]"}if(null===t)return"null";if(-1!==r.indexOf(t)){if(i)return JSON.stringify("__cycle__");throw new TypeError("Converting circular structure to JSON")}var a=r.push(t)-1,c=Object.keys(t).sort(s&&s(t));for(o="",n=0;n<c.length;n++){var l=c[n],h=e(t[l]);h&&(o&&(o+=","),o+=JSON.stringify(l)+":"+h)}return r.splice(a,1),"{"+o+"}"}}(e)},t.getTextPatch=function(e,t){if(!(e&&t&&e.trim().length&&t.trim().length))return t;if(e===t)return{from:0,to:0,text:"",md5:s.md5(t)};function n(n=1){let i=n<1?-1:0,s=!1;for(;!s&&Math.abs(i)<=t.length;){const r=n<1?[i]:[0,i];e.slice(...r)!==t.slice(...r)?s=!0:i+=1*Math.sign(n)}return i}let i=n()-1,r=e.length+n(-1)+1,o=t.length+n(-1)+1;return{from:i,to:r,text:t.slice(i,o),md5:s.md5(t)}},t.unpatchText=function(e,t){if(!t||"string"==typeof t)return t;const{from:n,to:i,text:r,md5:o}=t;if(null===r||null===e)return r;let a=e.slice(0,n)+r+e.slice(i);if(o&&s.md5(a)!==o)throw"Patch text error: Could not match md5 hash: (original/result) \n"+e+"\n"+a;return a},t.WAL=class{constructor(e){if(this.changed={},this.sending={},this.callbacks=[],this.sort=(e,t)=>{const{orderBy:n}=this.options;return n.map(n=>{if(!(n.fieldName in e)||!(n.fieldName in t))throw"Replication error: \n   some orderBy fields missing from data";let i=n.asc?e[n.fieldName]:t[n.fieldName],s=n.asc?t[n.fieldName]:e[n.fieldName],r=i-s,o=i<s?-1:i==s?0:1;return isNaN(r)?o:r}).find(e=>e)},this.addData=(e,t)=>{r(this.changed)&&this.options.onSendStart&&this.options.onSendStart();let n=t?{cb:t,idStrs:[]}:null;e.map(e=>{const t=this.getIdStr(e);n&&n.idStrs.push(t),this.changed=this.changed||{},this.changed[t]=Object.assign(Object.assign({},this.changed[t]),e)}),this.sendItems()},this.isSendingTimeout=null,this.sendItems=()=>i(this,void 0,void 0,(function*(){const{synced_field:e,onSend:t,onSendEnd:n,batch_size:i,throttle:s}=this.options;if(this.isSendingTimeout||this.sending&&!r(this.sending))return;if(!this.changed||r(this.changed))return;let o,a=[];Object.keys(this.changed).sort((e,t)=>this.sort(this.changed[e],this.changed[t])).slice(0,i).map(e=>{let t=Object.assign({},this.changed[e]);this.sending[e]=t,a.push(Object.assign({},t)),delete this.changed[e]}),this.isSendingTimeout=setTimeout(()=>{this.isSendingTimeout=void 0,r(this.changed)||this.sendItems()},s);try{yield t(a)}catch(e){o=e,console.error(e,a)}if(this.callbacks.length){const e=Object.keys(this.sending);this.callbacks.forEach((t,n)=>{t.idStrs=t.idStrs.filter(t=>e.includes(t)),t.idStrs.length||t.cb(o)}),this.callbacks=this.callbacks.filter(e=>e.idStrs.length)}this.sending={},r(this.changed)?n&&n(a,o):this.sendItems()})),this.options=Object.assign({},e),!this.options.orderBy){const{synced_field:t,id_fields:n}=e;this.options.orderBy=[t,...n.sort()].map(e=>({fieldName:e,asc:!0}))}}isSending(){return!(r(this.sending)&&r(this.changed))}getIdStr(e){return this.options.id_fields.sort().map(t=>""+(e[t]||"")).join(".")}getIdObj(e){let t={};return this.options.id_fields.sort().map(n=>{t[n]=e[n]}),t}},t.isEmpty=r}},t={};return function n(i){if(t[i])return t[i].exports;var s=t[i]={exports:{}};return e[i].call(s.exports,s,s.exports,n),s.exports}(590)})()}])}));