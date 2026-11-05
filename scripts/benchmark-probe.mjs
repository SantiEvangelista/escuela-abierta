import assert from 'node:assert/strict';
const base=process.env.BENCH_URL;
const probes={
 home:'/',national:'/api/v1/institutions?page_size=5',
 tucuman:'/api/v1/institutions?page_size=5&province=90',buenosAires:'/api/v1/institutions?page_size=5&province=06',
 search:'/api/v1/institutions?page_size=5&q=lorenzo',miss:'/api/v1/institutions?page_size=5&q=zzzzqqq',
 page:'/api/v1/institutions?page_size=5&province=90&page=20',card:'/api/v1/institutions?page_size=5&province=90&cueanexo=900058300',
 map:'/api/v1/map-points?province=90'
};
for(const [route,path] of Object.entries(probes)){
 for(const attempt of ['first','repeat']){
  const start=performance.now();
  const r=await fetch(base+path,{signal:AbortSignal.timeout(90000)});
  const ttfb=Math.round(performance.now()-start);
  const body=await r.text();
  const ms=Math.round(performance.now()-start);
  const ok=r.ok&&(route==='home'?!body.includes('Datos no disponibles'):Array.isArray(JSON.parse(body).data));
  console.log(JSON.stringify({route,attempt,status:r.status,ok,ttfb,ms,bytes:Buffer.byteLength(body)}));
  assert.ok(ok);
 }
}
