import { strict as assert } from "assert";
import { SyncedTable } from "prostgles-client";
import { __prglReactInstalled } from "prostgles-client/dist/hooks/reactImports";
import { useIsMounted } from "prostgles-client/dist/hooks/useIsMounted";
import { useEffectAsync } from "prostgles-client/dist/hooks/useEffectAsync";
import { test } from "node:test";

test("exports work", () => {
  const exportedTypes = Array.from(
    new Set([useEffectAsync, useIsMounted, SyncedTable].map((v) => typeof v)),
  );
  assert.equal(exportedTypes.join(), "function");
  assert.equal(typeof __prglReactInstalled(), "boolean");
});
