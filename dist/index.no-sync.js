!function(e,n){if("object"==typeof exports&&"object"==typeof module)module.exports=n();else if("function"==typeof define&&define.amd)define([],n);else{var t=n();for(var o in t)("object"==typeof exports?exports:e)[o]=t[o]}}(this,(function(){return function(e){var n={};function t(o){if(n[o])return n[o].exports;var r=n[o]={i:o,l:!1,exports:{}};return e[o].call(r.exports,r,r.exports,t),r.l=!0,r.exports}return t.m=e,t.c=n,t.d=function(e,n,o){t.o(e,n)||Object.defineProperty(e,n,{enumerable:!0,get:o})},t.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},t.t=function(e,n){if(1&n&&(e=t(e)),8&n)return e;if(4&n&&"object"==typeof e&&e&&e.__esModule)return e;var o=Object.create(null);if(t.r(o),Object.defineProperty(o,"default",{enumerable:!0,value:e}),2&n&&"string"!=typeof e)for(var r in e)t.d(o,r,function(n){return e[n]}.bind(null,r));return o},t.n=function(e){var n=e&&e.__esModule?function(){return e.default}:function(){return e};return t.d(n,"a",n),n},t.o=function(e,n){return Object.prototype.hasOwnProperty.call(e,n)},t.p="",t(t.s=0)}([function(e,n,t){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),n.prostgles=void 0,n.prostgles=function({socket:e,isReady:n=((e,n)=>{}),onDisconnect:t},o){const r="_psqlWS_.";var i=[];return new Promise((a,s)=>{t&&e.on("disconnect",t),e.on(r+"schema",({schema:t,methods:s,fullSchema:c,joinTables:l=[]})=>{let u=JSON.parse(JSON.stringify(t)),f=JSON.parse(JSON.stringify(s)),m={};f.map(n=>{m[n]=function(t){return new Promise((o,i)=>{e.emit(r+"method",{method:n,params:t},(e,n)=>{e?i(e):o(n)})})}}),m=Object.freeze(m),u.sql&&(u.sql=function(n,t,o){return new Promise((i,a)=>{e.emit(r+"sql",{query:n,params:t,options:o},(e,n)=>{e?a(e):i(n)})})}),Object.keys(u).forEach(n=>{Object.keys(u[n]).forEach(t=>{if("sync"===t){u[n]._syncInfo={...u[n][t]},o&&o&&(u[n].getSync=e=>new o({name:n,filter:e,db:u})),u[n][t]=function(o,a,s){const{onSyncRequest:c,onPullRequest:l,onUpdates:u}=s;var f,m=this;return e.emit(r,{tableName:n,command:t,param1:o,param2:a,lastUpdated:void 0},(n,t)=>{if(n)console.error(n);else if(t){const{id_fields:n,synced_field:o,channelName:r}=t,a={id_fields:n,synced_field:o};m.sync_info=a,m.channelName=r,m.socket=e,m.syncData=function(n,t,o){e.emit(r,{onSyncRequest:{...c({},a),...{data:n}||{},...{deleted:t}||{}}},o?e=>{o(e)}:null)},e.emit(r,{onSyncRequest:c({},a)},e=>{console.log(e)}),f=function(e,n){e&&(e.data&&e.data.length?Promise.resolve(u(e.data,a)).then(()=>{n&&n({ok:!0})}).catch(e=>{n&&n({err:e})}):e.onSyncRequest?Promise.resolve(c(e.onSyncRequest,a)).then(e=>n({onSyncRequest:e})).catch(e=>{n&&n({err:e})}):e.onPullRequest?Promise.resolve(l(e.onPullRequest,a)).then(e=>{n({data:e})}).catch(e=>{n&&n({err:e})}):console.log("unexpected response"))},i.push({channelName:r,syncHandles:s,socketHandle:f}),e.on(r,f)}}),Object.freeze({unsync:function(){return new Promise((n,t)=>{var o=i.filter(e=>e.channelName===m.channelName);1===o.length?(i=i.filter(e=>e.channelName!==m.channelName),e.emit(m.channelName+"unsync",{},(e,o)=>{e?t(e):n(o)})):o.length>1||console.log("no syncs to unsync from",o),e.removeListener(m.channelName,f)})},syncData:function(e,n){m&&m.syncData&&m.syncData(e,n)}})}}else if("subscribe"===t){u[n][t]=function(o,a,s){var c,l,u=this;return e.emit(r,{tableName:n,command:t,param1:o,param2:a,lastUpdated:void 0},(n,t)=>{n?console.error(n):t&&(c=t.channelName,l=function(n,t){s(n.data),u.channelName=c,u.socket=e},i.push({channelName:c,onChange:s,socketHandle:l}),e.on(c,l))}),Object.freeze({unsubscribe:function(){var n=i.filter(e=>e.channelName===c);1===n.length?(i=i.filter(e=>e.channelName!==c),e.emit(c+"unsubscribe",{},(e,n)=>{})):n.length>1||console.log("no subscriptions to unsubscribe from",n),e.removeListener(c,l)}})}}else u[n][t]=function(o,i,a){return new Promise((s,c)=>{e.emit(r,{tableName:n,command:t,param1:o,param2:i,param3:a},(e,n)=>{e?c(e):s(n)})})}})}),l.map(e=>{function n(n=!0,t,o,r){return{[n?"$leftJoin":"$innerJoin"]:e,filter:t,select:o,...r}}u.innerJoin=u.innerJoin||{},u.leftJoin=u.leftJoin||{},u.innerJoinOne=u.innerJoinOne||{},u.leftJoinOne=u.leftJoinOne||{},u.leftJoin[e]=(e,t,o={})=>n(!0,e,t,o),u.innerJoin[e]=(e,t,o={})=>n(!1,e,t,o),u.leftJoinOne[e]=(e,t,o={})=>n(!0,e,t,{...o,limit:1}),u.innerJoinOne[e]=(e,t,o={})=>n(!1,e,t,{...o,limit:1})}),n(u,m),a(u)})})}}])}));