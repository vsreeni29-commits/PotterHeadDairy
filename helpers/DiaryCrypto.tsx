import { DiaryModel } from "./DiaryModel";
import { z } from "zod";
type Sealed=z.infer<typeof DiaryModel.sealed>;
const encoder=new TextEncoder();
const encode=(bytes:Uint8Array)=>{let s=""; for(const b of bytes)s+=String.fromCharCode(b);return btoa(s);};
const decode=(s:string)=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const context=(purpose:string)=>encoder.encode("potterhead-diary:v1:"+purpose);
async function derive(phrase:string,salt:string) {
 const material=await crypto.subtle.importKey("raw",encoder.encode(phrase),"PBKDF2",false,["deriveKey"]);
 return crypto.subtle.deriveKey({name:"PBKDF2",salt:decode(salt),iterations:600000,hash:"SHA-256"},material,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
}
async function seal(key:CryptoKey,value:unknown,purpose:string):Promise<Sealed> {
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const result=await crypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:context(purpose)},key,encoder.encode(JSON.stringify(value)));
 return {v:1,iv:encode(iv),data:encode(new Uint8Array(result))};
}
async function open<T>(key:CryptoKey,sealed:Sealed,purpose:string):Promise<T> {
 const item=DiaryModel.sealed.parse(sealed);
 const bytes=await crypto.subtle.decrypt({name:"AES-GCM",iv:decode(item.iv),additionalData:context(purpose)},key,decode(item.data));
 return JSON.parse(new TextDecoder().decode(bytes)) as T;
}
async function unlock(phrase:string,vault:{salt:string;keyCheck:Sealed}) {
 try {
 const key=await derive(phrase,vault.salt);
 const check=await open<{marker:string}>(key,vault.keyCheck,"check");
 if(check.marker!=="potterhead-diary-v1")throw new Error();
 return key;
 }catch{throw new Error("That secret phrase did not open this diary. Check every character.");}
}
async function create(phrase:string,profile:z.infer<typeof DiaryModel.profile>) {
 if(phrase.length<16||phrase.length>512)throw new Error("Use a secret phrase of at least 16 characters. Four unrelated words work well.");
 const salt=encode(crypto.getRandomValues(new Uint8Array(16)));
 const key=await derive(phrase,salt);
 return {key,salt,keyCheck:await seal(key,{marker:"potterhead-diary-v1"},"check"),profileCipher:await seal(key,DiaryModel.profile.parse(profile),"profile")};
}
export const DiaryCrypto={create,derive,seal,open,unlock};
