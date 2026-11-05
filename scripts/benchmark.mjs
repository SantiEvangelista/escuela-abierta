import {performance} from 'node:perf_hooks';
const base = process.env.BENCH_URL || 'http://escuela-perf-app:3000';
const api = '/api/v1/institutions?page_size=5';
const routes = {
 home:'/', national:api, tucuman:api+'&province=90', buenosAires:api+'&province=06',
 search:api+'&q=lorenzo', search2:api+'&q=escuela', miss:api+'&q=zzzzqqq',
 page:api+'&province=90&page=20', card:api+'&cueanexo=900058300&province=90',
 map:'/api/v1/map-points?province=90'
};
const clients=Number(process.argv[2]||1), seconds=Number(process.argv[3]||10);
const samples={},start=performance.now();
let cursor=0, variant=0;
const names=['lorenzo','sarmiento','san josé','INST. 9 DE JULIO','belgrano','don bosco','pablo apóstol','san martín','san ignacio','mariano moreno','san miguel','técnica'];
async function worker(){
 do{
  const [key,route]=Object.entries(routes)[cursor++%Object.keys(routes).length];
  const path=key==='search' && process.env.BENCH_ROTATE==='1' ? api+'&q='+encodeURIComponent(names[variant++%names.length]) : route;
  const t=performance.now();
  let ok=false,ttfb;
  try{
   const r=await fetch(new URL(path,base),{signal:AbortSignal.timeout(30000)});
   ttfb=performance.now()-t;
   const body=await r.text();
   ok=r.ok&&(key==='home'?body.includes('instituciones')&&!body.includes('Datos no disponibles'):Array.isArray(JSON.parse(body).data));
  }catch{}
  (samples[key]??=[]).push({ms:performance.now()-t,ttfb,ok});
 }while(performance.now()-start<seconds*1000);
}
await Promise.all(Array.from({length:clients},worker));
const quantile=(v,q)=>Math.round(v.sort((a,b)=>a-b)[Math.ceil(v.length*q)-1]);
for(const [route,rows] of Object.entries(samples)){
 const times=rows.map(x=>x.ms);
 console.log(JSON.stringify({clients,route,count:rows.length,errors:rows.filter(x=>!x.ok).length,p50:quantile(times,.5),p95:quantile(times,.95),p99:quantile(times,.99),ttfb95:quantile(rows.map(x=>x.ttfb),.95)}));
}
console.log(JSON.stringify({clients,rps:cursor*1000/(performance.now()-start)}));
