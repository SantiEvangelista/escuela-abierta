import pg from 'pg';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
const url=process.env.DATABASE_URL;
if(new URL(url).hostname!=='escuela-perf-db')throw Error('Solo para la copia aislada');
const db=new pg.Client({connectionString:url});await db.connect();
const target=process.env.CANDIDATE||'escuela-perf-after';
if(!['escuela-perf-after','escuela-perf-final'].includes(target))throw Error('Requiere una app de prueba');
const base='http://'+target+':3000/api/v1/institutions?page_size=5';
async function read(params=''){
 const response=await fetch(base+params);
 assert.equal(response.status,200);return response.json();
}
const {rows:[pub]}=await db.query('SELECT dataset_id FROM publication');
const {rows:active}=await db.query("SELECT id FROM location_import_batches WHERE status='active'");
const batchIds=active.map(b=>b.id);
let temporary;
try{
 const {rows:[dataset]}=await db.query("INSERT INTO datasets(sha256,source_url,source_date,records) VALUES (md5(random()::text),'benchmark','2026-01-01',0) RETURNING id");
 temporary=dataset.id;
 await db.query('UPDATE publication SET dataset_id=$1',[temporary]);
 const empty=await read();
 assert.equal(empty.meta.dataset.id,temporary);
 assert.equal(empty.meta.pagination.total,0);assert.deepEqual(empty.data,[]);
 await db.query('UPDATE publication SET dataset_id=$1',[pub.dataset_id]);
 const start=performance.now();
 const {rows}=await db.query('SELECT code FROM provinces WHERE dataset_id=$1',[pub.dataset_id]);
 const pages=[];
 for(const province of ['',...rows.map(r=>r.code)])pages.push(await read(province?'&province='+province:''));
 assert.equal(pages.length,25);
 assert.equal(pages[0].meta.dataset.id,pub.dataset_id);
 const bytes=Buffer.byteLength(JSON.stringify(pages));
 console.log({entries:pages.length,serializedBytes:bytes,preparationMs:performance.now()-start});
 await db.query("UPDATE location_import_batches SET status='rolled_back' WHERE id=ANY($1::bigint[])",[batchIds]);
 const retired=await read();
 assert.equal(retired.meta.location_coverage.located,0);
 assert.ok(retired.data.every(card=>card.location===null&&card.locations.length===0));
 await db.query("UPDATE location_import_batches SET status='active' WHERE id=ANY($1::bigint[])",[batchIds]);
 const rebuilt=await Promise.all(Array.from({length:25},()=>read()));
 for(const page of rebuilt)assert.deepEqual(page,pages[0]);
 console.log('Publicación, reversión, cambio de lote y 25 lectores: OK');
}finally{
 await db.query('UPDATE publication SET dataset_id=$1',[pub.dataset_id]);
 await db.query("UPDATE location_import_batches SET status='active' WHERE id=ANY($1::bigint[])",[batchIds]);
 if(temporary)await db.query('DELETE FROM datasets WHERE id=$1',[temporary]);
 await db.end();
}
