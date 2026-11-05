import fs from 'node:fs/promises';
import {prepareInstitutions} from './prepare-institutions.mjs';
import crypto from 'node:crypto';
import readXlsx from 'read-excel-file/node';
import pg from 'pg';
import {SECTORS,AREAS,OFFERS,clean} from './catalogs.mjs';
const [command,path] = process.argv.slice(2);
const commands = ['migrate','validate','import','publish'];
if (!commands.includes(command)) throw Error('Use migrate | validate ARCHIVO | import ARCHIVO | publish ID');
const db = new pg.Client({connectionString:process.env.DATABASE_URL});
if(command !== 'validate') await db.connect();
try {
 if(command === 'migrate') {
  await db.query('BEGIN'); await db.query('SELECT pg_advisory_xact_lock(726411)'); await db.query(await fs.readFile('db/001.sql','utf8')); await db.query(await fs.readFile('db/002-attendance.sql','utf8')); await db.query(await fs.readFile('db/003-institution-locations.sql','utf8'));
  await db.query(await fs.readFile('db/004-institution-read.sql','utf8'));
  for(const {dataset_id} of (await db.query('SELECT dataset_id FROM publication WHERE NOT EXISTS (SELECT 1 FROM institution_read WHERE institution_read.dataset_id=publication.dataset_id)')).rows) await prepareInstitutions(db,dataset_id);
  for(const [name,code] of Object.entries(SECTORS)) await db.query('INSERT INTO sectors VALUES($1,$2) ON CONFLICT DO NOTHING',[code,name]);
  for(const [name,code] of Object.entries(AREAS)) await db.query('INSERT INTO areas VALUES($1,$2) ON CONFLICT DO NOTHING',[code,name]);
  for(const [,code,modality,name] of OFFERS) await db.query('INSERT INTO offers VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[code,modality,name]);
  await db.query('COMMIT'); console.log('Schema ready');
 } else if(command === 'publish') {
  if(!/^\d+$/.test(path||'')) throw Error('Dataset ID required');
  await db.query('BEGIN');
  await db.query('SELECT pg_advisory_xact_lock(726411)');
  // Imported cuts are immutable. Reverting to an existing cut only switches publication.
  const existing=await db.query('SELECT 1 FROM institution_read WHERE dataset_id=$1 LIMIT 1',[path]);
  if(!existing.rowCount)await prepareInstitutions(db,Number(path));
  await db.query('INSERT INTO publication VALUES(true,$1) ON CONFLICT(singleton) DO UPDATE SET dataset_id=excluded.dataset_id',[path]);
  await db.query('COMMIT');
  console.log('Published dataset',path);
 } else {
  if(!path) throw Error('File required');
  const bytes=await fs.readFile(path), hash=crypto.createHash('sha256').update(bytes).digest('hex');
  const sheets=await readXlsx(bytes,{sheet:'padron'});
  const rows=sheets[0].data;
  if(rows[12]?.[7] !== 'Cueanexo' || rows[12]?.[8] !== 'Nombre' || rows[12]?.[6] !== 'Código de localidad' || rows[12]?.[18] !== 'Primario') throw Error('Unexpected headers');
  const date=String(rows[9]?.[0]).match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if(!date) throw Error('Missing source date');
  const data=rows.slice(13).filter(row=>row.some(v=>v!=null)); const seen=new Set();
  const territories=[new Map(),new Map(),new Map()]; let missingAddresses=0;
  for(const [i,row] of data.entries()) {
   const id=clean(row[7]), dep=clean(row[4]), loc=clean(row[6]);
   if(!/^\d{9}$/.test(id||'') || seen.has(id)) throw Error('Invalid/duplicate CUEANEXO at row '+(i+14)); seen.add(id);
   if(!/^\d{5}$/.test(dep||'') || !/^\d{8}$/.test(loc||'') || !loc.startsWith(dep) || !id.startsWith(dep.slice(0,2))) throw Error('Invalid territory at row '+(i+14));
   for(const j of [0,3,5,8]) if(!clean(row[j])) throw Error('Required field missing');
   if(!Object.hasOwn(SECTORS,clean(row[1])) || !Object.hasOwn(AREAS,clean(row[2]))) throw Error('Unknown classification');
   for(let j=13;j<40;j++) if(row[j]!=null && row[j]!==1) throw Error('Unexpected offer marker');
   const values=[[dep.slice(0,2),clean(row[0])],[dep,clean(row[3])],[loc,clean(row[5])]];
   values.forEach(([key,name],j)=>{if(territories[j].has(key)&&territories[j].get(key)!==name) throw Error('Conflicting territory '+key);territories[j].set(key,name)});
   if(!clean(row[9]))missingAddresses++;
  }
  console.log(JSON.stringify({sha256:hash,records:data.length,provinces:territories[0].size,departments:territories[1].size,localities:territories[2].size,missingAddresses}));
  if(command==='import') {
   await db.query('BEGIN'); await db.query('SELECT pg_advisory_xact_lock(726410)');
   const previous=await db.query('SELECT id FROM datasets WHERE sha256=$1',[hash]);
   if(previous.rowCount){console.log('Already imported',previous.rows[0].id);await db.query('ROLLBACK');}
   else {
    const result=await db.query('INSERT INTO datasets(sha256,source_url,source_date,records) VALUES($1,$2,$3,$4) RETURNING id',[hash,'https://www.argentina.gob.ar/node/246613',`${date[3]}-${date[2]}-${date[1]}`,data.length]); const id=result.rows[0].id;
    for(const [code,name] of territories[0]) await db.query('INSERT INTO provinces VALUES($1,$2,$3)',[id,code,name]);
    for(const [code,name] of territories[1]) await db.query('INSERT INTO departments VALUES($1,$2,$3,$4)',[id,code,code.slice(0,2),name]);
    for(const [code,name] of territories[2]) await db.query('INSERT INTO localities VALUES($1,$2,$3,$4)',[id,code,code.slice(0,5),name]);
    for(const [i,row] of data.entries()) {
     await db.query('INSERT INTO schools(dataset_id,cueanexo,name,locality_code,sector_code,area_code,address,postal_code,phone,email,source_row,raw) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',[id,clean(row[7]),clean(row[8]),clean(row[6]),SECTORS[clean(row[1])],AREAS[clean(row[2])],...row.slice(9,13).map(clean),i+14,JSON.stringify(row)]);
     for(const [column,code] of OFFERS) if(row[column]===1) await db.query('INSERT INTO school_offers VALUES($1,$2,$3)',[id,clean(row[7]),code]);
    }
    await db.query('COMMIT'); console.log('Imported unpublished dataset',id);
   }
  }
 }
} catch(error) {if(command!=='validate')await db.query('ROLLBACK');console.error(error.message);process.exitCode=1;}
finally {if(command!=='validate')await db.end();}
