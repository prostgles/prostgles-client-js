"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncedTable = exports.prostgles_full = exports.prostgles = void 0;
const prostgles_1 = require("./prostgles");
Object.defineProperty(exports, "prostgles", { enumerable: true, get: function () { return prostgles_1.prostgles; } });
const SyncedTable_1 = require("./SyncedTable");
Object.defineProperty(exports, "SyncedTable", { enumerable: true, get: function () { return SyncedTable_1.SyncedTable; } });
const prostgles_full = (params) => {
    return prostgles_1.prostgles(params, SyncedTable_1.SyncedTable);
};
exports.prostgles_full = prostgles_full;
