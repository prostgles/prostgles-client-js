"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncedTable = void 0;
const prostgles_1 = require("./prostgles");
const SyncedTable_1 = require("./SyncedTable");
Object.defineProperty(exports, "SyncedTable", { enumerable: true, get: function () { return SyncedTable_1.SyncedTable; } });
const prostgles = (params) => {
    return prostgles_1.prostgles(params, SyncedTable_1.SyncedTable);
};
exports.default = prostgles;
