import { strict as assert } from 'assert';
import { SyncedTable } from "prostgles-client";
import { useEffectAsync, useIsMounted, __prglReactInstalled } from "prostgles-client/dist/react-hooks";
import { test } from 'node:test';

test("exports work", () => {
  const exportedTypes = Array.from(new Set([useEffectAsync, useIsMounted, SyncedTable].map(v => typeof v)));
  assert.equal(exportedTypes.join(), "function");
  assert.equal(typeof __prglReactInstalled(), "boolean");
});