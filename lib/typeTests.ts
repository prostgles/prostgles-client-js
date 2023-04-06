import { AnyObject, DBSchema, FullFilter, TableHandler } from "prostgles-types";
import { DBOFullyTyped } from "./prostgles";


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

const dbo: DBOFullyTyped<GeneratedSchema> = 1 as any;

const filter: FullFilter<GeneratedSchema, GeneratedSchema["table1"]["columns"]> = {  };

const filterCheck = <F extends FullFilter | undefined>(f: F) => {};
filterCheck(filter);

const sub: TableHandler["count"] = dbo.table1.count

const f = <A extends TableHandler>(a: A) => {};

// f(dbo.table1)
const ra = <A extends AnyObject>(a: A) => {

}; 
