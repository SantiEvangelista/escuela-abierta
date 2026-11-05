#!/bin/sh
# Run without other benchmark requests. Only changes logging in the disposable database.
set -eu
app=escuela-perf-after
pg() { docker exec escuela-perf-db psql -qAt -U postgres bench -c "$1"; }
reset() { pg "ALTER SYSTEM RESET log_statement"; pg "SELECT pg_reload_conf()"; }
trap reset EXIT
pg "ALTER SYSTEM SET log_statement='all'"
pg "SELECT pg_reload_conf()"
docker restart "$app" >/dev/null
sleep 2
since=$(date -u +%Y-%m-%dT%H:%M:%SZ)
docker exec "$app" node -e '
(async()=>{const base="http://127.0.0.1:3000";const home=await fetch(base);if(!(await home.text()).includes("instituciones"))throw Error("portada");const responses=await Promise.all(Array.from({length:25},()=>fetch(base+"/api/v1/institutions?page_size=5")));for(const r of responses)if(!r.ok||(await r.json()).data.length!==5)throw Error("national");
const province=await Promise.all(Array.from({length:25},()=>fetch(base+"/api/v1/institutions?province=90&page_size=5")));for(const r of province)if(!r.ok||(await r.json()).data.length!==5)throw Error("province");})().catch(e=>{console.error(e);process.exitCode=1});
'
queries=$(docker logs --since "$since" escuela-perf-db 2>&1 | grep -c 'execute .*SELECT card FROM institution_read WHERE')
echo "SSR nacional + 25 lecturas nacionales + 25 provinciales simultáneas: $queries consultas SELECT card (esperadas: 2)"
test "$queries" = 2
docker kill --signal USR2 "$app" >/dev/null
docker exec "$app" node -e '
(async()=>{
 const base="http://127.0.0.1:3000/api/v1/institutions?page_size=5";
 const api=async url=>{const r=await fetch(url);if(!r.ok)throw Error(String(r.status));return r.text()};
 const hot=await api(base);
 for(const query of ["","&sort=cueanexo"]){
  const times=[];
  for(let i=0;i<15;i++){const start=performance.now();const text=await api(base+query);if(text!==hot)throw Error("Cuerpo distinto");times.push(performance.now()-start)}
  times.sort((a,b)=>a-b);console.log(JSON.stringify({mode:query?"preparedSQL":"cached",p50:times[7],p95:times[14]}))
 }
 for(let i=0;i<24;i++)await api(base+"&province="+String(2+4*i).padStart(2,"0"));
})().catch(e=>{console.error(e);process.exitCode=1})'
docker kill --signal USR2 "$app" >/dev/null
sleep 1
docker logs --since "$since" "$app" 2>&1 | grep cacheEntries
