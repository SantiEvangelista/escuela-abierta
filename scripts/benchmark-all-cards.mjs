import assert from 'node:assert/strict';
import pg from 'pg';
import { groupInstitutions } from '../src/lib/institutions.ts';
const url = process.env.DATABASE_URL;
if (new URL(url).hostname !== 'escuela-perf-db') throw Error('Requiere la copia de prueba');
const db = new pg.Client({connectionString:url});
await db.connect();
try {
 const {rows:[{dataset_id:id}]}=await db.query('SELECT dataset_id FROM publication');
 // Reproduce the former three reads; compare one province at a time to bound verifier memory.
 const catalog=new Map((await db.query('SELECT code,name,modality FROM offers')).rows.map(o=>[o.code,o]));
 const provinces=(await db.query('SELECT code FROM provinces WHERE dataset_id=$1 ORDER BY code',[id])).rows;
 let total=0,members=0,located=0;
 for(const {code} of provinces){
  const {rows}=await db.query(`SELECT s.cueanexo,s.cue,s.annex,s.name,s.address,s.postal_code,s.phone,s.email,s.sector_code,s.area_code,l.code locality_code,l.name locality_name,d.code department_code,d.name department_name,p.code province_code,p.name province_name
  FROM schools s JOIN localities l ON (l.dataset_id,l.code)=(s.dataset_id,s.locality_code) JOIN departments d ON (d.dataset_id,d.code)=(l.dataset_id,l.department_code) JOIN provinces p ON (p.dataset_id,p.code)=(d.dataset_id,d.province_code)
  WHERE s.dataset_id=$1 AND p.code=$2 ORDER BY s.cueanexo`,[id,code]);
  const codes=rows.map(r=>r.cueanexo);
  const offers=new Map((await db.query('SELECT cueanexo,array_agg(offer_code ORDER BY offer_code) codes FROM school_offers WHERE dataset_id=$1 AND cueanexo=ANY($2::text[]) GROUP BY cueanexo',[id,codes])).rows.map(o=>[o.cueanexo,o.codes.map(c=>catalog.get(c))]));
  const coords=new Set((await db.query("SELECT il.source_cueanexo FROM institution_locations il JOIN location_import_batches b ON b.id=il.import_batch_id AND b.status='active' WHERE il.dataset_id=$1 AND il.institution_key='cue-'||il.source_cueanexo AND il.source_cueanexo=ANY($2::text[])",[id,codes])).rows.map(r=>r.source_cueanexo));
  const old=groupInstitutions(rows.map(r=>({...r,offers:offers.get(r.cueanexo)??[]})));
  const prepared=(await db.query("SELECT card,location_batches && ARRAY(SELECT id FROM location_import_batches WHERE status='active') located FROM institution_read WHERE dataset_id=$1 AND province=$2 ORDER BY cueanexo",[id,code])).rows;
  assert.equal(old.length,prepared.length);
  for(let i=0;i<old.length;i++){
   assert.deepEqual(prepared[i].card,old[i],old[i].cueanexo);
   assert.equal(prepared[i].located,old[i].members.some(c=>coords.has(c)));
   members+=old[i].members.length;
   located+=Number(prepared[i].located);
  }
  total+=old.length;
 }
 console.log({provinces:provinces.length,cards:total,members,located});
}finally{await db.end()}
