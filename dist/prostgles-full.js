"use strict";
const prostgles_1 = require("./prostgles");
const SyncedTable_1 = require("./SyncedTable/SyncedTable");
function prostgles(params) {
    return (0, prostgles_1.prostgles)(params, SyncedTable_1.SyncedTable);
}
prostgles.SyncedTable = SyncedTable_1.SyncedTable;
module.exports = prostgles;
