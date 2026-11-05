"use client";
import {useEffect,useMemo,useRef,useState} from 'react';
import type {School} from './explorer';
import dynamic from 'next/dynamic';
import {readApiJson} from '@/lib/client-response';
import {normalizeName} from '@/lib/institutions';
const Map=dynamic(()=>import('./pruebas/tucuman/institution-map'),{ssr:false,loading:()=> <p role="status">Cargando mapa de calles…</p>});
type Institution={cueanexo:string;name:string;address:string|null;locality_name:string;latitude:number;longitude:number;sector_code:string;source_url:string};
export default function StreetMap({province,query,sector,selectedCue,onOpenCard}:{onOpenCard:(school:School)=>void;province:string;query:string;sector:string;selectedCue:string}){
 const [items,setItems]=useState<Institution[]>([]),[ready,setReady]=useState(false),[error,setError]=useState(''),[retry,setRetry]=useState(0),[chosen,setChosen]=useState('');
 const lookup=useRef<AbortController|null>(null);
 const [cardStatus,setCardStatus]=useState('');
 useEffect(()=>{
   setCardStatus('');
   return ()=>lookup.current?.abort();
 },[province,query,sector,selectedCue]);
 async function selectMarker(cue:string){
   lookup.current?.abort();
   const controller=new AbortController();
   lookup.current=controller;
   setChosen(cue);
   setCardStatus('Abriendo ficha…');
   try {
     const params=new URLSearchParams({province,cueanexo:cue,page_size:'1'});
     const response=await fetch('/api/v1/institutions?'+params,{signal:controller.signal});
     const body=await readApiJson(response);
     const school=body.data?.[0];
     if(!response.ok || !school?.members?.includes(cue)) throw Error();
     if(controller.signal.aborted)return;
     onOpenCard({...school,location:school.locations.find((point:{source_cueanexo:string})=>point.source_cueanexo===cue)??school.location});
     setCardStatus('');
   }catch{
     if(!controller.signal.aborted)setCardStatus('No pudimos abrir la ficha. Volvé a seleccionar la bandera.');
   }
 }
 useEffect(()=>{setChosen(selectedCue)},[selectedCue]);
 useEffect(()=>{
  const controller=new AbortController();setError('');setReady(false);
  async function load(){
   const response=await fetch('/api/v1/map-points?province='+province,{signal:controller.signal});
   const body=await readApiJson(response);
   if(!response.ok||!Array.isArray(body.data))throw Error('No pudimos cargar las ubicaciones.');
   const all:Institution[]=body.data;
   if(!controller.signal.aborted){setItems(all);setReady(true)}
  }
  load().catch(e=>{if(!controller.signal.aborted)setError(e.message)});return()=>controller.abort();
 },[province,retry]);
 const visible=useMemo(()=>items.filter(x=>(!sector||sector===x.sector_code)&&(!query||normalizeName(x.name).includes(normalizeName(query)))),[items,query,sector]);
 const points=useMemo(()=>visible.map(x=>({id:x.cueanexo,cueanexo:x.cueanexo,name:x.name,latitude:x.latitude,longitude:x.longitude})),[visible]);
 const selected=visible.find(x=>x.cueanexo===chosen);
 if(error)return <div role="alert">{error}<p><button type="button" onClick={()=>setRetry(n=>n+1)}>Reintentar</button></p></div>;
 if(!ready)return <p role="status">Cargando ubicaciones…</p>;
 return <div className="street-content">
 {!points.length&&<p role="status">No hay ubicaciones incorporadas para estos filtros.</p>}
 {points.length>0&&<Map locations={points} selectedId={chosen} onSelect={selectMarker}/>}
 {cardStatus&&<p role="status">{cardStatus}</p>}
 {selected&&<div className="map-selection" aria-live="polite"><strong>{selected.name}</strong><p>{selected.address} · {selected.locality_name}</p><a href={selected.source_url} target="_blank" rel="noreferrer">Fuente de ubicación</a></div>}
 </div>;
}
