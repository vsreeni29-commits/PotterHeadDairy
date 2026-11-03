import superjson from "superjson";
import { NotAuthenticatedError } from "./getSetServerSession";
import { ZodError } from "zod";
function json(value:unknown,status=200) {return new Response(superjson.stringify(value),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store, private"}});}
function error(err:unknown) {
 if(err instanceof NotAuthenticatedError)return json({error:"Sign in to open your diary."},401);
 if(err instanceof ZodError)return json({error:"The request was not valid. Please check your input."},400);
 return json({error:"The diary could not complete that request. Your saved words have not been removed."},500);
}
async function body(request:Request) {
 const text=await request.text();
 if(text.length>300000)throw new ZodError([{code:"custom",path:[],message:"Too large"}]);
 try{return superjson.parse(text);}catch{throw new ZodError([{code:"custom",path:[],message:"Invalid JSON"}]);}
}
export const DiaryHttp={json,error,body};
