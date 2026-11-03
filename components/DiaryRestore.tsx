import React,{useState,useEffect} from "react";
import {z} from "zod";
import {Dialog,DialogContent,DialogTitle,DialogDescription} from "./Dialog";
import {Form,FormItem,FormLabel,FormControl,FormMessage,useForm} from "./Form";
import {Input} from "./Input";
import {Textarea} from "./Textarea";
import {Button} from "./Button";
import styles from "./DiaryGate.module.css";
export function DiaryRestore({open,onClose,onRestore,className=""}:{open:boolean;onClose:()=>void;onRestore:(raw:string,phrase:string)=>Promise<void>;className?:string}){
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 const form=useForm({schema:z.object({raw:z.string().min(20).max(250000),phrase:z.string().min(1).max(512)}),defaultValues:{raw:"",phrase:""}});
 useEffect(()=>{if(!open)form.setValues({raw:"",phrase:""});},[open]);
 return <Dialog open={open} onOpenChange={v=>{if(!v&&!busy)onClose();}}><DialogContent className={styles.dialog+" "+className}><DialogTitle className={styles.title}>Bring a page back.</DialogTitle><DialogDescription className={styles.description}>Paste an encrypted page copy and enter its original secret phrase. It will be sealed again with your current diary key.</DialogDescription><Form {...form}><form className={styles.form} onSubmit={form.handleSubmit(async v=>{setBusy(true);setError("");try{await onRestore(v.raw,v.phrase);form.setValues({raw:"",phrase:""});onClose();}catch(e){setError(e instanceof Error?e.message:"This copy could not be restored.");}finally{setBusy(false);}})}><FormItem name="raw"><FormLabel>Encrypted copy contents (.json)</FormLabel><FormControl><Textarea value={form.values.raw} onChange={e=>form.setValues(v=>({...v,raw:e.target.value}))} maxLength={250000} rows={5} spellCheck={false} disabled={busy}/></FormControl><FormMessage/></FormItem><FormItem name="phrase"><FormLabel>Original secret phrase</FormLabel><FormControl><Input type="password" autoComplete="off" autoCapitalize="none" spellCheck={false} value={form.values.phrase} onChange={e=>form.setValues(v=>({...v,phrase:e.target.value}))} disabled={busy}/></FormControl><FormMessage/></FormItem>{error&&<p role="alert" className={styles.error}>{error}</p>}<Button type="submit" disabled={busy}>{busy?"Restoring…":"Restore as a new page"}</Button></form></Form></DialogContent></Dialog>;
}
