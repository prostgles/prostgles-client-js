import { strict as assert } from "assert";
import { test } from "node:test";
import {
  useAsyncEffectQueue,
  useDeepCompareMemoize,
  useEffectAsync,
  useEffectDeep,
  useFetch,
  useIsMounted,
  useMemoDeep,
  usePromise,
  useProstglesClient,
  useSubscribe,
  useSync,
  type OnReadyParams,
} from "prostgles-client";
import { __prglReactInstalled } from "prostgles-client/dist/hooks/reactImports";
import type { DBGeneratedSchema, DBSchema, GeneratedFunctionSchema } from "./DBGeneratedSchema";

test("exports work", () => {
  const exportedTypes = Array.from(
    new Set(
      [
        useAsyncEffectQueue,
        useDeepCompareMemoize,
        useEffectAsync,
        useEffectDeep,
        useFetch,
        useIsMounted,
        useMemoDeep,
        usePromise,
        useProstglesClient,
        useSubscribe,
        useSync,
      ].map((value) => typeof value),
    ),
  );
  assert.equal(exportedTypes.join(), "function");
  assert.equal(typeof __prglReactInstalled(), "boolean");
});

test("types work", () => {
  type U = DBSchema["users"];

  type ProstglesContextValue = OnReadyParams<DBGeneratedSchema, GeneratedFunctionSchema, U>;
});
