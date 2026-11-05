"use client";
import {createContext,useCallback,useId,useState,type ReactNode} from 'react';
export const MapActionsTarget=createContext<HTMLSpanElement|null>(null);
export const MapReadyContext=createContext<()=>void>(()=>{});
export default function MapViewSwitch({toolbar,provincial,streets,enabled=true,initialStreet=false}:{toolbar?:ReactNode;provincial:ReactNode;streets:ReactNode;enabled?:boolean;initialStreet?:boolean}){
 const [street,setStreet]=useState(initialStreet),[opened,setOpened]=useState(initialStreet);
 const [actions,setActions]=useState<HTMLSpanElement|null>(null);
 const [ready,setReady]=useState(false);
 const signalReady=useCallback(()=>setReady(true),[]);
 const id=useId();const requested=enabled&&street;const active=requested&&(ready||initialStreet);
 return <div className="map-view-switch">
  {(toolbar||enabled)&&<div className="map-view-toolbar">{toolbar}{enabled&&<button type="button" aria-controls={id} aria-pressed={active} onClick={()=>{setOpened(true);setStreet(!requested)}}>{active?'Ver mapa provincial':requested?'Cargando calles…':'Ver mapa de calles'}</button>}{active&&<span className="map-extra-actions" ref={setActions}/>}</div>}
  <div id={id} className={'map-stage'+(active?' street-active':'')}>
   <div className="map-layer province-layer" inert={active} aria-hidden={active}>{provincial}</div>
   <div className="map-layer street-layer" inert={!active} aria-hidden={!active}><MapActionsTarget.Provider value={active?actions:null}><MapReadyContext.Provider value={signalReady}>{enabled&&opened&&streets}</MapReadyContext.Provider></MapActionsTarget.Provider></div>
  </div>
 </div>;
}
