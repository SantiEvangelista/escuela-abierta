import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const file='docs/research/national-coordinate/decision-batches/georef-reconcile/eligible-candidates.jsonl';
const rows=(await readFile(file,'utf8')).trim().split('\n').map(JSON.parse);
const remaining=new Map(rows.map(r=>[r.record_cueanexo,r]));
const api='http://127.0.0.1:3000/api/v1/';
const request=async(path)=>{
  const response=await fetch(api+path);
  assert.equal(response.status,200,path);
  return response.json();
};
for(const province of new Set(rows.map(r=>r.province_code))){
  const {data}=await request('map-points?province='+province);
  for(const point of data){
    const expected=remaining.get(point.cueanexo);
    assert.ok(expected,point.cueanexo);
    assert.equal(expected.province_code,province);
    assert.equal(point.latitude,expected.latitude);
    assert.equal(point.longitude,expected.longitude);
    assert.ok(remaining.delete(point.cueanexo));
  }
}
assert.equal(remaining.size,0);
const {data,meta}=await request('institutions?province=90&sector=private&page_size=100');
assert.equal(meta.pagination.total,338);
assert.ok(meta.location_coverage.located<338 && meta.location_coverage.located>0);
for(const institution of data){
  for(const point of institution.locations)assert.ok(institution.members.includes(point.source_cueanexo));
}
console.log('24 jurisdicciones, 41.898 anexos exactos y fichas con y sin ubicación. Cobertura privada Tucumán:',meta.location_coverage);
