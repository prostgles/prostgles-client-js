"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncedTable = exports.asName = void 0;
const prostgles_1 = require("./prostgles");
const SyncedTable_1 = require("./SyncedTable/SyncedTable");
Object.defineProperty(exports, "SyncedTable", { enumerable: true, get: function () { return SyncedTable_1.SyncedTable; } });
function prostgles(params) {
    return (0, prostgles_1.prostgles)(params, SyncedTable_1.SyncedTable);
}
var prostgles_2 = require("./prostgles");
Object.defineProperty(exports, "asName", { enumerable: true, get: function () { return prostgles_2.asName; } });
__exportStar(require("./hooks/useSync"), exports);
__exportStar(require("./hooks/useSubscribe"), exports);
__exportStar(require("./hooks/useProstglesClient"), exports);
__exportStar(require("./hooks/usePromise"), exports);
__exportStar(require("./hooks/useIsMounted"), exports);
__exportStar(require("./hooks/useFetch"), exports);
__exportStar(require("./hooks/useEffectDeep"), exports);
__exportStar(require("./hooks/useEffectAsync"), exports);
__exportStar(require("./hooks/useAsyncEffectQueue"), exports);
exports.default = prostgles;
