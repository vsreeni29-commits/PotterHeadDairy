import { schema } from "./entries_GET.schema";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { DiaryHttp } from "../../helpers/DiaryHttp";
import { DiaryModel } from "../../helpers/DiaryModel";
export async function handle(request:Request) {
 try{
 const {user}=await getServerUserSession(request);
 const input=schema.parse(Object.fromEntries(new URL(request.url).searchParams));
 if(input.id){
 const entry=await db.selectFrom("diaryEntries").select(["id","cipher","revision"]).where("id","=",input.id).where("userId","=",user.id).executeTakeFirst();
 if(!entry)return DiaryHttp.json({error:"That sealed page was not found."},404);
 return DiaryHttp.json({entries:[],entry:{...entry,cipher:DiaryModel.sealed.parse(entry.cipher)},hasMore:false});
 }
 const rows=await db.selectFrom("diaryEntries").select(["id","createdAt","updatedAt","revision"]).where("userId","=",user.id).orderBy("updatedAt","desc").orderBy("id","desc").offset(input.page*30).limit(31).execute();
 return DiaryHttp.json({entries:rows.slice(0,30),hasMore:rows.length>30});
 }catch(e){return DiaryHttp.error(e);}
}
