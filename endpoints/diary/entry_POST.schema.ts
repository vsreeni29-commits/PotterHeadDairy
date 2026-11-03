import { z } from "zod";
import superjson from "superjson";
import { DiaryModel } from "../../helpers/DiaryModel";
export const schema=z.object({id:z.string().uuid(),cipher:DiaryModel.sealed,revision:z.number().int().min(0).max(100000000)});
export type OutputType={revision:number};
export async function postEntry(input:z.infer<typeof schema>):Promise<OutputType>{
 const r=await fetch("/_api/diary/entry",{method:"POST",headers:{"Content-Type":"application/json"},body:superjson.stringify(schema.parse(input))});
 const data=superjson.parse<OutputType&{error?:string}>(await r.text());
 if(!r.ok)throw new Error(data.error||"Could not save your words.");return data;
}
