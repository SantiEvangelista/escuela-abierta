import { groupInstitutions, normalizeName } from "./institutions";
import { getPool } from "./db";

class ApiError extends Error { constructor(public status: number, public code: string, message: string) { super(message); } }
const invalid = (message: string): never => { throw new ApiError(400, "INVALID_QUERY", message); };
const catalogTables = { sectors: "sectors", areas: "areas", offers: "offers" } as const;
const resources = ["institutions", "schools", "provinces", "departments", "localities", "datasets", "sources", ...Object.keys(catalogTables)];
const base = ` FROM schools s JOIN localities l ON (l.dataset_id=s.dataset_id AND l.code=s.locality_code) JOIN departments d ON (d.dataset_id=l.dataset_id AND d.code=l.department_code) JOIN provinces p ON (p.dataset_id=d.dataset_id AND p.code=d.province_code) `;
const columns = `s.cueanexo,s.cue,s.annex,s.name,s.address,s.postal_code,s.phone,s.email,s.sector_code,s.area_code,l.code AS locality_code,l.name AS locality_name,d.code AS department_code,d.name AS department_name,p.code AS province_code,p.name AS province_name`;

// Caché acotada por corte y alcance territorial; no cachea fallos ni publicación.
const institutionCache=new Map<string,{expires:number;data:Promise<ReturnType<typeof groupInstitutions>>}>();
async function cachedInstitutions(key:string,load:()=>Promise<ReturnType<typeof groupInstitutions>>){
 const hit=institutionCache.get(key);if(hit&&hit.expires>Date.now())return hit.data;
 const data=load();const entry={expires:Date.now()+300000,data};
 if(institutionCache.size>=4)institutionCache.delete(institutionCache.keys().next().value!);
 institutionCache.set(key,entry);
 try{return await data}catch(e){if(institutionCache.get(key)===entry)institutionCache.delete(key);throw e}
}
const provinceCodes=new Set(Array.from({length:24},(_,i)=>String(i===0?2:(i)*4+2).padStart(2,'0')));

