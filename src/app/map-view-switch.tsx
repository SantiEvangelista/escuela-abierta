"use client";
import {createContext,useId,useState,type ReactNode} from 'react';
export const MapActionsTarget=createContext<HTMLSpanElement|null>(null);
export default function MapViewSwitch({toolbar,provincial,streets,enabled=true,initialStreet=false}:{toolbar?:ReactNode;provincial:ReactNode;streets:ReactNode;enabled?:boolean;initialStreet?:boolean}){
 const [street,setStreet]=useState(initialStreet),[opened,setOpened]=useState(initialStreet);
 const [actions,setActions]=useState<HTMLSpanElement|null>(null);
 const id=useId();const active=enabled&&street;
 return <div className="map-view-switch">
  {(toolbar||enabled)&&<div className="map-view-toolbar">{toolbar}{enabled&&<button type="button" aria-controls={id} aria-pressed={active} onClick={()=>{setOpened(true);setStreet(!active)}}>{active?'Ver mapa provincial':'Ver mapa de calles'}</button>}{active&&<span className="map-extra-actions" ref={setActions}/>}</div>}
  <div id={id} className={'map-stage'+(active?' street-active':'')}>
   <div className="map-layer province-layer" inert={active} aria-hidden={active}>{provincial}</div>
   <div className="map-layer street-layer" inert={!active} aria-hidden={!active}><MapActionsTarget.Provider value={active?actions:null}>{enabled&&opened&&streets}</MapActionsTarget.Provider></div>
  </div>
 </div>;
}
