import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { DiaryHttp } from "../../helpers/DiaryHttp";
import { DiaryModel } from "../../helpers/DiaryModel";
export async function handle(request:Request) {
 try {
 const {user}=await getServerUserSession(request);
 const row=await db.selectFrom("diaryVaults").select(["salt","keyCheck","profileCipher","kdfIterations"]).where("userId","=",user.id).executeTakeFirst();
 return DiaryHttp.json({vault:row?{...row,keyCheck:DiaryModel.sealed.parse(row.keyCheck),profileCipher:DiaryModel.sealed.parse(row.profileCipher)}:null});
 }catch(e){return DiaryHttp.error(e);}
}
