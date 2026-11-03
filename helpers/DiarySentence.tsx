/** Returns a completed sentence boundary without treating decimal points as full stops. */
export function DiarySentence(text:string):number {
 let boundary=0;
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(c==="\n"){boundary=i+1;continue;}
  if(!".!?。！？".includes(c))continue;
  if(c==="."&&/\d/.test(text[i-1]||"")&&/\d/.test(text[i+1]||""))continue;
  const prefix=text.slice(0,i+1);
  if(c==="."&&/\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|vs|etc)\.$/i.test(prefix))continue;
  let end=i+1;while(end<text.length&&/["'”’)!?.]/.test(text[end]))end++;
  if(end===text.length||/\s/.test(text[end])){
   while(end<text.length&&/\s/.test(text[end]))end++;
   boundary=end;
  }
 }
 return boundary;
}
