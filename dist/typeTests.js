"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
(async () => {
    var _a, _b, _c, _d;
    const dbo = 1;
    const filter = {};
    const filterCheck = (f) => { };
    filterCheck(filter);
    const sub = dbo.table1.size;
    const f = (a) => { };
    // f(dbo.table1)
    const ra = (a) => {
    };
    const dbH = 1;
    (_a = dbH.dwadwa) === null || _a === void 0 ? void 0 : _a.findOne({ "name.@@.to_tsquery": ["abc81"] }, { select: {
            h: { "$ts_headline_simple": ["name", { plainto_tsquery: "abc81" }] },
            hh: { "$ts_headline": ["name", "abc81"] },
            added: "$date_trunc_2hour",
            addedY: { "$date_trunc_5minute": ["added"] }
        } });
    (_c = (_b = dbH.d) === null || _b === void 0 ? void 0 : _b.find) === null || _c === void 0 ? void 0 : _c.call(_b, {}, {
        select: { id: 1, name: 1, items3: { name: "$upper" } }
    });
    (_d = dbH.d) === null || _d === void 0 ? void 0 : _d.find({}, {
        select: { connection_id: 1, access_control_user_types: { access_control_id: 1 }, access_control_methods: { access_control_id: 1 } }
    });
    // const dboBasic: DBHandlerClient = dbo;
});
