!function(e,t){if("object"==typeof exports&&"object"==typeof module)module.exports=t();else if("function"==typeof define&&define.amd)define([],t);else{var n=t();for(var r in n)("object"==typeof exports?exports:e)[r]=n[r]}}(this||window,(()=>{return e={274:(e,t,n)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.prostgles=t.debug=void 0;const r=n(792),i="DEBUG_SYNCEDTABLE",s="undefined"!=typeof window;t.debug=function(...e){s&&window[i]&&window[i](...e)},t.prostgles=function(e,n){const{socket:i,onReady:s,onDisconnect:o,onReconnect:a,onSchemaChange:l=!0}=e;if((0,t.debug)("prostgles",{initOpts:e}),l){let e;"function"==typeof l&&(e=l),i.removeAllListeners(r.CHANNELS.SCHEMA_CHANGED),e&&i.on(r.CHANNELS.SCHEMA_CHANGED,e)}const c=r.CHANNELS._preffix;let u={},d={},f={};const m=[];let h,p=!1,g={},y=!1;function b(e,n){return(0,t.debug)("_unsubscribe",{channelName:e,handler:n}),new Promise(((t,r)=>{u[e]?(u[e].handlers=u[e].handlers.filter((e=>e!==n)),u[e].handlers.length||(i.emit(e+"unsubscribe",{},((e,t)=>{e&&console.error(e)})),i.removeListener(e,u[e].onCall),delete u[e]),t(!0)):t(!0)}))}function _({tableName:e,command:t,param1:n,param2:r},s){return new Promise(((o,a)=>{i.emit(c,{tableName:e,command:t,param1:n,param2:r},((e,t)=>{if(e)console.error(e),a(e);else if(t){const{id_fields:e,synced_field:n,channelName:r}=t;i.emit(r,{onSyncRequest:s({})},(e=>{console.log(e)})),o({id_fields:e,synced_field:n,channelName:r})}}))}))}function S({tableName:e,command:t,param1:n,param2:r}){return new Promise(((s,o)=>{i.emit(c,{tableName:e,command:t,param1:n,param2:r},((e,t)=>{e?(console.error(e),o(e)):t&&s(t.channelName)}))}))}async function O(e,t,n,r){const s=new Promise(((i,s)=>{const o={dbo:e,params:t,onChange:n,_onError:r,returnHandlers:e=>{i(e)}};m.push(o)})),o=async()=>{if(!p)return;const e=m.shift();if(e){const t=await async function(e,{tableName:t,command:n,param1:r,param2:s},o,a){function l(n){let i={unsubscribe:function(){return b(n,o)},filter:{...r}};return e[t].update&&(i={...i,update:function(n,i){return e[t].update(r,n,i)}}),e[t].delete&&(i={...i,delete:function(n){return e[t].delete(r,n)}}),Object.freeze(i)}p=!0;const c=Object.keys(u).find((e=>{let i=u[e];return i.tableName===t&&i.command===n&&JSON.stringify(i.param1||{})===JSON.stringify(r||{})&&JSON.stringify(i.param2||{})===JSON.stringify(s||{})}));if(c)return u[c].handlers.push(o),setTimeout((()=>{o&&(null==u?void 0:u[c].lastData)&&o(null==u?void 0:u[c].lastData)}),10),p=!1,l(c);const d=await S({tableName:t,command:n,param1:r,param2:s});let f=function(e,t){u[d]?e.data?(u[d].lastData=e.data,u[d].handlers.map((t=>{t(e.data)}))):e.err?u[d].errorHandlers.map((t=>{t(e.err)})):console.error("INTERNAL ERROR: Unexpected data format from subscription: ",e):console.warn("Orphaned subscription: ",d)},m=a||function(e){console.error(`Uncaught error within running subscription \n ${d}`,e)};return i.on(d,f),u[d]={lastData:void 0,tableName:t,command:n,param1:r,param2:s,onCall:f,handlers:[o],errorHandlers:[m],destroy:()=>{u[d]&&(Object.values(u[d]).map((e=>{e&&e.handlers&&e.handlers.map((e=>b(d,e)))})),delete u[d])}},p=!1,l(d)}(e.dbo,e.params,e.onChange,e._onError);e.returnHandlers(t)}m.length&&o()};return o(),s}return new Promise(((e,l)=>{o&&i.on("disconnect",o),i.on(r.CHANNELS.SCHEMA,(({schema:o,methods:m,tableSchema:p,auth:b,rawSQL:N,joinTables:v=[],err:C})=>{if(C)throw l(C),C;(0,t.debug)("destroySyncs",{subscriptions:u,syncedTables:d}),Object.values(u).map((e=>e.destroy())),u={},f={},Object.values(d).map((e=>{e&&e.destroy&&e.destroy()})),d={},y&&a&&a(i),y=!0;let j=JSON.parse(JSON.stringify(o)),E=JSON.parse(JSON.stringify(m)),P={},w={};if(b){if(b.pathGuard){const e=e=>{var t,n;(null==e?void 0:e.shouldReload)&&"undefined"!=typeof window&&(null===(n=null===(t=null===window||void 0===window?void 0:window.location)||void 0===t?void 0:t.reload)||void 0===n||n.call(t))};i.emit(r.CHANNELS.AUTHGUARD,JSON.stringify(window.location),((t,n)=>{e(n)})),i.removeAllListeners(r.CHANNELS.AUTHGUARD),i.on(r.CHANNELS.AUTHGUARD,(t=>{e(t)}))}w={...b},[r.CHANNELS.LOGIN,r.CHANNELS.LOGOUT,r.CHANNELS.REGISTER].map((e=>{b[e]&&(w[e]=function(t){return new Promise(((n,r)=>{i.emit(c+e,t,((e,t)=>{e?r(e):n(t)}))}))})}))}E.map((e=>{P[e]=function(...t){return new Promise(((n,s)=>{i.emit(r.CHANNELS.METHOD,{method:e,params:t},((e,t)=>{e?s(e):n(t)}))}))}})),P=Object.freeze(P),N&&(j.sql=function(e,t,n){return new Promise(((s,o)=>{i.emit(r.CHANNELS.SQL,{query:e,params:t,options:n},((e,t)=>{if(e)o(e);else if(n&&"noticeSubscription"===n.returnType&&t&&Object.keys(t).sort().join()===["socketChannel","socketUnsubChannel"].sort().join()&&!Object.values(t).find((e=>"string"!=typeof e))){const e=t,n=t=>(((e,t)=>{h=h||{config:t,listeners:[]},h.listeners.length||(i.removeAllListeners(t.socketChannel),i.on(t.socketChannel,(e=>{h&&h.listeners&&h.listeners.length?h.listeners.map((t=>{t(e)})):i.emit(t.socketUnsubChannel,{})}))),h.listeners.push(e)})(t,e),{...e,removeListener:()=>(e=>{h&&(h.listeners=h.listeners.filter((t=>t!==e)),!h.listeners.length&&h.config&&h.config.socketUnsubChannel&&i&&i.emit(h.config.socketUnsubChannel,{}))})(t)}),r={...e,addListener:n};s(r)}else if(n&&n.returnType&&"statement"===n.returnType||!t||Object.keys(t).sort().join()!==["socketChannel","socketUnsubChannel","notifChannel"].sort().join()||Object.values(t).find((e=>"string"!=typeof e)))s(t);else{const e=e=>(((e,t)=>{g=g||{},g[t.notifChannel]?g[t.notifChannel].listeners.push(e):(g[t.notifChannel]={config:t,listeners:[e]},i.removeAllListeners(t.socketChannel),i.on(t.socketChannel,(e=>{g[t.notifChannel]&&g[t.notifChannel].listeners&&g[t.notifChannel].listeners.length?g[t.notifChannel].listeners.map((t=>{t(e)})):i.emit(g[t.notifChannel].config.socketUnsubChannel,{})})))})(e,t),{...t,removeListener:()=>((e,t)=>{g&&g[t.notifChannel]&&(g[t.notifChannel].listeners=g[t.notifChannel].listeners.filter((t=>t!==e)),!g[t.notifChannel].listeners.length&&g[t.notifChannel].config&&g[t.notifChannel].config.socketUnsubChannel&&i&&(i.emit(g[t.notifChannel].config.socketUnsubChannel,{}),delete g[t.notifChannel]))})(e,t)}),n={...t,addListener:e};s(n)}}))}))});const T=e=>"[object Object]"===Object.prototype.toString.call(e),A=(e,t,n,r)=>{if(!T(e)||!T(t)||"function"!=typeof n||r&&"function"!=typeof r)throw"Expecting: ( basicFilter<object>, options<object>, onChange<function> , onError?<function>) but got something else"},x=["subscribe","subscribeOne"];Object.keys(j).forEach((e=>{Object.keys(j[e]).sort(((e,t)=>x.includes(e)-x.includes(t))).forEach((r=>{if(["find","findOne"].includes(r)&&(j[e].getJoinedTables=function(){return(v||[]).filter((t=>Array.isArray(t)&&t.includes(e))).flat().filter((t=>t!==e))}),"sync"===r){if(j[e]._syncInfo={...j[e][r]},n){j[e].getSync=(t,r={})=>n.create({name:e,filter:t,db:j,...r});const t=async(t={},r={},i)=>{const s=`${e}.${JSON.stringify(t)}.${JSON.stringify(r)}`;return d[s]||(d[s]=await n.create({...r,name:e,filter:t,db:j,onError:i})),d[s]};j[e].sync=async(e,n={handlesOnData:!0,select:"*"},r,i)=>{A(e,n,r,i);const s=await t(e,n,i);return await s.sync(r,n.handlesOnData)},j[e].syncOne=async(e,n={handlesOnData:!0},r,i)=>{A(e,n,r,i);const s=await t(e,n,i);return await s.syncOne(e,r,n.handlesOnData)}}j[e]._sync=function(n,s,o){return async function({tableName:e,command:n,param1:r,param2:s},o){const{onPullRequest:a,onSyncRequest:l,onUpdates:c}=o;function u(e){return Object.freeze({unsync:function(){!function(e,n){(0,t.debug)("_unsync",{channelName:e,triggers:n}),new Promise(((t,r)=>{f[e]&&(f[e].triggers=f[e].triggers.filter((e=>e.onPullRequest!==n.onPullRequest&&e.onSyncRequest!==n.onSyncRequest&&e.onUpdates!==n.onUpdates)),f[e].triggers.length||(i.emit(e+"unsync",{},((e,n)=>{e?r(e):t(n)})),i.removeListener(e,f[e].onCall),delete f[e]))}))}(e,o)},syncData:function(t,n,r){i.emit(e,{onSyncRequest:{...l({}),...{data:t}||{},...{deleted:n}||{}}},r?e=>{r(e)}:null)}})}const d=Object.keys(f).find((t=>{let i=f[t];return i.tableName===e&&i.command===n&&JSON.stringify(i.param1||{})===JSON.stringify(r||{})&&JSON.stringify(i.param2||{})===JSON.stringify(s||{})}));if(d)return f[d].triggers.push(o),u(d);{const m=await _({tableName:e,command:n,param1:r,param2:s},l),{channelName:h,synced_field:p,id_fields:g}=m;function y(t,n){t&&f[h]&&f[h].triggers.map((({onUpdates:r,onSyncRequest:i,onPullRequest:s})=>{t.data?Promise.resolve(r(t)).then((()=>{n&&n({ok:!0})})).catch((t=>{n?n({err:t}):console.error(e+" onUpdates error",t)})):t.onSyncRequest?Promise.resolve(i(t.onSyncRequest)).then((e=>n({onSyncRequest:e}))).catch((t=>{n?n({err:t}):console.error(e+" onSyncRequest error",t)})):t.onPullRequest?Promise.resolve(s(t.onPullRequest)).then((e=>{n({data:e})})).catch((t=>{n?n({err:t}):console.error(e+" onPullRequest error",t)})):console.log("unexpected response")}))}return f[h]={tableName:e,command:n,param1:r,param2:s,triggers:[o],syncInfo:m,onCall:y},i.on(h,y),u(h)}}({tableName:e,command:r,param1:n,param2:s},o)}}else if(x.includes(r)){j[e][r]=function(t,n,i,s){return A(t,n,i,s),O(j,{tableName:e,command:r,param1:t,param2:n},i,s)};const t="subscribeOne";r!==t&&x.includes(t)||(j[e][t]=function(t,n,i,s){return A(t,n,i,s),O(j,{tableName:e,command:r,param1:t,param2:n},(e=>{i(e[0])}),s)})}else j[e][r]=function(t,n,s){return new Promise(((o,a)=>{i.emit(c,{tableName:e,command:r,param1:t,param2:n,param3:s},((e,t)=>{e?a(e):o(t)}))}))}}))})),u&&Object.keys(u).length&&Object.keys(u).map((async e=>{try{let t=u[e];await S(t),i.on(e,t.onCall)}catch(e){console.error("There was an issue reconnecting old subscriptions",e)}})),f&&Object.keys(f).length&&Object.keys(f).filter((e=>f[e].triggers&&f[e].triggers.length)).map((async e=>{try{let t=f[e];await _(t,t.triggers[0].onSyncRequest),i.on(e,t.onCall)}catch(e){console.error("There was an issue reconnecting olf subscriptions",e)}})),v.flat().map((e=>{function t(t=!0,n,r,i){return{[t?"$leftJoin":"$innerJoin"]:e,filter:n,select:r,...i}}j.innerJoin=j.innerJoin||{},j.leftJoin=j.leftJoin||{},j.innerJoinOne=j.innerJoinOne||{},j.leftJoinOne=j.leftJoinOne||{},j.leftJoin[e]=(e,n,r={})=>t(!0,e,n,r),j.innerJoin[e]=(e,n,r={})=>t(!1,e,n,r),j.leftJoinOne[e]=(e,n,r={})=>t(!0,e,n,{...r,limit:1}),j.innerJoinOne[e]=(e,n,r={})=>t(!1,e,n,{...r,limit:1})})),(async()=>{try{await s(j,P,p,w)}catch(e){console.error("Prostgles: Error within onReady: \n",e),l(e)}e(j)})()}))}))}},792:function(e){var t;this||window,t=()=>(()=>{"use strict";var e={444:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.EXISTS_KEYS=t.GeomFilter_Funcs=t.GeomFilterKeys=t.ArrayFilterOperands=t.TextFilter_FullTextSearchFilterKeys=t.TextFilterFTSKeys=t.TextFilterKeys=t.CompareInFilterKeys=t.CompareFilterKeys=void 0,t.CompareFilterKeys=["=","$eq","<>",">",">=","<=","$eq","$ne","$gt","$gte","$lte"],t.CompareInFilterKeys=["$in","$nin"],t.TextFilterKeys=["$ilike","$like"],t.TextFilterFTSKeys=["@@","@>","<@","$contains","$containedBy"],t.TextFilter_FullTextSearchFilterKeys=["to_tsquery","plainto_tsquery","phraseto_tsquery","websearch_to_tsquery"],t.ArrayFilterOperands=[...t.TextFilterFTSKeys,"&&","$overlaps"],t.GeomFilterKeys=["~","~=","@","|&>","|>>",">>","=","<<|","<<","&>","&<|","&<","&&&","&&"];const n=["ST_MakeEnvelope","ST_MakePolygon"];t.GeomFilter_Funcs=n.concat(n.map((e=>e.toLowerCase()))),t.EXISTS_KEYS=["$exists","$notExists","$existsJoined","$notExistsJoined"]},590:function(e,t,n){var r=this&&this.__createBinding||(Object.create?function(e,t,n,r){void 0===r&&(r=n);var i=Object.getOwnPropertyDescriptor(t,n);i&&!("get"in i?!t.__esModule:i.writable||i.configurable)||(i={enumerable:!0,get:function(){return t[n]}}),Object.defineProperty(e,r,i)}:function(e,t,n,r){void 0===r&&(r=n),e[r]=t[n]}),i=this&&this.__exportStar||function(e,t){for(var n in e)"default"===n||Object.prototype.hasOwnProperty.call(t,n)||r(t,e,n)};Object.defineProperty(t,"__esModule",{value:!0}),t.getKeys=t.isObject=t.isDefined=t.get=t.WAL=t.unpatchText=t.stableStringify=t.isEmpty=t.getTextPatch=t.asName=t.RULE_METHODS=t.CHANNELS=t.TS_PG_Types=t._PG_postgis=t._PG_date=t._PG_bool=t._PG_json=t._PG_numbers=t._PG_strings=void 0,t._PG_strings=["bpchar","char","varchar","text","citext","uuid","bytea","inet","time","timetz","interval","name"],t._PG_numbers=["int2","int4","int8","float4","float8","numeric","money","oid"],t._PG_json=["json","jsonb"],t._PG_bool=["bool"],t._PG_date=["date","timestamp","timestamptz"],t._PG_postgis=["geometry","geography"],t.TS_PG_Types={string:t._PG_strings,number:t._PG_numbers,boolean:t._PG_bool,Date:t._PG_date,"Array<number>":t._PG_numbers.map((e=>`_${e}`)),"Array<boolean>":t._PG_bool.map((e=>`_${e}`)),"Array<string>":t._PG_strings.map((e=>`_${e}`)),"Array<Object>":t._PG_json.map((e=>`_${e}`)),"Array<Date>":t._PG_date.map((e=>`_${e}`)),any:[]};const s="_psqlWS_.";t.CHANNELS={SCHEMA_CHANGED:s+"schema-changed",SCHEMA:s+"schema",DEFAULT:s,SQL:"_psqlWS_.sql",METHOD:"_psqlWS_.method",NOTICE_EV:"_psqlWS_.notice",LISTEN_EV:"_psqlWS_.listen",REGISTER:"_psqlWS_.register",LOGIN:"_psqlWS_.login",LOGOUT:"_psqlWS_.logout",AUTHGUARD:"_psqlWS_.authguard",_preffix:s},t.RULE_METHODS={getColumns:["getColumns"],getInfo:["getInfo"],insert:["insert","upsert"],update:["update","upsert","updateBatch"],select:["findOne","find","count","size"],delete:["delete","remove"],sync:["sync","unsync"],subscribe:["unsubscribe","subscribe","subscribeOne"]};var o=n(128);Object.defineProperty(t,"asName",{enumerable:!0,get:function(){return o.asName}}),Object.defineProperty(t,"getTextPatch",{enumerable:!0,get:function(){return o.getTextPatch}}),Object.defineProperty(t,"isEmpty",{enumerable:!0,get:function(){return o.isEmpty}}),Object.defineProperty(t,"stableStringify",{enumerable:!0,get:function(){return o.stableStringify}}),Object.defineProperty(t,"unpatchText",{enumerable:!0,get:function(){return o.unpatchText}}),Object.defineProperty(t,"WAL",{enumerable:!0,get:function(){return o.WAL}}),Object.defineProperty(t,"get",{enumerable:!0,get:function(){return o.get}}),Object.defineProperty(t,"isDefined",{enumerable:!0,get:function(){return o.isDefined}}),Object.defineProperty(t,"isObject",{enumerable:!0,get:function(){return o.isObject}}),Object.defineProperty(t,"getKeys",{enumerable:!0,get:function(){return o.getKeys}}),i(n(444),t)},899:(e,t)=>{function n(e,t){var n=e[0],r=e[1],l=e[2],c=e[3];n=i(n,r,l,c,t[0],7,-680876936),c=i(c,n,r,l,t[1],12,-389564586),l=i(l,c,n,r,t[2],17,606105819),r=i(r,l,c,n,t[3],22,-1044525330),n=i(n,r,l,c,t[4],7,-176418897),c=i(c,n,r,l,t[5],12,1200080426),l=i(l,c,n,r,t[6],17,-1473231341),r=i(r,l,c,n,t[7],22,-45705983),n=i(n,r,l,c,t[8],7,1770035416),c=i(c,n,r,l,t[9],12,-1958414417),l=i(l,c,n,r,t[10],17,-42063),r=i(r,l,c,n,t[11],22,-1990404162),n=i(n,r,l,c,t[12],7,1804603682),c=i(c,n,r,l,t[13],12,-40341101),l=i(l,c,n,r,t[14],17,-1502002290),n=s(n,r=i(r,l,c,n,t[15],22,1236535329),l,c,t[1],5,-165796510),c=s(c,n,r,l,t[6],9,-1069501632),l=s(l,c,n,r,t[11],14,643717713),r=s(r,l,c,n,t[0],20,-373897302),n=s(n,r,l,c,t[5],5,-701558691),c=s(c,n,r,l,t[10],9,38016083),l=s(l,c,n,r,t[15],14,-660478335),r=s(r,l,c,n,t[4],20,-405537848),n=s(n,r,l,c,t[9],5,568446438),c=s(c,n,r,l,t[14],9,-1019803690),l=s(l,c,n,r,t[3],14,-187363961),r=s(r,l,c,n,t[8],20,1163531501),n=s(n,r,l,c,t[13],5,-1444681467),c=s(c,n,r,l,t[2],9,-51403784),l=s(l,c,n,r,t[7],14,1735328473),n=o(n,r=s(r,l,c,n,t[12],20,-1926607734),l,c,t[5],4,-378558),c=o(c,n,r,l,t[8],11,-2022574463),l=o(l,c,n,r,t[11],16,1839030562),r=o(r,l,c,n,t[14],23,-35309556),n=o(n,r,l,c,t[1],4,-1530992060),c=o(c,n,r,l,t[4],11,1272893353),l=o(l,c,n,r,t[7],16,-155497632),r=o(r,l,c,n,t[10],23,-1094730640),n=o(n,r,l,c,t[13],4,681279174),c=o(c,n,r,l,t[0],11,-358537222),l=o(l,c,n,r,t[3],16,-722521979),r=o(r,l,c,n,t[6],23,76029189),n=o(n,r,l,c,t[9],4,-640364487),c=o(c,n,r,l,t[12],11,-421815835),l=o(l,c,n,r,t[15],16,530742520),n=a(n,r=o(r,l,c,n,t[2],23,-995338651),l,c,t[0],6,-198630844),c=a(c,n,r,l,t[7],10,1126891415),l=a(l,c,n,r,t[14],15,-1416354905),r=a(r,l,c,n,t[5],21,-57434055),n=a(n,r,l,c,t[12],6,1700485571),c=a(c,n,r,l,t[3],10,-1894986606),l=a(l,c,n,r,t[10],15,-1051523),r=a(r,l,c,n,t[1],21,-2054922799),n=a(n,r,l,c,t[8],6,1873313359),c=a(c,n,r,l,t[15],10,-30611744),l=a(l,c,n,r,t[6],15,-1560198380),r=a(r,l,c,n,t[13],21,1309151649),n=a(n,r,l,c,t[4],6,-145523070),c=a(c,n,r,l,t[11],10,-1120210379),l=a(l,c,n,r,t[2],15,718787259),r=a(r,l,c,n,t[9],21,-343485551),e[0]=f(n,e[0]),e[1]=f(r,e[1]),e[2]=f(l,e[2]),e[3]=f(c,e[3])}function r(e,t,n,r,i,s){return t=f(f(t,e),f(r,s)),f(t<<i|t>>>32-i,n)}function i(e,t,n,i,s,o,a){return r(t&n|~t&i,e,t,s,o,a)}function s(e,t,n,i,s,o,a){return r(t&i|n&~i,e,t,s,o,a)}function o(e,t,n,i,s,o,a){return r(t^n^i,e,t,s,o,a)}function a(e,t,n,i,s,o,a){return r(n^(t|~i),e,t,s,o,a)}function l(e){var t,n=[];for(t=0;t<64;t+=4)n[t>>2]=e.charCodeAt(t)+(e.charCodeAt(t+1)<<8)+(e.charCodeAt(t+2)<<16)+(e.charCodeAt(t+3)<<24);return n}Object.defineProperty(t,"__esModule",{value:!0}),t.md5=t.md5cycle=void 0,t.md5cycle=n;var c="0123456789abcdef".split("");function u(e){for(var t="",n=0;n<4;n++)t+=c[e>>8*n+4&15]+c[e>>8*n&15];return t}function d(e){return function(e){for(var t=0;t<e.length;t++)e[t]=u(e[t]);return e.join("")}(function(e){var t,r=e.length,i=[1732584193,-271733879,-1732584194,271733878];for(t=64;t<=e.length;t+=64)n(i,l(e.substring(t-64,t)));e=e.substring(t-64);var s=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];for(t=0;t<e.length;t++)s[t>>2]|=e.charCodeAt(t)<<(t%4<<3);if(s[t>>2]|=128<<(t%4<<3),t>55)for(n(i,s),t=0;t<16;t++)s[t]=0;return s[14]=8*r,n(i,s),i}(e))}function f(e,t){return e+t&4294967295}t.md5=d,d("hello")},128:(e,t,n)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.getKeys=t.isDefined=t.isObject=t.get=t.isEmpty=t.WAL=t.unpatchText=t.getTextPatch=t.stableStringify=t.asName=void 0;const r=n(899);function i(e){for(var t in e)return!1;return!0}t.asName=function(e){if(null==e||!e.toString||!e.toString())throw"Expecting a non empty string";return`"${e.toString().replace(/"/g,'""')}"`},t.stableStringify=function(e,t){t||(t={}),"function"==typeof t&&(t={cmp:t});var n,r="boolean"==typeof t.cycles&&t.cycles,i=t.cmp&&(n=t.cmp,function(e){return function(t,r){var i={key:t,value:e[t]},s={key:r,value:e[r]};return n(i,s)}}),s=[];return function e(t){if(t&&t.toJSON&&"function"==typeof t.toJSON&&(t=t.toJSON()),void 0!==t){if("number"==typeof t)return isFinite(t)?""+t:"null";if("object"!=typeof t)return JSON.stringify(t);var n,o;if(Array.isArray(t)){for(o="[",n=0;n<t.length;n++)n&&(o+=","),o+=e(t[n])||"null";return o+"]"}if(null===t)return"null";if(-1!==s.indexOf(t)){if(r)return JSON.stringify("__cycle__");throw new TypeError("Converting circular structure to JSON")}var a=s.push(t)-1,l=Object.keys(t).sort(i&&i(t));for(o="",n=0;n<l.length;n++){var c=l[n],u=e(t[c]);u&&(o&&(o+=","),o+=JSON.stringify(c)+":"+u)}return s.splice(a,1),"{"+o+"}"}}(e)},t.getTextPatch=function(e,t){if(!(e&&t&&e.trim().length&&t.trim().length))return t;if(e===t)return{from:0,to:0,text:"",md5:(0,r.md5)(t)};function n(n=1){let r=n<1?-1:0,i=!1;for(;!i&&Math.abs(r)<=t.length;){const s=n<1?[r]:[0,r];e.slice(...s)!==t.slice(...s)?i=!0:r+=1*Math.sign(n)}return r}let i=n()-1,s=e.length+n(-1)+1,o=t.length+n(-1)+1;return{from:i,to:s,text:t.slice(i,o),md5:(0,r.md5)(t)}},t.unpatchText=function(e,t){if(!t||"string"==typeof t)return t;const{from:n,to:i,text:s,md5:o}=t;if(null===s||null===e)return s;let a=e.slice(0,n)+s+e.slice(i);if(o&&(0,r.md5)(a)!==o)throw"Patch text error: Could not match md5 hash: (original/result) \n"+e+"\n"+a;return a},t.WAL=class{constructor(e){if(this.changed={},this.sending={},this.sentHistory={},this.callbacks=[],this.sort=(e,t)=>{const{orderBy:n}=this.options;return n&&e&&t&&n.map((n=>{if(!(n.fieldName in e)||!(n.fieldName in t))throw"Replication error: \n   some orderBy fields missing from data";let r=n.asc?e[n.fieldName]:t[n.fieldName],i=n.asc?t[n.fieldName]:e[n.fieldName],s=+r-+i,o=r<i?-1:r==i?0:1;return"number"===n.tsDataType&&Number.isFinite(s)?s:o})).find((e=>e))||0},this.isInHistory=e=>{if(!e)throw"Provide item";const t=e[this.options.synced_field];if(!Number.isFinite(+t))throw"Provided item Synced field value is missing/invalid ";const n=this.sentHistory[this.getIdStr(e)],r=n?.[this.options.synced_field];if(n){if(!Number.isFinite(+r))throw"Provided historic item Synced field value is missing/invalid";if(+r==+t)return!0}return!1},this.addData=e=>{i(this.changed)&&this.options.onSendStart&&this.options.onSendStart(),e.map((e=>{var t;const{initial:n,current:r}={...e};if(!r)throw"Expecting { current: object, initial?: object }";const i=this.getIdStr(r);this.changed??(this.changed={}),(t=this.changed)[i]??(t[i]={initial:n,current:r}),this.changed[i].current={...this.changed[i].current,...r}})),this.sendItems()},this.isOnSending=!1,this.isSendingTimeout=void 0,this.willDeleteHistory=void 0,this.sendItems=async()=>{const{DEBUG_MODE:e,onSend:t,onSendEnd:n,batch_size:r,throttle:s,historyAgeSeconds:o=2}=this.options;if(this.isSendingTimeout||this.sending&&!i(this.sending))return;if(!this.changed||i(this.changed))return;let a,l=[],c=[],u={};Object.keys(this.changed).sort(((e,t)=>this.sort(this.changed[e].current,this.changed[t].current))).slice(0,r).map((e=>{let t={...this.changed[e]};this.sending[e]={...t},c.push({...t}),u[e]={...t.current},delete this.changed[e]})),l=c.map((e=>e.current)),e&&console.log(this.options.id," SENDING lr->",l[l.length-1]),this.isSendingTimeout||(this.isSendingTimeout=setTimeout((()=>{this.isSendingTimeout=void 0,i(this.changed)||this.sendItems()}),s)),this.isOnSending=!0;try{await t(l,c),o&&(this.sentHistory={...this.sentHistory,...u},this.willDeleteHistory||(this.willDeleteHistory=setTimeout((()=>{this.willDeleteHistory=void 0,this.sentHistory={}}),1e3*o)))}catch(e){a=e,console.error("WAL onSend failed:",e,l,c)}if(this.isOnSending=!1,this.callbacks.length){const e=Object.keys(this.sending);this.callbacks.forEach(((t,n)=>{t.idStrs=t.idStrs.filter((t=>e.includes(t))),t.idStrs.length||t.cb(a)})),this.callbacks=this.callbacks.filter((e=>e.idStrs.length))}this.sending={},e&&console.log(this.options.id," SENT lr->",l[l.length-1]),i(this.changed)?n&&n(l,c,a):this.sendItems()},this.options={...e},!this.options.orderBy){const{synced_field:t,id_fields:n}=e;this.options.orderBy=[t,...n.sort()].map((e=>({fieldName:e,tsDataType:e===t?"number":"string",asc:!0})))}}isSending(){const e=this.isOnSending||!(i(this.sending)&&i(this.changed));return this.options.DEBUG_MODE&&console.log(this.options.id," CHECKING isSending ->",e),e}getIdStr(e){return this.options.id_fields.sort().map((t=>`${e[t]||""}`)).join(".")}getIdObj(e){let t={};return this.options.id_fields.sort().map((n=>{t[n]=e[n]})),t}getDeltaObj(e){let t={};return Object.keys(e).map((n=>{this.options.id_fields.includes(n)||(t[n]=e[n])})),t}},t.isEmpty=i,t.get=function(e,t){let n=t,r=e;return e?("string"==typeof n&&(n=n.split(".")),n.reduce(((e,t)=>e&&e[t]?e[t]:void 0),r)):e},t.isObject=function(e){return Boolean(e&&"object"==typeof e&&!Array.isArray(e))},t.isDefined=function(e){return null!=e},t.getKeys=function(e){return Object.keys(e)}}},t={};return function n(r){var i=t[r];if(void 0!==i)return i.exports;var s=t[r]={exports:{}};return e[r].call(s.exports,s,s.exports,n),s.exports}(590)})(),e.exports=t()}},t={},function n(r){var i=t[r];if(void 0!==i)return i.exports;var s=t[r]={exports:{}};return e[r].call(s.exports,s,s.exports,n),s.exports}(274);var e,t}));