import React,{useState,useEffect} from "react";
import { Helmet } from "react-helmet";
import { Link, useNavigate } from "react-router-dom";
import { Feather, ArrowLeft, LockKeyhole } from "lucide-react";
import { Button } from "../components/Button";
import { PasswordLoginForm } from "../components/PasswordLoginForm";
import { PasswordRegisterForm } from "../components/PasswordRegisterForm";
import { useAuth } from "../helpers/useAuth";
import styles from "./login.module.css";
export default function Login(){
 const [register,setRegister]=useState(false);
 const {authState}=useAuth();const navigate=useNavigate();
 useEffect(()=>{if(authState.type==="authenticated")navigate("/",{replace:true});},[authState.type,navigate]);
 return <main className={styles.screen}>
 <Helmet><title>Open your diary · Potterhead</title></Helmet>
 <Link to="/" className={styles.back}><ArrowLeft size={15}/> Back to the page</Link>
 <div className={styles.layout}><section className={styles.welcome}><Feather size={38}/><p className={styles.kicker}>POTTERHEAD DIARY</p><h1>Between you<br/>and the page.</h1><p>A little space to feel everything.<br/>And choose what happens next.</p><div className={styles.privacy}><LockKeyhole size={17}/><span>Your diary has its own secret phrase.<br/>Your account password cannot decrypt it.</span></div></section>
 <section className={styles.card}><div className={styles.tabs}><Button variant={register?"ghost":"secondary"} onClick={()=>setRegister(false)}>Sign in</Button><Button variant={register?"secondary":"ghost"} onClick={()=>setRegister(true)}>Create account</Button></div><h2>{register?"A diary of your own":"Welcome back."}</h2><p>{register?"Begin with an account. Then make your secret phrase.":"Sign in, then unlock your private pages."}</p>{register?<PasswordRegisterForm/>:<PasswordLoginForm/>}<p className={styles.note}>Forgot password resets your account access.<br/>It does not recover your diary secret phrase.</p></section></div>
 </main>;
}
