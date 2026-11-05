import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';
import pg from 'pg';
const [command, arg, expectedHash] = process.argv.slice(2);
if (!['import','rollback'].includes(command)) throw Error('Use import APPROVED.jsonl SHA256 | rollback BATCH_ID');
if (!process.env.DATABASE_URL) throw Error('DATABASE_URL is required');
const dbHost = new URL(process.env.DATABASE_URL).hostname;
if (!['db','localhost','127.0.0.1'].includes(dbHost)) throw Error('Location import is restricted to a local database host.');
const client = new pg.Client({connectionString:process.env.DATABASE_URL});
const textNorm=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const nameNorm=value=>textNorm(value).replace(/\bINST\b/g,'INSTITUTO').replace(/\bCOL\b/g,'COLEGIO').replace(/\bESC\b/g,'ESCUELA');
const addressNorm=value=>textNorm(value).replace(/\bAV(?:DA)?\b/g,'AVENIDA').replace(/\s+(?:BARRIO )?CENTRO$/,'').trim();
async function loadApproved(file, sha) {
 if (!file || !/^[0-9a-f]{64}$/.test(sha||'')) throw Error('Approved artifact and its 64-character SHA-256 are required.');
 const bytes=await fs.readFile(file);const actual=crypto.createHash('sha256').update(bytes).digest('hex');
 if(actual!==sha)throw Error(`SHA-256 mismatch: expected ${sha}, received ${actual}`);
 const rows=bytes.toString('utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
 if(rows.length!==267)throw Error(`Expected 267 approved locations; received ${rows.length}`);
 if(new Set(rows.map(r=>r.institution_id)).size!==rows.length)throw Error('Duplicate institution_id in approved artifact.');
 for(const r of rows){
  if(!/^tuc-\d{9}$/.test(r.institution_id)||!Array.isArray(r.cueanexos)||!r.cueanexos.length)throw Error(`Invalid identity: ${r.institution_id}`);
  if(!r.cueanexos.includes(String(r.source_cueanexo))||String(r.source_cueanexo)!==String(r.source_record_id))throw Error(`Source CUE is not a group member: ${r.institution_id}`);
  if(r.status!=='verified'||r.identity_confidence!=='verified'||r.source_precision_original!=='PRECISA'||r.coordinate_source_relationship!=='official_coordinate_linked_by_exact_cue'||r.discrepancy_review_summary?.conflict_pending)throw Error(`Row fails approved-set criteria: ${r.institution_id}`);
  if(!Number.isFinite(r.latitude)||!Number.isFinite(r.longitude)||!r.coordinate_source_url||!r.attribution||!r.source_license||!r.checked_at||!r.source_cartographic_cut_date||!r.source_metadata_reference_date)throw Error(`Missing coordinate/provenance/date field: ${r.institution_id}`);
  if(r.coordinate_precision!=='building')throw Error(`Unexpected coordinate_precision for ${r.institution_id}`);
 }
 return {rows,sha,artifact:path.basename(file)};
}
async function actualGroups(datasetId){
 const {rows}=await client.query(`SELECT s.cueanexo,s.name,s.address,l.code AS locality_code,s.sector_code,p.code AS province_code FROM schools s JOIN localities l ON l.dataset_id=s.dataset_id AND l.code=s.locality_code JOIN departments d ON d.dataset_id=l.dataset_id AND d.code=l.department_code JOIN provinces p ON p.dataset_id=d.dataset_id AND p.code=d.province_code WHERE s.dataset_id=$1 AND p.code='90' AND s.sector_code='private' ORDER BY s.cueanexo`,[datasetId]);
 const groups=new Map();for(const row of rows){const a=addressNorm(row.address||''),n=nameNorm(row.name);const key=a&&n?JSON.stringify([row.locality_code,a,n]):row.cueanexo;groups.set(key,[...(groups.get(key)||[]),row]);}
 const byMembers=new Map();for(const members of groups.values()){const cues=members.map(x=>x.cueanexo).sort();byMembers.set(cues.join('|'),{cues,representative:cues[0],members});}
 return {byMembers,schoolCount:rows.length,groupCount:byMembers.size};
}
await client.connect();
try{
 if(command==='rollback'){
  if(!/^\d+$/.test(arg||''))throw Error('Batch ID must be a positive integer.');
  await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(726411)');
  const b=await client.query('SELECT * FROM location_import_batches WHERE id=$1 FOR UPDATE',[arg]);
  if(!b.rowCount)throw Error(`Location import batch not found: ${arg}`);
  if(b.rows[0].status==='rolled_back'){await client.query('COMMIT');console.log(JSON.stringify({batch_id:Number(arg),status:'rolled_back',already_reverted:true}));}
  else{const del=await client.query('DELETE FROM institution_locations WHERE import_batch_id=$1',[arg]);if(del.rowCount!==b.rows[0].record_count)throw Error(`Expected to revert ${b.rows[0].record_count} rows; found ${del.rowCount}`);await client.query("UPDATE location_import_batches SET status='rolled_back',rolled_back_at=now() WHERE id=$1",[arg]);await client.query('COMMIT');console.log(JSON.stringify({batch_id:Number(arg),status:'rolled_back',removed:del.rowCount}));}
 }else{
  const approved=await loadApproved(arg,expectedHash);await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(726411)');
  const publication=await client.query('SELECT d.id,d.source_date::text,d.records FROM publication p JOIN datasets d ON d.id=p.dataset_id WHERE p.singleton=true');if(!publication.rowCount)throw Error('No locally published padron to attach locations to.');const dataset=publication.rows[0];
  const groups=await actualGroups(dataset.id);if(groups.schoolCount!==395||groups.groupCount!==338)throw Error(`Unexpected local padron scope: ${groups.schoolCount} CUE/anexos and ${groups.groupCount} institutions.`);
  for(const r of approved.rows){const key=[...r.cueanexos].sort().join('|'),g=groups.byMembers.get(key);if(!g)throw Error(`Approved CUE/anexo set does not match the local padron: ${r.institution_id}`);if(g.representative!==r.institution_id.slice(4))throw Error(`Group key does not match local representative CUE: ${r.institution_id}`);if(!g.cues.includes(String(r.source_cueanexo)))throw Error(`Source CUE missing in local group: ${r.institution_id}`);}
  let batch=await client.query('SELECT * FROM location_import_batches WHERE sha256=$1 FOR UPDATE',[approved.sha]);
  if(batch.rowCount&&batch.rows[0].status==='active'){
   const count=Number((await client.query('SELECT count(*) FROM institution_locations WHERE import_batch_id=$1',[batch.rows[0].id])).rows[0].count);if(count!==approved.rows.length)throw Error('Active batch row count is inconsistent.');await client.query('COMMIT');console.log(JSON.stringify({batch_id:Number(batch.rows[0].id),status:'active',already_imported:true,locations:count,dataset_id:dataset.id,source_padron_date:dataset.source_date}));
  }else{
   if(batch.rowCount){const collision=await client.query('SELECT institution_key,import_batch_id FROM institution_locations WHERE dataset_id=$1 AND institution_key=ANY($2::text[])',[dataset.id,approved.rows.map(x=>x.institution_id)]);if(collision.rowCount)throw Error(`Location conflict with other batch for ${collision.rows[0].institution_key}`);await client.query("UPDATE location_import_batches SET status='active',last_activated_at=now(),rolled_back_at=NULL,record_count=$2 WHERE id=$1",[batch.rows[0].id,approved.rows.length]);}
   else batch=await client.query('INSERT INTO location_import_batches(sha256,artifact_name,source_cartographic_cut_date,source_metadata_reference_date,record_count) VALUES($1,$2,$3,$4,$5) RETURNING *',[approved.sha,approved.artifact,approved.rows[0].source_cartographic_cut_date,approved.rows[0].source_metadata_reference_date,approved.rows.length]);
   const batchId=batch.rowCount?Number(batch.rows[0].id):Number(batch.rows[0].id);
   for(const r of approved.rows)await client.query(`INSERT INTO institution_locations(dataset_id,institution_key,member_cueanexos,source_cueanexo,latitude,longitude,coordinate_precision,source_precision_original,source_url,source_name,attribution,source_license,source_cartographic_cut_date,source_metadata_reference_date,checked_at,import_batch_id,raw) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb)`,[dataset.id,r.institution_id,r.cueanexos,String(r.source_cueanexo),r.latitude,r.longitude,r.coordinate_precision,r.source_precision_original,r.coordinate_source_url,r.source_name,r.attribution,r.source_license,r.source_cartographic_cut_date,r.source_metadata_reference_date,r.checked_at,batchId,JSON.stringify(r)]);
   await client.query('COMMIT');console.log(JSON.stringify({batch_id:batchId,status:'active',already_imported:false,locations:approved.rows.length,dataset_id:dataset.id,source_padron_date:dataset.source_date,sha256:approved.sha}));
  }
 }
}catch(error){try{await client.query('ROLLBACK')}catch{}console.error(error.message);process.exitCode=1}
finally{await client.end()}
