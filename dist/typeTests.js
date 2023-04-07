"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
(async () => {
    var _a, _b;
    const dbo = 1;
    const filter = {};
    const filterCheck = (f) => { };
    filterCheck(filter);
    const sub = dbo.table1.count;
    const f = (a) => { };
    // f(dbo.table1)
    const ra = (a) => {
    };
    const dbH = 1;
    dbH.dwadwa.findOne({ "name.@@.to_tsquery": ["abc81"] }, { select: {
            h: { "$ts_headline_simple": ["name", { plainto_tsquery: "abc81" }] },
            hh: { "$ts_headline": ["name", "abc81"] },
            added: "$date_trunc_2hour",
            addedY: { "$date_trunc_5minute": ["added"] }
        } });
    (_b = (_a = dbH.d).find) === null || _b === void 0 ? void 0 : _b.call(_a, {}, {
        select: { id: 1, name: 1, items3: { name: "$upper" } }
    });
    dbH.d.find({}, {
        select: { connection_id: 1, access_control_user_types: { access_control_id: 1 }, access_control_methods: { access_control_id: 1 } }
    });
    // const dboBasic: DBHandlerClient = dbo;
});
