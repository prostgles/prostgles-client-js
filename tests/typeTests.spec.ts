import { test } from "node:test";
import prostgles from "prostgles-client";
import {
  type DBHandlerClient,
  prostgles as namedProstgles,
  useProstglesClient,
} from "prostgles-client/dist/prostgles";
import type { DBHandler, FullFilter, TableHandler } from "prostgles-types";
import type { FunctionHandle, OnReadyParams, TableHandlerClient } from "../dist";
import type { DBGeneratedSchema } from "./DBGeneratedSchema";

type GeneratedSchema = {
  table1: {
    columns: {
      col1: string;
    };
    is_view: false;
    select: true;
    insert: true;
    update: true;
    delete: true;
  };
};

test("types work", async () => {
  const typeTest = async () => {
    const options = { endpoint: "http://localhost:3000", token: "test-token" };
    const prostglesClient = await prostgles<GeneratedSchema>(options);
    prostglesClient.db.table1?.find?.();
    const namedProstglesClient = await namedProstgles<GeneratedSchema>(options);
    namedProstglesClient.db.table1?.find?.();

    const client = useProstglesClient<GeneratedSchema>();
    if (client.isLoading || client.hasError) return;
    const useFindResult = client.db.table1?.useFind({}, { orderBy: { col1: 1 } });
    useFindResult?.data satisfies undefined | Required<GeneratedSchema["table1"]["columns"]>[];
    const db = {} as DBHandlerClient<GeneratedSchema>;

    const client2 = useProstglesClient();
    if (client2.isLoading || "error" in client2) return;
    client2.db.myTable?.find?.();

    client2.methods;
    const filter: FullFilter<GeneratedSchema["table1"]["columns"], GeneratedSchema> = {};

    const filterCheck = <F extends FullFilter<void, void> | undefined>(f: F) => {};
    filterCheck(filter);

    db.table1.size satisfies TableHandler["size"];

    const dbHandlerUntyped = {} as DBHandlerClient;

    dbHandlerUntyped.myTable?.findOne!(
      { "name.@@.to_tsquery": ["abc81"] },
      {
        select: {
          h: { $ts_headline_simple: ["name", { plainto_tsquery: "abc81" }] },
          hh: { $ts_headline: ["name", "abc81"] },
          added: "$date_trunc",
          addedY: { $date_trunc: ["added"] },
        },
      },
    );

    const row = await dbHandlerUntyped.d?.find?.(
      {},
      {
        select: { id: 1, name: 1, items3: { name: "$upper" } },
      },
    );
    row?.[0]?.id;
    row?.[0]?.items3;
    row?.[0]?.name;
    //@ts-expect-error
    row?.[0]?.invalid;

    const syncedItemNoHandles = dbHandlerUntyped.d?.useSyncOne?.({}, {
      select: { id: 1 },
      handlesOnData: false,
    } as const);
    //@ts-expect-error
    syncedItemNoHandles?.data?.$cloneMultiSync(() => {});
    //@ts-expect-error
    syncedItemNoHandles?.data?.name;
    syncedItemNoHandles?.data?.id;

    const syncedItemWithHandles = dbHandlerUntyped.d?.useSyncOne?.({}, {
      select: { id: 1, name: 1 },
      handlesOnData: true,
    } as const);
    syncedItemWithHandles?.data?.$cloneMultiSync(() => {});
    syncedItemWithHandles?.data?.name;

    dbHandlerUntyped.d?.sync?.(
      {},
      {
        select: { name: 1 },
        handlesOnData: true,
      } as const,
      (items) => {
        void items[0]?.name;
        //@ts-expect-error
        void items[0]?.id;
      },
    );

    dbHandlerUntyped.d?.find!(
      {},
      {
        //@ts-expect-error
        select: {
          connection_id: 12,
          access_control_user_types: { access_control_id: 1 },
          access_control_methods: { access_control_id: 1 },
        },
      },
    );

    const dbTyped = {} as DBHandler<DBGeneratedSchema>;
    dbTyped.futures.findOne?.();
    let dbGeneric = {} as DBHandler;
    dbGeneric = dbTyped;

    const tblH = {} as TableHandlerClient<DBGeneratedSchema, "symbols">;

    tblH.insert({
      pair: "BTC/USD",
    });

    let tblH2 = {} as TableHandlerClient;
    tblH2 = tblH;

    const dbClientTyped = {} as DBHandlerClient<DBGeneratedSchema>;
    dbClientTyped.futures.findOne?.();
    let dbClientGeneric = {} as DBHandlerClient;
    dbClientGeneric = dbClientTyped;
  };
  typeTest;
});

test("GeneratedFunctionSchema types work ", async () => {
  async () => {
    type GeneratedFunctionSchema = {
      askLLM: (args: { messages?: any; model?: any; tools?: any }) => Promise<unknown>;
      stopServer: () => Promise<boolean>;
    };
    const client = useProstglesClient<GeneratedSchema, GeneratedFunctionSchema>();
    if (client.isLoading || client.hasError) return;
    client.methods?.askLLM({
      messages: [],
      model: "gpt-4",
      //@ts-expect-error
      dddd: 1,
    });

    const readyParams: OnReadyParams<
      GeneratedSchema,
      GeneratedFunctionSchema,
      { id: string; type: string }
    > = {} as any;

    readyParams.methods?.askLLM({
      messages: [],
      model: "gpt-4",
      //@ts-expect-error
      dddd: 1,
    });

    const res = await readyParams.methods?.stopServer();
    res satisfies boolean | undefined;

    const readyParamsBasic: OnReadyParams = {} as any;
    const res2 = await readyParamsBasic.methods?.stopServer?.({});
    await readyParamsBasic.methods?.runAgent?.();

    const runAgent: FunctionHandle<void, { done: boolean }> = async () => ({ done: true });
    (await runAgent()) satisfies { done: boolean };

    const optionalInput: FunctionHandle<{ name: string } | undefined> = async (args) => args?.name;
    await optionalInput();
    await optionalInput({ name: "test" });

    const requiredInput: FunctionHandle<{ name: string }, string> = async ({ name }) => name;
    (await requiredInput({ name: "test" })) satisfies string;
    // @ts-expect-error Input is required when its type excludes undefined.
    await requiredInput();
    // @ts-expect-error Required input properties must keep their declared types.
    await requiredInput({ name: 1 });
  };
});
