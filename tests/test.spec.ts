import { strict as assert } from "assert";
import { test } from "node:test";
import { SyncedTable, useEffectAsync, useIsMounted, type OnReadyParams } from "prostgles-client";
import { __prglReactInstalled } from "prostgles-client/dist/hooks/reactImports";
import type { DBGeneratedSchema, DBSchema, GeneratedFunctionSchema } from "./DBGeneratedSchema";

test("exports work", () => {
  const exportedTypes = Array.from(
    new Set([useEffectAsync, useIsMounted, SyncedTable].map((v) => typeof v)),
  );
  assert.equal(exportedTypes.join(), "function");
  assert.equal(typeof __prglReactInstalled(), "boolean");
});

test("types work", () => {
  () => {
    type U = DBSchema["users"];

    type ProstglesContextValue = OnReadyParams<DBGeneratedSchema, GeneratedFunctionSchema, U>;
  };
});
