!function(e,t){if("object"==typeof exports&&"object"==typeof module)module.exports=t();else if("function"==typeof define&&define.amd)define([],t);else{var n=t();for(var i in n)("object"==typeof exports?exports:e)[i]=n[i]}}(this||window,(function(){return(()=>{var e={133:(e,t,n)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.SyncedTable=t.debug=void 0;const i=n(792),s="DEBUG_SYNCEDTABLE",r="undefined"!=typeof window;t.debug=function(...e){r&&window[s]&&window[s](...e)};const o={array:"array",localStorage:"localStorage",object:"object"};class a{constructor({name:e,filter:n,onChange:s,onReady:a,db:c,skipFirstTrigger:l=!1,select:h="*",storageType:u=o.object,patchText:d=!1,patchJSON:f=!1,onError:m}){if(this.throttle=100,this.batch_size=50,this.skipFirstTrigger=!1,this.columns=[],this.items=[],this.itemsObj={},this.isSynced=!1,this.updatePatches=async e=>{let t=e.map((e=>e.current)),n=[],s=[];if(this.columns&&this.columns.length&&this.db[this.name].updateBatch&&(this.patchText||this.patchJSON)){const r=this.columns.filter((e=>"text"===e.data_type));if(this.patchText&&r.length){t=[];const o=[this.synced_field,...this.id_fields];await Promise.all(e.slice(0).map((async(e,a)=>{const{current:c,initial:l}={...e};let h;l&&(r.map((e=>{!o.includes(e.name)&&e.name in c&&(h=h||{...c},h[e.name]=i.getTextPatch(l[e.name],c[e.name]))})),h&&(s.push(h),n.push([this.wal.getIdObj(h),this.wal.getDeltaObj(h)]))),h||t.push(c)})))}}if(n.length)try{await this.db[this.name].updateBatch(n)}catch(e){console.log("failed to patch update",e),t=t.concat(s)}return t.filter((e=>e))},this.notifySubscribers=(e=[])=>{if(!this.isSynced)return;let t=[],n=[],i=[];e.map((({idObj:e,newItem:s,delta:r})=>{this.singleSubscriptions.filter((t=>this.matchesIdObj(t.idObj,e))).map((async e=>{try{await e.notify(s,r)}catch(e){console.error("SyncedTable failed to notify: ",e)}})),this.matchesFilter(s)&&(t.push(s),n.push(r),i.push(e))}));let s=[],r=[];if(this.getItems().map((e=>{s.push({...e});const i=t.findIndex((t=>this.matchesIdObj(e,t)));r.push(n[i])})),this.onChange)try{this.onChange(s,r)}catch(e){console.error("SyncedTable failed to notify onChange: ",e)}this.multiSubscriptions.map((async e=>{try{await e.notify(s,r)}catch(e){console.error("SyncedTable failed to notify: ",e)}}))},this.unsubscribe=e=>{this.singleSubscriptions=this.singleSubscriptions.filter((t=>t._onChange!==e)),this.multiSubscriptions=this.multiSubscriptions.filter((t=>t._onChange!==e))},this.unsync=()=>{this.dbSync&&this.dbSync.unsync&&this.dbSync.unsync()},this.destroy=()=>{this.unsync(),this.multiSubscriptions=[],this.singleSubscriptions=[],this.itemsObj={},this.items=[],this.onChange=null},this.delete=async(e,t=!1)=>{const n=this.getIdObj(e);return this.setItem(n,null,!0,!0),t||await this.db[this.name].delete(n),this.notifySubscribers(),!0},this.upsert=async(e,t=!1)=>{if(!(e&&e.length||t))throw"No data provided for upsert";let n,s=[],r=[];await Promise.all(e.map((async(e,o)=>{let a={...e.idObj},c={...e.delta},l=this.getItem(a),h=l.index,u=l.data;!t&&!i.isEmpty(c)||i.isEmpty(u)||(c=this.getDelta(u||{},c)),t||(c[this.synced_field]=Date.now());let d={...u,...c,...a};u&&u[this.synced_field]<d[this.synced_field]?n="updated":u||(n="inserted"),this.setItem(d,h);let f={idObj:a,delta:c,oldItem:u,newItem:d,status:n,from_server:t};return t||r.push({initial:u,current:{...c,...a}}),s.push(f),!0}))).catch((e=>{console.error("SyncedTable failed upsert: ",e)})),this.notifySubscribers(s),!t&&r.length&&this.wal.addData(r)},this.setItems=e=>{if(this.storageType===o.localStorage){if(!r)throw"Cannot access window object. Choose another storage method (array OR object)";window.localStorage.setItem(this.name,JSON.stringify(e))}else this.storageType===o.array?this.items=e:this.itemsObj=e.reduce(((e,t)=>({...e,[this.getIdStr(t)]:{...t}})),{})},this.getItems=()=>{let e=[];if(this.storageType===o.localStorage){if(!r)throw"Cannot access window object. Choose another storage method (array OR object)";let t=window.localStorage.getItem(this.name);if(t)try{e=JSON.parse(t)}catch(e){console.error(e)}}else e=this.storageType===o.array?this.items.map((e=>({...e}))):Object.values({...this.itemsObj});if(!this.id_fields||!this.synced_field)throw"id_fields AND/OR synced_field missing";{const t=[this.synced_field,...this.id_fields.sort()];e=e.filter((e=>!this.filter||!Object.keys(this.filter).find((t=>e[t]!==this.filter[t])))).sort(((e,n)=>t.map((t=>e[t]<n[t]?-1:e[t]>n[t]?1:0)).find((e=>e))))}return e.map((e=>({...e})))},this.getBatch=({from_synced:e,to_synced:t,offset:n,limit:i}={offset:0,limit:null})=>{let s=this.getItems().map((e=>({...e}))).filter((n=>(!e||n[this.synced_field]>=e)&&(!t||n[this.synced_field]<=t)));return(n||i)&&(s=s.splice(n,i||s.length)),s},this.name=e,this.filter=n,this.select=h,this.onChange=s,this.onChange,!o[u])throw"Invalid storage type. Expecting one of: "+Object.keys(o).join(", ");if(r||u!==o.localStorage||(console.warn("Could not set storageType to localStorage: window object missing\nStorage changed to object"),u="object"),this.storageType=u,this.patchText=d,this.patchJSON=f,!c)throw"db missing";this.db=c;const{id_fields:p,synced_field:g,throttle:y=100,batch_size:b=50}=c[this.name]._syncInfo;if(!p||!g)throw"id_fields/synced_field missing";this.id_fields=p,this.synced_field=g,this.batch_size=b,this.throttle=y,this.skipFirstTrigger=l,this.multiSubscriptions=[],this.singleSubscriptions=[],this.onError=m||function(e){console.error("Sync internal error: ",e)},c[this.name]._sync(n,{select:h},{onSyncRequest:e=>{let t={c_lr:null,c_fr:null,c_count:0},n=this.getBatch(e);return n.length&&(t={c_fr:this.getRowSyncObj(n[0])||null,c_lr:this.getRowSyncObj(n[n.length-1])||null,c_count:n.length}),t},onPullRequest:async e=>this.getBatch(e),onUpdates:({err:e,data:t,isSynced:n})=>{if(e)this.onError(e);else if(n&&!this.isSynced){this.isSynced=n;let e=this.getItems().map((e=>({...e})));this.setItems([]),this.upsert(e.map((e=>({idObj:this.getIdObj(e),delta:{...e}}))),!0)}else{let e=t.map((e=>({idObj:this.getIdObj(e),delta:e})));this.upsert(e,!0)}}}).then((e=>{function t(){return"Data may be lost. Are you sure?"}this.dbSync=e,this.wal=new i.WAL({id_fields:p,synced_field:g,throttle:y,batch_size:b,onSendStart:()=>{r&&(window.onbeforeunload=t)},onSend:async(e,t)=>(await this.updatePatches(t)).length?this.dbSync.syncData(e):[],onSendEnd:()=>{r&&(window.onbeforeunload=null)}}),a()})),c[this.name].getColumns&&c[this.name].getColumns().then((e=>{this.columns=e})),this.onChange&&!this.skipFirstTrigger&&setTimeout(this.onChange,0),t.debug(this)}set multiSubscriptions(e){t.debug(e,this._multiSubscriptions),this._multiSubscriptions=e.slice(0)}get multiSubscriptions(){return this._multiSubscriptions}set singleSubscriptions(e){t.debug(e,this._singleSubscriptions),this._singleSubscriptions=e.slice(0)}get singleSubscriptions(){return this._singleSubscriptions}static create(e){return new Promise(((t,n)=>{try{const n=new a({...e,onReady:()=>{setTimeout((()=>{t(n)}),0)}})}catch(e){n(e)}}))}sync(e,t=!1){const n={unsync:()=>{this.unsubscribe(e)},upsert:e=>{if(e){const t=e=>({idObj:this.getIdObj(e),delta:e});Array.isArray(e)?this.upsert(e.map((e=>t(e)))):this.upsert([t(e)])}}},i={_onChange:e,handlesOnData:t,handles:n,notify:(n,i)=>{let s=[...n],r=[...i];return t&&(s=s.map(((e,t)=>{const n=this.wal.getIdObj(e);return{...e,$update:e=>this.upsert([{idObj:n,delta:e}]).then((e=>!0)),$delete:async()=>this.delete(n)}}))),e(s,r)}};if(this.multiSubscriptions.push(i),!this.skipFirstTrigger){let t=this.getItems();e(t,t)}return Object.freeze({...n})}syncOne(e,t,n=!1){if(!e||!t)throw"syncOne(idObj, onChange) -> MISSING idObj or onChange";const i={get:()=>this.getItem(e).data,unsync:()=>{this.unsubscribe(t)},delete:()=>this.delete(e),update:t=>{this.upsert([{idObj:e,delta:t}])}},s={_onChange:t,idObj:e,handlesOnData:n,handles:i,notify:(e,s)=>{let r={...e};return n&&(r.$update=i.update,r.$delete=i.delete,r.$unsync=i.unsync),t(r,s)}};this.singleSubscriptions.push(s);let r=i.get();return r&&s.notify(r,r),Object.freeze({...i})}getIdStr(e){return this.id_fields.sort().map((t=>`${e[t]||""}`)).join(".")}getIdObj(e){let t={};return this.id_fields.sort().map((n=>{t[n]=e[n]})),t}getRowSyncObj(e){let t={};return[this.synced_field,...this.id_fields].sort().map((n=>{t[n]=e[n]})),t}matchesFilter(e){return Boolean(e&&(!this.filter||i.isEmpty(this.filter)||!Object.keys(this.filter).find((t=>this.filter[t]!==e[t]))))}matchesIdObj(e,t){return Boolean(e&&t&&!this.id_fields.sort().find((n=>e[n]!==t[n])))}getDelta(e,t){return i.isEmpty(e)?{...t}:Object.keys({...e,...t}).filter((e=>!this.id_fields.includes(e))).reduce(((n,i)=>{let s={};return i in t&&t[i]!==e[i]&&(s={[i]:t[i]}),{...n,...s}}),{})}deleteAll(){this.getItems().map((e=>this.delete(e)))}getItem(e){let t;return this.storageType===o.localStorage?t=this.getItems().find((t=>this.matchesIdObj(t,e))):this.storageType===o.array?t=this.items.find((t=>this.matchesIdObj(t,e))):(this.itemsObj=this.itemsObj||{},t={...this.itemsObj}[this.getIdStr(e)]),{data:t?{...t}:t,index:-1}}setItem(e,t,n=!1,i=!1){if(this.storageType===o.localStorage){let s=this.getItems();if(i)s=s.filter((t=>!this.matchesIdObj(t,e)));else{let i=t;s[i]?s[i]=n?{...e}:{...s[i],...e}:s.push(e)}r&&window.localStorage.setItem(this.name,JSON.stringify(s))}else if(this.storageType===o.array)i?this.items=this.items.filter((t=>!this.matchesIdObj(t,e))):this.items[t]?this.items[t]=n?{...e}:{...this.items[t],...e}:this.items.push(e);else if(this.itemsObj=this.itemsObj||{},i)delete this.itemsObj[this.getIdStr(e)];else{let t=this.itemsObj[this.getIdStr(e)]||{};this.itemsObj[this.getIdStr(e)]=n?{...e}:{...t,...e}}}}t.SyncedTable=a},792:function(e){this||window,e.exports=(()=>{"use strict";var e={444:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.EXISTS_KEYS=t.GeomFilter_Funcs=t.GeomFilterKeys=t.TextFilterFTSKeys=t.TextFilter_FullTextSearchFilterKeys=t.CompareInFilterKeys=t.CompareFilterKeys=void 0,t.CompareFilterKeys=["=","$eq","<>",">",">=","<=","$eq","$ne","$gt","$gte","$lte"],t.CompareInFilterKeys=["$in","$nin"],t.TextFilter_FullTextSearchFilterKeys=["to_tsquery","plainto_tsquery","phraseto_tsquery","websearch_to_tsquery"],t.TextFilterFTSKeys=["@@","@>","<@","$contains","$containedBy"],t.GeomFilterKeys=["~","~=","@","|&>","|>>",">>","=","<<|","<<","&>","&<|","&<","&&&","&&"],t.GeomFilter_Funcs=["ST_MakeEnvelope","ST_MakeEnvelope".toLowerCase()],t.EXISTS_KEYS=["$exists","$notExists","$existsJoined","$notExistsJoined"]},590:(e,t,n)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.TextFilter_FullTextSearchFilterKeys=t.GeomFilter_Funcs=t.GeomFilterKeys=t.EXISTS_KEYS=t.asName=t.WAL=t.isEmpty=t.unpatchText=t.getTextPatch=t.get=t.CHANNELS=void 0;const i="_psqlWS_.";t.CHANNELS={SCHEMA_CHANGED:i+"schema-changed",SCHEMA:i+"schema",DEFAULT:i,SQL:"_psqlWS_.sql",METHOD:"_psqlWS_.method",NOTICE_EV:"_psqlWS_.notice",LISTEN_EV:"_psqlWS_.listen",REGISTER:"_psqlWS_.register",LOGIN:"_psqlWS_.login",LOGOUT:"_psqlWS_.logout",_preffix:i};var s=n(128);Object.defineProperty(t,"get",{enumerable:!0,get:function(){return s.get}}),Object.defineProperty(t,"getTextPatch",{enumerable:!0,get:function(){return s.getTextPatch}}),Object.defineProperty(t,"unpatchText",{enumerable:!0,get:function(){return s.unpatchText}}),Object.defineProperty(t,"isEmpty",{enumerable:!0,get:function(){return s.isEmpty}}),Object.defineProperty(t,"WAL",{enumerable:!0,get:function(){return s.WAL}}),Object.defineProperty(t,"asName",{enumerable:!0,get:function(){return s.asName}});var r=n(444);Object.defineProperty(t,"EXISTS_KEYS",{enumerable:!0,get:function(){return r.EXISTS_KEYS}}),Object.defineProperty(t,"GeomFilterKeys",{enumerable:!0,get:function(){return r.GeomFilterKeys}}),Object.defineProperty(t,"GeomFilter_Funcs",{enumerable:!0,get:function(){return r.GeomFilter_Funcs}}),Object.defineProperty(t,"TextFilter_FullTextSearchFilterKeys",{enumerable:!0,get:function(){return r.TextFilter_FullTextSearchFilterKeys}})},899:(e,t)=>{function n(e,t){var n=e[0],i=e[1],c=e[2],l=e[3];n=s(n,i,c,l,t[0],7,-680876936),l=s(l,n,i,c,t[1],12,-389564586),c=s(c,l,n,i,t[2],17,606105819),i=s(i,c,l,n,t[3],22,-1044525330),n=s(n,i,c,l,t[4],7,-176418897),l=s(l,n,i,c,t[5],12,1200080426),c=s(c,l,n,i,t[6],17,-1473231341),i=s(i,c,l,n,t[7],22,-45705983),n=s(n,i,c,l,t[8],7,1770035416),l=s(l,n,i,c,t[9],12,-1958414417),c=s(c,l,n,i,t[10],17,-42063),i=s(i,c,l,n,t[11],22,-1990404162),n=s(n,i,c,l,t[12],7,1804603682),l=s(l,n,i,c,t[13],12,-40341101),c=s(c,l,n,i,t[14],17,-1502002290),n=r(n,i=s(i,c,l,n,t[15],22,1236535329),c,l,t[1],5,-165796510),l=r(l,n,i,c,t[6],9,-1069501632),c=r(c,l,n,i,t[11],14,643717713),i=r(i,c,l,n,t[0],20,-373897302),n=r(n,i,c,l,t[5],5,-701558691),l=r(l,n,i,c,t[10],9,38016083),c=r(c,l,n,i,t[15],14,-660478335),i=r(i,c,l,n,t[4],20,-405537848),n=r(n,i,c,l,t[9],5,568446438),l=r(l,n,i,c,t[14],9,-1019803690),c=r(c,l,n,i,t[3],14,-187363961),i=r(i,c,l,n,t[8],20,1163531501),n=r(n,i,c,l,t[13],5,-1444681467),l=r(l,n,i,c,t[2],9,-51403784),c=r(c,l,n,i,t[7],14,1735328473),n=o(n,i=r(i,c,l,n,t[12],20,-1926607734),c,l,t[5],4,-378558),l=o(l,n,i,c,t[8],11,-2022574463),c=o(c,l,n,i,t[11],16,1839030562),i=o(i,c,l,n,t[14],23,-35309556),n=o(n,i,c,l,t[1],4,-1530992060),l=o(l,n,i,c,t[4],11,1272893353),c=o(c,l,n,i,t[7],16,-155497632),i=o(i,c,l,n,t[10],23,-1094730640),n=o(n,i,c,l,t[13],4,681279174),l=o(l,n,i,c,t[0],11,-358537222),c=o(c,l,n,i,t[3],16,-722521979),i=o(i,c,l,n,t[6],23,76029189),n=o(n,i,c,l,t[9],4,-640364487),l=o(l,n,i,c,t[12],11,-421815835),c=o(c,l,n,i,t[15],16,530742520),n=a(n,i=o(i,c,l,n,t[2],23,-995338651),c,l,t[0],6,-198630844),l=a(l,n,i,c,t[7],10,1126891415),c=a(c,l,n,i,t[14],15,-1416354905),i=a(i,c,l,n,t[5],21,-57434055),n=a(n,i,c,l,t[12],6,1700485571),l=a(l,n,i,c,t[3],10,-1894986606),c=a(c,l,n,i,t[10],15,-1051523),i=a(i,c,l,n,t[1],21,-2054922799),n=a(n,i,c,l,t[8],6,1873313359),l=a(l,n,i,c,t[15],10,-30611744),c=a(c,l,n,i,t[6],15,-1560198380),i=a(i,c,l,n,t[13],21,1309151649),n=a(n,i,c,l,t[4],6,-145523070),l=a(l,n,i,c,t[11],10,-1120210379),c=a(c,l,n,i,t[2],15,718787259),i=a(i,c,l,n,t[9],21,-343485551),e[0]=d(n,e[0]),e[1]=d(i,e[1]),e[2]=d(c,e[2]),e[3]=d(l,e[3])}function i(e,t,n,i,s,r){return t=d(d(t,e),d(i,r)),d(t<<s|t>>>32-s,n)}function s(e,t,n,s,r,o,a){return i(t&n|~t&s,e,t,r,o,a)}function r(e,t,n,s,r,o,a){return i(t&s|n&~s,e,t,r,o,a)}function o(e,t,n,s,r,o,a){return i(t^n^s,e,t,r,o,a)}function a(e,t,n,s,r,o,a){return i(n^(t|~s),e,t,r,o,a)}function c(e){var t,n=[];for(t=0;t<64;t+=4)n[t>>2]=e.charCodeAt(t)+(e.charCodeAt(t+1)<<8)+(e.charCodeAt(t+2)<<16)+(e.charCodeAt(t+3)<<24);return n}Object.defineProperty(t,"__esModule",{value:!0}),t.md5=t.md5cycle=void 0,t.md5cycle=n;var l="0123456789abcdef".split("");function h(e){for(var t="",n=0;n<4;n++)t+=l[e>>8*n+4&15]+l[e>>8*n&15];return t}function u(e){return function(e){for(var t=0;t<e.length;t++)e[t]=h(e[t]);return e.join("")}(function(e){var t,i=e.length,s=[1732584193,-271733879,-1732584194,271733878];for(t=64;t<=e.length;t+=64)n(s,c(e.substring(t-64,t)));e=e.substring(t-64);var r=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];for(t=0;t<e.length;t++)r[t>>2]|=e.charCodeAt(t)<<(t%4<<3);if(r[t>>2]|=128<<(t%4<<3),t>55)for(n(s,r),t=0;t<16;t++)r[t]=0;return r[14]=8*i,n(s,r),s}(e))}function d(e,t){return e+t&4294967295}if(t.md5=u,"5d41402abc4b2a76b9719d911017c592"!=u("hello")){function d(e,t){var n=(65535&e)+(65535&t);return(e>>16)+(t>>16)+(n>>16)<<16|65535&n}}},128:function(e,t,n){var i=this&&this.__awaiter||function(e,t,n,i){return new(n||(n=Promise))((function(s,r){function o(e){try{c(i.next(e))}catch(e){r(e)}}function a(e){try{c(i.throw(e))}catch(e){r(e)}}function c(e){var t;e.done?s(e.value):(t=e.value,t instanceof n?t:new n((function(e){e(t)}))).then(o,a)}c((i=i.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.get=t.isEmpty=t.WAL=t.unpatchText=t.getTextPatch=t.stableStringify=t.asName=void 0;const s=n(899);function r(e){for(var t in e)return!1;return!0}t.asName=function(e){if(null==e||!e.toString||!e.toString())throw"Expecting a non empty string";return`"${e.toString().replace(/"/g,'""')}"`},t.stableStringify=function(e,t){t||(t={}),"function"==typeof t&&(t={cmp:t});var n,i="boolean"==typeof t.cycles&&t.cycles,s=t.cmp&&(n=t.cmp,function(e){return function(t,i){var s={key:t,value:e[t]},r={key:i,value:e[i]};return n(s,r)}}),r=[];return function e(t){if(t&&t.toJSON&&"function"==typeof t.toJSON&&(t=t.toJSON()),void 0!==t){if("number"==typeof t)return isFinite(t)?""+t:"null";if("object"!=typeof t)return JSON.stringify(t);var n,o;if(Array.isArray(t)){for(o="[",n=0;n<t.length;n++)n&&(o+=","),o+=e(t[n])||"null";return o+"]"}if(null===t)return"null";if(-1!==r.indexOf(t)){if(i)return JSON.stringify("__cycle__");throw new TypeError("Converting circular structure to JSON")}var a=r.push(t)-1,c=Object.keys(t).sort(s&&s(t));for(o="",n=0;n<c.length;n++){var l=c[n],h=e(t[l]);h&&(o&&(o+=","),o+=JSON.stringify(l)+":"+h)}return r.splice(a,1),"{"+o+"}"}}(e)},t.getTextPatch=function(e,t){if(!(e&&t&&e.trim().length&&t.trim().length))return t;if(e===t)return{from:0,to:0,text:"",md5:s.md5(t)};function n(n=1){let i=n<1?-1:0,s=!1;for(;!s&&Math.abs(i)<=t.length;){const r=n<1?[i]:[0,i];e.slice(...r)!==t.slice(...r)?s=!0:i+=1*Math.sign(n)}return i}let i=n()-1,r=e.length+n(-1)+1,o=t.length+n(-1)+1;return{from:i,to:r,text:t.slice(i,o),md5:s.md5(t)}},t.unpatchText=function(e,t){if(!t||"string"==typeof t)return t;const{from:n,to:i,text:r,md5:o}=t;if(null===r||null===e)return r;let a=e.slice(0,n)+r+e.slice(i);if(o&&s.md5(a)!==o)throw"Patch text error: Could not match md5 hash: (original/result) \n"+e+"\n"+a;return a},t.WAL=class{constructor(e){if(this.changed={},this.sending={},this.callbacks=[],this.sort=(e,t)=>{const{orderBy:n}=this.options;return n.map((n=>{if(!(n.fieldName in e)||!(n.fieldName in t))throw"Replication error: \n   some orderBy fields missing from data";let i=n.asc?e[n.fieldName]:t[n.fieldName],s=n.asc?t[n.fieldName]:e[n.fieldName],r=i-s,o=i<s?-1:i==s?0:1;return isNaN(r)?o:r})).find((e=>e))},this.addData=(e,t)=>{r(this.changed)&&this.options.onSendStart&&this.options.onSendStart();let n=t?{cb:t,idStrs:[]}:null;e.map((e=>{const{initial:t,current:i}=Object.assign({},e);if(!i)throw"Expecting { current: object, initial?: object }";const s=this.getIdStr(i);n&&n.idStrs.push(s),this.changed=this.changed||{},this.changed[s]=this.changed[s]||{initial:t,current:i},this.changed[s].current=Object.assign(Object.assign({},this.changed[s].current),i)})),this.sendItems()},this.isSendingTimeout=null,this.sendItems=()=>i(this,void 0,void 0,(function*(){const{synced_field:e,onSend:t,onSendEnd:n,batch_size:i,throttle:s}=this.options;if(this.isSendingTimeout||this.sending&&!r(this.sending))return;if(!this.changed||r(this.changed))return;let o,a=[],c=[];Object.keys(this.changed).sort(((e,t)=>this.sort(this.changed[e].current,this.changed[t].current))).slice(0,i).map((e=>{let t=Object.assign({},this.changed[e]);this.sending[e]=t,c.push(Object.assign({},t)),delete this.changed[e]})),a=c.map((e=>e.current)),this.isSendingTimeout=setTimeout((()=>{this.isSendingTimeout=void 0,r(this.changed)||this.sendItems()}),s);try{yield t(a,c)}catch(e){o=e,console.error(e,a,c)}if(this.callbacks.length){const e=Object.keys(this.sending);this.callbacks.forEach(((t,n)=>{t.idStrs=t.idStrs.filter((t=>e.includes(t))),t.idStrs.length||t.cb(o)})),this.callbacks=this.callbacks.filter((e=>e.idStrs.length))}this.sending={},r(this.changed)?n&&n(a,c,o):this.sendItems()})),this.options=Object.assign({},e),!this.options.orderBy){const{synced_field:t,id_fields:n}=e;this.options.orderBy=[t,...n.sort()].map((e=>({fieldName:e,asc:!0})))}}isSending(){return!(r(this.sending)&&r(this.changed))}getIdStr(e){return this.options.id_fields.sort().map((t=>`${e[t]||""}`)).join(".")}getIdObj(e){let t={};return this.options.id_fields.sort().map((n=>{t[n]=e[n]})),t}getDeltaObj(e){let t={};return Object.keys(e).map((n=>{this.options.id_fields.includes(n)||(t[n]=e[n])})),t}},t.isEmpty=r,t.get=function(e,t){let n=t,i=e;return e?("string"==typeof n&&(n=n.split(".")),n.reduce(((e,t)=>e&&e[t]?e[t]:void 0),i)):e}}},t={};return function n(i){if(t[i])return t[i].exports;var s=t[i]={exports:{}};return e[i].call(s.exports,s,s.exports,n),s.exports}(590)})()}},t={};function n(i){var s=t[i];if(void 0!==s)return s.exports;var r=t[i]={exports:{}};return e[i].call(r.exports,r,r.exports,n),r.exports}var i={};return(()=>{"use strict";var e=i;Object.defineProperty(e,"__esModule",{value:!0}),e.prostgles=void 0;const t=n(792),s=n(133);e.prostgles=function(e,n){const{socket:i,onReady:r,onDisconnect:o,onReconnect:a,onSchemaChange:c=!0}=e;if(s.debug("prostgles",{initOpts:e}),c){let e;"function"==typeof c&&(e=c),i.removeAllListeners(t.CHANNELS.SCHEMA_CHANGED),e&&i.on(t.CHANNELS.SCHEMA_CHANGED,e)}const l=t.CHANNELS._preffix;let h={},u={},d={},f={};const m=(e,t)=>{f&&f[t.notifChannel]&&(f[t.notifChannel].listeners=f[t.notifChannel].listeners.filter((t=>t!==e)),!f[t.notifChannel].listeners.length&&f[t.notifChannel].config&&f[t.notifChannel].config.socketUnsubChannel&&i&&(i.emit(f[t.notifChannel].config.socketUnsubChannel),delete f[t.notifChannel]))};let p;const g=e=>{p&&(p.listeners=p.listeners.filter((t=>t!==e)),!p.listeners.length&&p.config&&p.config.socketUnsubChannel&&i&&i.emit(p.config.socketUnsubChannel))};let y=!1;function b(e,t){s.debug("_unsubscribe",{channelName:e,handler:t}),h[e]&&(h[e].handlers=h[e].handlers.filter((e=>e!==t)),h[e].handlers.length||(i.emit(e+"unsubscribe",{},((e,t)=>{})),i.removeListener(e,h[e].onCall),delete h[e]))}function S({tableName:e,command:t,param1:n,param2:s},r){return new Promise(((o,a)=>{i.emit(l,{tableName:e,command:t,param1:n,param2:s},((e,t)=>{if(e)console.error(e),a(e);else if(t){const{id_fields:e,synced_field:n,channelName:s}=t;i.emit(s,{onSyncRequest:r({},t)},(e=>{console.log(e)})),o({id_fields:e,synced_field:n,channelName:s})}}))}))}function O({tableName:e,command:t,param1:n,param2:s}){return new Promise(((r,o)=>{i.emit(l,{tableName:e,command:t,param1:n,param2:s},((e,t)=>{e?(console.error(e),o(e)):t&&r(t.channelName)}))}))}return new Promise(((e,c)=>{o&&i.on("disconnect",o),i.on(t.CHANNELS.SCHEMA,(({schema:o,methods:_,fullSchema:j,auth:N,rawSQL:w,joinTables:T=[],err:C})=>{if(C)throw c(C),C;s.debug("destroySyncs",{subscriptions:h,syncedTables:u}),Object.values(h).map((e=>e.destroy())),h={},d={},Object.values(u).map((e=>{e&&e.destroy&&e.destroy()})),u={},y&&a&&a(i),y=!0;let E=JSON.parse(JSON.stringify(o)),I=JSON.parse(JSON.stringify(_)),v={},x={};N&&(x={...N},[t.CHANNELS.LOGIN,t.CHANNELS.LOGOUT,t.CHANNELS.REGISTER].map((e=>{N[e]&&(x[e]=function(t){return new Promise(((n,s)=>{i.emit(l+e,t,((e,t)=>{e?s(e):n(t)}))}))})}))),I.map((e=>{v[e]=function(...n){return new Promise(((s,r)=>{i.emit(t.CHANNELS.METHOD,{method:e,params:n},((e,t)=>{e?r(e):s(t)}))}))}})),v=Object.freeze(v),w&&(E.sql=function(e,n,s){return new Promise(((r,o)=>{i.emit(t.CHANNELS.SQL,{query:e,params:n,options:s},((e,t)=>{e?o(e):s&&s.getNotices&&t&&Object.keys(t).sort().join()===["socketChannel","socketUnsubChannel"].sort().join()&&!Object.values(t).find((e=>"string"!=typeof e))?r({addListener:e=>(((e,t)=>{p=p||{config:t,listeners:[]},p.listeners.length||(i.on(t.socketChannel,(t=>{e(t)})),setTimeout((()=>{g(null)}),500)),p.listeners.push(e)})(e,t),{removeListener:()=>g(e)})}):s&&s.returnType&&"statement"===s.returnType||!t||Object.keys(t).sort().join()!==["socketChannel","socketUnsubChannel","notifChannel"].sort().join()||Object.values(t).find((e=>"string"!=typeof e))?r(t):r({addListener:e=>(((e,t)=>{f=f||{},f[t.notifChannel]?f[t.notifChannel].listeners.push(e):(f[t.notifChannel]={config:t,listeners:[e]},i.on(t.socketChannel,(t=>{e(t)})),setTimeout((()=>{m(null,t)}),500))})(e,t),{removeListener:()=>m(e,t)})})}))}))});const P=e=>"[object Object]"===Object.prototype.toString.call(e),F=(e,t,n,i)=>{if(!P(e)||!P(t)||"function"!=typeof n||i&&"function"!=typeof i)throw"Expecting: ( basicFilter<object>, options<object>, onChange<function> , onError?<function>) but got something else"},k=["subscribe","subscribeOne"];Object.keys(E).forEach((e=>{Object.keys(E[e]).sort(((e,t)=>k.includes(e)-k.includes(t))).forEach((t=>{if(["find","findOne"].includes(t)&&(E[e].getJoinedTables=function(){return(T||[]).filter((t=>Array.isArray(t)&&t.includes(e))).flat().filter((t=>t!==e))}),"sync"===t){if(E[e]._syncInfo={...E[e][t]},n){E[e].getSync=(t,i={})=>n.create({name:e,filter:t,db:E,...i});const t=async(t={},i={},s)=>{const r=`${e}.${JSON.stringify(t)}.${JSON.stringify(i)}`;return u[r]||(u[r]=await n.create({...i,name:e,filter:t,db:E,onError:s})),u[r]};E[e].sync=async(e,n,i,s)=>{F(e,n,i,s);const r=await t(e,n,s);return await r.sync(i,n)},E[e].syncOne=async(e,n,i,s)=>{F(e,n,i,s);const r=await t(e,n,s);return await r.syncOne(e,i,n.handlesOnData)}}E[e]._sync=function(n,r,o){return async function({tableName:e,command:t,param1:n,param2:r},o){const{onPullRequest:a,onSyncRequest:c,onUpdates:l}=o;function h(e,t){return Object.freeze({unsync:function(){!function(e,t){s.debug("_unsync",{channelName:e,triggers:t}),new Promise(((n,s)=>{d[e]&&(d[e].triggers=d[e].triggers.filter((e=>e.onPullRequest!==t.onPullRequest&&e.onSyncRequest!==t.onSyncRequest&&e.onUpdates!==t.onUpdates)),d[e].triggers.length||(i.emit(e+"unsync",{},((e,t)=>{e?s(e):n(t)})),i.removeListener(e,d[e].onCall),delete d[e]))}))}(e,o)},syncData:function(n,s,r){i.emit(e,{onSyncRequest:{...c({},t),...{data:n}||{},...{deleted:s}||{}}},r?e=>{r(e)}:null)}})}const u=Object.keys(d).find((i=>{let s=d[i];return s.tableName===e&&s.command===t&&JSON.stringify(s.param1||{})===JSON.stringify(n||{})&&JSON.stringify(s.param2||{})===JSON.stringify(r||{})}));if(u)return d[u].triggers.push(o),h(u,d[u].syncInfo);{const s=await S({tableName:e,command:t,param1:n,param2:r},c),{channelName:a,synced_field:l,id_fields:u}=s;function f(t,n){t&&d[a]&&d[a].triggers.map((({onUpdates:i,onSyncRequest:r,onPullRequest:o})=>{t.data?Promise.resolve(i(t,s)).then((()=>{n&&n({ok:!0})})).catch((t=>{n?n({err:t}):console.error(e+" onUpdates error",t)})):t.onSyncRequest?Promise.resolve(r(t.onSyncRequest,s)).then((e=>n({onSyncRequest:e}))).catch((t=>{n?n({err:t}):console.error(e+" onSyncRequest error",t)})):t.onPullRequest?Promise.resolve(o(t.onPullRequest,s)).then((e=>{n({data:e})})).catch((t=>{n?n({err:t}):console.error(e+" onPullRequest error",t)})):console.log("unexpected response")}))}return d[a]={tableName:e,command:t,param1:n,param2:r,triggers:[o],syncInfo:s,onCall:f},i.on(a,f),h(a,s)}}({tableName:e,command:t,param1:n,param2:r},o)}}else k.includes(t)?E[e][t]=function(n,s,r,o){return F(n,s,r,o),async function(e,{tableName:t,command:n,param1:s,param2:r},o,a){function c(n){let i={unsubscribe:function(){b(n,o)}};return e[t].update&&(i={...i,update:function(n,i){return e[t].update(s,n,i)}}),e[t].delete&&(i={...i,delete:function(n){return e[t].delete(s,n)}}),Object.freeze(i)}const l=Object.keys(h).find((e=>{let i=h[e];return i.tableName===t&&i.command===n&&JSON.stringify(i.param1||{})===JSON.stringify(s||{})&&JSON.stringify(i.param2||{})===JSON.stringify(r||{})}));if(l)return h[l].handlers.push(o),h[l].handlers.includes(o)&&console.warn("Duplicate subscription handler was added for:",h[l]),c(l);{const e=await O({tableName:t,command:n,param1:s,param2:r});let l=function(t,n){h[e]?t.data?h[e].handlers.map((e=>{e(t.data)})):t.err?h[e].errorHandlers.map((e=>{e(t.err)})):console.error("INTERNAL ERROR: Unexpected data format from subscription: ",t):console.warn("Orphaned subscription: ",e)},u=a||function(t){console.error(`Uncaught error within running subscription \n ${e}`,t)};return i.on(e,l),h[e]={tableName:t,command:n,param1:s,param2:r,onCall:l,handlers:[o],errorHandlers:[u],destroy:()=>{h[e]&&(Object.values(h[e]).map((t=>{t&&t.handlers&&t.handlers.map((t=>b(e,t)))})),delete h[e])}},c(e)}}(E,{tableName:e,command:t,param1:n,param2:s},r,o)}:E[e][t]=function(n,s,r){return new Promise(((o,a)=>{i.emit(l,{tableName:e,command:t,param1:n,param2:s,param3:r},((e,t)=>{e?a(e):o(t)}))}))}}))})),h&&Object.keys(h).length&&Object.keys(h).map((async e=>{try{let t=h[e];await O(t),i.on(e,t.onCall)}catch(e){console.error("There was an issue reconnecting old subscriptions",e)}})),d&&Object.keys(d).length&&Object.keys(d).filter((e=>d[e].triggers&&d[e].triggers.length)).map((async e=>{try{let t=d[e];await S(t,t.triggers[0].onSyncRequest),i.on(e,t.onCall)}catch(e){console.error("There was an issue reconnecting olf subscriptions",e)}})),T.flat().map((e=>{function t(t=!0,n,i,s){return{[t?"$leftJoin":"$innerJoin"]:e,filter:n,select:i,...s}}E.innerJoin=E.innerJoin||{},E.leftJoin=E.leftJoin||{},E.innerJoinOne=E.innerJoinOne||{},E.leftJoinOne=E.leftJoinOne||{},E.leftJoin[e]=(e,n,i={})=>t(!0,e,n,i),E.innerJoin[e]=(e,n,i={})=>t(!1,e,n,i),E.leftJoinOne[e]=(e,n,i={})=>t(!0,e,n,{...i,limit:1}),E.innerJoinOne[e]=(e,n,i={})=>t(!1,e,n,{...i,limit:1})})),(async()=>{try{await r(E,v,j,x)}catch(e){console.error("Prostgles: Error within onReady: \n",e),c(e)}e(E)})()}))}))}})(),i})()}));