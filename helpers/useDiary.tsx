import {useCallback,useEffect,useRef,useState} from "react";
import {useMutation,useQuery,useQueryClient} from "@tanstack/react-query";
import {z} from "zod";
import {useAuth} from "./useAuth";
import {DiaryModel} from "./DiaryModel";
import {DiaryCrypto} from "./DiaryCrypto";
import {getVault} from "../endpoints/diary/vault_GET.schema";
import {postVault} from "../endpoints/diary/vault_POST.schema";
import {getEntries} from "../endpoints/diary/entries_GET.schema";
import {postEntry} from "../endpoints/diary/entry_POST.schema";
import {postCouncil} from "../endpoints/diary/council_POST.schema";

type Entry=z.infer<typeof DiaryModel.entry>;
type Profile=z.infer<typeof DiaryModel.profile>;
type Mode=Entry["mode"];
type State={id:string;revision:number;payload:Entry;version:number};
const isHidden=()=>document.visibilityState==="hidden";
const fresh=():State=>({id:crypto.randomUUID(),revision:0,payload:{text:"",mode:"Diary",report:null},version:0});

export function useDiary(){
 const {authState,logout}=useAuth();
 const uid=authState.type==="authenticated"?authState.user.id:null;
 const qc=useQueryClient();
 const vault=useQuery({queryKey:["diary-vault",uid],queryFn:getVault,enabled:!!uid,retry:false,staleTime:60000});
 const [archivePage,setArchivePage]=useState(0);
 const entries=useQuery({queryKey:["diary-entries",uid,archivePage],queryFn:()=>getEntries({page:archivePage}),enabled:!!uid,retry:false});
 const [key,setKey]=useState<CryptoKey|null>(null),keyRef=useRef<CryptoKey|null>(null);
 const [profile,setProfile]=useState<Profile|null>(null);
 const [state,setState]=useState<State>(fresh),stateRef=useRef(state);
 const [status,setStatus]=useState<"idle"|"unsaved"|"saving"|"saved"|"error">("idle");
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 const [cooldown,setCooldown]=useState(0);
 const [context,setContext]=useState<{id:string;text:string}[]>([]);
 const revisionMap=useRef<Record<string,number>>({});
 const saveChain=useRef<Promise<unknown>>(Promise.resolve());
 const persisted=useRef<Record<string,number>>({});
 const runRef=useRef(false),epoch=useRef(0),controller=useRef<AbortController|null>(null);
 const {mutateAsync:saveRemote}=useMutation({mutationFn:postEntry,onSuccess:()=>qc.invalidateQueries({queryKey:["diary-entries",uid]})});
 const {mutateAsync:createRemote}=useMutation({mutationFn:postVault,onSuccess:()=>qc.invalidateQueries({queryKey:["diary-vault",uid]})});
 const {mutateAsync:runCouncil}=useMutation({mutationFn:(input:Parameters<typeof postCouncil>[0])=>postCouncil(input,controller.current?.signal),retry:false});
 const outboxKey="potterhead-encrypted-outbox:"+uid;
 const update=useCallback((next:State)=>{stateRef.current=next;setState(next);},[]);
 const edit=useCallback((text:string)=>{
  const current=stateRef.current;
  update({...current,payload:{...current.payload,text,report:null},version:current.version+1});
  setStatus("unsaved");setError("");
 },[update]);
 const setMode=useCallback((mode:Mode)=>{
  const s=stateRef.current;update({...s,payload:{...s.payload,mode,report:null},version:s.version+1});setStatus(s.payload.text?"unsaved":"idle");
 },[update]);

 const persist=useCallback((snapshot=stateRef.current,withKey=keyRef.current)=>{
  if(!uid||!withKey||(!snapshot.payload.text.trim()&&!snapshot.revision))return Promise.resolve();
  if(persisted.current[snapshot.id]===snapshot.version)return Promise.resolve();
  const task=saveChain.current.catch(()=>{}).then(async()=>{
   if(persisted.current[snapshot.id]===snapshot.version)return;
   if(stateRef.current.id===snapshot.id)setStatus("saving");
   const cipher=await DiaryCrypto.seal(withKey,snapshot.payload,"entry:"+snapshot.id);
   const revision=revisionMap.current[snapshot.id]??snapshot.revision;
   const stamp=crypto.randomUUID();
   // Ciphertext only. This survives a network failure or accidental reload.
   try{localStorage.setItem(outboxKey,JSON.stringify({id:snapshot.id,cipher,revision,stamp}));}catch{}
   try{
    const saved=await saveRemote({id:snapshot.id,cipher,revision});
    revisionMap.current[snapshot.id]=saved.revision;
    persisted.current[snapshot.id]=snapshot.version;
    try{if(JSON.parse(localStorage.getItem(outboxKey)||"null")?.stamp===stamp)localStorage.removeItem(outboxKey);}catch{}
    if(stateRef.current.id===snapshot.id){
     const latest=stateRef.current;update({...latest,revision:saved.revision});
     setStatus(latest.version===snapshot.version?"saved":"unsaved");setError("");
    }
   }catch(e){
    if(stateRef.current.id===snapshot.id){setStatus("error");setError(e instanceof Error?e.message:"Your encrypted save is waiting to sync.");}
    throw e;
   }
  });
  saveChain.current=task;return task;
 },[uid,outboxKey,saveRemote,update]);

 const lock=useCallback(()=>{
  const snapshot=stateRef.current,oldKey=keyRef.current;
  if(oldKey&&snapshot.payload.text.trim())void persist(snapshot,oldKey).catch(()=>{});
  epoch.current++;controller.current?.abort();keyRef.current=null;setKey(null);setProfile(null);setContext([]);
  update(fresh());setBusy(false);setStatus("idle");setError("");
  qc.removeQueries({queryKey:["diary-entry"]});
 },[persist,update,qc]);

 useEffect(()=>{
  if(!key||!state.payload.text.trim()||state.version===persisted.current[state.id])return;
  const timer=setTimeout(()=>void persist().catch(()=>{}),900);
  return()=>clearTimeout(timer);
 },[key,state.id,state.version,state.payload.text,persist]);

 useEffect(()=>{
  if(!key)return;
  let timer:ReturnType<typeof setTimeout>;
  const reset=()=>{clearTimeout(timer);timer=setTimeout(lock,5*60000);};
  const hidden=()=>{if(isHidden())lock();};
  reset();window.addEventListener("pointerdown",reset);window.addEventListener("keydown",reset);
  document.addEventListener("visibilitychange",hidden);
  return()=>{clearTimeout(timer);window.removeEventListener("pointerdown",reset);window.removeEventListener("keydown",reset);document.removeEventListener("visibilitychange",hidden);};
 },[key,lock]);
 useEffect(()=>{if(cooldown<=Date.now())return;const t=setTimeout(()=>setCooldown(0),cooldown-Date.now());return()=>clearTimeout(t);},[cooldown]);
 useEffect(()=>{
  const leaving=(event:BeforeUnloadEvent)=>{
   const s=stateRef.current;
   if(keyRef.current&&s.payload.text.trim()&&persisted.current[s.id]!==s.version){event.preventDefault();event.returnValue="";}
  };
  window.addEventListener("beforeunload",leaving);
  return()=>window.removeEventListener("beforeunload",leaving);
 },[]);
 const previousUid=useRef(uid);
 useEffect(()=>{if(previousUid.current!==uid){previousUid.current=uid;lock();qc.removeQueries({queryKey:["diary-vault"]});qc.removeQueries({queryKey:["diary-entries"]});}},[uid,lock,qc]);

 const activate=async(newKey:CryptoKey,newProfile:Profile)=>{
  if(isHidden())throw new Error("Return to the diary and unlock it again.");
  keyRef.current=newKey;setKey(newKey);setProfile(newProfile);setError("");
  let recovered=false;
  try{
   const raw=localStorage.getItem(outboxKey);
   if(raw){
    const stored=z.object({id:z.string().uuid(),cipher:DiaryModel.sealed,revision:z.number().int().nonnegative(),stamp:z.string()}).parse(JSON.parse(raw));
    const payload=DiaryModel.entry.parse(await DiaryCrypto.open(newKey,stored.cipher,"entry:"+stored.id));
    let revision=stored.revision;
    try{const result=await getEntries({id:stored.id});if(result.entry&&JSON.stringify(result.entry.cipher)===JSON.stringify(stored.cipher))revision=result.entry.revision;}catch{}
    revisionMap.current[stored.id]=revision;
    update({id:stored.id,payload,revision,version:1});setStatus("unsaved");recovered=true;
   }
  }catch{setError("An encrypted recovery copy could not be opened. It has been kept on this device.");}
  if(!recovered){update(fresh());setStatus("idle");}
 };
 const create=async(phrase:string,p:Profile)=>{
  const created=await DiaryCrypto.create(phrase,p);
  await createRemote({salt:created.salt,keyCheck:created.keyCheck,profileCipher:created.profileCipher});
  await activate(created.key,p);
 };
 const verify=async(phrase:string)=>{
  const v=vault.data?.vault;
  if(!v)throw new Error("Your diary is not available. Try refreshing the page.");
  return DiaryCrypto.unlock(phrase,v);
 };
 const unlock=async(phrase:string)=>{
  const next=await verify(phrase),v=vault.data!.vault!;
  const p=DiaryModel.profile.parse(await DiaryCrypto.open(next,v.profileCipher,"profile"));
  await activate(next,p);
 };
 const read=async(id:string,phrase:string)=>{
  const session=epoch.current;
  const next=await verify(phrase);
  if(epoch.current!==session||!keyRef.current||isHidden())throw new Error("The diary was sealed while opening. Unlock it again.");
  if(id===stateRef.current.id)return {...stateRef.current};
  const r=await getEntries({id});
  if(!r.entry)throw new Error("That page was not found.");
  const payload=DiaryModel.entry.parse(await DiaryCrypto.open(next,r.entry.cipher,"entry:"+id));
  if(epoch.current!==session||!keyRef.current||isHidden())throw new Error("The diary was sealed while opening. Unlock it again.");
  return {id,revision:r.entry.revision,payload,version:0};
 };
 const adopt=async(record:State)=>{
  const session=epoch.current;
  await persist();
  if(epoch.current!==session||!keyRef.current)throw new Error("The diary was sealed. Unlock it again.");
  revisionMap.current[record.id]=record.revision;persisted.current[record.id]=record.version;
  update(record);setStatus("saved");setError("");
 };
 const newPage=async()=>{await persist();update(fresh());setStatus("idle");setError("");};
 const submit=async()=>{
  if(runRef.current||Date.now()<cooldown)return;
  const activeKey=keyRef.current,snapshot=stateRef.current,session=epoch.current;
  if(!activeKey)throw new Error("Unlock your diary before submitting.");
  if(snapshot.payload.text.trim().length<8)throw new Error("Give the page a few more words first.");
  runRef.current=true;setBusy(true);setError("");controller.current=new AbortController();
  try{
   await persist(snapshot,activeKey);
   const response=await runCouncil({requestId:crypto.randomUUID(),entryId:snapshot.id,text:snapshot.payload.text,mode:snapshot.payload.mode,language:profile?.language??"English",context:context.map(c=>c.text),consent:true});
   if(epoch.current!==session||!keyRef.current)return;
   const next={...stateRef.current,payload:{...stateRef.current.payload,report:response.report},version:stateRef.current.version+1};
   update(next);
   await persist(next,activeKey);
  }catch(e){
   if(epoch.current!==session)return;
   const ex=e as Error&{code?:string;status?:number};
   if(ex.status===429)setCooldown(Date.now()+60000);
   if(ex.name==="AbortError")return;
   if(ex.code==="OUT_OF_CREDITS"){setError("The Council is temporarily unavailable. Your encrypted draft is saved.");return;}
   setError(ex.message||"The Council could not respond. Your draft is saved.");
   throw e;
  }finally{runRef.current=false;if(epoch.current===session)setBusy(false);controller.current=null;}
 };
 const addContext=(record:State)=>{
  if(context.some(c=>c.id===record.id))return;
  if(context.length>=3)throw new Error("Use up to three previous pages as context.");
  setContext(c=>[...c,{id:record.id,text:record.payload.text}]);
 };
 const restore=async(raw:string,phrase:string)=>{
  const session=epoch.current,activeKey=keyRef.current;
  if(!activeKey)throw new Error("Unlock your current diary first.");
  const backup=z.object({format:z.literal("potterhead-sealed-page-v1"),vault:z.object({salt:z.string().regex(/^[A-Za-z0-9+/]{22}==$/),keyCheck:DiaryModel.sealed}),page:z.object({id:z.string().uuid(),cipher:DiaryModel.sealed})}).parse(JSON.parse(raw));
  const originalKey=await DiaryCrypto.unlock(phrase,backup.vault);
  const payload=DiaryModel.entry.parse(await DiaryCrypto.open(originalKey,backup.page.cipher,"entry:"+backup.page.id));
  if(epoch.current!==session||!keyRef.current||isHidden())throw new Error("The diary was sealed. Unlock it again.");
  await persist();
  if(epoch.current!==session||!keyRef.current)throw new Error("The diary was sealed. Unlock it again.");
  const next={...fresh(),payload,version:1};update(next);
  await persist(next,activeKey);
 };
 const signOut=async()=>{await persist();lock();qc.removeQueries({queryKey:["diary-vault"]});qc.removeQueries({queryKey:["diary-entries"]});await logout();};
 return {authState,vault,entries,archivePage,setArchivePage,key,profile,state,status,error,busy,cooldown,context,
 edit,setMode,persist,lock,create,unlock,verify,read,adopt,newPage,submit,restore,addContext,clearContext:()=>setContext([]),signOut};
}
