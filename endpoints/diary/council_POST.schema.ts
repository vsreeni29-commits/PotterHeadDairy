import { z } from "zod";
import superjson from "superjson";
import { DiaryModel } from "../../helpers/DiaryModel";
export const schema=z.object({
 requestId:z.string().uuid(),entryId:z.string().uuid(),text:z.string().trim().min(8).max(18000),
 mode:z.enum(DiaryModel.modes),language:z.enum(["English","Tanglish"]),
 consent:z.literal(true),context:z.array(z.string().max(18000)).max(3).default([])
}).strict();
export type OutputType={report:string;safety:boolean};
export async function postCouncil(input:z.infer<typeof schema>,signal?:AbortSignal):Promise<OutputType>{
 const r=await fetch("/_api/diary/council",{method:"POST",signal,headers:{"Content-Type":"application/json"},body:superjson.stringify(schema.parse(input))});
 const data=superjson.parse<OutputType&{error?:string;code?:string}>(await r.text());
 if(!r.ok){const error=new Error(data.error||"The Council could not respond. Your draft is safe.");Object.assign(error,{code:data.code,status:r.status});throw error;}
 return data;
}
