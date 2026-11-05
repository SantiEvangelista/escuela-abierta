"use client";
import {useEffect,useState} from 'react';
import {readApiJson} from '@/lib/client-response';
export default function Attendance({id}:{id:string}){
 const [data,setData]=useState<{count:number;attended:boolean}|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 useEffect(()=>{const c=new AbortController();setData(null);setError('');fetch('/api/v1/attendance/'+id,{signal:c.signal,cache:'no-store'}).then(async r=>{const j=await readApiJson(r);if(!r.ok)throw Error(j.error);setData(j)}).catch(e=>{if(e.name!=='AbortError')setError(e.message)});return()=>c.abort()},[id,retry]);
 async function toggle(){if(!data||busy)return;setBusy(true);setError('');try{const r=await fetch('/api/v1/attendance/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({attended:!data.attended})});const j=await readApiJson(r);if(!r.ok)throw Error(j.error);setData(j)}catch(e){setError(e instanceof Error?e.message:'No se pudo guardar')}finally{setBusy(false)}}
 return <div className="attendance"><div className="attendance-row"><span aria-live="polite">{data?`${data.count} ${data.count===1?'persona asistió':'personas asistieron'}`:'Consultando participación…'}</span><button type="button" disabled={!data||busy} aria-pressed={data?.attended||false} onClick={toggle}>{busy?'Guardando…':data?.attended?'Asistí acá · Deshacer':'Asistí acá'}</button></div>{error&&<p role="alert">{error} <button type="button" onClick={()=>setRetry(n=>n+1)} disabled={busy}>Reintentar</button></p>}</div>
}
