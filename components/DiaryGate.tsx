import React,{useEffect} from "react";
import {z} from "zod";
import {KeyRound,ShieldCheck} from "lucide-react";
import {Dialog,DialogContent,DialogTitle,DialogDescription} from "./Dialog";
import {Form,FormItem,FormLabel,FormControl,FormMessage,useForm} from "./Form";
import {Input} from "./Input";
import {Button} from "./Button";
import {Switch} from "./Switch";
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from "./Select";
import styles from "./DiaryGate.module.css";

type Values={phrase:string;confirm:string;name:string;potter:boolean;language:"English"|"Tanglish"};
type Props={open:boolean;kind:"create"|"unlock"|"reveal";onClose:()=>void;onConfirm:(values:Values)=>Promise<void>;defaultName?:string;className?:string};
export function DiaryGate({open,kind,onClose,onConfirm,defaultName="",className}:Props){
 const [busy,setBusy]=React.useState(false),[error,setError]=React.useState("");
 const form=useForm({schema:z.object({phrase:z.string().min(1,"Enter your secret phrase.").max(512),confirm:z.string(),name:z.string().max(40),potter:z.boolean(),language:z.enum(["English","Tanglish"])}),defaultValues:{phrase:"",confirm:"",name:defaultName,potter:true,language:"English" as const}});
 useEffect(()=>{if(!open){form.setValues(v=>({...v,phrase:"",confirm:""}));setError("");}},[open]);
 const submit=async(v:Values)=>{
  setError("");
  if(kind==="create"&&(v.phrase.length<16||v.phrase!==v.confirm||!v.name.trim())){setError(!v.name.trim()?"Tell the diary what to call you.":v.phrase.length<16?"Use at least 16 characters. Four unrelated words work well.":"The secret phrases do not match.");return;}
  setBusy(true);
  try{await onConfirm(v);form.setValues(prev=>({...prev,phrase:"",confirm:""}));onClose();}
  catch(e){setError(e instanceof Error?e.message:"The diary could not be opened.");}
  finally{setBusy(false);}
 };
 return <Dialog open={open} onOpenChange={next=>{if(!next&&!busy)onClose();}}><DialogContent className={styles.dialog+" "+(className||"")} onInteractOutside={e=>{if(busy)e.preventDefault();}}>
 <div className={styles.key}><KeyRound size={23}/></div>
 <DialogTitle className={styles.title}>{kind==="create"?"Make it yours.":kind==="reveal"?"Some words are only for you.":"Welcome back to your diary."}</DialogTitle>
 <DialogDescription className={styles.description}>{kind==="create"?"Choose the phrase that will seal every word you write.":"Your saved words stay invisible until you enter your secret phrase."}</DialogDescription>
 <Form {...form}><form className={styles.form} onSubmit={form.handleSubmit(submit)}>
 {kind==="create"&&<><FormItem name="name"><FormLabel>What should the diary call you?</FormLabel><FormControl><Input value={form.values.name} maxLength={40} autoComplete="nickname" placeholder="Sreeni" onChange={e=>form.setValues(v=>({...v,name:e.target.value}))}/></FormControl><FormMessage/></FormItem>
 <div className={styles.toggle}><label htmlFor="potter-surname">Add “Potter” to my name</label><Switch id="potter-surname" checked={form.values.potter} onCheckedChange={value=>form.setValues(v=>({...v,potter:value}))}/></div>
 <FormItem name="language"><FormLabel>Council language</FormLabel><Select value={form.values.language} onValueChange={value=>form.setValues(v=>({...v,language:value as Values["language"]}))}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="English">English</SelectItem><SelectItem value="Tanglish">Tanglish · Tamil in English</SelectItem></SelectContent></Select><FormMessage/></FormItem></>}
 <FormItem name="phrase"><FormLabel>{kind==="create"?"Create your secret phrase":"Your secret phrase"}</FormLabel><FormControl><Input type="password" autoComplete="off" autoCapitalize="none" spellCheck={false} value={form.values.phrase} onChange={e=>form.setValues(v=>({...v,phrase:e.target.value}))} placeholder={kind==="create"?"At least 16 characters":"Enter your secret phrase"} disabled={busy}/></FormControl><FormMessage/></FormItem>
 {kind==="create"&&<FormItem name="confirm"><FormLabel>Repeat your secret phrase</FormLabel><FormControl><Input type="password" autoComplete="off" autoCapitalize="none" spellCheck={false} value={form.values.confirm} onChange={e=>form.setValues(v=>({...v,confirm:e.target.value}))} disabled={busy}/></FormControl><FormMessage/></FormItem>}
 {error&&<p className={styles.error} role="alert">{error}</p>}
 {kind==="create"&&<p className={styles.warning}>Keep this phrase somewhere safe. We cannot recover it. Resetting your account password will not unlock your diary.</p>}
 <Button type="submit" disabled={busy} className={styles.submit}>{busy?"Opening the seal…":kind==="create"?"Create my diary":kind==="reveal"?"Reveal these words":"Open my diary"}</Button>
 <p className={styles.footnote}><ShieldCheck size={13}/> Your phrase stays on this device. Saved writing is encrypted before it is sent.</p>
 </form></Form></DialogContent></Dialog>;
}
