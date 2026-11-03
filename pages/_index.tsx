import React,{useEffect,useRef,useState} from "react";
import {Helmet} from "react-helmet";
import {useNavigate} from "react-router-dom";
import {BookOpen,Feather,LockKeyhole,Archive,ShieldCheck,ArrowUpRight,Moon,KeyRound,Eye,Plus,Settings2,LogOut,ChevronLeft,ChevronRight,LoaderCircle,Download} from "lucide-react";
import {Button} from "../components/Button";
import {Textarea} from "../components/Textarea";
import {Dialog,DialogContent,DialogTitle,DialogDescription} from "../components/Dialog";
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from "../components/Select";
import {Switch} from "../components/Switch";
import {DiaryGate} from "../components/DiaryGate";
import {DiaryRestore} from "../components/DiaryRestore";
import {InkReflection} from "../components/InkReflection";
import {useDiary} from "../helpers/useDiary";
import {DiarySentence} from "../helpers/DiarySentence";
import {DiaryModel} from "../helpers/DiaryModel";
import {DiaryCrypto} from "../helpers/DiaryCrypto";
import {toast} from "../helpers/toast";
import styles from "./_index.module.css";

type DiaryState=ReturnType<typeof useDiary>["state"];
export default function Diary(){
 const d=useDiary(),navigate=useNavigate();
 const [gate,setGate]=useState<{kind:"create"|"unlock"|"reveal";id?:string}|null>(null);
 const [archiveOpen,setArchiveOpen]=useState(false),[settingsOpen,setSettingsOpen]=useState(false),[consent,setConsent]=useState(false);
 const [restoreOpen,setRestoreOpen]=useState(false);
 const [preview,setPreview]=useState<DiaryState|null>(null),[previewText,setPreviewText]=useState("");
 const [absorbed,setAbsorbed]=useState(0),[ghost,setGhost]=useState(""),[composing,setComposing]=useState(false);
 const [vanish,setVanish]=useState(true),[reduced,setReduced]=useState(()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches);
 const [mobilePage,setMobilePage]=useState<"write"|"council">("write");
 const [working,setWorking]=useState(false);
 const text=d.state.payload.text,report=d.state.payload.report;
 const pending=text.slice(absorbed);
 const lastId=useRef(d.state.id),hadKey=useRef(false);
 const run=async(fn:()=>Promise<unknown>)=>{setWorking(true);try{await fn();}catch(e){const ex=e as Error&{code?:string};if(ex.code!=="OUT_OF_CREDITS")toast.error(ex.message||"Please try again.");}finally{setWorking(false);}};
 useEffect(()=>{
  if(d.state.id!==lastId.current){lastId.current=d.state.id;setAbsorbed(d.state.payload.text.length);setGhost("");}
 },[d.state.id]);
 useEffect(()=>{
  if(!d.key){setPreview(null);setPreviewText("");setGhost("");setAbsorbed(0);setArchiveOpen(false);setSettingsOpen(false);setRestoreOpen(false);setConsent(false);setMobilePage("write");if(hadKey.current)setGate(null);}
  hadKey.current=!!d.key;
 },[d.key]);
 useEffect(()=>{
  if(!d.key||!vanish||composing||!pending||d.busy)return;
  const cut=DiarySentence(pending);if(!cut)return;
  const timer=setTimeout(()=>{setGhost(pending.slice(0,cut));setAbsorbed(absorbed+cut);},950);
  return()=>clearTimeout(timer);
 },[pending,absorbed,vanish,composing,d.key,d.busy]);
 useEffect(()=>{if(!ghost)return;const t=setTimeout(()=>setGhost(""),1900);return()=>clearTimeout(t);},[ghost]);
 useEffect(()=>{if(report)setMobilePage("council");},[report]);
 const requireOpen=()=>{
  if(d.authState.type!=="authenticated"){navigate("/login");return;}
  if(d.vault.isFetching)return;
  if(d.vault.error){toast.error("Your vault could not be loaded. Try again.");void d.vault.refetch();return;}
  setGate({kind:d.vault.data?.vault?"unlock":"create"});
 };
 const name=d.profile?d.profile.name+(d.profile.potter&&!/\bpotter$/i.test(d.profile.name)?" Potter":""):"Your private corner";
 const date=new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});
 const saveLabel={idle:"Your ink fades. Your words are kept.",unsaved:"Sealing your latest words…",saving:"Saving encrypted words…",saved:"Encrypted & saved",error:"Save needs attention. Keep this page open."}[d.status];
 const save=()=>{if(!d.key){requireOpen();return;}void run(async()=>{await d.persist();toast.success("Draft sealed. The Council has not been called.");});};
 const choose=()=>{if(!d.key){requireOpen();return;}if(text.trim().length<8){toast("Give the page a few more words first.");return;}setConsent(true);};
 const reveal=(id=d.state.id)=>setGate({kind:"reveal",id});
 const exportPage=async()=>{
  if(!preview||!d.key||!d.vault.data?.vault)return;
  const cipher=await DiaryCrypto.seal(d.key,preview.payload,"entry:"+preview.id);
  const bytes=JSON.stringify({format:"potterhead-sealed-page-v1",vault:d.vault.data.vault,page:{id:preview.id,cipher}},null,2);
  const url=URL.createObjectURL(new Blob([bytes],{type:"application/json"}));
  const a=document.createElement("a");a.href=url;a.download="potterhead-sealed-page.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
 };
 return <div className={styles.app}>
 <Helmet><title>Potterhead Diary · Between you and the page</title><meta name="description" content="A quiet encrypted diary. Let the ink settle, and your Inner Council speak."/><meta name="theme-color" content="#151816"/><link rel="manifest" href="/manifest.json"/></Helmet>
 <aside className={styles.rail}>
 <a href="/" className={styles.mark} aria-label="Potterhead Diary"><Feather size={27}/></a>
 <div className={styles.railLinks}><Button variant="ghost" size="icon" className={styles.activeNav} aria-label="Write" onClick={()=>setMobilePage("write")}><BookOpen size={21}/></Button><Button variant="ghost" size="icon" aria-label="Sealed entries" onClick={()=>{if(d.key)setArchiveOpen(true);else requireOpen();}}><Archive size={20}/></Button><Button variant="ghost" size="icon" aria-label="New diary page" disabled={d.busy||working} onClick={()=>{if(d.key)void run(async()=>{await d.newPage();setMobilePage("write");});else requireOpen();}}><Plus size={20}/></Button></div>
 <Button variant="ghost" size="icon" aria-label="Diary settings" className={styles.railBottom} onClick={()=>{if(d.key)setSettingsOpen(true);else requireOpen();}}><Settings2 size={20}/></Button>
 </aside>
 <div className={styles.workspace}>
 <header className={styles.header}><a className={styles.wordmark} href="/">POTTERHEAD <span>DIARY</span></a><div className={styles.headerRight}><span><span className={styles.statusDot}/>{d.key?"A space of your own":"Between you & the page"}</span><Button variant="outline" className={styles.smallButton} disabled={d.authState.type==="loading"||d.vault.isFetching} onClick={()=>d.key?d.lock():requireOpen()}><LockKeyhole size={13}/>{d.key?"Seal diary":d.authState.type==="loading"?"Opening…":"Open your diary"}</Button></div></header>
 <main className={styles.main}>
 <div className={styles.intro}><p className={styles.eyebrow}><Moon size={13}/>{name}</p><h1>Let the page hold it.</h1><p>Some things are easier to understand once you put them into words.</p></div>
 <div className={styles.deskToolbar}><div className={styles.date}>{date}<span> · </span>{d.state.revision?"Your private page":"A fresh page"}</div><div className={styles.toolGroup}>{d.key&&<Select value={d.state.payload.mode} onValueChange={v=>d.setMode(v as DiaryState["payload"]["mode"])} disabled={d.busy}><SelectTrigger className={styles.modeSelect} aria-label="Reflection mode"><SelectValue/></SelectTrigger><SelectContent>{DiaryModel.modes.map(m=><SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>}{d.key&&text&&<Button variant="ghost" size="icon-sm" className={styles.revealButton} aria-label="Reveal or edit your words" onClick={()=>reveal()} disabled={d.busy}><Eye size={15}/></Button>}<span className={styles.privateLabel}><ShieldCheck size={13}/> Encrypted. Yours.</span></div></div>
 <div className={styles.mobileTabs}><Button variant={mobilePage==="write"?"secondary":"ghost"} onClick={()=>setMobilePage("write")}>Your words</Button><Button variant={mobilePage==="council"?"secondary":"ghost"} onClick={()=>setMobilePage("council")}>Inner Council{report?" · 1":""}</Button></div>
 <section className={styles.book+" "+(mobilePage==="council"?styles.showCouncil:"")} aria-label="Your diary">
 <div className={styles.pageLeft}><div className={styles.pageTop}><span>THE WORDS YOU CARRY</span><Feather size={15}/></div><div className={styles.writingArea}>
 {d.key?<><p className={styles.salutation}>Dear diary,</p><div className={styles.inkWell}>{ghost&&<p className={styles.absorbing} aria-hidden="true" key={absorbed}>{ghost}</p>}<Textarea className={styles.inkInput} variant="clear" disableResize value={pending} onChange={e=>d.edit(text.slice(0,absorbed)+e.target.value)} onCompositionStart={()=>setComposing(true)} onCompositionEnd={()=>setComposing(false)} placeholder={absorbed?"And then…":"Begin wherever you are…"} aria-label="Write in your diary" maxLength={18000-absorbed} disabled={d.busy} spellCheck={false}/></div>{absorbed>0&&<div className={styles.absorbedCount}><span>{text.trim().split(/\s+/).filter(Boolean).length} words held by the page</span><Button variant="ghost" size="sm" onClick={()=>reveal()} disabled={d.busy}>Reveal <Eye size={12}/></Button></div>}</>:<div className={styles.closedPage}><KeyRound size={25}/><p>A page for your eyes only.</p><Button variant="ghost" className={styles.paperButton} onClick={requireOpen}>Open your diary <ArrowUpRight size={13}/></Button></div>}
 </div><div className={styles.paperFooter}><span>Write. Release. Reflect.</span><span>01</span></div></div>
 <div className={styles.binding} aria-hidden="true"/>
 <div className={styles.pageRight}><div className={styles.pageTop}><span>THE VOICES WITHIN</span><span className={styles.tinyStar}>✧</span></div>
 {report?<div className={styles.reflectionScroll}><InkReflection text={report} reducedMotion={reduced}/></div>:<div className={styles.waiting}><div className={styles.seal}>{d.busy?<LoaderCircle className={styles.spin} size={26}/>:<Feather size={28}/>}</div><h2>{d.busy?"The Council is gathering.":"The page is listening."}</h2><p>{d.busy?<>Your draft is sealed.<br/>A reflection is taking shape.</>:<>Your Inner Council will appear here<br/>when you are ready to let it in.</>}</p><span className={styles.ornament}>— ✧ —</span></div>}
 <div className={styles.paperFooter}><span>Feel everything. Let wisdom lead.</span><span>02</span></div></div>
 </section>
 {d.error&&<div className={styles.errorBanner} role="alert">{d.error}<Button variant="ghost" size="sm" onClick={()=>void run(()=>d.persist())}>Retry save</Button></div>}
 {d.vault.error&&d.authState.type==="authenticated"&&<div className={styles.errorBanner}>Your vault could not be loaded.<Button variant="ghost" size="sm" onClick={()=>void d.vault.refetch()}>Try again</Button></div>}
 <div className={styles.belowBook}><p role="status"><span className={styles.inkDot}/>{d.key?saveLabel:"Your page begins with a secret phrase."}</p><div className={styles.actions}><Button variant="outline" onClick={save} disabled={d.busy||working||!!d.key&&!text.trim()}>Save draft</Button><Button onClick={choose} disabled={d.busy||working||Date.now()<d.cooldown}>{d.busy?"Council is listening…":d.cooldown?"Please wait a moment":"Submit to Council"} <ArrowUpRight size={15}/></Button></div></div>
 {d.context.length>0&&<div className={styles.contextNotice}>{d.context.length} previous {d.context.length===1?"page":"pages"} selected as AI context.<Button variant="ghost" size="sm" onClick={d.clearContext}>Clear</Button></div>}
 <footer className={styles.footer}><LockKeyhole size={12}/> Only your secret phrase can reveal saved words.<span>BETWEEN YOU & THE PAGE</span></footer>
 </main></div>
 {gate&&<DiaryGate open kind={gate.kind} onClose={()=>setGate(null)} defaultName={d.authState.type==="authenticated"?d.authState.user.displayName:""} onConfirm={async v=>{
 if(gate.kind==="create")await d.create(v.phrase,{name:v.name,potter:v.potter,language:v.language});
 else if(gate.kind==="unlock")await d.unlock(v.phrase);
 else{const record=await d.read(gate.id||d.state.id,v.phrase);setPreview(record);setPreviewText(record.payload.text);}
 }}/>}
 <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}><DialogContent className={styles.panel}><DialogTitle className={styles.panelTitle}>Sealed pages</DialogTitle><DialogDescription className={styles.panelDescription}>Dates are visible. Your words are not. Enter your phrase to reveal a page.</DialogDescription>
 <div className={styles.entryList}>{d.entries.isFetching?<p>Finding your pages…</p>:d.entries.error?<div><p>Your pages could not be loaded.</p><Button onClick={()=>void d.entries.refetch()}>Retry</Button></div>:!d.entries.data?.entries.length?<div className={styles.emptyArchive}><Archive size={27}/><p>No sealed pages yet.</p><span>Your first saved words will wait here.</span></div>:d.entries.data.entries.map((e,i)=><Button variant="ghost" className={styles.entryRow} key={e.id} onClick={()=>{setArchiveOpen(false);reveal(e.id);}}><div><LockKeyhole size={15}/><span>Sealed page {d.archivePage*30+i+1}<small>{new Date(e.updatedAt).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}</small></span></div><KeyRound size={14}/></Button>)}</div>
 <div className={styles.pagination}><Button variant="ghost" size="sm" disabled={!d.archivePage} onClick={()=>d.setArchivePage(p=>p-1)}><ChevronLeft size={14}/> Newer</Button><span>Page {d.archivePage+1}</span><Button variant="ghost" size="sm" disabled={!d.entries.data?.hasMore} onClick={()=>d.setArchivePage(p=>p+1)}>Older <ChevronRight size={14}/></Button></div></DialogContent></Dialog>
 <Dialog open={!!preview} onOpenChange={v=>{if(!v){setPreview(null);setPreviewText("");}}}><DialogContent className={styles.previewPanel}><DialogTitle className={styles.panelTitle}>Your words, revealed.</DialogTitle><DialogDescription className={styles.panelDescription}>Visible for this moment. Seal the diary to hide them again.</DialogDescription><label className={styles.previewLabel} htmlFor="revealed-writing">Your writing</label><Textarea id="revealed-writing" className={styles.previewInput} value={previewText} maxLength={18000} onChange={e=>setPreviewText(e.target.value)}/>
 {preview?.payload.report&&<div className={styles.previewReflection}><InkReflection text={preview.payload.report} reducedMotion/></div>}
 <div className={styles.previewActions}><Button variant="outline" disabled={working||d.busy} onClick={()=>void run(async()=>{if(!preview)return;await d.adopt(preview);if(previewText!==preview.payload.text)d.edit(previewText);setAbsorbed(previewText.length);setPreview(null);setPreviewText("");setMobilePage("write");})}>Continue this page</Button><Button disabled={working||d.busy} onClick={()=>void run(async()=>{if(!preview)return;await d.adopt(preview);if(previewText!==preview.payload.text)d.edit(previewText);await d.persist();setAbsorbed(previewText.length);setPreview(null);setPreviewText("");toast.success("Your changes are sealed.");})}>Save changes</Button></div>
 <div className={styles.previewLinks}><Button variant="ghost" size="sm" disabled={!preview?.payload.text||d.busy} onClick={()=>{if(preview)try{d.addContext(preview);toast("This page will be included with your next submission.");}catch(e){toast.error((e as Error).message);}}}>Use as Council context</Button><Button variant="ghost" size="sm" disabled={working} onClick={()=>void run(exportPage)}><Download size={12}/> Encrypted copy</Button></div>
 </DialogContent></Dialog>
 <Dialog open={consent} onOpenChange={setConsent}><DialogContent className={styles.panel}><DialogTitle className={styles.panelTitle}>Invite your Inner Council.</DialogTitle><DialogDescription className={styles.panelDescription}>Your current entry{d.context.length?" and "+d.context.length+" selected previous pages":""} will be decrypted on this device and shared with Floot AI to create a reflection. Your secret phrase is never shared.</DialogDescription><div className={styles.consentNote}><ShieldCheck size={18}/><p>Saved drafts and reflections are encrypted. AI processing receives readable text. The app does not save that readable text on its server.</p></div><p className={styles.panelDescription}>The Council helps you reflect. You remain the one who decides what to do.</p><div className={styles.previewActions}><Button variant="outline" onClick={()=>setConsent(false)}>Keep writing</Button><Button onClick={()=>{setConsent(false);setMobilePage("council");void run(()=>d.submit());}}>Submit this entry <ArrowUpRight size={14}/></Button></div></DialogContent></Dialog>
 <DiaryRestore open={restoreOpen} onClose={()=>setRestoreOpen(false)} onRestore={async(raw,phrase)=>{await d.restore(raw,phrase);setMobilePage("write");toast.success("Your restored page is encrypted and saved.");}}/>
 <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}><DialogContent className={styles.panel}><DialogTitle className={styles.panelTitle}>Your quiet corner.</DialogTitle><DialogDescription className={styles.panelDescription}>{name} · {d.profile?.language||"English"} reflections</DialogDescription><div className={styles.settingRow}><div><label htmlFor="fade-ink">Absorb completed sentences</label><small>Words remain safely held by the page.</small></div><Switch id="fade-ink" checked={vanish} onCheckedChange={v=>{setVanish(v);if(v)setAbsorbed(text.length);setGhost("");}}/></div><div className={styles.settingRow}><div><label htmlFor="reduce-motion">Quiet motion</label><small>Reveal reflections immediately.</small></div><Switch id="reduce-motion" checked={reduced} onCheckedChange={setReduced}/></div><Button variant="outline" onClick={()=>{setSettingsOpen(false);setRestoreOpen(true);}}>Restore an encrypted page</Button><p className={styles.privacyDetail}>AES-256-GCM encryption · Your key stays on this device while open. The diary seals when you leave the app or after five minutes without activity. Keep your secret phrase safe; there is no recovery key.</p><div className={styles.previewActions}><Button variant="outline" onClick={d.lock}><LockKeyhole size={14}/> Seal diary</Button><Button variant="ghost" disabled={working||d.busy} onClick={()=>void run(d.signOut)}><LogOut size={14}/> Sign out</Button></div></DialogContent></Dialog>
 </div>;
}
