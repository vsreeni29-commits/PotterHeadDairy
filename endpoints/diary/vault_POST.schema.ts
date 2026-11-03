import { z } from "zod";
import superjson from "superjson";
import { DiaryModel } from "../../helpers/DiaryModel";
export const schema=z.object({salt:z.string().regex(/^[A-Za-z0-9+/]{22}==$/),keyCheck:DiaryModel.sealed,profileCipher:DiaryModel.sealed}).strict();
export type OutputType={ok:true};
export async function postVault(input:z.infer<typeof schema>):Promise<OutputType> {
 const r=await fetch("/_api/diary/vault",{method:"POST",headers:{"Content-Type":"application/json"},body:superjson.stringify(schema.parse(input))});
 const data=superjson.parse<OutputType&{error?:string}>(await r.text());
 if(!r.ok)throw new Error(data.error||"Could not create your diary.");return data;
}
