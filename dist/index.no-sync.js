!function(e,t){if("object"==typeof exports&&"object"==typeof module)module.exports=t();else if("function"==typeof define&&define.amd)define([],t);else{var n=t();for(var i in n)("object"==typeof exports?exports:e)[i]=n[i]}}(this||window,(()=>{return e={274:(e,t,n)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.prostgles=t.asName=t.debug=void 0;const i=n(792);Object.defineProperty(t,"asName",{enumerable:!0,get:function(){return i.asName}});const r="DEBUG_SYNCEDTABLE",s="undefined"!=typeof window;t.debug=function(...e){s&&window[r]&&window[r](...e)},t.prostgles=function(e,n){const{socket:r,onReady:a,onDisconnect:l,onReconnect:c,onSchemaChange:u=!0,onReload:p}=e;if((0,t.debug)("prostgles",{initOpts:e}),u){let e;"function"==typeof u&&(e=u),r.removeAllListeners(i.CHANNELS.SCHEMA_CHANGED),e&&r.on(i.CHANNELS.SCHEMA_CHANGED,e)}const d=i.CHANNELS._preffix;let m,f={},h={},g={},y={},b=!1;function O(e,n){return(0,t.debug)("_unsubscribe",{channelName:e,handler:n}),new Promise(((t,i)=>{f[e]?(f[e].handlers=f[e].handlers.filter((e=>e!==n)),f[e].handlers.length||(r.emit(e+"unsubscribe",{},((e,t)=>{e&&console.error(e)})),r.removeListener(e,f[e].onCall),delete f[e]),t(!0)):t(!0)}))}function v({tableName:e,command:t,param1:n,param2:i},s){return new Promise(((o,a)=>{r.emit(d,{tableName:e,command:t,param1:n,param2:i},((e,t)=>{if(e)console.error(e),a(e);else if(t){const{id_fields:e,synced_field:n,channelName:i}=t;r.emit(i,{onSyncRequest:s({})},(e=>{console.log(e)})),o({id_fields:e,synced_field:n,channelName:i})}}))}))}function _({tableName:e,command:t,param1:n,param2:i}){return new Promise(((s,o)=>{r.emit(d,{tableName:e,command:t,param1:n,param2:i},((e,t)=>{e?(console.error(e),o(e)):t&&s(t.channelName)}))}))}const S=new o((async function({tableName:e,command:n,param1:i,param2:s},o){const{onPullRequest:a,onSyncRequest:l,onUpdates:c}=o;function u(e){return Object.freeze({unsync:function(){!function(e,n){(0,t.debug)("_unsync",{channelName:e,triggers:n}),new Promise(((t,i)=>{g[e]&&(g[e].triggers=g[e].triggers.filter((e=>e.onPullRequest!==n.onPullRequest&&e.onSyncRequest!==n.onSyncRequest&&e.onUpdates!==n.onUpdates)),g[e].triggers.length||(r.emit(e+"unsync",{},((e,n)=>{e?i(e):t(n)})),r.removeListener(e,g[e].onCall),delete g[e]))}))}(e,o)},syncData:function(t,n,i){r.emit(e,{onSyncRequest:{...l({}),...{data:t}||{},...{deleted:n}||{}}},i?e=>{i(e)}:null)}})}const p=Object.keys(g).find((t=>{let r=g[t];return r.tableName===e&&r.command===n&&JSON.stringify(r.param1||{})===JSON.stringify(i||{})&&JSON.stringify(r.param2||{})===JSON.stringify(s||{})}));if(p)return g[p].triggers.push(o),u(p);{const d=await v({tableName:e,command:n,param1:i,param2:s},l),{channelName:m,synced_field:f,id_fields:h}=d;function y(t,n){t&&g[m]&&g[m].triggers.map((({onUpdates:i,onSyncRequest:r,onPullRequest:s})=>{t.data?Promise.resolve(i(t)).then((()=>{n&&n({ok:!0})})).catch((t=>{n?n({err:t}):console.error(e+" onUpdates error",t)})):t.onSyncRequest?Promise.resolve(r(t.onSyncRequest)).then((e=>n({onSyncRequest:e}))).catch((t=>{n?n({err:t}):console.error(e+" onSyncRequest error",t)})):t.onPullRequest?Promise.resolve(s(t.onPullRequest)).then((e=>{n({data:e})})).catch((t=>{n?n({err:t}):console.error(e+" onPullRequest error",t)})):console.log("unexpected response")}))}return g[m]={tableName:e,command:n,param1:i,param2:s,triggers:[o],syncInfo:d,onCall:y},r.on(m,y),u(m)}})),N=new o((async function(e,{tableName:t,command:n,param1:i,param2:s},o,a){function l(n){let r={unsubscribe:function(){return O(n,o)},filter:{...i}};return e[t].update&&(r={...r,update:function(n,r){return e[t].update(i,n,r)}}),e[t].delete&&(r={...r,delete:function(n){return e[t].delete(i,n)}}),Object.freeze(r)}const c=Object.keys(f).find((e=>{let r=f[e];return r.tableName===t&&r.command===n&&JSON.stringify(r.param1||{})===JSON.stringify(i||{})&&JSON.stringify(r.param2||{})===JSON.stringify(s||{})}));if(c)return f[c].handlers.push(o),setTimeout((()=>{o&&(null==f?void 0:f[c].lastData)&&o(null==f?void 0:f[c].lastData)}),10),l(c);const u=await _({tableName:t,command:n,param1:i,param2:s});let p=function(e,t){f[u]?e.data?(f[u].lastData=e.data,f[u].handlers.map((t=>{t(e.data)}))):e.err?f[u].errorHandlers.map((t=>{t(e.err)})):console.error("INTERNAL ERROR: Unexpected data format from subscription: ",e):console.warn("Orphaned subscription: ",u)},d=a||function(e){console.error(`Uncaught error within running subscription \n ${u}`,e)};return r.on(u,p),f[u]={lastData:void 0,tableName:t,command:n,param1:i,param2:s,onCall:p,handlers:[o],errorHandlers:[d],destroy:()=>{f[u]&&(Object.values(f[u]).map((e=>{e&&e.handlers&&e.handlers.map((e=>O(u,e)))})),delete f[u])}},l(u)}));async function x(e,t,n,i){return N.run([e,t,n,i])}return new Promise(((e,o)=>{r.removeAllListeners(i.CHANNELS.CONNECTION),r.on(i.CHANNELS.CONNECTION,(e=>(o(e),"ok"))),l&&r.on("disconnect",l),r.on(i.CHANNELS.SCHEMA,(({schema:l,methods:u,tableSchema:O,auth:N,rawSQL:j,joinTables:T=[],err:E})=>{if((0,t.debug)("destroySyncs",{subscriptions:f,syncedTables:h}),Object.values(f).map((e=>e.destroy())),f={},g={},Object.values(h).map((e=>{e&&e.destroy&&e.destroy()})),h={},b&&c&&(c(r,E),E))return void console.error(E);if(E)throw o(E),E;b=!0;let w=JSON.parse(JSON.stringify(l)),P=JSON.parse(JSON.stringify(u)),C={},A={};if(N){if(N.pathGuard&&s){const e=e=>{var t,n;(null==e?void 0:e.shouldReload)&&(p?p():"undefined"!=typeof window&&(null===(n=null===(t=null===window||void 0===window?void 0:window.location)||void 0===t?void 0:t.reload)||void 0===n||n.call(t)))};r.emit(i.CHANNELS.AUTHGUARD,JSON.stringify(window.location),((t,n)=>{e(n)})),r.removeAllListeners(i.CHANNELS.AUTHGUARD),r.on(i.CHANNELS.AUTHGUARD,(t=>{e(t)}))}A={...N},[i.CHANNELS.LOGIN,i.CHANNELS.LOGOUT,i.CHANNELS.REGISTER].map((e=>{N[e]&&(A[e]=function(t){return new Promise(((n,i)=>{r.emit(d+e,t,((e,t)=>{e?i(e):n(t)}))}))})}))}P.map((e=>{const t="string"==typeof e,n=function(...e){return new Promise(((t,n)=>{r.emit(i.CHANNELS.METHOD,{method:s,params:e},((e,i)=>{e?n(e):t(i)}))}))},s=t?e:e.name;C[s]=t?n:{...e,run:n}})),C=Object.freeze(C),j&&(w.sql=function(e,t,n){return new Promise(((s,o)=>{r.emit(i.CHANNELS.SQL,{query:e,params:t,options:n},((e,t)=>{if(e)o(e);else if(n&&"noticeSubscription"===n.returnType&&t&&Object.keys(t).sort().join()===["socketChannel","socketUnsubChannel"].sort().join()&&!Object.values(t).find((e=>"string"!=typeof e))){const e=t,n=t=>(((e,t)=>{m=m||{config:t,listeners:[]},m.listeners.length||(r.removeAllListeners(t.socketChannel),r.on(t.socketChannel,(e=>{m&&m.listeners&&m.listeners.length?m.listeners.map((t=>{t(e)})):r.emit(t.socketUnsubChannel,{})}))),m.listeners.push(e)})(t,e),{...e,removeListener:()=>(e=>{m&&(m.listeners=m.listeners.filter((t=>t!==e)),!m.listeners.length&&m.config&&m.config.socketUnsubChannel&&r&&r.emit(m.config.socketUnsubChannel,{}))})(t)}),i={...e,addListener:n};s(i)}else if(n&&n.returnType&&"statement"===n.returnType||!t||Object.keys(t).sort().join()!==["socketChannel","socketUnsubChannel","notifChannel"].sort().join()||Object.values(t).find((e=>"string"!=typeof e)))s(t);else{const e=e=>(((e,t)=>{y=y||{},y[t.notifChannel]?y[t.notifChannel].listeners.push(e):(y[t.notifChannel]={config:t,listeners:[e]},r.removeAllListeners(t.socketChannel),r.on(t.socketChannel,(e=>{y[t.notifChannel]&&y[t.notifChannel].listeners&&y[t.notifChannel].listeners.length?y[t.notifChannel].listeners.map((t=>{t(e)})):r.emit(y[t.notifChannel].config.socketUnsubChannel,{})})))})(e,t),{...t,removeListener:()=>((e,t)=>{y&&y[t.notifChannel]&&(y[t.notifChannel].listeners=y[t.notifChannel].listeners.filter((t=>t!==e)),!y[t.notifChannel].listeners.length&&y[t.notifChannel].config&&y[t.notifChannel].config.socketUnsubChannel&&r&&(r.emit(y[t.notifChannel].config.socketUnsubChannel,{}),delete y[t.notifChannel]))})(e,t)}),n={...t,addListener:e};s(n)}}))}))});const k=e=>"[object Object]"===Object.prototype.toString.call(e),J=(e,t,n,i)=>{if(!k(e)||!k(t)||"function"!=typeof n||i&&"function"!=typeof i)throw"Expecting: ( basicFilter<object>, options<object>, onChange<function> , onError?<function>) but got something else"},D=["subscribe","subscribeOne"];Object.keys(w).forEach((e=>{Object.keys(w[e]).sort(((e,t)=>D.includes(e)-D.includes(t))).forEach((t=>{if(["find","findOne"].includes(t)&&(w[e].getJoinedTables=function(){return(T||[]).filter((t=>Array.isArray(t)&&t.includes(e))).flat().filter((t=>t!==e))}),"sync"===t){if(w[e]._syncInfo={...w[e][t]},n){w[e].getSync=(t,i={})=>n.create({name:e,filter:t,db:w,...i});const t=async(t={},i={},r)=>{const s=`${e}.${JSON.stringify(t)}.${JSON.stringify(i)}`;return h[s]||(h[s]=await n.create({...i,name:e,filter:t,db:w,onError:r})),h[s]};w[e].sync=async(e,n={handlesOnData:!0,select:"*"},i,r)=>{J(e,n,i,r);const s=await t(e,n,r);return await s.sync(i,n.handlesOnData)},w[e].syncOne=async(e,n={handlesOnData:!0},i,r)=>{J(e,n,i,r);const s=await t(e,n,r);return await s.syncOne(e,i,n.handlesOnData)}}w[e]._sync=function(n,i,r){return async function(e,t){return S.run([e,t])}({tableName:e,command:t,param1:n,param2:i},r)}}else if(D.includes(t)){const n=function(n,i,r,s){return J(n,i,r,s),x(w,{tableName:e,command:t,param1:n,param2:i},r,s)};w[e][t]=n,w[e][t+"Hook"]=function(e,t,i){return{start:r=>n(e,t,r,i),args:[e,t,i]}};const i="subscribeOne";t!==i&&D.includes(i)||(w[e][i]=function(n,i,r,s){return J(n,i,r,s),x(w,{tableName:e,command:t,param1:n,param2:i},(e=>{r(e[0])}),s)})}else w[e][t]=function(n,i,s){return new Promise(((o,a)=>{r.emit(d,{tableName:e,command:t,param1:n,param2:i,param3:s},((e,t)=>{e?a(e):o(t)}))}))}}))})),f&&Object.keys(f).length&&Object.keys(f).map((async e=>{try{let t=f[e];await _(t),r.on(e,t.onCall)}catch(e){console.error("There was an issue reconnecting old subscriptions",e)}})),g&&Object.keys(g).length&&Object.keys(g).filter((e=>g[e].triggers&&g[e].triggers.length)).map((async e=>{try{let t=g[e];await v(t,t.triggers[0].onSyncRequest),r.on(e,t.onCall)}catch(e){console.error("There was an issue reconnecting olf subscriptions",e)}})),T.flat().map((e=>{function t(t=!0,n,i,r){return{[t?"$leftJoin":"$innerJoin"]:e,filter:n,select:i,...r}}w.innerJoin=w.innerJoin||{},w.leftJoin=w.leftJoin||{},w.innerJoinOne=w.innerJoinOne||{},w.leftJoinOne=w.leftJoinOne||{},w.leftJoin[e]=(e,n,i={})=>t(!0,e,n,i),w.innerJoin[e]=(e,n,i={})=>t(!1,e,n,i),w.leftJoinOne[e]=(e,n,i={})=>t(!0,e,n,{...i,limit:1}),w.innerJoinOne[e]=(e,n,i={})=>t(!1,e,n,{...i,limit:1})})),(async()=>{try{await a(w,C,O,A,b)}catch(e){console.error("Prostgles: Error within onReady: \n",e),o(e)}e(w)})()}))}))};class o{constructor(e){this.queue=[],this.isRunning=!1,this.func=e}async run(e){const t=new Promise(((t,n)=>{const i={arguments:e,onResult:t};this.queue.push(i)})),n=async()=>{if(this.isRunning)return;this.isRunning=!0;const e=this.queue.shift();if(e){const t=await this.func(...e.arguments);e.onResult(t)}this.isRunning=!1,this.queue.length&&n()};return n(),t}}},792:function(e){var t;this||window,t=()=>(()=>{"use strict";var e={31:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.CONTENT_TYPE_TO_EXT=void 0,t.CONTENT_TYPE_TO_EXT={"text/html":["html","htm","shtml"],"text/css":["css"],"text/csv":["csv"],"text/tsv":["tsv"],"text/xml":["xml"],"text/mathml":["mml"],"text/plain":["txt"],"text/vnd.sun.j2me.app-descriptor":["jad"],"text/vnd.wap.wml":["wml"],"text/x-component":["htc"],"image/gif":["gif"],"image/jpeg":["jpeg","jpg"],"image/png":["png"],"image/tiff":["tif","tiff"],"image/vnd.wap.wbmp":["wbmp"],"image/x-icon":["ico"],"image/x-jng":["jng"],"image/x-ms-bmp":["bmp"],"image/svg+xml":["svg"],"image/webp":["webp"],"application/sql":["sql"],"application/x-javascript":["js"],"application/atom+xml":["atom"],"application/rss+xml":["rss"],"application/java-archive":["jar","war","ear"],"application/mac-binhex40":["hqx"],"application/msword":["doc","docx"],"application/pdf":["pdf"],"application/postscript":["ps","eps","ai"],"application/rtf":["rtf"],"application/vnd.ms-excel":["xls","xlsx"],"application/vnd.ms-powerpoint":["ppt","pptx"],"application/vnd.wap.wmlc":["wmlc"],"application/vnd.google-earth.kml+xml":["kml"],"application/vnd.google-earth.kmz":["kmz"],"application/x-7z-compressed":["7z"],"application/x-cocoa":["cco"],"application/x-java-archive-diff":["jardiff"],"application/x-java-jnlp-file":["jnlp"],"application/x-makeself":["run"],"application/x-perl":["pl","pm"],"application/x-pilot":["prc","pdb"],"application/x-rar-compressed":["rar"],"application/x-redhat-package-manager":["rpm"],"application/x-sea":["sea"],"application/x-shockwave-flash":["swf"],"application/x-stuffit":["sit"],"application/x-tcl":["tcl","tk"],"application/x-x509-ca-cert":["der","pem","crt"],"application/x-xpinstall":["xpi"],"application/xhtml+xml":["xhtml"],"application/zip":["zip"],"application/octet-stream":["bin","exe","dll","deb","dmg","eot","iso","img","msi","msp","msm"],"audio/midi":["mid","midi","kar"],"audio/mpeg":["mp3"],"audio/ogg":["ogg"],"audio/x-realaudio":["ra"],"video/3gpp":["3gpp","3gp"],"video/mpeg":["mpeg","mpg"],"video/quicktime":["mov"],"video/x-flv":["flv"],"video/x-mng":["mng"],"video/x-ms-asf":["asx","asf"],"video/x-ms-wmv":["wmv"],"video/x-msvideo":["avi"],"video/mp4":["m4v","mp4"],"video/webm":["webm"]}},444:(e,t,n)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.COMPLEX_FILTER_KEY=t.EXISTS_KEYS=t.GeomFilter_Funcs=t.GeomFilterKeys=t.ArrayFilterOperands=t.TextFilter_FullTextSearchFilterKeys=t.TextFilterFTSKeys=t.TextFilterKeys=t.JsonbFilterKeys=t.JsonbOperands=t.CompareInFilterKeys=t.CompareFilterKeys=void 0;const i=n(128);t.CompareFilterKeys=["=","$eq","<>",">","<",">=","<=","$eq","$ne","$gt","$gte","$lte"],t.CompareInFilterKeys=["$in","$nin"],t.JsonbOperands={"@>":{Operator:"@>","Right Operand Type":"jsonb",Description:"Does the left JSON value contain the right JSON path/value entries at the top level?",Example:'\'{"a":1, "b":2}\'::jsonb @> \'{"b":2}\'::jsonb'},"<@":{Operator:"<@","Right Operand Type":"jsonb",Description:"Are the left JSON path/value entries contained at the top level within the right JSON value?",Example:'\'{"b":2}\'::jsonb <@ \'{"a":1, "b":2}\'::jsonb'},"?":{Operator:"?","Right Operand Type":"text",Description:"Does the string exist as a top-level key within the JSON value?",Example:"'{\"a\":1, \"b\":2}'::jsonb ? 'b'"},"?|":{Operator:"?|","Right Operand Type":"text[]",Description:"Do any of these array strings exist as top-level keys?",Example:"'{\"a\":1, \"b\":2, \"c\":3}'::jsonb ?| array['b', 'c']"},"?&":{Operator:"?&","Right Operand Type":"text[]",Description:"Do all of these array strings exist as top-level keys?",Example:"'[\"a\", \"b\"]'::jsonb ?& array['a', 'b']"},"||":{Operator:"||","Right Operand Type":"jsonb",Description:"Concatenate two jsonb values into a new jsonb value",Example:'\'["a", "b"]\'::jsonb || \'["c", "d"]\'::jsonb'},"-":{Operator:"-","Right Operand Type":"integer",Description:"Delete the array element with specified index (Negative integers count from the end). Throws an error if top level container is not an array.",Example:'\'["a", "b"]\'::jsonb - 1'},"#-":{Operator:"#-","Right Operand Type":"text[]",Description:"Delete the field or element with specified path (for JSON arrays, negative integers count from the end)",Example:"'[\"a\", {\"b\":1}]'::jsonb #- '{1,b}'"},"@?":{Operator:"@?","Right Operand Type":"jsonpath",Description:"Does JSON path return any item for the specified JSON value?",Example:"'{\"a\":[1,2,3,4,5]}'::jsonb @? '$.a[*] ? (@ > 2)'"},"@@":{Operator:"@@","Right Operand Type":"jsonpath",Description:"Returns the result of JSON path predicate check for the specified JSON value. Only the first item of the result is taken into account. If the result is not Boolean, then null is returned.",Example:"'{\"a\":[1,2,3,4,5]}'::jsonb @@ '$.a[*] > 2'"}},t.JsonbFilterKeys=(0,i.getKeys)(t.JsonbOperands),t.TextFilterKeys=["$ilike","$like","$nilike","$nlike"],t.TextFilterFTSKeys=["@@","@>","<@","$contains","$containedBy"],t.TextFilter_FullTextSearchFilterKeys=["to_tsquery","plainto_tsquery","phraseto_tsquery","websearch_to_tsquery"],t.ArrayFilterOperands=[...t.TextFilterFTSKeys,"&&","$overlaps"],t.GeomFilterKeys=["~","~=","@","|&>","|>>",">>","=","<<|","<<","&>","&<|","&<","&&&","&&"],t.GeomFilter_Funcs=["ST_MakeEnvelope","st_makeenvelope","ST_MakePolygon","st_makepolygon"],t.EXISTS_KEYS=["$exists","$notExists","$existsJoined","$notExistsJoined"],t.COMPLEX_FILTER_KEY="$filter"},590:function(e,t,n){var i=this&&this.__createBinding||(Object.create?function(e,t,n,i){void 0===i&&(i=n);var r=Object.getOwnPropertyDescriptor(t,n);r&&!("get"in r?!t.__esModule:r.writable||r.configurable)||(r={enumerable:!0,get:function(){return t[n]}}),Object.defineProperty(e,i,r)}:function(e,t,n,i){void 0===i&&(i=n),e[i]=t[n]}),r=this&&this.__exportStar||function(e,t){for(var n in e)"default"===n||Object.prototype.hasOwnProperty.call(t,n)||i(t,e,n)};Object.defineProperty(t,"__esModule",{value:!0}),t.CONTENT_TYPE_TO_EXT=t.getKeys=t.isObject=t.isDefined=t.get=t.WAL=t.unpatchText=t.stableStringify=t.isEmpty=t.getTextPatch=t.omitKeys=t.pickKeys=t.asName=t.RULE_METHODS=t.CHANNELS=t.JOIN_PARAMS=t.JOIN_KEYS=t.TS_PG_Types=t._PG_geometric=t._PG_postgis=t._PG_date=t._PG_bool=t._PG_json=t._PG_numbers=t._PG_strings=void 0,t._PG_strings=["bpchar","char","varchar","text","citext","uuid","bytea","time","timetz","interval","name","cidr","inet","macaddr","macaddr8","int4range","int8range","numrange","tsvector"],t._PG_numbers=["int2","int4","int8","float4","float8","numeric","money","oid"],t._PG_json=["json","jsonb"],t._PG_bool=["bool"],t._PG_date=["date","timestamp","timestamptz"],t._PG_postgis=["geometry","geography"],t._PG_geometric=["point","line","lseg","box","path","polygon","circle"];const s={string:[...t._PG_strings,...t._PG_date,"lseg"],number:t._PG_numbers,boolean:t._PG_bool,any:t._PG_json};t.TS_PG_Types={...s,"number[]":s.number.map((e=>`_${e}`)),"boolean[]":s.boolean.map((e=>`_${e}`)),"string[]":s.string.map((e=>`_${e}`)),"any[]":t._PG_json.map((e=>`_${e}`))},t.JOIN_KEYS=["$innerJoin","$leftJoin"],t.JOIN_PARAMS=["select","filter","$path","$condition","offset","limit","orderBy"];const o="_psqlWS_.";t.CHANNELS={SCHEMA_CHANGED:o+"schema-changed",SCHEMA:o+"schema",DEFAULT:o,SQL:"_psqlWS_.sql",METHOD:"_psqlWS_.method",NOTICE_EV:"_psqlWS_.notice",LISTEN_EV:"_psqlWS_.listen",REGISTER:"_psqlWS_.register",LOGIN:"_psqlWS_.login",LOGOUT:"_psqlWS_.logout",AUTHGUARD:"_psqlWS_.authguard",CONNECTION:"_psqlWS_.connection",_preffix:o},t.RULE_METHODS={getColumns:["getColumns"],getInfo:["getInfo"],insert:["insert","upsert"],update:["update","upsert","updateBatch"],select:["findOne","find","count","size"],delete:["delete","remove"],sync:["sync","unsync"],subscribe:["unsubscribe","subscribe","subscribeOne"]};var a=n(128);Object.defineProperty(t,"asName",{enumerable:!0,get:function(){return a.asName}}),Object.defineProperty(t,"pickKeys",{enumerable:!0,get:function(){return a.pickKeys}}),Object.defineProperty(t,"omitKeys",{enumerable:!0,get:function(){return a.omitKeys}}),Object.defineProperty(t,"getTextPatch",{enumerable:!0,get:function(){return a.getTextPatch}}),Object.defineProperty(t,"isEmpty",{enumerable:!0,get:function(){return a.isEmpty}}),Object.defineProperty(t,"stableStringify",{enumerable:!0,get:function(){return a.stableStringify}}),Object.defineProperty(t,"unpatchText",{enumerable:!0,get:function(){return a.unpatchText}}),Object.defineProperty(t,"WAL",{enumerable:!0,get:function(){return a.WAL}}),Object.defineProperty(t,"get",{enumerable:!0,get:function(){return a.get}}),Object.defineProperty(t,"isDefined",{enumerable:!0,get:function(){return a.isDefined}}),Object.defineProperty(t,"isObject",{enumerable:!0,get:function(){return a.isObject}}),Object.defineProperty(t,"getKeys",{enumerable:!0,get:function(){return a.getKeys}}),r(n(444),t);var l=n(31);Object.defineProperty(t,"CONTENT_TYPE_TO_EXT",{enumerable:!0,get:function(){return l.CONTENT_TYPE_TO_EXT}}),r(n(929),t)},929:(e,t,n)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.getJSONBSchemaAsJSONSchema=t.DATA_TYPES=t.PrimitiveArrayTypes=t.PrimitiveTypes=void 0;const i=n(128);t.PrimitiveTypes=["boolean","number","integer","string","Date","time","timestamp","any"],t.PrimitiveArrayTypes=t.PrimitiveTypes.map((e=>`${e}[]`)),t.DATA_TYPES=[...t.PrimitiveTypes,...t.PrimitiveArrayTypes];const r=(e,t)=>{const{type:n,arrayOf:s,arrayOfType:o,description:a,nullable:l,oneOf:c,oneOfType:u,title:p,record:d,...m}="string"==typeof e?{type:e}:e;let f={};const h={...(m.enum||m.allowedValues?.length)&&{enum:m.allowedValues?.slice(0)??m.enum.slice(0)},...!!a&&{description:a},...!!p&&{title:p}};if(m.enum?.length&&(h.type=typeof m.enum[0]),"string"==typeof n||s||o){if(n&&"string"!=typeof n)throw"Not expected";f=s||o||n?.endsWith("[]")?{type:"array",items:s||o?r(s||{type:o}):n?.startsWith("any")?{type:void 0}:{type:n?.slice(0,-2),...m.allowedValues&&{enum:m.allowedValues.slice(0)}}}:{type:n}}else(0,i.isObject)(n)?f={type:"object",required:(0,i.getKeys)(n).filter((e=>{const t=n[e];return"string"==typeof t||!t.optional})),properties:(0,i.getKeys)(n).reduce(((e,t)=>({...e,[t]:r(n[t])})),{})}:c||u?f={oneOf:(c||u.map((e=>({type:e})))).map((e=>r(e)))}:d&&(f={type:"object",...d.values&&!d.keysEnum&&{additionalProperties:r(d.values)},...d.keysEnum&&{properties:d.keysEnum.reduce(((e,t)=>({...e,[t]:d.values?r(d.values):{type:{}}})),{})}});if(l){const e={type:"null"};f.oneOf?f.oneOf.push(e):f.enum&&!f.enum.includes(null)?f.enum.push(null):f={oneOf:[f,e]}}return{...t?{$id:t?.id,$schema:"https://json-schema.org/draft/2020-12/schema"}:void 0,...h,...f}};t.getJSONBSchemaAsJSONSchema=function(e,t,n){return r(n,{id:`${e}.${t}`})}},899:(e,t)=>{function n(e,t){var n=e[0],i=e[1],l=e[2],c=e[3];n=r(n,i,l,c,t[0],7,-680876936),c=r(c,n,i,l,t[1],12,-389564586),l=r(l,c,n,i,t[2],17,606105819),i=r(i,l,c,n,t[3],22,-1044525330),n=r(n,i,l,c,t[4],7,-176418897),c=r(c,n,i,l,t[5],12,1200080426),l=r(l,c,n,i,t[6],17,-1473231341),i=r(i,l,c,n,t[7],22,-45705983),n=r(n,i,l,c,t[8],7,1770035416),c=r(c,n,i,l,t[9],12,-1958414417),l=r(l,c,n,i,t[10],17,-42063),i=r(i,l,c,n,t[11],22,-1990404162),n=r(n,i,l,c,t[12],7,1804603682),c=r(c,n,i,l,t[13],12,-40341101),l=r(l,c,n,i,t[14],17,-1502002290),n=s(n,i=r(i,l,c,n,t[15],22,1236535329),l,c,t[1],5,-165796510),c=s(c,n,i,l,t[6],9,-1069501632),l=s(l,c,n,i,t[11],14,643717713),i=s(i,l,c,n,t[0],20,-373897302),n=s(n,i,l,c,t[5],5,-701558691),c=s(c,n,i,l,t[10],9,38016083),l=s(l,c,n,i,t[15],14,-660478335),i=s(i,l,c,n,t[4],20,-405537848),n=s(n,i,l,c,t[9],5,568446438),c=s(c,n,i,l,t[14],9,-1019803690),l=s(l,c,n,i,t[3],14,-187363961),i=s(i,l,c,n,t[8],20,1163531501),n=s(n,i,l,c,t[13],5,-1444681467),c=s(c,n,i,l,t[2],9,-51403784),l=s(l,c,n,i,t[7],14,1735328473),n=o(n,i=s(i,l,c,n,t[12],20,-1926607734),l,c,t[5],4,-378558),c=o(c,n,i,l,t[8],11,-2022574463),l=o(l,c,n,i,t[11],16,1839030562),i=o(i,l,c,n,t[14],23,-35309556),n=o(n,i,l,c,t[1],4,-1530992060),c=o(c,n,i,l,t[4],11,1272893353),l=o(l,c,n,i,t[7],16,-155497632),i=o(i,l,c,n,t[10],23,-1094730640),n=o(n,i,l,c,t[13],4,681279174),c=o(c,n,i,l,t[0],11,-358537222),l=o(l,c,n,i,t[3],16,-722521979),i=o(i,l,c,n,t[6],23,76029189),n=o(n,i,l,c,t[9],4,-640364487),c=o(c,n,i,l,t[12],11,-421815835),l=o(l,c,n,i,t[15],16,530742520),n=a(n,i=o(i,l,c,n,t[2],23,-995338651),l,c,t[0],6,-198630844),c=a(c,n,i,l,t[7],10,1126891415),l=a(l,c,n,i,t[14],15,-1416354905),i=a(i,l,c,n,t[5],21,-57434055),n=a(n,i,l,c,t[12],6,1700485571),c=a(c,n,i,l,t[3],10,-1894986606),l=a(l,c,n,i,t[10],15,-1051523),i=a(i,l,c,n,t[1],21,-2054922799),n=a(n,i,l,c,t[8],6,1873313359),c=a(c,n,i,l,t[15],10,-30611744),l=a(l,c,n,i,t[6],15,-1560198380),i=a(i,l,c,n,t[13],21,1309151649),n=a(n,i,l,c,t[4],6,-145523070),c=a(c,n,i,l,t[11],10,-1120210379),l=a(l,c,n,i,t[2],15,718787259),i=a(i,l,c,n,t[9],21,-343485551),e[0]=d(n,e[0]),e[1]=d(i,e[1]),e[2]=d(l,e[2]),e[3]=d(c,e[3])}function i(e,t,n,i,r,s){return t=d(d(t,e),d(i,s)),d(t<<r|t>>>32-r,n)}function r(e,t,n,r,s,o,a){return i(t&n|~t&r,e,t,s,o,a)}function s(e,t,n,r,s,o,a){return i(t&r|n&~r,e,t,s,o,a)}function o(e,t,n,r,s,o,a){return i(t^n^r,e,t,s,o,a)}function a(e,t,n,r,s,o,a){return i(n^(t|~r),e,t,s,o,a)}function l(e){var t,n=[];for(t=0;t<64;t+=4)n[t>>2]=e.charCodeAt(t)+(e.charCodeAt(t+1)<<8)+(e.charCodeAt(t+2)<<16)+(e.charCodeAt(t+3)<<24);return n}Object.defineProperty(t,"__esModule",{value:!0}),t.md5=t.md5cycle=void 0,t.md5cycle=n;var c="0123456789abcdef".split("");function u(e){for(var t="",n=0;n<4;n++)t+=c[e>>8*n+4&15]+c[e>>8*n&15];return t}function p(e){return function(e){for(var t=0;t<e.length;t++)e[t]=u(e[t]);return e.join("")}(function(e){var t,i=e.length,r=[1732584193,-271733879,-1732584194,271733878];for(t=64;t<=e.length;t+=64)n(r,l(e.substring(t-64,t)));e=e.substring(t-64);var s=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];for(t=0;t<e.length;t++)s[t>>2]|=e.charCodeAt(t)<<(t%4<<3);if(s[t>>2]|=128<<(t%4<<3),t>55)for(n(r,s),t=0;t<16;t++)s[t]=0;return s[14]=8*i,n(r,s),r}(e))}function d(e,t){return e+t&4294967295}t.md5=p,p("hello")},128:(e,t,n)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.getKeys=t.isDefined=t.isObject=t.get=t.isEmpty=t.WAL=t.unpatchText=t.getTextPatch=t.stableStringify=t.find=t.filter=t.omitKeys=t.pickKeys=t.asName=void 0;const i=n(899);function r(e,t=[],n=!1){let i=t;if(!i.length)return{};if(e&&i.length){let t={};return i.forEach((i=>{n&&void 0===e[i]||(t[i]=e[i])})),t}return e}function s(e,t){return e.filter((e=>Object.entries(t).every((([t,n])=>e[t]===n))))}function o(e){for(var t in e)return!1;return!0}function a(e){return Object.keys(e)}t.asName=function(e){if(null==e||!e.toString||!e.toString())throw"Expecting a non empty string";return`"${e.toString().replace(/"/g,'""')}"`},t.pickKeys=r,t.omitKeys=function(e,t){return r(e,a(e).filter((e=>!t.includes(e))))},t.filter=s,t.find=function(e,t){return s(e,t)[0]},t.stableStringify=function(e,t){t||(t={}),"function"==typeof t&&(t={cmp:t});var n,i="boolean"==typeof t.cycles&&t.cycles,r=t.cmp&&(n=t.cmp,function(e){return function(t,i){var r={key:t,value:e[t]},s={key:i,value:e[i]};return n(r,s)}}),s=[];return function e(t){if(t&&t.toJSON&&"function"==typeof t.toJSON&&(t=t.toJSON()),void 0!==t){if("number"==typeof t)return isFinite(t)?""+t:"null";if("object"!=typeof t)return JSON.stringify(t);var n,o;if(Array.isArray(t)){for(o="[",n=0;n<t.length;n++)n&&(o+=","),o+=e(t[n])||"null";return o+"]"}if(null===t)return"null";if(-1!==s.indexOf(t)){if(i)return JSON.stringify("__cycle__");throw new TypeError("Converting circular structure to JSON")}var a=s.push(t)-1,l=Object.keys(t).sort(r&&r(t));for(o="",n=0;n<l.length;n++){var c=l[n],u=e(t[c]);u&&(o&&(o+=","),o+=JSON.stringify(c)+":"+u)}return s.splice(a,1),"{"+o+"}"}}(e)},t.getTextPatch=function(e,t){if(!(e&&t&&e.trim().length&&t.trim().length))return t;if(e===t)return{from:0,to:0,text:"",md5:(0,i.md5)(t)};function n(n=1){let i=n<1?-1:0,r=!1;for(;!r&&Math.abs(i)<=t.length;){const s=n<1?[i]:[0,i];e.slice(...s)!==t.slice(...s)?r=!0:i+=1*Math.sign(n)}return i}let r=n()-1,s=e.length+n(-1)+1,o=t.length+n(-1)+1;return{from:r,to:s,text:t.slice(r,o),md5:(0,i.md5)(t)}},t.unpatchText=function(e,t){if(!t||"string"==typeof t)return t;const{from:n,to:r,text:s,md5:o}=t;if(null===s||null===e)return s;let a=e.slice(0,n)+s+e.slice(r);if(o&&(0,i.md5)(a)!==o)throw"Patch text error: Could not match md5 hash: (original/result) \n"+e+"\n"+a;return a},t.WAL=class{constructor(e){if(this.changed={},this.sending={},this.sentHistory={},this.callbacks=[],this.sort=(e,t)=>{const{orderBy:n}=this.options;return n&&e&&t&&n.map((n=>{if(!(n.fieldName in e)||!(n.fieldName in t))throw"Replication error: \n   some orderBy fields missing from data";let i=n.asc?e[n.fieldName]:t[n.fieldName],r=n.asc?t[n.fieldName]:e[n.fieldName],s=+i-+r,o=i<r?-1:i==r?0:1;return"number"===n.tsDataType&&Number.isFinite(s)?s:o})).find((e=>e))||0},this.isInHistory=e=>{if(!e)throw"Provide item";const t=e[this.options.synced_field];if(!Number.isFinite(+t))throw"Provided item Synced field value is missing/invalid ";const n=this.sentHistory[this.getIdStr(e)],i=n?.[this.options.synced_field];if(n){if(!Number.isFinite(+i))throw"Provided historic item Synced field value is missing/invalid";if(+i==+t)return!0}return!1},this.addData=e=>{o(this.changed)&&this.options.onSendStart&&this.options.onSendStart(),e.map((e=>{var t;const{initial:n,current:i,delta:r}={...e};if(!i)throw"Expecting { current: object, initial?: object }";const s=this.getIdStr(i);this.changed??(this.changed={}),(t=this.changed)[s]??(t[s]={initial:n,current:i,delta:r}),this.changed[s].current={...this.changed[s].current,...i},this.changed[s].delta={...this.changed[s].delta,...r}})),this.sendItems()},this.isOnSending=!1,this.isSendingTimeout=void 0,this.willDeleteHistory=void 0,this.sendItems=async()=>{const{DEBUG_MODE:e,onSend:t,onSendEnd:n,batch_size:i,throttle:r,historyAgeSeconds:s=2}=this.options;if(this.isSendingTimeout||this.sending&&!o(this.sending))return;if(!this.changed||o(this.changed))return;let a,l=[],c=[],u={};Object.keys(this.changed).sort(((e,t)=>this.sort(this.changed[e].current,this.changed[t].current))).slice(0,i).map((e=>{let t={...this.changed[e]};this.sending[e]={...t},c.push({...t}),u[e]={...t.current},delete this.changed[e]})),l=c.map((e=>{let t={};return Object.keys(e.current).map((n=>{const i=e.initial?.[n],r=e.current[n];var s,o;![this.options.synced_field,...this.options.id_fields].includes(n)&&((s=i)===(o=r)||(["number","string","boolean"].includes(typeof s)?s===o:JSON.stringify(s)===JSON.stringify(o)))||(t[n]=r)})),t})),e&&console.log(this.options.id," SENDING lr->",l[l.length-1]),this.isSendingTimeout||(this.isSendingTimeout=setTimeout((()=>{this.isSendingTimeout=void 0,o(this.changed)||this.sendItems()}),r)),this.isOnSending=!0;try{await t(l,c),s&&(this.sentHistory={...this.sentHistory,...u},this.willDeleteHistory||(this.willDeleteHistory=setTimeout((()=>{this.willDeleteHistory=void 0,this.sentHistory={}}),1e3*s)))}catch(e){a=e,console.error("WAL onSend failed:",e,l,c)}if(this.isOnSending=!1,this.callbacks.length){const e=Object.keys(this.sending);this.callbacks.forEach(((t,n)=>{t.idStrs=t.idStrs.filter((t=>e.includes(t))),t.idStrs.length||t.cb(a)})),this.callbacks=this.callbacks.filter((e=>e.idStrs.length))}this.sending={},e&&console.log(this.options.id," SENT lr->",l[l.length-1]),o(this.changed)?n&&n(l,c,a):this.sendItems()},this.options={...e},!this.options.orderBy){const{synced_field:t,id_fields:n}=e;this.options.orderBy=[t,...n.sort()].map((e=>({fieldName:e,tsDataType:e===t?"number":"string",asc:!0})))}}isSending(){const e=this.isOnSending||!(o(this.sending)&&o(this.changed));return this.options.DEBUG_MODE&&console.log(this.options.id," CHECKING isSending ->",e),e}getIdStr(e){return this.options.id_fields.sort().map((t=>`${e[t]||""}`)).join(".")}getIdObj(e){let t={};return this.options.id_fields.sort().map((n=>{t[n]=e[n]})),t}getDeltaObj(e){let t={};return Object.keys(e).map((n=>{this.options.id_fields.includes(n)||(t[n]=e[n])})),t}},t.isEmpty=o,t.get=function(e,t){let n=t,i=e;return e?("string"==typeof n&&(n=n.split(".")),n.reduce(((e,t)=>e&&e[t]?e[t]:void 0),i)):e},t.isObject=function(e){return Boolean(e&&"object"==typeof e&&!Array.isArray(e))},t.isDefined=function(e){return null!=e},t.getKeys=a}},t={};return function n(i){var r=t[i];if(void 0!==r)return r.exports;var s=t[i]={exports:{}};return e[i].call(s.exports,s,s.exports,n),s.exports}(590)})(),e.exports=t()}},t={},function n(i){var r=t[i];if(void 0!==r)return r.exports;var s=t[i]={exports:{}};return e[i].call(s.exports,s,s.exports,n),s.exports}(274);var e,t}));