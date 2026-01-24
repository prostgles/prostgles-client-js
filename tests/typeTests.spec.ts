import type { AnyObject, FullFilter, TableHandler } from "prostgles-types";
import { type DBHandlerClient, useProstglesClient } from "prostgles-client/dist/prostgles";
import { test } from "node:test";

test("types work", async () => {
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

  const typeTest = () => {
    const client = useProstglesClient<GeneratedSchema>();
    if (client.isLoading || client.hasError) return;
    const t1 = client.db.table1?.useFind({}, { orderBy: { col1: 1 } });
    const dbo: DBHandlerClient<GeneratedSchema> = 1 as any;

    const client2 = useProstglesClient();
    if (client2.isLoading || "error" in client2) return;
    client2.db.dwada?.find?.();

    const filter: FullFilter<GeneratedSchema["table1"]["columns"], GeneratedSchema> = {};

    const filterCheck = <F extends FullFilter<void, void> | undefined>(f: F) => {};
    filterCheck(filter);

    const sub: TableHandler["size"] = dbo.table1.size;

    const f = <A extends TableHandler>(a: A) => {};

    // f(dbo.table1)
    const ra = <A extends AnyObject>(a: A) => {};

    const dbH: DBHandlerClient = 1 as any;

    dbH.dwadwa?.findOne!(
      { "name.@@.to_tsquery": ["abc81"] },
      {
        select: {
          h: { $ts_headline_simple: ["name", { plainto_tsquery: "abc81" }] },
          hh: { $ts_headline: ["name", "abc81"] },
          added: "$date_trunc_2hour",
          addedY: { $date_trunc_5minute: ["added"] },
        },
      },
    );

    dbH.d?.find?.(
      {},
      {
        select: { id: 1, name: 1, items3: { name: "$upper" } },
      },
    );

    dbH.d?.find!(
      {},
      {
        select: {
          connection_id: 1,
          access_control_user_types: { access_control_id: 1 },
          access_control_methods: { access_control_id: 1 },
        },
      },
    );

    dbH.d?.find!(
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
  };
  typeTest;
});
