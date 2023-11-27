"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = require("assert");
const prostgles_client_1 = require("prostgles-client");
const react_hooks_1 = require("prostgles-client/dist/react-hooks");
const node_test_1 = require("node:test");
(0, node_test_1.test)("exports work", () => {
    const exportedTypes = Array.from(new Set([react_hooks_1.useEffectAsync, react_hooks_1.useIsMounted, prostgles_client_1.SyncedTable].map(v => typeof v)));
    assert_1.strict.equal(exportedTypes.join(), "function");
    assert_1.strict.equal(typeof (0, react_hooks_1.__prglReactInstalled)(), "boolean");
});
