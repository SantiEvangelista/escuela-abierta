import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import pg from 'pg';

const file = 'docs/research/national-coordinate/decision-batches/georef-reconcile/eligible-candidates.jsonl';
const digest = '07fc6c124fefa2ca4d325e6713212a4dd1fbda5cd5c8d292fe8e08b6262dd7b5';
const bytes = await readFile(file);
if (createHash('sha256').update(bytes).digest('hex') !== digest) throw Error('El lote difiere del aprobado.');
const rows = bytes.toString().trim().split('\n').map(JSON.parse);
if (rows.length !== 41898 || new Set(rows.map(r => r.source_cueanexo)).size !== rows.length) throw Error('Conteo de anexos inválido.');
for (const r of rows) {
  if (r.decision !== 'accepted' || r.source_cueanexo !== r.record_cueanexo || r.boundary !== 'inside' || r.precision_original !== 'PRECISA') throw Error('Candidato no apto: '+r.record_cueanexo);
}
if (!['db','127.0.0.1','localhost'].includes(new URL(process.env.DATABASE_URL).hostname)) throw Error('Solo DB local');
const client = new pg.Client({connectionString:process.env.DATABASE_URL});
await client.connect();
try {
  await client.query('begin');
  await client.query('select pg_advisory_xact_lock(726411)');
  const {rows:[dataset]} = await client.query("select d.id from datasets d join publication p on p.dataset_id=d.id where p.singleton and d.source_date='2026-09-07' and d.records=64495 for share");
  if (!dataset) throw Error('El padrón publicado no corresponde al lote');
  const {rows:[prior]} = await client.query('select * from location_import_batches where sha256=$1',[digest]);
  if (!prior) {
    const {rows:[batch]} = await client.query("insert into location_import_batches(sha256,artifact_name,source_cartographic_cut_date,source_metadata_reference_date,record_count) values ($1,$2,'2025-01-06','2025-01-15',$3) returning id",[digest,file,rows.length]);
    for(let i=0;i<rows.length;i+=500){
      const part=rows.slice(i,i+500);
      const result=await client.query(`insert into institution_locations select s.dataset_id,'cue-'||s.cueanexo,array[s.cueanexo],s.cueanexo,(r->>'latitude')::float8,(r->>'longitude')::float8,'building','PRECISA',r->>'source','Mapa Educativo Nacional',r->>'attribution','CC BY 4.0',(r->>'cartographic_cut_date')::date,(r->>'metadata_reference_date')::date,(r->>'source_checked_at')::date,$3,r from jsonb_array_elements($1::jsonb) r join schools s on s.dataset_id=$2 and s.cueanexo=r->>'record_cueanexo' join localities l on l.dataset_id=s.dataset_id and l.code=s.locality_code join departments d on d.dataset_id=l.dataset_id and d.code=l.department_code and d.province_code=r->>'province_code'`,[JSON.stringify(part),dataset.id,batch.id]);
      if(result.rowCount!==part.length) throw Error('Anexo o provincia sin correspondencia');
    }
    await client.query('SELECT refresh_institution_coverage($1)',[dataset.id]);
    // Retener los registros históricos para auditoría, excluir su lote de las lecturas activas.
    await client.query("update location_import_batches set status='rolled_back',rolled_back_at=now() where id in (select distinct import_batch_id from institution_locations where dataset_id=$1 and institution_key like 'tuc-%') and status='active'",[dataset.id]);
  }
  const count=await client.query("select count(*)::int n from institution_locations l join location_import_batches b on b.id=l.import_batch_id where l.dataset_id=$1 and b.status='active' and b.sha256=$2",[dataset.id,digest]);
  if(count.rows[0].n!==rows.length) throw Error('El lote no está activo o está incompleto');
  await client.query('commit');
  console.log('Lote activo:',count.rows[0].n);
} catch(e){await client.query('rollback');throw e} finally{await client.end()}
