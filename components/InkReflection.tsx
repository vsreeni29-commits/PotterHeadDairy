import React,{useEffect,useState} from "react";
import {Button} from "./Button";
import {RotateCcw,FastForward} from "lucide-react";
import styles from "./InkReflection.module.css";
export function InkReflection({text,reducedMotion=false,className=""}:{text:string;reducedMotion?:boolean;className?:string}){
 const safety=text.startsWith("[[SAFETY]]");
 const blocks=text.replace(/^\[\[SAFETY\]\]\s*/,"").replace(/^#{1,6}\s*/gm,"").replace(/\*\*/g,"").split(/\n\s*\n/).filter(Boolean);
 const [visible,setVisible]=useState(safety||reducedMotion?blocks.length:0),[replay,setReplay]=useState(0),[showAll,setShowAll]=useState(false);
 useEffect(()=>{
  if(safety||reducedMotion||showAll){setVisible(blocks.length);return;}
  setVisible(0);let next=0;let timer:ReturnType<typeof setTimeout>;
  const tick=()=>{next++;setVisible(next);if(next<blocks.length)timer=setTimeout(tick,1000);};
  timer=setTimeout(tick,350);return()=>clearTimeout(timer);
 },[text,replay,reducedMotion,safety,showAll]);
 return <div className={styles.reflection+" "+(safety?styles.safety:"")+" "+className}>
 <div className={styles.toolbar}><span>{safety?"YOUR SAFETY COMES FIRST":"YOUR INNER COUNCIL"}</span>{!safety&&<div>{visible<blocks.length?<Button variant="ghost" size="icon-sm" aria-label="Show full reflection" onClick={()=>setShowAll(true)}><FastForward size={14}/></Button>:<Button variant="ghost" size="icon-sm" aria-label="Replay the ink reveal" onClick={()=>{setShowAll(false);setReplay(v=>v+1);}}><RotateCcw size={13}/></Button>}</div>}</div>
 <div className={styles.words}>{blocks.slice(0,visible).map((p,i)=><p className={reducedMotion||safety?styles.still:styles.appear} key={replay+":"+i}>{p}</p>)}</div>
 <span className={styles.endmark}>✧</span>
 </div>;
}
