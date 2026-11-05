"use client";
import {useLayoutEffect,useRef,useState} from 'react';
import provinces from './map-data.json';
export default function TucumanOutline(){
 const path=useRef<SVGPathElement>(null);const [box,setBox]=useState('175 85 70 85');
 useLayoutEffect(()=>{const b=path.current?.getBBox();if(b)setBox(`${b.x-5} ${b.y-5} ${b.width+10} ${b.height+10}`)},[]);
 return <svg viewBox={box} role="img" aria-label="Mapa provincial de Tucumán"><path ref={path} d={provinces.find(p=>p.id==='90')!.path} fill="var(--secondary)" stroke="var(--ink)" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/></svg>;
}
