"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prostgles_1 = require("./prostgles");
(async () => {
    var _a, _b, _c, _d, _e, _f;
    const client = (0, prostgles_1.useProstglesClient)();
    if (client.isLoading || "error" in client)
        return;
    const t1 = client.dbo.table1.useFind({}, { orderBy: { col1: 1 } });
    const dbo = 1;
    const client2 = (0, prostgles_1.useProstglesClient)();
    if (client2.isLoading || "error" in client2)
        return;
    (_b = (_a = client2.dbo.dwada) === null || _a === void 0 ? void 0 : _a.find) === null || _b === void 0 ? void 0 : _b.call(_a);
    const filter = {};
    const filterCheck = (f) => { };
    filterCheck(filter);
    const sub = dbo.table1.size;
    const f = (a) => { };
    // f(dbo.table1)
    const ra = (a) => {
    };
    const dbH = 1;
    (_c = dbH.dwadwa) === null || _c === void 0 ? void 0 : _c.findOne({ "name.@@.to_tsquery": ["abc81"] }, { select: {
            h: { "$ts_headline_simple": ["name", { plainto_tsquery: "abc81" }] },
            hh: { "$ts_headline": ["name", "abc81"] },
            added: "$date_trunc_2hour",
            addedY: { "$date_trunc_5minute": ["added"] }
        } });
    (_e = (_d = dbH.d) === null || _d === void 0 ? void 0 : _d.find) === null || _e === void 0 ? void 0 : _e.call(_d, {}, {
        select: { id: 1, name: 1, items3: { name: "$upper" } }
    });
    (_f = dbH.d) === null || _f === void 0 ? void 0 : _f.find({}, {
        select: { connection_id: 1, access_control_user_types: { access_control_id: 1 }, access_control_methods: { access_control_id: 1 } }
    });
    // const dboBasic: DBHandlerClient = dbo;
});
