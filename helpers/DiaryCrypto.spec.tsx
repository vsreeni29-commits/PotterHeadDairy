import {webcrypto} from "node:crypto";
import {DiaryCrypto} from "./DiaryCrypto";
describe("Diary encryption",()=>{
 let previous:Crypto;
 beforeAll(()=>{previous=globalThis.crypto;Object.defineProperty(globalThis,"crypto",{configurable:true,value:webcrypto});});
 afterAll(()=>Object.defineProperty(globalThis,"crypto",{configurable:true,value:previous}));
 it("round-trips Unicode without exposing text in ciphertext",async()=>{
  const created=await DiaryCrypto.create("cedar river paper lantern",{name:"Sreeni",potter:true,language:"English"});
  const text={text:"Anger is present. வணக்கம். 💭",report:"A quiet reflection."};
  const sealed=await DiaryCrypto.seal(created.key,text,"entry:one");
  expect(JSON.stringify(sealed)).not.toContain("Anger");
  expect(await DiaryCrypto.open(created.key,sealed,"entry:one")).toEqual(text);
  expect(created.key.extractable).toBeFalse();
 });
 it("uses a different nonce for every encryption",async()=>{
  const created=await DiaryCrypto.create("cedar river paper lantern",{name:"Sreeni",potter:true,language:"English"});
  const a=await DiaryCrypto.seal(created.key,"same words","entry:one");
  const b=await DiaryCrypto.seal(created.key,"same words","entry:one");
  expect(a.iv).not.toEqual(b.iv);expect(a.data).not.toEqual(b.data);
 });
 it("rejects a wrong phrase",async()=>{
  const created=await DiaryCrypto.create("cedar river paper lantern",{name:"Sreeni",potter:true,language:"English"});
  await expectAsync(DiaryCrypto.unlock("a different secret phrase",created)).toBeRejected();
  const reopened=await DiaryCrypto.unlock("cedar river paper lantern",created);
  expect(await DiaryCrypto.open(reopened,created.profileCipher,"profile")).toEqual({name:"Sreeni",potter:true,language:"English"});
 });
 it("rejects tampering and moving ciphertext to another page",async()=>{
  const created=await DiaryCrypto.create("cedar river paper lantern",{name:"Sreeni",potter:true,language:"English"});
  const sealed=await DiaryCrypto.seal(created.key,{text:"Private"},"entry:one");
  await expectAsync(DiaryCrypto.open(created.key,sealed,"entry:two")).toBeRejected();
  const changed={...sealed,data:(sealed.data[0]==="A"?"B":"A")+sealed.data.slice(1)};
  await expectAsync(DiaryCrypto.open(created.key,changed,"entry:one")).toBeRejected();
 });
 it("does not create a vault with a short phrase",async()=>{
  await expectAsync(DiaryCrypto.create("short",{name:"Sreeni",potter:true,language:"English"})).toBeRejected();
 });
});
