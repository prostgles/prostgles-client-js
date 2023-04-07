"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
(async () => {
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
    // const dboBasic: DBHandlerClient = dbo;
});
