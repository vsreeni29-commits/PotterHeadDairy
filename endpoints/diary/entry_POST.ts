import { schema } from "./entry_POST.schema";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { DiaryHttp } from "../../helpers/DiaryHttp";
export async function handle(request:Request) {
 try{
 const {user}=await getServerUserSession(request);
 const input=schema.parse(await DiaryHttp.body(request));
 const vault=await db.selectFrom("diaryVaults").select("userId").where("userId","=",user.id).executeTakeFirst();
 if(!vault)return DiaryHttp.json({error:"Create your encrypted diary first."},409);
 if(input.revision===0){
 const row=await db.insertInto("diaryEntries").values({id:input.id,userId:user.id,cipher:input.cipher}).onConflict(oc=>oc.column("id").doNothing()).returning("revision").executeTakeFirst();
 if(row)return DiaryHttp.json(row);
 }else{
 const row=await db.updateTable("diaryEntries").set({cipher:input.cipher,updatedAt:new Date(),revision:input.revision+1}).where("id","=",input.id).where("userId","=",user.id).where("revision","=",input.revision).returning("revision").executeTakeFirst();
 if(row)return DiaryHttp.json(row);
 }
 return DiaryHttp.json({error:"This page changed in another window. Your words are still here; copy them from Reveal before reopening the saved version."},409);
 }catch(e){return DiaryHttp.error(e);}
}
