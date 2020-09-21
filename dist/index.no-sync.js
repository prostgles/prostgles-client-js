!function(e,n){if("object"==typeof exports&&"object"==typeof module)module.exports=n();else if("function"==typeof define&&define.amd)define([],n);else{var t=n();for(var o in t)("object"==typeof exports?exports:e)[o]=t[o]}}(this,(function(){return function(e){var n={};function t(o){if(n[o])return n[o].exports;var r=n[o]={i:o,l:!1,exports:{}};return e[o].call(r.exports,r,r.exports,t),r.l=!0,r.exports}return t.m=e,t.c=n,t.d=function(e,n,o){t.o(e,n)||Object.defineProperty(e,n,{enumerable:!0,get:o})},t.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},t.t=function(e,n){if(1&n&&(e=t(e)),8&n)return e;if(4&n&&"object"==typeof e&&e&&e.__esModule)return e;var o=Object.create(null);if(t.r(o),Object.defineProperty(o,"default",{enumerable:!0,value:e}),2&n&&"string"!=typeof e)for(var r in e)t.d(o,r,function(n){return e[n]}.bind(null,r));return o},t.n=function(e){var n=e&&e.__esModule?function(){return e.default}:function(){return e};return t.d(n,"a",n),n},t.o=function(e,n){return Object.prototype.hasOwnProperty.call(e,n)},t.p="",t(t.s=0)}([function(e,n,t){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),n.prostgles=void 0,n.prostgles=function(e,n){const{socket:t,isReady:o=((e,n)=>{}),onDisconnect:r}=e,i="_psqlWS_.";var a=[];return new Promise((e,s)=>{r&&t.on("disconnect",r),t.on(i+"schema",({schema:r,methods:s,fullSchema:c,joinTables:l=[]})=>{let u=JSON.parse(JSON.stringify(r)),f=JSON.parse(JSON.stringify(s)),m={};f.map(e=>{m[e]=function(n){return new Promise((o,r)=>{t.emit(i+"method",{method:e,params:n},(e,n)=>{e?r(e):o(n)})})}}),m=Object.freeze(m),u.sql&&(u.sql=function(e,n,o){return new Promise((r,a)=>{t.emit(i+"sql",{query:e,params:n,options:o},(e,n)=>{e?a(e):r(n)})})}),Object.keys(u).forEach(e=>{Object.keys(u[e]).forEach(o=>{if("sync"===o){u[e]._syncInfo={...u[e][o]},n&&n&&(u[e].getSync=(t,o={})=>new n({name:e,filter:t,db:u,...o})),u[e][o]=function(n,r,s){const{onSyncRequest:c,onPullRequest:l,onUpdates:u}=s;var f,m=this;return t.emit(i,{tableName:e,command:o,param1:n,param2:r,lastUpdated:void 0},(e,n)=>{if(e)console.error(e);else if(n){const{id_fields:e,synced_field:o,channelName:r}=n,i={id_fields:e,synced_field:o};m.sync_info=i,m.channelName=r,m.socket=t,m.syncData=function(e,n,o){t.emit(r,{onSyncRequest:{...c({},i),...{data:e}||{},...{deleted:n}||{}}},o?e=>{o(e)}:null)},t.emit(r,{onSyncRequest:c({},i)},e=>{console.log(e)}),f=function(e,n){e&&(e.data&&e.data.length?Promise.resolve(u(e.data,i)).then(()=>{n&&n({ok:!0})}).catch(e=>{n&&n({err:e})}):e.onSyncRequest?Promise.resolve(c(e.onSyncRequest,i)).then(e=>n({onSyncRequest:e})).catch(e=>{n&&n({err:e})}):e.onPullRequest?Promise.resolve(l(e.onPullRequest,i)).then(e=>{n({data:e})}).catch(e=>{n&&n({err:e})}):console.log("unexpected response"))},a.push({channelName:r,syncHandles:s,socketHandle:f}),t.on(r,f)}}),Object.freeze({unsync:function(){return new Promise((e,n)=>{var o=a.filter(e=>e.channelName===m.channelName);1===o.length?(a=a.filter(e=>e.channelName!==m.channelName),t.emit(m.channelName+"unsync",{},(t,o)=>{t?n(t):e(o)})):o.length>1||console.log("no syncs to unsync from",o),t.removeListener(m.channelName,f)})},syncData:function(e,n){m&&m.syncData&&m.syncData(e,n)}})}}else if("subscribe"===o){u[e][o]=function(n,r,s){var c,l,u=this;return t.emit(i,{tableName:e,command:o,param1:n,param2:r,lastUpdated:void 0},(e,n)=>{e?console.error(e):n&&(c=n.channelName,l=function(e,n){s(e.data),u.channelName=c,u.socket=t},a.push({channelName:c,onChange:s,socketHandle:l}),t.on(c,l))}),Object.freeze({unsubscribe:function(){var e=a.filter(e=>e.channelName===c);1===e.length?(a=a.filter(e=>e.channelName!==c),t.emit(c+"unsubscribe",{},(e,n)=>{})):e.length>1||console.log("no subscriptions to unsubscribe from",e),t.removeListener(c,l)}})}}else u[e][o]=function(n,r,a){return new Promise((s,c)=>{t.emit(i,{tableName:e,command:o,param1:n,param2:r,param3:a},(e,n)=>{e?c(e):s(n)})})}})}),l.map(e=>{function n(n=!0,t,o,r){return{[n?"$leftJoin":"$innerJoin"]:e,filter:t,select:o,...r}}u.innerJoin=u.innerJoin||{},u.leftJoin=u.leftJoin||{},u.innerJoinOne=u.innerJoinOne||{},u.leftJoinOne=u.leftJoinOne||{},u.leftJoin[e]=(e,t,o={})=>n(!0,e,t,o),u.innerJoin[e]=(e,t,o={})=>n(!1,e,t,o),u.leftJoinOne[e]=(e,t,o={})=>n(!0,e,t,{...o,limit:1}),u.innerJoinOne[e]=(e,t,o={})=>n(!1,e,t,{...o,limit:1})}),o(u,m),e(u)})})}}])}));