"use client";
import {useContext,useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {MapActionsTarget} from '../../map-view-switch';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
const flagSymbol = `<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="-12 -12 472 536"><!--! Font Awesome Free 7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2026 Fonticons, Inc. --><path stroke="white" stroke-width="12" paint-order="stroke" fill="currentColor" d="M64 32C64 14.3 49.7 0 32 0S0 14.3 0 32L0 480c0 17.7 14.3 32 32 32s32-14.3 32-32l0-121.6 62.7-18.8c41.9-12.6 87.1-8.7 126.2 10.9 42.7 21.4 92.5 24 137.2 7.2l37.1-13.9c12.5-4.7 20.8-16.6 20.8-30l0-247.7c0-23-24.2-38-44.8-27.7l-11.8 5.9c-44.9 22.5-97.8 22.5-142.8 0-36.4-18.2-78.3-21.8-117.2-10.1L64 54.4 64 32z"/></svg>`;
export type MapLocation={id:string;name:string;cueanexo:string;latitude:number;longitude:number};
type Props={locations:MapLocation[];selectedId:string;onSelect:(id:string)=>void};
export default function InstitutionMap({locations,selectedId,onSelect}:Props){const actions=useContext(MapActionsTarget);const container=useRef<HTMLDivElement>(null);const map=useRef<L.Map|null>(null);const markers=useRef(new Map<string,L.Marker>());const select=useRef(onSelect);const activeId=useRef(selectedId);const [tileError,setTileError]=useState(false);useEffect(()=>{select.current=onSelect},[onSelect]);useEffect(()=>{if(!container.current)return;const instance=L.map(container.current,{scrollWheelZoom:false,zoomControl:false}).setView([-26.83,-65.21],8);map.current=instance;L.control.zoom({zoomInTitle:'Acercar',zoomOutTitle:'Alejar'}).addTo(instance);const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(instance);tiles.on('tileerror',()=>setTileError(true));const observer=new ResizeObserver(()=>instance.invalidateSize());observer.observe(container.current);return()=>{observer.disconnect();instance.remove();map.current=null;markers.current.clear()}},[]);useEffect(()=>{const instance=map.current;if(!instance)return;const layer=L.layerGroup().addTo(instance);const groups=new Map<string,MapLocation[]>();locations.forEach(p=>{const key=`${p.latitude},${p.longitude}`;groups.set(key,[...(groups.get(key)||[]),p])});const draw=()=>{
 layer.clearLayers();
 markers.current.clear();
 const cells=new Map<string,MapLocation[]>();
 const cluster=locations.length>750 && instance.getZoom()<15;
 const bounds=instance.getBounds().pad(.2);
 for(const points of groups.values()){
   const first=points[0],position=L.latLng(first.latitude,first.longitude);
   if(locations.length>750 && !bounds.contains(position))continue;
   const pixel=instance.project(position);
   const key=cluster?Math.floor(pixel.x/48)+':'+Math.floor(pixel.y/48):first.latitude+","+first.longitude;
   const cell=cells.get(key);
   if(cell)cell.push(...points);else cells.set(key,[...points]);
 }
 for(const points of cells.values()){
   const first=points[0];
   const multipleSites=points.some(p=>p.latitude!==first.latitude||p.longitude!==first.longitude);
   const extent=L.latLngBounds(points.map(p=>[p.latitude,p.longitude]));
   const title=multipleSites?points.length+' sedes · acercar':points.map(p=>p.name).join(' / ');
   const marker=L.marker(extent.getCenter(),{title,keyboard:true,icon:L.divIcon({className:'institution-pin',html:flagSymbol+(points.length>1?'<b aria-hidden="true">'+points.length+'</b>':''),iconSize:[34,34],iconAnchor:[17,17]})}).addTo(layer);
   const active=points.some(point=>point.id===activeId.current);
   marker.getElement()?.classList.toggle('is-selected',active);
   marker.setZIndexOffset(active?1000:0);
   for(const point of points) markers.current.set(point.id,marker);
   marker.getElement()?.setAttribute('aria-label',title);
   if(multipleSites){
     marker.on('click',()=>instance.fitBounds(extent,{padding:[24,24],maxZoom:16}));
     continue;
   }
   if(points.length===1){
     marker.on('click',()=>select.current(first.id));
     continue;
   }
   const popup=document.createElement('div');
   for(const point of points){
     const button=document.createElement('button');
     button.type='button';button.textContent=point.name;
     button.onclick=()=>{select.current(point.id);marker.closePopup()};
     popup.append(button);
   }
   marker.bindPopup(popup);

 }
};
if(locations.length)instance.fitBounds(L.latLngBounds(locations.map(p=>[p.latitude,p.longitude])),{animate:false,padding:[35,35],maxZoom:11});
draw();
if(locations.length>750)instance.on('moveend resize',draw);
return()=>{instance.off('moveend resize',draw);layer.remove();markers.current.clear()}
},[locations]);useEffect(()=>{activeId.current=selectedId;const selectedMarker=markers.current.get(selectedId);const touched=new Set(markers.current.values());touched.forEach(marker=>{const active=marker===selectedMarker;marker.getElement()?.classList.toggle('is-selected',active);marker.setZIndexOffset(active?1000:0)});const point=locations.find(p=>p.id===selectedId);if(point&&map.current)map.current.setView([point.latitude,point.longitude],Math.max(map.current.getZoom(),15),{animate:false})},[selectedId,locations]);function showAll(){if(locations.length)map.current?.fitBounds(L.latLngBounds(locations.map(p=>[p.latitude,p.longitude])),{padding:[35,35],maxZoom:11})}return <div className="institution-map-wrap">{actions&&locations.length>0&&createPortal(<button type="button" onClick={showAll}>Ver todas las ubicaciones</button>,actions)}<div ref={container} className="institution-map" role="region" aria-label="Mapa de calles de instituciones educativas"/>{tileError&&<p role="status">No se pudieron cargar algunas calles. La lista sigue disponible para elegir instituciones.</p>}</div>;}
