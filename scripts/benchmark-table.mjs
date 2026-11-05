import {readFile,writeFile} from 'node:fs/promises';
const root='docs/performance/';
const data=await Promise.all(['baseline','optimized'].map(async v=>(await readFile(root+v+'.jsonl','utf8')).trim().split('\n').map(JSON.parse)));
let md='# Mediciones de tráfico mixto\n\nLatencias en milisegundos; se incluyen fallos y el límite de 30 s del cliente. RPS incluye todas las respuestas, incluso errores. La columna TTFB sólo tiene sentido cuando llegó la cabecera. Una muestra insuficiente no permite inferir percentiles estables.\n\n';
for(const n of [1,10,25,50]){
 const stats=data.map(rows=>rows.filter(r=>r.clients===n));
 md+='## '+n+' clientes\n\n| Variante | Solicitudes | Errores | RPS |\n|---|---:|---:|---:|\n';
 for(const [i,rows] of stats.entries())md+='| '+['Original','Preparada'][i]+' | '+rows.reduce((a,r)=>a+(r.count||0),0)+' | '+rows.reduce((a,r)=>a+(r.errors||0),0)+' | '+rows.find(r=>r.rps)?.rps.toFixed(2)+' |\n';
 md+='\n| Operación | Original p50 / p95 / p99 | Preparada p50 / p95 / p99 | TTFB p95 original / preparada |\n|---|---:|---:|---:|\n';
 const percentile=r=>r?[r.p50,r.p95,r.p99].join(' / '):'—';
 for(const route of ['home','national','tucuman','buenosAires','search','search2','miss','page','card','map']){
  const [a,b]=stats.map(s=>s.find(r=>r.route===route));
  md+='| '+route+' | '+percentile(a)+' | '+percentile(b)+' | '+(a?.ttfb95??'—')+' / '+(b?.ttfb95??'—')+' |\n';
 }
 md+='\n';
}
await writeFile(root+'MEDICIONES.md',md);

// Include the independent hot comparison if its two runs have finished.
let rotating;
try{rotating=await Promise.all(['before','final'].map(async key=>(await readFile(root+'rotating-'+key+'.jsonl','utf8')).trim().split('\n').map(JSON.parse)))}catch{}
if(rotating?.every(run=>run.some(row=>row.rps))){
 md+='## Contraprueba: 25 clientes, doce nombres de búsqueda\n\nCinco minutos por imagen, sin builds simultáneas, después de 20 s de precalentamiento. Se conserva el perfil de búsquedas amplias, sin resultados y navegación.\n\n| Operación | Original p50 / p95 / p99 | Final p50 / p95 / p99 | TTFB p95 original / final |\n|---|---:|---:|---:|\n';
 for(const a of rotating[0].filter(r=>r.route)){
  const b=rotating[1].find(r=>r.route===a.route);
  md+='| '+a.route+' | '+[a.p50,a.p95,a.p99].join(' / ')+' | '+[b.p50,b.p95,b.p99].join(' / ')+' | '+(a.ttfb95??'—')+' / '+(b.ttfb95??'—')+' |\n';
 }
 md+='\n| Imagen | RPS | Solicitudes | Errores |\n|---|---:|---:|---:|\n';
 for(const [i,rows] of rotating.entries()){
  md+='| '+['Original','Final'][i]+' | '+rows.find(r=>r.rps).rps.toFixed(2)+' | '+rows.reduce((n,r)=>n+(r.count??0),0)+' | '+rows.reduce((n,r)=>n+(r.errors??0),0)+' |\n';
 }
 await writeFile(root+'MEDICIONES.md',md);
}
