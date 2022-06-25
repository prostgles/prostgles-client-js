!function(e,t){if("object"==typeof exports&&"object"==typeof module)module.exports=t();else if("function"==typeof define&&define.amd)define([],t);else{var n=t();for(var i in n)("object"==typeof exports?exports:e)[i]=n[i]}}(this||window,(()=>{return e={274:(e,t,n)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.prostgles=t.debug=void 0;const i=n(792),r="DEBUG_SYNCEDTABLE",s="undefined"!=typeof window;t.debug=function(...e){s&&window[r]&&window[r](...e)},t.prostgles=function(e,n){const{socket:r,onReady:s,onDisconnect:a,onReconnect:c,onSchemaChange:l=!0}=e;if((0,t.debug)("prostgles",{initOpts:e}),l){let e;"function"==typeof l&&(e=l),r.removeAllListeners(i.CHANNELS.SCHEMA_CHANGED),e&&r.on(i.CHANNELS.SCHEMA_CHANGED,e)}const u=i.CHANNELS._preffix;let d,f={},m={},h={},p=!1,g={},y=!1;function b(e,n){return(0,t.debug)("_unsubscribe",{channelName:e,handler:n}),new Promise(((t,i)=>{f[e]?(f[e].handlers=f[e].handlers.filter((e=>e!==n)),f[e].handlers.length||(r.emit(e+"unsubscribe",{},((e,t)=>{e&&console.error(e)})),r.removeListener(e,f[e].onCall),delete f[e]),t(!0)):t(!0)}))}function _({tableName:e,command:t,param1:n,param2:i},s){return new Promise(((o,a)=>{r.emit(u,{tableName:e,command:t,param1:n,param2:i},((e,t)=>{if(e)console.error(e),a(e);else if(t){const{id_fields:e,synced_field:n,channelName:i}=t;r.emit(i,{onSyncRequest:s({})},(e=>{console.log(e)})),o({id_fields:e,synced_field:n,channelName:i})}}))}))}function S({tableName:e,command:t,param1:n,param2:i}){return new Promise(((s,o)=>{r.emit(u,{tableName:e,command:t,param1:n,param2:i},((e,t)=>{e?(console.error(e),o(e)):t&&s(t.channelName)}))}))}const O=new o((async function({tableName:e,command:n,param1:i,param2:s},o){const{onPullRequest:a,onSyncRequest:c,onUpdates:l}=o;function u(e){return Object.freeze({unsync:function(){!function(e,n){(0,t.debug)("_unsync",{channelName:e,triggers:n}),new Promise(((t,i)=>{h[e]&&(h[e].triggers=h[e].triggers.filter((e=>e.onPullRequest!==n.onPullRequest&&e.onSyncRequest!==n.onSyncRequest&&e.onUpdates!==n.onUpdates)),h[e].triggers.length||(r.emit(e+"unsync",{},((e,n)=>{e?i(e):t(n)})),r.removeListener(e,h[e].onCall),delete h[e]))}))}(e,o)},syncData:function(t,n,i){r.emit(e,{onSyncRequest:{...c({}),...{data:t}||{},...{deleted:n}||{}}},i?e=>{i(e)}:null)}})}const d=Object.keys(h).find((t=>{let r=h[t];return r.tableName===e&&r.command===n&&JSON.stringify(r.param1||{})===JSON.stringify(i||{})&&JSON.stringify(r.param2||{})===JSON.stringify(s||{})}));if(d)return h[d].triggers.push(o),u(d);{const f=await _({tableName:e,command:n,param1:i,param2:s},c),{channelName:m,synced_field:p,id_fields:g}=f;function y(t,n){t&&h[m]&&h[m].triggers.map((({onUpdates:i,onSyncRequest:r,onPullRequest:s})=>{t.data?Promise.resolve(i(t)).then((()=>{n&&n({ok:!0})})).catch((t=>{n?n({err:t}):console.error(e+" onUpdates error",t)})):t.onSyncRequest?Promise.resolve(r(t.onSyncRequest)).then((e=>n({onSyncRequest:e}))).catch((t=>{n?n({err:t}):console.error(e+" onSyncRequest error",t)})):t.onPullRequest?Promise.resolve(s(t.onPullRequest)).then((e=>{n({data:e})})).catch((t=>{n?n({err:t}):console.error(e+" onPullRequest error",t)})):console.log("unexpected response")}))}return h[m]={tableName:e,command:n,param1:i,param2:s,triggers:[o],syncInfo:f,onCall:y},r.on(m,y),u(m)}})),N=new o((async function(e,{tableName:t,command:n,param1:i,param2:s},o,a){function c(n){let r={unsubscribe:function(){return b(n,o)},filter:{...i}};return e[t].update&&(r={...r,update:function(n,r){return e[t].update(i,n,r)}}),e[t].delete&&(r={...r,delete:function(n){return e[t].delete(i,n)}}),Object.freeze(r)}p=!0;const l=Object.keys(f).find((e=>{let r=f[e];return r.tableName===t&&r.command===n&&JSON.stringify(r.param1||{})===JSON.stringify(i||{})&&JSON.stringify(r.param2||{})===JSON.stringify(s||{})}));if(l)return f[l].handlers.push(o),setTimeout((()=>{o&&(null==f?void 0:f[l].lastData)&&o(null==f?void 0:f[l].lastData)}),10),p=!1,c(l);const u=await S({tableName:t,command:n,param1:i,param2:s});let d=function(e,t){f[u]?e.data?(f[u].lastData=e.data,f[u].handlers.map((t=>{t(e.data)}))):e.err?f[u].errorHandlers.map((t=>{t(e.err)})):console.error("INTERNAL ERROR: Unexpected data format from subscription: ",e):console.warn("Orphaned subscription: ",u)},m=a||function(e){console.error(`Uncaught error within running subscription \n ${u}`,e)};return r.on(u,d),f[u]={lastData:void 0,tableName:t,command:n,param1:i,param2:s,onCall:d,handlers:[o],errorHandlers:[m],destroy:()=>{f[u]&&(Object.values(f[u]).map((e=>{e&&e.handlers&&e.handlers.map((e=>b(u,e)))})),delete f[u])}},p=!1,c(u)}));async function v(e,t,n,i){return N.run([e,t,n,i])}return new Promise(((e,o)=>{a&&r.on("disconnect",a),r.on(i.CHANNELS.SCHEMA,(({schema:a,methods:l,tableSchema:p,auth:b,rawSQL:N,joinTables:C=[],err:j})=>{if(j)throw o(j),j;(0,t.debug)("destroySyncs",{subscriptions:f,syncedTables:m}),Object.values(f).map((e=>e.destroy())),f={},h={},Object.values(m).map((e=>{e&&e.destroy&&e.destroy()})),m={},y&&c&&c(r),y=!0;let E=JSON.parse(JSON.stringify(a)),P=JSON.parse(JSON.stringify(l)),w={},T={};if(b){if(b.pathGuard){const e=e=>{var t,n;(null==e?void 0:e.shouldReload)&&"undefined"!=typeof window&&(null===(n=null===(t=null===window||void 0===window?void 0:window.location)||void 0===t?void 0:t.reload)||void 0===n||n.call(t))};r.emit(i.CHANNELS.AUTHGUARD,JSON.stringify(window.location),((t,n)=>{e(n)})),r.removeAllListeners(i.CHANNELS.AUTHGUARD),r.on(i.CHANNELS.AUTHGUARD,(t=>{e(t)}))}T={...b},[i.CHANNELS.LOGIN,i.CHANNELS.LOGOUT,i.CHANNELS.REGISTER].map((e=>{b[e]&&(T[e]=function(t){return new Promise(((n,i)=>{r.emit(u+e,t,((e,t)=>{e?i(e):n(t)}))}))})}))}P.map((e=>{w[e]=function(...t){return new Promise(((n,s)=>{r.emit(i.CHANNELS.METHOD,{method:e,params:t},((e,t)=>{e?s(e):n(t)}))}))}})),w=Object.freeze(w),N&&(E.sql=function(e,t,n){return new Promise(((s,o)=>{r.emit(i.CHANNELS.SQL,{query:e,params:t,options:n},((e,t)=>{if(e)o(e);else if(n&&"noticeSubscription"===n.returnType&&t&&Object.keys(t).sort().join()===["socketChannel","socketUnsubChannel"].sort().join()&&!Object.values(t).find((e=>"string"!=typeof e))){const e=t,n=t=>(((e,t)=>{d=d||{config:t,listeners:[]},d.listeners.length||(r.removeAllListeners(t.socketChannel),r.on(t.socketChannel,(e=>{d&&d.listeners&&d.listeners.length?d.listeners.map((t=>{t(e)})):r.emit(t.socketUnsubChannel,{})}))),d.listeners.push(e)})(t,e),{...e,removeListener:()=>(e=>{d&&(d.listeners=d.listeners.filter((t=>t!==e)),!d.listeners.length&&d.config&&d.config.socketUnsubChannel&&r&&r.emit(d.config.socketUnsubChannel,{}))})(t)}),i={...e,addListener:n};s(i)}else if(n&&n.returnType&&"statement"===n.returnType||!t||Object.keys(t).sort().join()!==["socketChannel","socketUnsubChannel","notifChannel"].sort().join()||Object.values(t).find((e=>"string"!=typeof e)))s(t);else{const e=e=>(((e,t)=>{g=g||{},g[t.notifChannel]?g[t.notifChannel].listeners.push(e):(g[t.notifChannel]={config:t,listeners:[e]},r.removeAllListeners(t.socketChannel),r.on(t.socketChannel,(e=>{g[t.notifChannel]&&g[t.notifChannel].listeners&&g[t.notifChannel].listeners.length?g[t.notifChannel].listeners.map((t=>{t(e)})):r.emit(g[t.notifChannel].config.socketUnsubChannel,{})})))})(e,t),{...t,removeListener:()=>((e,t)=>{g&&g[t.notifChannel]&&(g[t.notifChannel].listeners=g[t.notifChannel].listeners.filter((t=>t!==e)),!g[t.notifChannel].listeners.length&&g[t.notifChannel].config&&g[t.notifChannel].config.socketUnsubChannel&&r&&(r.emit(g[t.notifChannel].config.socketUnsubChannel,{}),delete g[t.notifChannel]))})(e,t)}),n={...t,addListener:e};s(n)}}))}))});const A=e=>"[object Object]"===Object.prototype.toString.call(e),x=(e,t,n,i)=>{if(!A(e)||!A(t)||"function"!=typeof n||i&&"function"!=typeof i)throw"Expecting: ( basicFilter<object>, options<object>, onChange<function> , onError?<function>) but got something else"},G=["subscribe","subscribeOne"];Object.keys(E).forEach((e=>{Object.keys(E[e]).sort(((e,t)=>G.includes(e)-G.includes(t))).forEach((t=>{if(["find","findOne"].includes(t)&&(E[e].getJoinedTables=function(){return(C||[]).filter((t=>Array.isArray(t)&&t.includes(e))).flat().filter((t=>t!==e))}),"sync"===t){if(E[e]._syncInfo={...E[e][t]},n){E[e].getSync=(t,i={})=>n.create({name:e,filter:t,db:E,...i});const t=async(t={},i={},r)=>{const s=`${e}.${JSON.stringify(t)}.${JSON.stringify(i)}`;return m[s]||(m[s]=await n.create({...i,name:e,filter:t,db:E,onError:r})),m[s]};E[e].sync=async(e,n={handlesOnData:!0,select:"*"},i,r)=>{x(e,n,i,r);const s=await t(e,n,r);return await s.sync(i,n.handlesOnData)},E[e].syncOne=async(e,n={handlesOnData:!0},i,r)=>{x(e,n,i,r);const s=await t(e,n,r);return await s.syncOne(e,i,n.handlesOnData)}}E[e]._sync=function(n,i,r){return async function(e,t){return O.run([e,t])}({tableName:e,command:t,param1:n,param2:i},r)}}else if(G.includes(t)){E[e][t]=function(n,i,r,s){return x(n,i,r,s),v(E,{tableName:e,command:t,param1:n,param2:i},r,s)};const n="subscribeOne";t!==n&&G.includes(n)||(E[e][n]=function(n,i,r,s){return x(n,i,r,s),v(E,{tableName:e,command:t,param1:n,param2:i},(e=>{r(e[0])}),s)})}else E[e][t]=function(n,i,s){return new Promise(((o,a)=>{r.emit(u,{tableName:e,command:t,param1:n,param2:i,param3:s},((e,t)=>{e?a(e):o(t)}))}))}}))})),f&&Object.keys(f).length&&Object.keys(f).map((async e=>{try{let t=f[e];await S(t),r.on(e,t.onCall)}catch(e){console.error("There was an issue reconnecting old subscriptions",e)}})),h&&Object.keys(h).length&&Object.keys(h).filter((e=>h[e].triggers&&h[e].triggers.length)).map((async e=>{try{let t=h[e];await _(t,t.triggers[0].onSyncRequest),r.on(e,t.onCall)}catch(e){console.error("There was an issue reconnecting olf subscriptions",e)}})),C.flat().map((e=>{function t(t=!0,n,i,r){return{[t?"$leftJoin":"$innerJoin"]:e,filter:n,select:i,...r}}E.innerJoin=E.innerJoin||{},E.leftJoin=E.leftJoin||{},E.innerJoinOne=E.innerJoinOne||{},E.leftJoinOne=E.leftJoinOne||{},E.leftJoin[e]=(e,n,i={})=>t(!0,e,n,i),E.innerJoin[e]=(e,n,i={})=>t(!1,e,n,i),E.leftJoinOne[e]=(e,n,i={})=>t(!0,e,n,{...i,limit:1}),E.innerJoinOne[e]=(e,n,i={})=>t(!1,e,n,{...i,limit:1})})),(async()=>{try{await s(E,w,p,T)}catch(e){console.error("Prostgles: Error within onReady: \n",e),o(e)}e(E)})()}))}))};class o{constructor(e){this.queue=[],this.isRunning=!1,this.func=e}async run(e){const t=new Promise(((t,n)=>{const i={arguments:e,onResult:t};this.queue.push(i)})),n=async()=>{if(this.isRunning)return;this.isRunning=!0;const e=this.queue.shift();if(e){const t=await this.func(...e.arguments);e.onResult(t)}this.isRunning=!1,this.queue.length&&n()};return n(),t}}},792:function(e){var t;this||window,t=()=>(()=>{"use strict";var e={444:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.EXISTS_KEYS=t.GeomFilter_Funcs=t.GeomFilterKeys=t.ArrayFilterOperands=t.TextFilter_FullTextSearchFilterKeys=t.TextFilterFTSKeys=t.TextFilterKeys=t.CompareInFilterKeys=t.CompareFilterKeys=void 0,t.CompareFilterKeys=["=","$eq","<>",">",">=","<=","$eq","$ne","$gt","$gte","$lte"],t.CompareInFilterKeys=["$in","$nin"],t.TextFilterKeys=["$ilike","$like"],t.TextFilterFTSKeys=["@@","@>","<@","$contains","$containedBy"],t.TextFilter_FullTextSearchFilterKeys=["to_tsquery","plainto_tsquery","phraseto_tsquery","websearch_to_tsquery"],t.ArrayFilterOperands=[...t.TextFilterFTSKeys,"&&","$overlaps"],t.GeomFilterKeys=["~","~=","@","|&>","|>>",">>","=","<<|","<<","&>","&<|","&<","&&&","&&"];const n=["ST_MakeEnvelope","ST_MakePolygon"];t.GeomFilter_Funcs=n.concat(n.map((e=>e.toLowerCase()))),t.EXISTS_KEYS=["$exists","$notExists","$existsJoined","$notExistsJoined"]},590:function(e,t,n){var i=this&&this.__createBinding||(Object.create?function(e,t,n,i){void 0===i&&(i=n);var r=Object.getOwnPropertyDescriptor(t,n);r&&!("get"in r?!t.__esModule:r.writable||r.configurable)||(r={enumerable:!0,get:function(){return t[n]}}),Object.defineProperty(e,i,r)}:function(e,t,n,i){void 0===i&&(i=n),e[i]=t[n]}),r=this&&this.__exportStar||function(e,t){for(var n in e)"default"===n||Object.prototype.hasOwnProperty.call(t,n)||i(t,e,n)};Object.defineProperty(t,"__esModule",{value:!0}),t.getKeys=t.isObject=t.isDefined=t.get=t.WAL=t.unpatchText=t.stableStringify=t.isEmpty=t.getTextPatch=t.asName=t.RULE_METHODS=t.CHANNELS=t.TS_PG_Types=t._PG_postgis=t._PG_date=t._PG_bool=t._PG_json=t._PG_numbers=t._PG_strings=void 0,t._PG_strings=["bpchar","char","varchar","text","citext","uuid","bytea","inet","time","timetz","interval","name"],t._PG_numbers=["int2","int4","int8","float4","float8","numeric","money","oid"],t._PG_json=["json","jsonb"],t._PG_bool=["bool"],t._PG_date=["date","timestamp","timestamptz"],t._PG_postgis=["geometry","geography"],t.TS_PG_Types={string:t._PG_strings,number:t._PG_numbers,boolean:t._PG_bool,Date:t._PG_date,"Array<number>":t._PG_numbers.map((e=>`_${e}`)),"Array<boolean>":t._PG_bool.map((e=>`_${e}`)),"Array<string>":t._PG_strings.map((e=>`_${e}`)),"Array<Object>":t._PG_json.map((e=>`_${e}`)),"Array<Date>":t._PG_date.map((e=>`_${e}`)),any:[]};const s="_psqlWS_.";t.CHANNELS={SCHEMA_CHANGED:s+"schema-changed",SCHEMA:s+"schema",DEFAULT:s,SQL:"_psqlWS_.sql",METHOD:"_psqlWS_.method",NOTICE_EV:"_psqlWS_.notice",LISTEN_EV:"_psqlWS_.listen",REGISTER:"_psqlWS_.register",LOGIN:"_psqlWS_.login",LOGOUT:"_psqlWS_.logout",AUTHGUARD:"_psqlWS_.authguard",_preffix:s},t.RULE_METHODS={getColumns:["getColumns"],getInfo:["getInfo"],insert:["insert","upsert"],update:["update","upsert","updateBatch"],select:["findOne","find","count","size"],delete:["delete","remove"],sync:["sync","unsync"],subscribe:["unsubscribe","subscribe","subscribeOne"]};var o=n(128);Object.defineProperty(t,"asName",{enumerable:!0,get:function(){return o.asName}}),Object.defineProperty(t,"getTextPatch",{enumerable:!0,get:function(){return o.getTextPatch}}),Object.defineProperty(t,"isEmpty",{enumerable:!0,get:function(){return o.isEmpty}}),Object.defineProperty(t,"stableStringify",{enumerable:!0,get:function(){return o.stableStringify}}),Object.defineProperty(t,"unpatchText",{enumerable:!0,get:function(){return o.unpatchText}}),Object.defineProperty(t,"WAL",{enumerable:!0,get:function(){return o.WAL}}),Object.defineProperty(t,"get",{enumerable:!0,get:function(){return o.get}}),Object.defineProperty(t,"isDefined",{enumerable:!0,get:function(){return o.isDefined}}),Object.defineProperty(t,"isObject",{enumerable:!0,get:function(){return o.isObject}}),Object.defineProperty(t,"getKeys",{enumerable:!0,get:function(){return o.getKeys}}),r(n(444),t)},899:(e,t)=>{function n(e,t){var n=e[0],i=e[1],c=e[2],l=e[3];n=r(n,i,c,l,t[0],7,-680876936),l=r(l,n,i,c,t[1],12,-389564586),c=r(c,l,n,i,t[2],17,606105819),i=r(i,c,l,n,t[3],22,-1044525330),n=r(n,i,c,l,t[4],7,-176418897),l=r(l,n,i,c,t[5],12,1200080426),c=r(c,l,n,i,t[6],17,-1473231341),i=r(i,c,l,n,t[7],22,-45705983),n=r(n,i,c,l,t[8],7,1770035416),l=r(l,n,i,c,t[9],12,-1958414417),c=r(c,l,n,i,t[10],17,-42063),i=r(i,c,l,n,t[11],22,-1990404162),n=r(n,i,c,l,t[12],7,1804603682),l=r(l,n,i,c,t[13],12,-40341101),c=r(c,l,n,i,t[14],17,-1502002290),n=s(n,i=r(i,c,l,n,t[15],22,1236535329),c,l,t[1],5,-165796510),l=s(l,n,i,c,t[6],9,-1069501632),c=s(c,l,n,i,t[11],14,643717713),i=s(i,c,l,n,t[0],20,-373897302),n=s(n,i,c,l,t[5],5,-701558691),l=s(l,n,i,c,t[10],9,38016083),c=s(c,l,n,i,t[15],14,-660478335),i=s(i,c,l,n,t[4],20,-405537848),n=s(n,i,c,l,t[9],5,568446438),l=s(l,n,i,c,t[14],9,-1019803690),c=s(c,l,n,i,t[3],14,-187363961),i=s(i,c,l,n,t[8],20,1163531501),n=s(n,i,c,l,t[13],5,-1444681467),l=s(l,n,i,c,t[2],9,-51403784),c=s(c,l,n,i,t[7],14,1735328473),n=o(n,i=s(i,c,l,n,t[12],20,-1926607734),c,l,t[5],4,-378558),l=o(l,n,i,c,t[8],11,-2022574463),c=o(c,l,n,i,t[11],16,1839030562),i=o(i,c,l,n,t[14],23,-35309556),n=o(n,i,c,l,t[1],4,-1530992060),l=o(l,n,i,c,t[4],11,1272893353),c=o(c,l,n,i,t[7],16,-155497632),i=o(i,c,l,n,t[10],23,-1094730640),n=o(n,i,c,l,t[13],4,681279174),l=o(l,n,i,c,t[0],11,-358537222),c=o(c,l,n,i,t[3],16,-722521979),i=o(i,c,l,n,t[6],23,76029189),n=o(n,i,c,l,t[9],4,-640364487),l=o(l,n,i,c,t[12],11,-421815835),c=o(c,l,n,i,t[15],16,530742520),n=a(n,i=o(i,c,l,n,t[2],23,-995338651),c,l,t[0],6,-198630844),l=a(l,n,i,c,t[7],10,1126891415),c=a(c,l,n,i,t[14],15,-1416354905),i=a(i,c,l,n,t[5],21,-57434055),n=a(n,i,c,l,t[12],6,1700485571),l=a(l,n,i,c,t[3],10,-1894986606),c=a(c,l,n,i,t[10],15,-1051523),i=a(i,c,l,n,t[1],21,-2054922799),n=a(n,i,c,l,t[8],6,1873313359),l=a(l,n,i,c,t[15],10,-30611744),c=a(c,l,n,i,t[6],15,-1560198380),i=a(i,c,l,n,t[13],21,1309151649),n=a(n,i,c,l,t[4],6,-145523070),l=a(l,n,i,c,t[11],10,-1120210379),c=a(c,l,n,i,t[2],15,718787259),i=a(i,c,l,n,t[9],21,-343485551),e[0]=f(n,e[0]),e[1]=f(i,e[1]),e[2]=f(c,e[2]),e[3]=f(l,e[3])}function i(e,t,n,i,r,s){return t=f(f(t,e),f(i,s)),f(t<<r|t>>>32-r,n)}function r(e,t,n,r,s,o,a){return i(t&n|~t&r,e,t,s,o,a)}function s(e,t,n,r,s,o,a){return i(t&r|n&~r,e,t,s,o,a)}function o(e,t,n,r,s,o,a){return i(t^n^r,e,t,s,o,a)}function a(e,t,n,r,s,o,a){return i(n^(t|~r),e,t,s,o,a)}function c(e){var t,n=[];for(t=0;t<64;t+=4)n[t>>2]=e.charCodeAt(t)+(e.charCodeAt(t+1)<<8)+(e.charCodeAt(t+2)<<16)+(e.charCodeAt(t+3)<<24);return n}Object.defineProperty(t,"__esModule",{value:!0}),t.md5=t.md5cycle=void 0,t.md5cycle=n;var l="0123456789abcdef".split("");function u(e){for(var t="",n=0;n<4;n++)t+=l[e>>8*n+4&15]+l[e>>8*n&15];return t}function d(e){return function(e){for(var t=0;t<e.length;t++)e[t]=u(e[t]);return e.join("")}(function(e){var t,i=e.length,r=[1732584193,-271733879,-1732584194,271733878];for(t=64;t<=e.length;t+=64)n(r,c(e.substring(t-64,t)));e=e.substring(t-64);var s=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];for(t=0;t<e.length;t++)s[t>>2]|=e.charCodeAt(t)<<(t%4<<3);if(s[t>>2]|=128<<(t%4<<3),t>55)for(n(r,s),t=0;t<16;t++)s[t]=0;return s[14]=8*i,n(r,s),r}(e))}function f(e,t){return e+t&4294967295}t.md5=d,d("hello")},128:(e,t,n)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.getKeys=t.isDefined=t.isObject=t.get=t.isEmpty=t.WAL=t.unpatchText=t.getTextPatch=t.stableStringify=t.asName=void 0;const i=n(899);function r(e){for(var t in e)return!1;return!0}t.asName=function(e){if(null==e||!e.toString||!e.toString())throw"Expecting a non empty string";return`"${e.toString().replace(/"/g,'""')}"`},t.stableStringify=function(e,t){t||(t={}),"function"==typeof t&&(t={cmp:t});var n,i="boolean"==typeof t.cycles&&t.cycles,r=t.cmp&&(n=t.cmp,function(e){return function(t,i){var r={key:t,value:e[t]},s={key:i,value:e[i]};return n(r,s)}}),s=[];return function e(t){if(t&&t.toJSON&&"function"==typeof t.toJSON&&(t=t.toJSON()),void 0!==t){if("number"==typeof t)return isFinite(t)?""+t:"null";if("object"!=typeof t)return JSON.stringify(t);var n,o;if(Array.isArray(t)){for(o="[",n=0;n<t.length;n++)n&&(o+=","),o+=e(t[n])||"null";return o+"]"}if(null===t)return"null";if(-1!==s.indexOf(t)){if(i)return JSON.stringify("__cycle__");throw new TypeError("Converting circular structure to JSON")}var a=s.push(t)-1,c=Object.keys(t).sort(r&&r(t));for(o="",n=0;n<c.length;n++){var l=c[n],u=e(t[l]);u&&(o&&(o+=","),o+=JSON.stringify(l)+":"+u)}return s.splice(a,1),"{"+o+"}"}}(e)},t.getTextPatch=function(e,t){if(!(e&&t&&e.trim().length&&t.trim().length))return t;if(e===t)return{from:0,to:0,text:"",md5:(0,i.md5)(t)};function n(n=1){let i=n<1?-1:0,r=!1;for(;!r&&Math.abs(i)<=t.length;){const s=n<1?[i]:[0,i];e.slice(...s)!==t.slice(...s)?r=!0:i+=1*Math.sign(n)}return i}let r=n()-1,s=e.length+n(-1)+1,o=t.length+n(-1)+1;return{from:r,to:s,text:t.slice(r,o),md5:(0,i.md5)(t)}},t.unpatchText=function(e,t){if(!t||"string"==typeof t)return t;const{from:n,to:r,text:s,md5:o}=t;if(null===s||null===e)return s;let a=e.slice(0,n)+s+e.slice(r);if(o&&(0,i.md5)(a)!==o)throw"Patch text error: Could not match md5 hash: (original/result) \n"+e+"\n"+a;return a},t.WAL=class{constructor(e){if(this.changed={},this.sending={},this.sentHistory={},this.callbacks=[],this.sort=(e,t)=>{const{orderBy:n}=this.options;return n&&e&&t&&n.map((n=>{if(!(n.fieldName in e)||!(n.fieldName in t))throw"Replication error: \n   some orderBy fields missing from data";let i=n.asc?e[n.fieldName]:t[n.fieldName],r=n.asc?t[n.fieldName]:e[n.fieldName],s=+i-+r,o=i<r?-1:i==r?0:1;return"number"===n.tsDataType&&Number.isFinite(s)?s:o})).find((e=>e))||0},this.isInHistory=e=>{if(!e)throw"Provide item";const t=e[this.options.synced_field];if(!Number.isFinite(+t))throw"Provided item Synced field value is missing/invalid ";const n=this.sentHistory[this.getIdStr(e)],i=n?.[this.options.synced_field];if(n){if(!Number.isFinite(+i))throw"Provided historic item Synced field value is missing/invalid";if(+i==+t)return!0}return!1},this.addData=e=>{r(this.changed)&&this.options.onSendStart&&this.options.onSendStart(),e.map((e=>{var t;const{initial:n,current:i}={...e};if(!i)throw"Expecting { current: object, initial?: object }";const r=this.getIdStr(i);this.changed??(this.changed={}),(t=this.changed)[r]??(t[r]={initial:n,current:i}),this.changed[r].current={...this.changed[r].current,...i}})),this.sendItems()},this.isOnSending=!1,this.isSendingTimeout=void 0,this.willDeleteHistory=void 0,this.sendItems=async()=>{const{DEBUG_MODE:e,onSend:t,onSendEnd:n,batch_size:i,throttle:s,historyAgeSeconds:o=2}=this.options;if(this.isSendingTimeout||this.sending&&!r(this.sending))return;if(!this.changed||r(this.changed))return;let a,c=[],l=[],u={};Object.keys(this.changed).sort(((e,t)=>this.sort(this.changed[e].current,this.changed[t].current))).slice(0,i).map((e=>{let t={...this.changed[e]};this.sending[e]={...t},l.push({...t}),u[e]={...t.current},delete this.changed[e]})),c=l.map((e=>e.current)),e&&console.log(this.options.id," SENDING lr->",c[c.length-1]),this.isSendingTimeout||(this.isSendingTimeout=setTimeout((()=>{this.isSendingTimeout=void 0,r(this.changed)||this.sendItems()}),s)),this.isOnSending=!0;try{await t(c,l),o&&(this.sentHistory={...this.sentHistory,...u},this.willDeleteHistory||(this.willDeleteHistory=setTimeout((()=>{this.willDeleteHistory=void 0,this.sentHistory={}}),1e3*o)))}catch(e){a=e,console.error("WAL onSend failed:",e,c,l)}if(this.isOnSending=!1,this.callbacks.length){const e=Object.keys(this.sending);this.callbacks.forEach(((t,n)=>{t.idStrs=t.idStrs.filter((t=>e.includes(t))),t.idStrs.length||t.cb(a)})),this.callbacks=this.callbacks.filter((e=>e.idStrs.length))}this.sending={},e&&console.log(this.options.id," SENT lr->",c[c.length-1]),r(this.changed)?n&&n(c,l,a):this.sendItems()},this.options={...e},!this.options.orderBy){const{synced_field:t,id_fields:n}=e;this.options.orderBy=[t,...n.sort()].map((e=>({fieldName:e,tsDataType:e===t?"number":"string",asc:!0})))}}isSending(){const e=this.isOnSending||!(r(this.sending)&&r(this.changed));return this.options.DEBUG_MODE&&console.log(this.options.id," CHECKING isSending ->",e),e}getIdStr(e){return this.options.id_fields.sort().map((t=>`${e[t]||""}`)).join(".")}getIdObj(e){let t={};return this.options.id_fields.sort().map((n=>{t[n]=e[n]})),t}getDeltaObj(e){let t={};return Object.keys(e).map((n=>{this.options.id_fields.includes(n)||(t[n]=e[n])})),t}},t.isEmpty=r,t.get=function(e,t){let n=t,i=e;return e?("string"==typeof n&&(n=n.split(".")),n.reduce(((e,t)=>e&&e[t]?e[t]:void 0),i)):e},t.isObject=function(e){return Boolean(e&&"object"==typeof e&&!Array.isArray(e))},t.isDefined=function(e){return null!=e},t.getKeys=function(e){return Object.keys(e)}}},t={};return function n(i){var r=t[i];if(void 0!==r)return r.exports;var s=t[i]={exports:{}};return e[i].call(s.exports,s,s.exports,n),s.exports}(590)})(),e.exports=t()}},t={},function n(i){var r=t[i];if(void 0!==r)return r.exports;var s=t[i]={exports:{}};return e[i].call(s.exports,s,s.exports,n),s.exports}(274);var e,t}));