// Next bundles the page and route separately within the same server process.
const cacheScope=globalThis as typeof globalThis & {
 escuelaPages?:{version:string;pages:Map<string,Promise<string>>}
};
const pageCache=cacheScope.escuelaPages??={version:'',pages:new Map()};
const pages=pageCache.pages;
async function firstPage(version:string,key:string,build:()=>Promise<string>){
 if(pageCache.version!==version){pages.clear();pageCache.version=version}
 const existing=pages.get(key);
 if(existing)return existing;
 const entry=build();
 pages.set(key,entry);
 try{return await entry}catch(error){if(pages.get(key)===entry)pages.delete(key);throw error}
}
export async function handleApi(request: Request, segments: string[]) {
 try {
  const [resource, id] = segments;
  if (!resources.includes(resource) || segments.length > 2 || (id && resource !== "schools")) throw new ApiError(404,"NOT_FOUND","Recurso inexistente.");
  if (id && !/^\d{9}$/.test(id)) invalid("cueanexo debe tener nueve dígitos.");
  const params = new URL(request.url).searchParams;
  const allowed = ['schools','institutions'].includes(resource) && !id ? ['page','page_size','q','cue',...(resource==='institutions'?['cueanexo']:[]),'province','department','locality','sector','area','offer','sort'] : resource === 'departments' ? ['province','page','page_size'] : resource === 'localities' ? ['province','department','page','page_size'] : [];
  for(const key of params.keys()) if(!allowed.includes(key) || params.getAll(key).length!==1 || !params.get(key)?.trim()) invalid(`Parámetro inválido o repetido: ${key}`);
  const integer = (key: string, fallback: number, max: number) => {const value=params.get(key); if(value===null)return fallback;if(!/^[1-9]\d*$/.test(value)||Number(value)>max)invalid(`${key}: entero entre 1 y ${max}.`);return Number(value);};
  const page=integer('page',1,1000000), size=integer('page_size',25,100);
  for(const [key,length] of [['province',2],['department',5],['locality',8],['cue',7],['cueanexo',9]] as const) if(params.has(key)&&!new RegExp(`^\\d{${length}}$`).test(params.get(key)!)) invalid(`${key}: se requieren ${length} dígitos.`);
  const pool=getPool();
  for(const [key,table] of [['sector','sectors'],['area','areas'],['offer','offers']] as const) if(params.has(key)) { const found=await pool.query(`SELECT 1 FROM ${table} WHERE code=$1`,[params.get(key)]);if(!found.rowCount)invalid(`Código desconocido: ${key}`); }
  const sort=params.get('sort')??'cueanexo';if(!['cueanexo','name','-name'].includes(sort))invalid('sort debe ser cueanexo, name o -name.');
  if(params.has('q')&&(params.get('q')!.trim().length<2||params.get('q')!.length>100))invalid('q debe tener entre 2 y 100 caracteres.');
  const published=await pool.query(`SELECT d.id,d.source_url,d.source_date::text,d.imported_at,d.records, to_regclass('institution_read') IS NOT NULL AS prepared, ARRAY(SELECT id::text FROM location_import_batches WHERE status='active' ORDER BY id) AS batches FROM publication p JOIN datasets d ON d.id=p.dataset_id WHERE p.singleton=true`);
  if(!published.rowCount)throw new ApiError(503,'DATASET_NOT_PUBLISHED','Todavía no hay un padrón publicado.');
  const {prepared,batches,...dataset}=published.rows[0];
  let data: unknown; let pagination: unknown; let locationCoverage: unknown;
  if(resource==='datasets')data=[dataset];
  else if(resource==='sources')data=[{name:'Padrón Oficial de Establecimientos Educativos',url:dataset.source_url}];
  else if(Object.hasOwn(catalogTables,resource))data=(await pool.query(`SELECT * FROM ${catalogTables[resource as keyof typeof catalogTables]} ORDER BY code`)).rows;
  else if(resource==='institutions' && prepared) {
   const version=JSON.stringify([dataset.id,batches]);
   const key=params.get('province')||'national';
   const eligible=page===1 && size===5 && [...params.keys()].every(k=>['province','page','page_size'].includes(k)) && (!params.has('province')||provinceCodes.has(key));
   const build=async()=>{
    const values:unknown[]=[dataset.id];
    const predicates=['dataset_id=$1'];
    const filter=(expr:string,value:unknown)=>{
     values.push(value);
     predicates.push(expr.replace('?', '$'+values.length));
    };
    for(const key of ['province','department','locality']) if(params.has(key)) filter(key+'=?',params.get(key));
    for(const [key,column] of [['area','areas'],['offer','offers'],['sector','sectors'],['cueanexo','members']]) if(params.has(key)) filter(column+' @> ARRAY[?]::text[]',params.get(key));
    if(params.has('cue')) filter('members && ARRAY(SELECT s.cueanexo FROM schools s WHERE s.dataset_id=$1 AND s.cue=?)',params.get('cue'));
    if(params.has('q'))filter('name LIKE ?', '%'+normalizeName(params.get('q')!)+'%');
    const where=predicates.join(' AND ');
    const sortColumn=sort==='name'?'name_rank':sort==='-name'?'reverse_rank':'cueanexo';
    // Across the full country, sorting for a unique member made PostgreSQL scan all
    // cards in primary-key order instead of using the member index.
    const order=params.has('cueanexo')&&!params.has('province')?'':' ORDER BY '+sortColumn;
    const result=await pool.query('SELECT card FROM institution_read WHERE '+where+order+' LIMIT $'+(values.length+1)+' OFFSET $'+(values.length+2),[...values,size,(page-1)*size]);
    const pageGroups=result.rows.map(r=>r.card as ReturnType<typeof groupInstitutions>[number]);
    const counts=await pool.query(`SELECT count(*)::int AS total,count(*) FILTER(WHERE location_batches && $${values.length+1}::bigint[])::int AS located
      FROM institution_read i WHERE ${where}`,[...values,batches]);
    const {total,located}=counts.rows[0];
   const active=" FROM institution_locations il WHERE il.dataset_id=$1 AND il.institution_key='cue-'||il.source_cueanexo ";
   const locRows=(await pool.query('SELECT il.latitude,il.longitude,il.coordinate_precision,il.source_precision_original,il.source_cueanexo,il.source_url,il.source_name,il.attribution,il.source_license,il.source_cartographic_cut_date::text,il.source_metadata_reference_date::text,il.checked_at::text'+active+' AND il.source_cueanexo=ANY($2::text[]) AND il.import_batch_id=ANY($3::bigint[])',[dataset.id,pageGroups.flatMap(g=>g.members),batches])).rows;
   const byCue=new Map(locRows.map(x=>[x.source_cueanexo,{latitude:Number(x.latitude),longitude:Number(x.longitude),precision:x.coordinate_precision,precision_original:x.source_precision_original,source_cueanexo:x.source_cueanexo,label:'Ubicación según Mapa Educativo',precision_note:x.source_precision_original==='PRECISA'?'PRE=PRECISA según la fuente; no implica verificación física independiente de entrada o edificio.':'Precisión según el atributo original PRE de la fuente.',source:{name:x.source_name,url:x.source_url,attribution:x.attribution,license:x.source_license,cartographic_cut_date:x.source_cartographic_cut_date,metadata_reference_date:x.source_metadata_reference_date,checked_at:x.checked_at}}]));
   const cards=pageGroups.map(g=>{
     const locations=g.members.flatMap(cue=>byCue.has(cue)?[byCue.get(cue)!]:[]);
     return {...g,institution_id:(g.cueanexo.startsWith('90')?'tuc-':'inst-')+g.cueanexo,locations,location:locations[0]??null};
   });
    return JSON.stringify({data:cards,meta:{dataset,pagination:{page,page_size:size,total,total_pages:Math.ceil(total/size)},location_coverage:{located,total,label:'Ubicación según Mapa Educativo'}}});
   };
   const body=eligible?await firstPage(version,key,build):await build();
   return new Response(body,{headers:{'Content-Type':'application/json','Cache-Control':'no-cache','Access-Control-Allow-Origin':'*'}});
  }
  else if(resource==='institutions') {
   const values:unknown[]=[dataset.id];const where=['s.dataset_id=$1'];
   for(const [key,column] of [['province','p.code'],['department','d.code'],['locality','l.code']])if(params.has(key)){values.push(params.get(key));where.push(`${column}=$${values.length}`);}
   let grouped=[...await cachedInstitutions(JSON.stringify(values),async()=>{
   const rows=(await pool.query(`SELECT ${columns} ${base} WHERE ${where.join(' AND ')} ORDER BY s.cueanexo`,values)).rows;
   const catalog=(await pool.query('SELECT code,name,modality FROM offers')).rows;
   const offersByCode=new Map(catalog.map(o=>[o.code,o]));
   const offersByCue=new Map<string,string[]>();
   const offerRows=await pool.query(`SELECT so.cueanexo,array_agg(so.offer_code ORDER BY so.offer_code) AS codes
     FROM school_offers so WHERE so.dataset_id=$1
     ${values.length>1?'AND so.cueanexo=ANY($2::text[])':''} GROUP BY so.cueanexo`,
     values.length>1?[dataset.id,rows.map(s=>s.cueanexo)]:[dataset.id]);
   for(const row of offerRows.rows) offersByCue.set(row.cueanexo,row.codes);
   for(const row of rows) row.offers=(offersByCue.get(row.cueanexo)??[]).map(code=>offersByCode.get(code));
   return groupInstitutions(rows);
   })];
   if(params.has('q'))grouped=grouped.filter(g=>normalizeName(g.name).includes(normalizeName(params.get('q')!)));
   if(params.has('sector'))grouped=grouped.filter(g=>g.sector_codes.includes(params.get('sector')!));
   if(params.has('offer'))grouped=grouped.filter(g=>g.offers.some(o=>o.code===params.get('offer')));
   if(params.has('cueanexo'))grouped=grouped.filter(g=>g.members.includes(params.get('cueanexo')!));
   if(params.has('cue'))grouped=grouped.filter(g=>g.members.some(c=>c.startsWith(params.get('cue')!)));
   if(params.has('area'))grouped=grouped.filter(g=>g.area_codes.includes(params.get('area')!));
   if(sort!=='cueanexo')grouped.sort((a,b)=>(sort==='-name'?-1:1)*a.name.localeCompare(b.name,'es')||a.cueanexo.localeCompare(b.cueanexo));
   const pageGroups=grouped.slice((page-1)*size,page*size);
   const active=" FROM institution_locations il JOIN location_import_batches b ON b.id=il.import_batch_id AND b.status='active' WHERE il.dataset_id=$1 AND il.institution_key='cue-'||il.source_cueanexo ";
   const locatedCues=new Set((await pool.query('SELECT coalesce(array_agg(il.source_cueanexo),ARRAY[]::text[]) AS cues'+active,[dataset.id])).rows[0].cues as string[]);
   const locRows=(await pool.query('SELECT il.latitude,il.longitude,il.coordinate_precision,il.source_precision_original,il.source_cueanexo,il.source_url,il.source_name,il.attribution,il.source_license,il.source_cartographic_cut_date::text,il.source_metadata_reference_date::text,il.checked_at::text'+active+' AND il.source_cueanexo=ANY($2::text[])',[dataset.id,pageGroups.flatMap(g=>g.members)])).rows;
   const byCue=new Map(locRows.map(x=>[x.source_cueanexo,{latitude:Number(x.latitude),longitude:Number(x.longitude),precision:x.coordinate_precision,precision_original:x.source_precision_original,source_cueanexo:x.source_cueanexo,label:'Ubicación según Mapa Educativo',precision_note:x.source_precision_original==='PRECISA'?'PRE=PRECISA según la fuente; no implica verificación física independiente de entrada o edificio.':'Precisión según el atributo original PRE de la fuente.',source:{name:x.source_name,url:x.source_url,attribution:x.attribution,license:x.source_license,cartographic_cut_date:x.source_cartographic_cut_date,metadata_reference_date:x.source_metadata_reference_date,checked_at:x.checked_at}}]));
   data=pageGroups.map(g=>{
     const locations=g.members.flatMap(cue=>byCue.has(cue)?[byCue.get(cue)!]:[]);
     return {...g,institution_id:(g.cueanexo.startsWith('90')?'tuc-':'inst-')+g.cueanexo,locations,location:locations[0]??null};
   });
   const total=grouped.length;
   locationCoverage={located:grouped.filter(g=>g.members.some(cue=>locatedCues.has(cue))).length,total,label:'Ubicación según Mapa Educativo'};
   pagination={page,page_size:size,total,total_pages:Math.ceil(total/size)};
  }
  else if(resource==='schools') {
   const values: unknown[]=[dataset.id];const where=['s.dataset_id=$1'];
   const add=(sql: string,value: unknown)=>{values.push(value);where.push(sql.replace('?',`$${values.length}`));};
   if(id)add('s.cueanexo=?',id);
   for(const [key,column] of [['cue','s.cue'],['province','p.code'],['department','d.code'],['locality','l.code'],['sector','s.sector_code'],['area','s.area_code']]) if(params.has(key))add(`${column}=?`,params.get(key));
   if(params.has('q'))add("s.name ILIKE ?",'%'+params.get('q')!.trim().replace(/[\\%_]/g,'\\$&')+'%');
   if(params.has('offer'))add('EXISTS(SELECT 1 FROM school_offers so WHERE so.dataset_id=s.dataset_id AND so.cueanexo=s.cueanexo AND so.offer_code=?)',params.get('offer'));
   const condition=' WHERE '+where.join(' AND ');
   const total=Number((await pool.query('SELECT count(*)'+base+condition,values)).rows[0].count);
   const order=sort==='cueanexo'?'s.cueanexo':`s.name ${sort==='-name'?'DESC':'ASC'},s.cueanexo`;
   const rows=(await pool.query('SELECT '+columns+base+condition+` ORDER BY ${order} LIMIT $${values.length+1} OFFSET $${values.length+2}`,[...values,id?1:size,id?0:(page-1)*size])).rows;
   if(id&&!rows.length)throw new ApiError(404,'SCHOOL_NOT_FOUND','Localización no encontrada en el corte publicado.');
   const offers=rows.length?(await pool.query('SELECT so.cueanexo,o.code,o.name,o.modality FROM school_offers so JOIN offers o ON o.code=so.offer_code WHERE so.dataset_id=$1 AND so.cueanexo=ANY($2::text[]) ORDER BY o.code',[dataset.id,rows.map(row=>row.cueanexo)])).rows:[];
   const enriched=rows.map(row=>({...row,offers:offers.filter(o=>o.cueanexo===row.cueanexo).map(({cueanexo,...offer})=>offer)}));
   data=id?enriched[0]:enriched;
   if(!id)pagination={page,page_size:size,total,total_pages:Math.ceil(total/size)};
  } else {
   const values: unknown[]=[dataset.id];let table='provinces t',where='t.dataset_id=$1';
   if(resource==='departments')table='departments t';
   if(resource==='localities')table='localities t JOIN departments d ON d.dataset_id=t.dataset_id AND d.code=t.department_code';
   for(const [key,column] of [['province',resource==='localities'?'d.province_code':'t.province_code'],['department','t.department_code']])if(params.has(key)){values.push(params.get(key));where+=` AND ${column}=$${values.length}`;}
   const total=Number((await pool.query(`SELECT count(*) FROM ${table} WHERE ${where}`,values)).rows[0].count);
   const paginated=resource!=='provinces';
   data=(await pool.query(`SELECT t.code,t.name${resource==='departments'?',t.province_code':resource==='localities'?',t.department_code':''} FROM ${table} WHERE ${where} ORDER BY t.code`+(paginated?` LIMIT $${values.length+1} OFFSET $${values.length+2}`:''),paginated?[...values,size,(page-1)*size]:values)).rows;
   if(paginated)pagination={page,page_size:size,total,total_pages:Math.ceil(total/size)};
  }
  return Response.json({data,meta:{dataset,...(pagination?{pagination}:{}),...(locationCoverage?{location_coverage:locationCoverage}:{})}},{headers:{'Cache-Control':'public, max-age=0, s-maxage=60','Access-Control-Allow-Origin':'*'}});
 }catch(error){
  const known=error instanceof ApiError;
  if(!known)console.error('API database/request failure');
  return Response.json({error:{code:known?error.code:'SERVICE_UNAVAILABLE',message:known?error.message:'Servicio temporalmente no disponible.'}},{status:known?error.status:503,headers:{'Cache-Control':'no-store','Access-Control-Allow-Origin':'*'}});
 }
}
