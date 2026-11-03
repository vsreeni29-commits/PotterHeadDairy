import { z } from "zod";
import superjson from "superjson";
import { DiaryModel } from "../../helpers/DiaryModel";
export const schema=z.object({id:z.string().uuid().optional(),page:z.coerce.number().int().min(0).max(100000).default(0)});
type Sealed=z.infer<typeof DiaryModel.sealed>;
export type OutputType={entries:{id:string;createdAt:Date;updatedAt:Date;revision:number}[];entry?:{id:string;cipher:Sealed;revision:number};hasMore:boolean};
export async function getEntries(input:{id?:string;page?:number}={}):Promise<OutputType>{
 const params=new URLSearchParams();
 if(input.id)params.set("id",input.id);
 if(input.page)params.set("page",String(input.page));
 const r=await fetch("/_api/diary/entries?"+params,{cache:"no-store"});
 const data=superjson.parse<OutputType&{error?:string}>(await r.text());
 if(!r.ok)throw new Error(data.error||"Could not read your sealed pages.");return data;
}
