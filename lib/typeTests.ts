import { AnyObject, FullFilter, TableHandler } from "prostgles-types";
import { DBHandlerClient, useProstglesClient } from "./prostgles";

(async () => {
  // const schema: DBSchema = {
    type GeneratedSchema = {
    table1: {
      columns: {
        col1: string,
      },
      is_view: false,
      select: true,
      insert: true,
      update: true,
      delete: true,
    }
  };
  
  const client = useProstglesClient<GeneratedSchema>({ socket: 1 as any })
  const t1 = client?.dbo.table1.useFind({ }, { orderBy: { col1: 1 } });
  const dbo: DBHandlerClient<GeneratedSchema> = 1 as any;
  
  const filter: FullFilter<GeneratedSchema["table1"]["columns"], GeneratedSchema> = {  };
  
  const filterCheck = <F extends FullFilter<void, void> | undefined>(f: F) => {};
  filterCheck(filter);
  
  const sub: TableHandler["size"] = dbo.table1.size
  
  const f = <A extends TableHandler>(a: A) => {};
  
  // f(dbo.table1)
  const ra = <A extends AnyObject>(a: A) => {
  
  }; 
  
  const dbH: DBHandlerClient = 1 as any;
   
  dbH.dwadwa?.findOne!(
    { "name.@@.to_tsquery": ["abc81"] }, 
    { select: { 
      h: { "$ts_headline_simple": ["name", { plainto_tsquery: "abc81" }] },
      hh: { "$ts_headline": ["name", "abc81"] } ,
      added: "$date_trunc_2hour",
      addedY: { "$date_trunc_5minute": ["added"] }
    }});
   
    dbH.d?.find?.({}, { 

      select: { id: 1, name: 1, items3: { name: "$upper" } }
    })

    dbH.d?.find!({}, {
      select: { connection_id: 1, access_control_user_types: { access_control_id: 1 }, access_control_methods: { access_control_id: 1 }  } 
    })
  // const dboBasic: DBHandlerClient = dbo;
  
})