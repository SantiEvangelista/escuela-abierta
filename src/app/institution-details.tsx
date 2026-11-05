import records from './institution-details.json';
type Section={source:string;note:string;items:string[]};
type RecordData={checked:string;schedule:Section;authorities:Section};
export default function InstitutionDetails({id,name,locality,province}:{id:string;name:string;locality:string;province:string}){
 const info=(records as Record<string,RecordData>)[id];
 return <>{info&&<>{(['schedule','authorities'] as const).map(key=><section key={key}><h4>{key==='schedule'?'Horarios informados':'Autoridades informadas'}</h4><ul>{info[key].items.map(item=><li key={item}>{item}</li>)}</ul><p className="map-note">{info[key].note} <a href={info[key].source} target="_blank" rel="noreferrer">Fuente institucional</a> · Consulta: {info.checked}.</p></section>)}</>}<section><a className="news-action" href={'https://www.google.com/search?tbm=nws&q='+encodeURIComponent('"'+name+'" '+locality+' '+province)} target="_blank" rel="noreferrer">Buscar noticias sobre esta institución</a></section></>;
}
