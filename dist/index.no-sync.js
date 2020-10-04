!function(e,n){if("object"==typeof exports&&"object"==typeof module)module.exports=n();else if("function"==typeof define&&define.amd)define([],n);else{var t=n();for(var o in t)("object"==typeof exports?exports:e)[o]=t[o]}}(this||window,(function(){return function(e){var n={};function t(o){if(n[o])return n[o].exports;var r=n[o]={i:o,l:!1,exports:{}};return e[o].call(r.exports,r,r.exports,t),r.l=!0,r.exports}return t.m=e,t.c=n,t.d=function(e,n,o){t.o(e,n)||Object.defineProperty(e,n,{enumerable:!0,get:o})},t.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},t.t=function(e,n){if(1&n&&(e=t(e)),8&n)return e;if(4&n&&"object"==typeof e&&e&&e.__esModule)return e;var o=Object.create(null);if(t.r(o),Object.defineProperty(o,"default",{enumerable:!0,value:e}),2&n&&"string"!=typeof e)for(var r in e)t.d(o,r,function(n){return e[n]}.bind(null,r));return o},t.n=function(e){var n=e&&e.__esModule?function(){return e.default}:function(){return e};return t.d(n,"a",n),n},t.o=function(e,n){return Object.prototype.hasOwnProperty.call(e,n)},t.p="",t(t.s=0)}([function(e,n,t){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),n.prostgles=void 0,n.prostgles=function(e,n){const{socket:t,onReady:o,onDisconnect:r}=e,i="_psqlWS_.";var s=[];let c={};return new Promise((e,a)=>{r&&t.on("disconnect",r),t.on(i+"schema",({schema:r,methods:a,fullSchema:l,joinTables:u=[]})=>{let f=JSON.parse(JSON.stringify(r)),m=JSON.parse(JSON.stringify(a)),d={};m.map(e=>{d[e]=function(...n){return new Promise((o,r)=>{t.emit(i+"method",{method:e,params:n},(e,n)=>{e?r(e):o(n)})})}}),d=Object.freeze(d),f.sql&&(f.sql=function(e,n,o){return new Promise((r,s)=>{t.emit(i+"sql",{query:e,params:n,options:o},(e,n)=>{e?s(e):r(n)})})}),Object.keys(f).forEach(e=>{Object.keys(f[e]).forEach(o=>{if("sync"===o){if(f[e]._syncInfo={...f[e][o]},n){f[e].getSync=(t,o={})=>new n({name:e,filter:t,db:f,...o});const t=t=>{const o=`${e}.${JSON.stringify(t||{})}`;return c[o]||(c[o]=new n({name:e,filter:t,db:f})),c[o]};f[e].sync=(e,n,o=!1)=>t(e).sync(n,o),f[e].syncOne=(e,n,o=!1)=>t(e).syncOne(e,n,o)}f[e]._sync=function(n,r,c){const{onSyncRequest:a,onPullRequest:l,onUpdates:u}=c;var f,m=this;return t.emit(i,{tableName:e,command:o,param1:n,param2:r,lastUpdated:void 0},(e,n)=>{if(e)console.error(e);else if(n){const{id_fields:e,synced_field:o,channelName:r}=n,i={id_fields:e,synced_field:o};m.sync_info=i,m.channelName=r,m.socket=t,m.syncData=function(e,n,o){t.emit(r,{onSyncRequest:{...a({},i),...{data:e}||{},...{deleted:n}||{}}},o?e=>{o(e)}:null)},t.emit(r,{onSyncRequest:a({},i)},e=>{console.log(e)}),f=function(e,n){e&&(e.data&&e.data.length?Promise.resolve(u(e.data,i)).then(()=>{n&&n({ok:!0})}).catch(e=>{n&&n({err:e})}):e.onSyncRequest?Promise.resolve(a(e.onSyncRequest,i)).then(e=>n({onSyncRequest:e})).catch(e=>{n&&n({err:e})}):e.onPullRequest?Promise.resolve(l(e.onPullRequest,i)).then(e=>{n({data:e})}).catch(e=>{n&&n({err:e})}):console.log("unexpected response"))},s.push({channelName:r,syncHandles:c,socketHandle:f}),t.on(r,f)}}),Object.freeze({unsync:function(){return new Promise((e,n)=>{var o=s.filter(e=>e.channelName===m.channelName);1===o.length?(s=s.filter(e=>e.channelName!==m.channelName),t.emit(m.channelName+"unsync",{},(t,o)=>{t?n(t):e(o)})):o.length>1||console.log("no syncs to unsync from",o),t.removeListener(m.channelName,f)})},syncData:function(e,n){m&&m.syncData&&m.syncData(e,n)}})}}else if("subscribe"===o||"subscribeOne"===o){f[e][o]=function(n,r,c){var a,l,u=this;return t.emit(i,{tableName:e,command:o,param1:n,param2:r,lastUpdated:void 0},(e,n)=>{e?console.error(e):n&&(a=n.channelName,l=function(e,n){c(e.data),u.channelName=a,u.socket=t},s.push({channelName:a,onChange:c,socketHandle:l}),t.on(a,l))}),Object.freeze({unsubscribe:function(){var e=s.filter(e=>e.channelName===a);1===e.length?(s=s.filter(e=>e.channelName!==a),t.emit(a+"unsubscribe",{},(e,n)=>{})):e.length>1||console.log("no subscriptions to unsubscribe from",e),t.removeListener(a,l)}})}}else f[e][o]=function(n,r,s){return new Promise((c,a)=>{t.emit(i,{tableName:e,command:o,param1:n,param2:r,param3:s},(e,n)=>{e?a(e):c(n)})})}})}),u.map(e=>{function n(n=!0,t,o,r){return{[n?"$leftJoin":"$innerJoin"]:e,filter:t,select:o,...r}}f.innerJoin=f.innerJoin||{},f.leftJoin=f.leftJoin||{},f.innerJoinOne=f.innerJoinOne||{},f.leftJoinOne=f.leftJoinOne||{},f.leftJoin[e]=(e,t,o={})=>n(!0,e,t,o),f.innerJoin[e]=(e,t,o={})=>n(!1,e,t,o),f.leftJoinOne[e]=(e,t,o={})=>n(!0,e,t,{...o,limit:1}),f.innerJoinOne[e]=(e,t,o={})=>n(!1,e,t,{...o,limit:1})}),o(f,d),e(f)})})}}])}));