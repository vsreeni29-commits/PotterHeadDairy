import { z } from "zod";
import superjson from "superjson";
import { DiaryModel } from "../../helpers/DiaryModel";
export const schema=z.object({});
type Sealed=z.infer<typeof DiaryModel.sealed>;
export type OutputType={vault:null|{salt:string;keyCheck:Sealed;profileCipher:Sealed;kdfIterations:number}};
export async function getVault():Promise<OutputType>{
 const r=await fetch("/_api/diary/vault",{cache:"no-store"});
 const body=superjson.parse<OutputType&{error?:string}>(await r.text());
 if(!r.ok)throw new Error(body.error||"Could not open your vault.");
 return body;
}
