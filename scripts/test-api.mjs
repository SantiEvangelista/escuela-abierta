import assert from 'node:assert/strict';
import pg from 'pg';
// Ejecutar solo en desarrollo local. Publicación temporal restaurada en finally.
const connection = new URL(process.env.DATABASE_URL);
if(connection.hostname!=='db' || connection.pathname!=='/escuela_api')throw Error('Integration test requires the local Compose database');
const db=new pg.Client({connectionString:process.env.DATABASE_URL});await db.connect();
const base='http://127.0.0.1:3000/api/v1';
const get=async(path,status=200)=>{const response=await fetch(base+path);assert.equal(response.status,status,path);return response.json();};
const previous=(await db.query('SELECT dataset_id FROM publication')).rows;
try {
 await db.query('DELETE FROM publication');
 assert.equal((await get('/schools',503)).error.code,'DATASET_NOT_PUBLISHED');
 const id=(await db.query('SELECT min(id) id FROM datasets')).rows[0].id;assert.ok(id);
 await db.query('INSERT INTO publication VALUES(true,$1)',[id]);
 const expected=Number((await db.query('SELECT count(*) FROM schools WHERE dataset_id=$1',[id])).rows[0].count);
 const all=await get('/schools?page_size=2');assert.equal(all.data.length,2);assert.equal(all.meta.pagination.total,expected);assert.ok(!('raw' in all.data[0]));
 const detail=await get('/schools/'+all.data[0].cueanexo);assert.equal(detail.data.cueanexo,all.data[0].cueanexo);assert.ok(Array.isArray(detail.data.offers));
 const filtered=await get('/schools?province=90&offer=common_primary');assert.ok(filtered.data.length);assert.ok(filtered.data.every(s=>s.province_code==='90'&&s.offers.some(o=>o.code==='common_primary')));
 const page2=await get('/schools?page_size=2&page=2');assert.ok(page2.data.every(s=>!all.data.some(a=>a.cueanexo===s.cueanexo)));
 for(const q of ['page=0','page_size=101','province=xx','sort=DROP','q=x','sector=invalid','page=1&page=2','unknown=x'])await get('/schools?'+q,400);
 await get('/schools/123',400);await get('/schools/999999999',404);await get('/missing',404);
 assert.equal((await get('/provinces')).data.length,24);
 for(const path of ['/departments?province=90','/localities?province=90','/sectors','/areas','/offers','/datasets','/sources'])assert.ok((await get(path)).data.length);
 assert.equal((await get('/schools?q=%25%27%20OR%201%3D1--')).data.length,0);
 assert.equal((await get('/openapi')).openapi,'3.1.0');
 console.log('API integration checks passed');
} finally {await db.query('DELETE FROM publication');for(const row of previous)await db.query('INSERT INTO publication VALUES(true,$1)',[row.dataset_id]);await db.end();}
