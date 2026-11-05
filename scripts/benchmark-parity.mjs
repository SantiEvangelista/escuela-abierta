import assert from 'node:assert/strict';
const urls=['escuela-perf-before',process.env.CANDIDATE||'escuela-perf-after'].map(host=>'http://'+host+':3000/api/v1/institutions?');
const cases=['','province=90','province=06','q=lorenzo','q=SAN%20JOSÉ','q=INST.%209%20DE%20JULIO','q=zzzzqqq','page=20&province=90','cueanexo=900058300','cue=9000583','cue=9999999','sector=private&sort=name','sort=-name&province=06'];
for(const query of cases){
 const bodies=await Promise.all(urls.map(async url=>{
  const res=await fetch(url+query+'&page_size=5');
  assert.equal(res.status,200);
  return res.json();
 }));
 assert.deepEqual(bodies[1],bodies[0],query);
 console.log(query||'national','OK');
}
