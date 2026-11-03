import { schema } from "./vault_POST.schema";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { DiaryHttp } from "../../helpers/DiaryHttp";
export async function handle(request:Request) {
 try{
 const {user}=await getServerUserSession(request);
 const input=schema.parse(await DiaryHttp.body(request));
 const saved=await db.insertInto("diaryVaults").values({...input,userId:user.id}).onConflict(oc=>oc.column("userId").doNothing()).returning("userId").executeTakeFirst();
 if(!saved)return DiaryHttp.json({error:"A diary already exists. Open it with its original secret phrase."},409);
 return DiaryHttp.json({ok:true});
 }catch(e){return DiaryHttp.error(e);}
}
