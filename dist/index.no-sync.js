!function(e,t){if("object"==typeof exports&&"object"==typeof module)module.exports=t();else if("function"==typeof define&&define.amd)define([],t);else{var n=t();for(var i in n)("object"==typeof exports?exports:e)[i]=n[i]}}(this||window,(function(){return(()=>{var e={133:(e,t,n)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.SyncedTable=t.debug=void 0;const i=n(792),s="DEBUG_SYNCEDTABLE",r="undefined"!=typeof window;t.debug=function(...e){r&&window[s]&&window[s](...e)};const o={array:"array",localStorage:"localStorage",object:"object"};class a{constructor({name:e,filter:n,onChange:s,onReady:a,db:l,skipFirstTrigger:c=!1,select:h="*",storageType:u="object",patchText:d=!1,patchJSON:f=!1,onError:m}){if(this.throttle=100,this.batch_size=50,this.skipFirstTrigger=!1,this.columns=[],this._multiSubscriptions=[],this._singleSubscriptions=[],this.items=[],this.itemsObj={},this.isSynced=!1,this.updatePatches=async e=>{let t=e.map((e=>e.current)),n=[],s=[];if(this.columns&&this.columns.length&&this.db[this.name].updateBatch&&(this.patchText||this.patchJSON)){const r=this.columns.filter((e=>"text"===e.data_type));if(this.patchText&&r.length){t=[];const o=[this.synced_field,...this.id_fields];await Promise.all(e.slice(0).map((async(e,a)=>{const{current:l,initial:c}={...e};let h;c&&(r.map((e=>{!o.includes(e.name)&&e.name in l&&(h=h||{...l},h[e.name]=i.getTextPatch(c[e.name],l[e.name]))})),h&&(s.push(h),n.push([this.wal.getIdObj(h),this.wal.getDeltaObj(h)]))),h||t.push(l)})))}}if(n.length)try{await this.db[this.name].updateBatch(n)}catch(e){console.log("failed to patch update",e),t=t.concat(s)}return t.filter((e=>e))},this.notifySubscribers=(e=[])=>{if(!this.isSynced)return;let t=[],n=[],i=[];e.map((({idObj:e,newItem:s,delta:r})=>{this.singleSubscriptions.filter((t=>this.matchesIdObj(t.idObj,e))).map((async e=>{try{await e.notify(s,r)}catch(e){console.error("SyncedTable failed to notify: ",e)}})),this.matchesFilter(s)&&(t.push(s),n.push(r),i.push(e))}));let s=[],r=[];if(this.getItems().map((e=>{s.push({...e});const i=t.findIndex((t=>this.matchesIdObj(e,t)));r.push(n[i])})),this.onChange)try{this.onChange(s,r)}catch(e){console.error("SyncedTable failed to notify onChange: ",e)}this.multiSubscriptions.map((async e=>{try{await e.notify(s,r)}catch(e){console.error("SyncedTable failed to notify: ",e)}}))},this.unsubscribe=e=>(this.singleSubscriptions=this.singleSubscriptions.filter((t=>t._onChange!==e)),this.multiSubscriptions=this.multiSubscriptions.filter((t=>t._onChange!==e)),t.debug("unsubscribe",this),"ok"),this.unsync=()=>{this.dbSync&&this.dbSync.unsync&&this.dbSync.unsync()},this.destroy=()=>{this.unsync(),this.multiSubscriptions=[],this.singleSubscriptions=[],this.itemsObj={},this.items=[],this.onChange=null},this.delete=async(e,t=!1)=>{const n=this.getIdObj(e);return this.setItem(n,null,!0,!0),t||await this.db[this.name].delete(n),this.notifySubscribers(),!0},this.checkItemCols=e=>{if(this.columns&&this.columns.length){const t=Object.keys({...e}).filter((e=>!this.columns.find((t=>t.name===e))));if(t.length)throw"Unexpected columns in sync item update: "+t.join(", ")}},this.upsert=async(e,t=!1)=>{if(!(e&&e.length||t))throw"No data provided for upsert";let n,s=[],r=[];await Promise.all(e.map((async(e,o)=>{let a={...e.idObj},l={...e.delta};Object.keys(l).map((e=>{void 0===l[e]&&(l[e]=null)})),t||this.checkItemCols({...e.delta,...e.idObj});let c=this.getItem(a),h=c.index,u=c.data;!t&&!i.isEmpty(l)||i.isEmpty(u)||(l=this.getDelta(u||{},l)),t||(l[this.synced_field]=Date.now());let d={...u,...l,...a};u&&u[this.synced_field]<d[this.synced_field]?n="updated":u||(n="inserted"),this.setItem(d,h);let f={idObj:a,delta:l,oldItem:u,newItem:d,status:n,from_server:t};return t||r.push({initial:u,current:{...l,...a}}),f.delta&&!i.isEmpty(f.delta)&&s.push(f),!0}))).catch((e=>{console.error("SyncedTable failed upsert: ",e)})),this.notifySubscribers(s),!t&&r.length&&this.wal.addData(r)},this.setItems=e=>{if(this.storageType===o.localStorage){if(!r)throw"Cannot access window object. Choose another storage method (array OR object)";window.localStorage.setItem(this.name,JSON.stringify(e))}else this.storageType===o.array?this.items=e:this.itemsObj=e.reduce(((e,t)=>({...e,[this.getIdStr(t)]:{...t}})),{})},this.getItems=()=>{let e=[];if(this.storageType===o.localStorage){if(!r)throw"Cannot access window object. Choose another storage method (array OR object)";let t=window.localStorage.getItem(this.name);if(t)try{e=JSON.parse(t)}catch(e){console.error(e)}}else e=this.storageType===o.array?this.items.map((e=>({...e}))):Object.values({...this.itemsObj});if(!this.id_fields||!this.synced_field)throw"id_fields AND/OR synced_field missing";{const t=[this.synced_field,...this.id_fields.sort()];e=e.filter((e=>!this.filter||!Object.keys(this.filter).find((t=>e[t]!==this.filter[t])))).sort(((e,n)=>t.map((t=>e[t]<n[t]?-1:e[t]>n[t]?1:0)).find((e=>e))))}return e.map((e=>({...e})))},this.getBatch=({from_synced:e,to_synced:t,offset:n,limit:i}={offset:0,limit:null})=>{let s=this.getItems().map((e=>({...e}))).filter((n=>(!Number.isFinite(e)||+n[this.synced_field]>=+e)&&(!Number.isFinite(t)||+n[this.synced_field]<=+t)));return(n||i)&&(s=s.splice(n,i||s.length)),s},this.name=e,this.filter=n,this.select=h,this.onChange=s,!o[u])throw"Invalid storage type. Expecting one of: "+Object.keys(o).join(", ");if(r||u!==o.localStorage||(console.warn("Could not set storageType to localStorage: window object missing\nStorage changed to object"),u="object"),this.storageType=u,this.patchText=d,this.patchJSON=f,!l)throw"db missing";this.db=l;const{id_fields:p,synced_field:g,throttle:y=100,batch_size:b=50}=l[this.name]._syncInfo;if(!p||!g)throw"id_fields/synced_field missing";this.id_fields=p,this.synced_field=g,this.batch_size=b,this.throttle=y,this.skipFirstTrigger=c,this.multiSubscriptions=[],this.singleSubscriptions=[],this.onError=m||function(e){console.error("Sync internal error: ",e)},l[this.name]._sync(n,{select:h},{onSyncRequest:e=>{let t={c_lr:null,c_fr:null,c_count:0},n=this.getBatch(e);return n.length&&(t={c_fr:this.getRowSyncObj(n[0])||null,c_lr:this.getRowSyncObj(n[n.length-1])||null,c_count:n.length}),t},onPullRequest:async e=>this.getBatch(e),onUpdates:async e=>{if("err"in e&&e.err)this.onError(e.err);else if("isSynced"in e&&e.isSynced&&!this.isSynced){this.isSynced=e.isSynced;let t=this.getItems().map((e=>({...e})));this.setItems([]);const n=t.map((e=>({idObj:this.getIdObj(e),delta:{...e}})));await this.upsert(n,!0)}else if("data"in e){let t=e.data.map((e=>({idObj:this.getIdObj(e),delta:e})));await this.upsert(t,!0)}else console.error("Unexpected onUpdates");return!0}}).then((e=>{function t(){return"Data may be lost. Are you sure?"}this.dbSync=e,this.wal=new i.WAL({id_fields:p,synced_field:g,throttle:y,batch_size:b,onSendStart:()=>{r&&(window.onbeforeunload=t)},onSend:async(e,t)=>(await this.updatePatches(t)).length?this.dbSync.syncData(e):[],onSendEnd:()=>{r&&(window.onbeforeunload=null)}}),a()})),l[this.name].getColumns&&l[this.name].getColumns().then((e=>{this.columns=e})),this.onChange&&!this.skipFirstTrigger&&setTimeout(this.onChange,0),t.debug(this)}set multiSubscriptions(e){t.debug(e,this._multiSubscriptions),this._multiSubscriptions=e.slice(0)}get multiSubscriptions(){return this._multiSubscriptions}set singleSubscriptions(e){t.debug(e,this._singleSubscriptions),this._singleSubscriptions=e.slice(0)}get singleSubscriptions(){return this._singleSubscriptions}static create(e){return new Promise(((t,n)=>{try{const n=new a({...e,onReady:()=>{setTimeout((()=>{t(n)}),0)}})}catch(e){n(e)}}))}sync(e,t=!0){const n={unsync:()=>this.unsubscribe(e),upsert:e=>{if(e){const t=e=>({idObj:this.getIdObj(e),delta:e});Array.isArray(e)?this.upsert(e.map((e=>t(e)))):this.upsert([t(e)])}}},i={_onChange:e,handlesOnData:t,handles:n,notify:(n,i)=>{let s=[...n],r=[...i];return t&&(s=s.map(((e,t)=>{const n=(e,t)=>({...e,$get:()=>n(this.getItem(t).data,t),$find:e=>n(this.getItem(e).data,e),$update:e=>this.upsert([{idObj:t,delta:e}]).then((e=>!0)),$delete:async()=>this.delete(t)}),i=this.wal.getIdObj(e);return n(e,i)}))),e(s,r)}};return this.multiSubscriptions.push(i),this.skipFirstTrigger||setTimeout((()=>{let t=this.getItems();e(t,t)}),0),Object.freeze({...n})}syncOne(e,n,i=!0){if(!e||!n)throw"syncOne(idObj, onChange) -> MISSING idObj or onChange";const s={get:()=>this.getItem(e).data,find:e=>this.getItem(e).data,unsync:()=>this.unsubscribe(n),delete:()=>this.delete(e),update:n=>{this.singleSubscriptions.length||(console.warn("No singleSubscriptions"),t.debug("nosync",this._singleSubscriptions)),this.upsert([{idObj:e,delta:n}])},cloneSync:t=>this.syncOne(e,t)},r={_onChange:n,idObj:e,handlesOnData:i,handles:s,notify:(e,t)=>{let r={...e};return i&&(r.$get=s.get,r.$find=s.find,r.$update=s.update,r.$delete=s.delete,r.$unsync=s.unsync,r.$cloneSync=s.cloneSync),n(r,t)}};return this.singleSubscriptions.push(r),setTimeout((()=>{let e=s.get();e&&r.notify(e,e)}),0),Object.freeze({...s})}getIdStr(e){return this.id_fields.sort().map((t=>`${e[t]||""}`)).join(".")}getIdObj(e){let t={};return this.id_fields.sort().map((n=>{t[n]=e[n]})),t}getRowSyncObj(e){let t={};return[this.synced_field,...this.id_fields].sort().map((n=>{t[n]=e[n]})),t}matchesFilter(e){return Boolean(e&&(!this.filter||i.isEmpty(this.filter)||!Object.keys(this.filter).find((t=>this.filter[t]!==e[t]))))}matchesIdObj(e,t){return Boolean(e&&t&&!this.id_fields.sort().find((n=>e[n]!==t[n])))}getDelta(e,t){return i.isEmpty(e)?{...t}:Object.keys({...e,...t}).filter((e=>!this.id_fields.includes(e))).reduce(((n,i)=>{let s={};return i in t&&t[i]!==e[i]&&(s={[i]:t[i]}),{...n,...s}}),{})}deleteAll(){this.getItems().map((e=>this.delete(e)))}getItem(e){let t;return this.storageType===o.localStorage?t=this.getItems().find((t=>this.matchesIdObj(t,e))):this.storageType===o.array?t=this.items.find((t=>this.matchesIdObj(t,e))):(this.itemsObj=this.itemsObj||{},t={...this.itemsObj}[this.getIdStr(e)]),{data:t?{...t}:t,index:-1}}setItem(e,t,n=!1,i=!1){if(this.storageType===o.localStorage){let s=this.getItems();if(i)s=s.filter((t=>!this.matchesIdObj(t,e)));else{let i=t;s[i]?s[i]=n?{...e}:{...s[i],...e}:s.push(e)}r&&window.localStorage.setItem(this.name,JSON.stringify(s))}else if(this.storageType===o.array)i?this.items=this.items.filter((t=>!this.matchesIdObj(t,e))):this.items[t]?this.items[t]=n?{...e}:{...this.items[t],...e}:this.items.push(e);else if(this.itemsObj=this.itemsObj||{},i)delete this.itemsObj[this.getIdStr(e)];else{let t=this.itemsObj[this.getIdStr(e)]||{};this.itemsObj[this.getIdStr(e)]=n?{...e}:{...t,...e}}}}t.SyncedTable=a},792:function(e){this||window,e.exports=(()=>{"use strict";var e={444:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.EXISTS_KEYS=t.GeomFilter_Funcs=t.GeomFilterKeys=t.TextFilterFTSKeys=t.TextFilter_FullTextSearchFilterKeys=t.CompareInFilterKeys=t.CompareFilterKeys=void 0,t.CompareFilterKeys=["=","$eq","<>",">",">=","<=","$eq","$ne","$gt","$gte","$lte"],t.CompareInFilterKeys=["$in","$nin"],t.TextFilter_FullTextSearchFilterKeys=["to_tsquery","plainto_tsquery","phraseto_tsquery","websearch_to_tsquery"],t.TextFilterFTSKeys=["@@","@>","<@","$contains","$containedBy"],t.GeomFilterKeys=["~","~=","@","|&>","|>>",">>","=","<<|","<<","&>","&<|","&<","&&&","&&"],t.GeomFilter_Funcs=["ST_MakeEnvelope","ST_MakeEnvelope".toLowerCase()],t.EXISTS_KEYS=["$exists","$notExists","$existsJoined","$notExistsJoined"]},590:function(e,t,n){var i=this&&this.__createBinding||(Object.create?function(e,t,n,i){void 0===i&&(i=n),Object.defineProperty(e,i,{enumerable:!0,get:function(){return t[n]}})}:function(e,t,n,i){void 0===i&&(i=n),e[i]=t[n]}),s=this&&this.__exportStar||function(e,t){for(var n in e)"default"===n||Object.prototype.hasOwnProperty.call(t,n)||i(t,e,n)};Object.defineProperty(t,"__esModule",{value:!0}),t.get=t.WAL=t.unpatchText=t.stableStringify=t.isEmpty=t.getTextPatch=t.asName=t.CHANNELS=t.TS_PG_Types=t._PG_postgis=t._PG_date=t._PG_bool=t._PG_json=t._PG_numbers=t._PG_strings=void 0,t._PG_strings=["bpchar","char","varchar","text","citext","uuid","bytea","inet","time","timetz","interval","name"],t._PG_numbers=["int2","int4","int8","float4","float8","numeric","money","oid"],t._PG_json=["json","jsonb"],t._PG_bool=["bool"],t._PG_date=["date","timestamp","timestamptz"],t._PG_postgis=["geometry","geography"],t.TS_PG_Types={string:t._PG_strings,number:t._PG_numbers,boolean:t._PG_bool,Object:t._PG_json,Date:t._PG_date,"Array<number>":t._PG_numbers.map((e=>`_${e}`)),"Array<boolean>":t._PG_bool.map((e=>`_${e}`)),"Array<string>":t._PG_strings.map((e=>`_${e}`)),"Array<Object>":t._PG_json.map((e=>`_${e}`)),"Array<Date>":t._PG_date.map((e=>`_${e}`)),any:[]};const r="_psqlWS_.";t.CHANNELS={SCHEMA_CHANGED:r+"schema-changed",SCHEMA:r+"schema",DEFAULT:r,SQL:"_psqlWS_.sql",METHOD:"_psqlWS_.method",NOTICE_EV:"_psqlWS_.notice",LISTEN_EV:"_psqlWS_.listen",REGISTER:"_psqlWS_.register",LOGIN:"_psqlWS_.login",LOGOUT:"_psqlWS_.logout",AUTHGUARD:"_psqlWS_.authguard",_preffix:r};var o=n(128);Object.defineProperty(t,"asName",{enumerable:!0,get:function(){return o.asName}}),Object.defineProperty(t,"getTextPatch",{enumerable:!0,get:function(){return o.getTextPatch}}),Object.defineProperty(t,"isEmpty",{enumerable:!0,get:function(){return o.isEmpty}}),Object.defineProperty(t,"stableStringify",{enumerable:!0,get:function(){return o.stableStringify}}),Object.defineProperty(t,"unpatchText",{enumerable:!0,get:function(){return o.unpatchText}}),Object.defineProperty(t,"WAL",{enumerable:!0,get:function(){return o.WAL}}),Object.defineProperty(t,"get",{enumerable:!0,get:function(){return o.get}}),s(n(444),t)},899:(e,t)=>{function n(e,t){var n=e[0],i=e[1],l=e[2],c=e[3];n=s(n,i,l,c,t[0],7,-680876936),c=s(c,n,i,l,t[1],12,-389564586),l=s(l,c,n,i,t[2],17,606105819),i=s(i,l,c,n,t[3],22,-1044525330),n=s(n,i,l,c,t[4],7,-176418897),c=s(c,n,i,l,t[5],12,1200080426),l=s(l,c,n,i,t[6],17,-1473231341),i=s(i,l,c,n,t[7],22,-45705983),n=s(n,i,l,c,t[8],7,1770035416),c=s(c,n,i,l,t[9],12,-1958414417),l=s(l,c,n,i,t[10],17,-42063),i=s(i,l,c,n,t[11],22,-1990404162),n=s(n,i,l,c,t[12],7,1804603682),c=s(c,n,i,l,t[13],12,-40341101),l=s(l,c,n,i,t[14],17,-1502002290),n=r(n,i=s(i,l,c,n,t[15],22,1236535329),l,c,t[1],5,-165796510),c=r(c,n,i,l,t[6],9,-1069501632),l=r(l,c,n,i,t[11],14,643717713),i=r(i,l,c,n,t[0],20,-373897302),n=r(n,i,l,c,t[5],5,-701558691),c=r(c,n,i,l,t[10],9,38016083),l=r(l,c,n,i,t[15],14,-660478335),i=r(i,l,c,n,t[4],20,-405537848),n=r(n,i,l,c,t[9],5,568446438),c=r(c,n,i,l,t[14],9,-1019803690),l=r(l,c,n,i,t[3],14,-187363961),i=r(i,l,c,n,t[8],20,1163531501),n=r(n,i,l,c,t[13],5,-1444681467),c=r(c,n,i,l,t[2],9,-51403784),l=r(l,c,n,i,t[7],14,1735328473),n=o(n,i=r(i,l,c,n,t[12],20,-1926607734),l,c,t[5],4,-378558),c=o(c,n,i,l,t[8],11,-2022574463),l=o(l,c,n,i,t[11],16,1839030562),i=o(i,l,c,n,t[14],23,-35309556),n=o(n,i,l,c,t[1],4,-1530992060),c=o(c,n,i,l,t[4],11,1272893353),l=o(l,c,n,i,t[7],16,-155497632),i=o(i,l,c,n,t[10],23,-1094730640),n=o(n,i,l,c,t[13],4,681279174),c=o(c,n,i,l,t[0],11,-358537222),l=o(l,c,n,i,t[3],16,-722521979),i=o(i,l,c,n,t[6],23,76029189),n=o(n,i,l,c,t[9],4,-640364487),c=o(c,n,i,l,t[12],11,-421815835),l=o(l,c,n,i,t[15],16,530742520),n=a(n,i=o(i,l,c,n,t[2],23,-995338651),l,c,t[0],6,-198630844),c=a(c,n,i,l,t[7],10,1126891415),l=a(l,c,n,i,t[14],15,-1416354905),i=a(i,l,c,n,t[5],21,-57434055),n=a(n,i,l,c,t[12],6,1700485571),c=a(c,n,i,l,t[3],10,-1894986606),l=a(l,c,n,i,t[10],15,-1051523),i=a(i,l,c,n,t[1],21,-2054922799),n=a(n,i,l,c,t[8],6,1873313359),c=a(c,n,i,l,t[15],10,-30611744),l=a(l,c,n,i,t[6],15,-1560198380),i=a(i,l,c,n,t[13],21,1309151649),n=a(n,i,l,c,t[4],6,-145523070),c=a(c,n,i,l,t[11],10,-1120210379),l=a(l,c,n,i,t[2],15,718787259),i=a(i,l,c,n,t[9],21,-343485551),e[0]=d(n,e[0]),e[1]=d(i,e[1]),e[2]=d(l,e[2]),e[3]=d(c,e[3])}function i(e,t,n,i,s,r){return t=d(d(t,e),d(i,r)),d(t<<s|t>>>32-s,n)}function s(e,t,n,s,r,o,a){return i(t&n|~t&s,e,t,r,o,a)}function r(e,t,n,s,r,o,a){return i(t&s|n&~s,e,t,r,o,a)}function o(e,t,n,s,r,o,a){return i(t^n^s,e,t,r,o,a)}function a(e,t,n,s,r,o,a){return i(n^(t|~s),e,t,r,o,a)}function l(e){var t,n=[];for(t=0;t<64;t+=4)n[t>>2]=e.charCodeAt(t)+(e.charCodeAt(t+1)<<8)+(e.charCodeAt(t+2)<<16)+(e.charCodeAt(t+3)<<24);return n}Object.defineProperty(t,"__esModule",{value:!0}),t.md5=t.md5cycle=void 0,t.md5cycle=n;var c="0123456789abcdef".split("");function h(e){for(var t="",n=0;n<4;n++)t+=c[e>>8*n+4&15]+c[e>>8*n&15];return t}function u(e){return function(e){for(var t=0;t<e.length;t++)e[t]=h(e[t]);return e.join("")}(function(e){var t,i=e.length,s=[1732584193,-271733879,-1732584194,271733878];for(t=64;t<=e.length;t+=64)n(s,l(e.substring(t-64,t)));e=e.substring(t-64);var r=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];for(t=0;t<e.length;t++)r[t>>2]|=e.charCodeAt(t)<<(t%4<<3);if(r[t>>2]|=128<<(t%4<<3),t>55)for(n(s,r),t=0;t<16;t++)r[t]=0;return r[14]=8*i,n(s,r),s}(e))}function d(e,t){return e+t&4294967295}if(t.md5=u,"5d41402abc4b2a76b9719d911017c592"!=u("hello")){function d(e,t){var n=(65535&e)+(65535&t);return(e>>16)+(t>>16)+(n>>16)<<16|65535&n}}},128:function(e,t,n){var i=this&&this.__awaiter||function(e,t,n,i){return new(n||(n=Promise))((function(s,r){function o(e){try{l(i.next(e))}catch(e){r(e)}}function a(e){try{l(i.throw(e))}catch(e){r(e)}}function l(e){var t;e.done?s(e.value):(t=e.value,t instanceof n?t:new n((function(e){e(t)}))).then(o,a)}l((i=i.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.get=t.isEmpty=t.WAL=t.unpatchText=t.getTextPatch=t.stableStringify=t.asName=void 0;const s=n(899);function r(e){for(var t in e)return!1;return!0}t.asName=function(e){if(null==e||!e.toString||!e.toString())throw"Expecting a non empty string";return`"${e.toString().replace(/"/g,'""')}"`},t.stableStringify=function(e,t){t||(t={}),"function"==typeof t&&(t={cmp:t});var n,i="boolean"==typeof t.cycles&&t.cycles,s=t.cmp&&(n=t.cmp,function(e){return function(t,i){var s={key:t,value:e[t]},r={key:i,value:e[i]};return n(s,r)}}),r=[];return function e(t){if(t&&t.toJSON&&"function"==typeof t.toJSON&&(t=t.toJSON()),void 0!==t){if("number"==typeof t)return isFinite(t)?""+t:"null";if("object"!=typeof t)return JSON.stringify(t);var n,o;if(Array.isArray(t)){for(o="[",n=0;n<t.length;n++)n&&(o+=","),o+=e(t[n])||"null";return o+"]"}if(null===t)return"null";if(-1!==r.indexOf(t)){if(i)return JSON.stringify("__cycle__");throw new TypeError("Converting circular structure to JSON")}var a=r.push(t)-1,l=Object.keys(t).sort(s&&s(t));for(o="",n=0;n<l.length;n++){var c=l[n],h=e(t[c]);h&&(o&&(o+=","),o+=JSON.stringify(c)+":"+h)}return r.splice(a,1),"{"+o+"}"}}(e)},t.getTextPatch=function(e,t){if(!(e&&t&&e.trim().length&&t.trim().length))return t;if(e===t)return{from:0,to:0,text:"",md5:s.md5(t)};function n(n=1){let i=n<1?-1:0,s=!1;for(;!s&&Math.abs(i)<=t.length;){const r=n<1?[i]:[0,i];e.slice(...r)!==t.slice(...r)?s=!0:i+=1*Math.sign(n)}return i}let i=n()-1,r=e.length+n(-1)+1,o=t.length+n(-1)+1;return{from:i,to:r,text:t.slice(i,o),md5:s.md5(t)}},t.unpatchText=function(e,t){if(!t||"string"==typeof t)return t;const{from:n,to:i,text:r,md5:o}=t;if(null===r||null===e)return r;let a=e.slice(0,n)+r+e.slice(i);if(o&&s.md5(a)!==o)throw"Patch text error: Could not match md5 hash: (original/result) \n"+e+"\n"+a;return a},t.WAL=class{constructor(e){if(this.changed={},this.sending={},this.sentHistory={},this.callbacks=[],this.sort=(e,t)=>{const{orderBy:n}=this.options;return n&&e&&t&&n.map((n=>{if(!(n.fieldName in e)||!(n.fieldName in t))throw"Replication error: \n   some orderBy fields missing from data";let i=n.asc?e[n.fieldName]:t[n.fieldName],s=n.asc?t[n.fieldName]:e[n.fieldName],r=+i-+s,o=i<s?-1:i==s?0:1;return"number"===n.tsDataType&&Number.isFinite(r)?r:o})).find((e=>e))||0},this.isInHistory=e=>{if(!e)throw"Provide item";const t=e[this.options.synced_field];if(!Number.isFinite(+t))throw"Provided item Synced field value is missing/invalid ";const n=this.sentHistory[this.getIdStr(e)],i=null==n?void 0:n[this.options.synced_field];if(n){if(!Number.isFinite(+i))throw"Provided historic item Synced field value is missing/invalid";if(+i==+t)return!0}return!1},this.addData=e=>{r(this.changed)&&this.options.onSendStart&&this.options.onSendStart(),e.map((e=>{const{initial:t,current:n}=Object.assign({},e);if(!n)throw"Expecting { current: object, initial?: object }";const i=this.getIdStr(n);this.changed=this.changed||{},this.changed[i]=this.changed[i]||{initial:t,current:n},this.changed[i].current=Object.assign(Object.assign({},this.changed[i].current),n)})),this.sendItems()},this.isSendingTimeout=void 0,this.willDeleteHistory=void 0,this.sendItems=()=>i(this,void 0,void 0,(function*(){const{synced_field:e,onSend:t,onSendEnd:n,batch_size:i,throttle:s,historyAgeSeconds:o=2}=this.options;if(this.isSendingTimeout||this.sending&&!r(this.sending))return;if(!this.changed||r(this.changed))return;let a,l=[],c=[],h={};Object.keys(this.changed).sort(((e,t)=>this.sort(this.changed[e].current,this.changed[t].current))).slice(0,i).map((e=>{let t=Object.assign({},this.changed[e]);this.sending[e]=t,c.push(Object.assign({},t)),h[e]=Object.assign({},t.current),delete this.changed[e]})),l=c.map((e=>e.current)),this.isSendingTimeout||(this.isSendingTimeout=setTimeout((()=>{this.isSendingTimeout=void 0,r(this.changed)||this.sendItems()}),s));try{yield t(l,c),o&&(this.sentHistory=Object.assign(Object.assign({},this.sentHistory),h),this.willDeleteHistory||(this.willDeleteHistory=setTimeout((()=>{this.willDeleteHistory=void 0,this.sentHistory={}}),1e3*o)))}catch(e){a=e,console.error("WAL onSend failed:",e,l,c)}if(this.callbacks.length){const e=Object.keys(this.sending);this.callbacks.forEach(((t,n)=>{t.idStrs=t.idStrs.filter((t=>e.includes(t))),t.idStrs.length||t.cb(a)})),this.callbacks=this.callbacks.filter((e=>e.idStrs.length))}this.sending={},r(this.changed)?n&&n(l,c,a):this.sendItems()})),this.options=Object.assign({},e),!this.options.orderBy){const{synced_field:t,id_fields:n}=e;this.options.orderBy=[t,...n.sort()].map((e=>({fieldName:e,tsDataType:e===t?"number":"string",asc:!0})))}}isSending(){return!(r(this.sending)&&r(this.changed))}getIdStr(e){return this.options.id_fields.sort().map((t=>`${e[t]||""}`)).join(".")}getIdObj(e){let t={};return this.options.id_fields.sort().map((n=>{t[n]=e[n]})),t}getDeltaObj(e){let t={};return Object.keys(e).map((n=>{this.options.id_fields.includes(n)||(t[n]=e[n])})),t}},t.isEmpty=r,t.get=function(e,t){let n=t,i=e;return e?("string"==typeof n&&(n=n.split(".")),n.reduce(((e,t)=>e&&e[t]?e[t]:void 0),i)):e}}},t={};return function n(i){if(t[i])return t[i].exports;var s=t[i]={exports:{}};return e[i].call(s.exports,s,s.exports,n),s.exports}(590)})()}},t={};function n(i){var s=t[i];if(void 0!==s)return s.exports;var r=t[i]={exports:{}};return e[i].call(r.exports,r,r.exports,n),r.exports}var i={};return(()=>{"use strict";var e=i;Object.defineProperty(e,"__esModule",{value:!0}),e.prostgles=void 0;const t=n(792),s=n(133);e.prostgles=function(e,n){const{socket:i,onReady:r,onDisconnect:o,onReconnect:a,onSchemaChange:l=!0}=e;if(s.debug("prostgles",{initOpts:e}),l){let e;"function"==typeof l&&(e=l),i.removeAllListeners(t.CHANNELS.SCHEMA_CHANGED),e&&i.on(t.CHANNELS.SCHEMA_CHANGED,e)}const c=t.CHANNELS._preffix;let h,u={},d={},f={},m={},p=!1;function g(e,t){return s.debug("_unsubscribe",{channelName:e,handler:t}),new Promise(((n,s)=>{u[e]?(u[e].handlers=u[e].handlers.filter((e=>e!==t)),u[e].handlers.length||(i.emit(e+"unsubscribe",{},((e,t)=>{e&&console.error(e)})),i.removeListener(e,u[e].onCall),delete u[e]),n(!0)):n(!0)}))}function y({tableName:e,command:t,param1:n,param2:s},r){return new Promise(((o,a)=>{i.emit(c,{tableName:e,command:t,param1:n,param2:s},((e,t)=>{if(e)console.error(e),a(e);else if(t){const{id_fields:e,synced_field:n,channelName:s}=t;i.emit(s,{onSyncRequest:r({},t)},(e=>{console.log(e)})),o({id_fields:e,synced_field:n,channelName:s})}}))}))}function b({tableName:e,command:t,param1:n,param2:s}){return new Promise(((r,o)=>{i.emit(c,{tableName:e,command:t,param1:n,param2:s},((e,t)=>{e?(console.error(e),o(e)):t&&r(t.channelName)}))}))}async function S(e,{tableName:t,command:n,param1:s,param2:r},o,a){function l(n){let i={unsubscribe:function(){return g(n,o)},filter:{...s}};return e[t].update&&(i={...i,update:function(n,i){return e[t].update(s,n,i)}}),e[t].delete&&(i={...i,delete:function(n){return e[t].delete(s,n)}}),Object.freeze(i)}const c=Object.keys(u).find((e=>{let i=u[e];return i.tableName===t&&i.command===n&&JSON.stringify(i.param1||{})===JSON.stringify(s||{})&&JSON.stringify(i.param2||{})===JSON.stringify(r||{})}));if(c)return u[c].handlers.push(o),setTimeout((()=>{o&&(null==u?void 0:u[c].lastData)&&o(null==u?void 0:u[c].lastData)}),10),l(c);{const e=await b({tableName:t,command:n,param1:s,param2:r});let c=function(t,n){u[e]?t.data?(u[e].lastData=t.data,u[e].handlers.map((e=>{e(t.data)}))):t.err?u[e].errorHandlers.map((e=>{e(t.err)})):console.error("INTERNAL ERROR: Unexpected data format from subscription: ",t):console.warn("Orphaned subscription: ",e)},h=a||function(t){console.error(`Uncaught error within running subscription \n ${e}`,t)};return i.on(e,c),u[e]={lastData:void 0,tableName:t,command:n,param1:s,param2:r,onCall:c,handlers:[o],errorHandlers:[h],destroy:()=>{u[e]&&(Object.values(u[e]).map((t=>{t&&t.handlers&&t.handlers.map((t=>g(e,t)))})),delete u[e])}},l(e)}}return new Promise(((e,l)=>{o&&i.on("disconnect",o),i.on(t.CHANNELS.SCHEMA,(({schema:o,methods:g,fullSchema:_,auth:O,rawSQL:j,joinTables:w=[],err:N})=>{if(N)throw l(N),N;s.debug("destroySyncs",{subscriptions:u,syncedTables:d}),Object.values(u).map((e=>e.destroy())),u={},f={},Object.values(d).map((e=>{e&&e.destroy&&e.destroy()})),d={},p&&a&&a(i),p=!0;let v=JSON.parse(JSON.stringify(o)),C=JSON.parse(JSON.stringify(g)),T={},P={};O&&(O.pathGuard&&i.emit(t.CHANNELS.AUTHGUARD,JSON.stringify(window.location),((e,t)=>{var n,i;t.shouldReload&&"undefined"!=typeof window&&(null===(i=null===(n=null===window||void 0===window?void 0:window.location)||void 0===n?void 0:n.reload)||void 0===i||i.call(n))})),P={...O},[t.CHANNELS.LOGIN,t.CHANNELS.LOGOUT,t.CHANNELS.REGISTER].map((e=>{O[e]&&(P[e]=function(t){return new Promise(((n,s)=>{i.emit(c+e,t,((e,t)=>{e?s(e):n(t)}))}))})}))),C.map((e=>{T[e]=function(...n){return new Promise(((s,r)=>{i.emit(t.CHANNELS.METHOD,{method:e,params:n},((e,t)=>{e?r(e):s(t)}))}))}})),T=Object.freeze(T),j&&(v.sql=function(e,n,s){return new Promise(((r,o)=>{i.emit(t.CHANNELS.SQL,{query:e,params:n,options:s},((e,t)=>{if(e)o(e);else if(s&&"noticeSubscription"===s.returnType&&t&&Object.keys(t).sort().join()===["socketChannel","socketUnsubChannel"].sort().join()&&!Object.values(t).find((e=>"string"!=typeof e))){const e=t,n=t=>(((e,t)=>{h=h||{config:t,listeners:[]},h.listeners.length||(i.removeAllListeners(t.socketChannel),i.on(t.socketChannel,(e=>{h&&h.listeners&&h.listeners.length?h.listeners.map((t=>{t(e)})):i.emit(t.socketUnsubChannel,{})}))),h.listeners.push(e)})(t,e),{...e,removeListener:()=>(e=>{h&&(h.listeners=h.listeners.filter((t=>t!==e)),!h.listeners.length&&h.config&&h.config.socketUnsubChannel&&i&&i.emit(h.config.socketUnsubChannel,{}))})(t)}),s={...e,addListener:n};r(s)}else if(s&&s.returnType&&"statement"===s.returnType||!t||Object.keys(t).sort().join()!==["socketChannel","socketUnsubChannel","notifChannel"].sort().join()||Object.values(t).find((e=>"string"!=typeof e)))r(t);else{const e=e=>(((e,t)=>{m=m||{},m[t.notifChannel]?m[t.notifChannel].listeners.push(e):(m[t.notifChannel]={config:t,listeners:[e]},i.removeAllListeners(t.socketChannel),i.on(t.socketChannel,(e=>{m[t.notifChannel]&&m[t.notifChannel].listeners&&m[t.notifChannel].listeners.length?m[t.notifChannel].listeners.map((t=>{t(e)})):i.emit(m[t.notifChannel].config.socketUnsubChannel,{})})))})(e,t),{...t,removeListener:()=>((e,t)=>{m&&m[t.notifChannel]&&(m[t.notifChannel].listeners=m[t.notifChannel].listeners.filter((t=>t!==e)),!m[t.notifChannel].listeners.length&&m[t.notifChannel].config&&m[t.notifChannel].config.socketUnsubChannel&&i&&(i.emit(m[t.notifChannel].config.socketUnsubChannel,{}),delete m[t.notifChannel]))})(e,t)}),n={...t,addListener:e};r(n)}}))}))});const I=e=>"[object Object]"===Object.prototype.toString.call(e),E=(e,t,n,i)=>{if(!I(e)||!I(t)||"function"!=typeof n||i&&"function"!=typeof i)throw"Expecting: ( basicFilter<object>, options<object>, onChange<function> , onError?<function>) but got something else"},x=["subscribe","subscribeOne"];Object.keys(v).forEach((e=>{Object.keys(v[e]).sort(((e,t)=>x.includes(e)-x.includes(t))).forEach((t=>{if(["find","findOne"].includes(t)&&(v[e].getJoinedTables=function(){return(w||[]).filter((t=>Array.isArray(t)&&t.includes(e))).flat().filter((t=>t!==e))}),"sync"===t){if(v[e]._syncInfo={...v[e][t]},n){v[e].getSync=(t,i={})=>n.create({name:e,filter:t,db:v,...i});const t=async(t={},i={},s)=>{const r=`${e}.${JSON.stringify(t)}.${JSON.stringify(i)}`;return d[r]||(d[r]=await n.create({...i,name:e,filter:t,db:v,onError:s})),d[r]};v[e].sync=async(e,n={handlesOnData:!0,select:"*"},i,s)=>{E(e,n,i,s);const r=await t(e,n,s);return await r.sync(i,n.handlesOnData)},v[e].syncOne=async(e,n={handlesOnData:!0},i,s)=>{E(e,n,i,s);const r=await t(e,n,s);return await r.syncOne(e,i,n.handlesOnData)}}v[e]._sync=function(n,r,o){return async function({tableName:e,command:t,param1:n,param2:r},o){const{onPullRequest:a,onSyncRequest:l,onUpdates:c}=o;function h(e,t){return Object.freeze({unsync:function(){!function(e,t){s.debug("_unsync",{channelName:e,triggers:t}),new Promise(((n,s)=>{f[e]&&(f[e].triggers=f[e].triggers.filter((e=>e.onPullRequest!==t.onPullRequest&&e.onSyncRequest!==t.onSyncRequest&&e.onUpdates!==t.onUpdates)),f[e].triggers.length||(i.emit(e+"unsync",{},((e,t)=>{e?s(e):n(t)})),i.removeListener(e,f[e].onCall),delete f[e]))}))}(e,o)},syncData:function(t,n,s){i.emit(e,{onSyncRequest:{...l({}),...{data:t}||{},...{deleted:n}||{}}},s?e=>{s(e)}:null)}})}const u=Object.keys(f).find((i=>{let s=f[i];return s.tableName===e&&s.command===t&&JSON.stringify(s.param1||{})===JSON.stringify(n||{})&&JSON.stringify(s.param2||{})===JSON.stringify(r||{})}));if(u)return f[u].triggers.push(o),h(u,f[u].syncInfo);{const s=await y({tableName:e,command:t,param1:n,param2:r},l),{channelName:a,synced_field:c,id_fields:u}=s;function d(t,n){t&&f[a]&&f[a].triggers.map((({onUpdates:i,onSyncRequest:s,onPullRequest:r})=>{t.data?Promise.resolve(i(t)).then((()=>{n&&n({ok:!0})})).catch((t=>{n?n({err:t}):console.error(e+" onUpdates error",t)})):t.onSyncRequest?Promise.resolve(s(t.onSyncRequest)).then((e=>n({onSyncRequest:e}))).catch((t=>{n?n({err:t}):console.error(e+" onSyncRequest error",t)})):t.onPullRequest?Promise.resolve(r(t.onPullRequest)).then((e=>{n({data:e})})).catch((t=>{n?n({err:t}):console.error(e+" onPullRequest error",t)})):console.log("unexpected response")}))}return f[a]={tableName:e,command:t,param1:n,param2:r,triggers:[o],syncInfo:s,onCall:d},i.on(a,d),h(a)}}({tableName:e,command:t,param1:n,param2:r},o)}}else if(x.includes(t)){v[e][t]=function(n,i,s,r){return E(n,i,s,r),S(v,{tableName:e,command:t,param1:n,param2:i},s,r)};const n="subscribeOne";t!==n&&x.includes(n)||(v[e][n]=function(n,i,s,r){return E(n,i,s,r),S(v,{tableName:e,command:t,param1:n,param2:i},(e=>{s(e[0])}),r)})}else v[e][t]=function(n,s,r){return new Promise(((o,a)=>{i.emit(c,{tableName:e,command:t,param1:n,param2:s,param3:r},((e,t)=>{e?a(e):o(t)}))}))}}))})),u&&Object.keys(u).length&&Object.keys(u).map((async e=>{try{let t=u[e];await b(t),i.on(e,t.onCall)}catch(e){console.error("There was an issue reconnecting old subscriptions",e)}})),f&&Object.keys(f).length&&Object.keys(f).filter((e=>f[e].triggers&&f[e].triggers.length)).map((async e=>{try{let t=f[e];await y(t,t.triggers[0].onSyncRequest),i.on(e,t.onCall)}catch(e){console.error("There was an issue reconnecting olf subscriptions",e)}})),w.flat().map((e=>{function t(t=!0,n,i,s){return{[t?"$leftJoin":"$innerJoin"]:e,filter:n,select:i,...s}}v.innerJoin=v.innerJoin||{},v.leftJoin=v.leftJoin||{},v.innerJoinOne=v.innerJoinOne||{},v.leftJoinOne=v.leftJoinOne||{},v.leftJoin[e]=(e,n,i={})=>t(!0,e,n,i),v.innerJoin[e]=(e,n,i={})=>t(!1,e,n,i),v.leftJoinOne[e]=(e,n,i={})=>t(!0,e,n,{...i,limit:1}),v.innerJoinOne[e]=(e,n,i={})=>t(!1,e,n,{...i,limit:1})})),(async()=>{try{await r(v,T,_,P)}catch(e){console.error("Prostgles: Error within onReady: \n",e),l(e)}e(v)})()}))}))}})(),i})()}));