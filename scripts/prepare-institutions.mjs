import {groupInstitutions} from '../src/lib/institutions.ts';

// Called only inside the manual migration/publication transaction.
export async function prepareInstitutions(db,id){
 const {rows}=await db.query(`
 SELECT s.cueanexo,s.cue,s.annex,s.name,s.address,s.postal_code,s.phone,s.email,s.sector_code,s.area_code,
 l.code AS locality_code,l.name AS locality_name,d.code AS department_code,d.name AS department_name,
 p.code AS province_code,p.name AS province_name,
 coalesce(o.offers,'[]'::jsonb) AS offers
 FROM schools s JOIN localities l ON (s.dataset_id,s.locality_code)=(l.dataset_id,l.code)
 JOIN departments d ON (l.dataset_id,l.department_code)=(d.dataset_id,d.code)
 JOIN provinces p ON (d.dataset_id,d.province_code)=(p.dataset_id,p.code)
 LEFT JOIN (SELECT so.cueanexo,jsonb_agg(to_jsonb(o) ORDER BY o.code) AS offers FROM school_offers so
 JOIN offers o ON o.code=so.offer_code WHERE so.dataset_id=$1 GROUP BY so.cueanexo) o USING(cueanexo)
 WHERE s.dataset_id=$1 ORDER BY s.cueanexo`,[id]);
 const cards=groupInstitutions(rows);
 const ranks=dir=>new Map(cards.slice().sort((a,b)=>dir*a.name.localeCompare(b.name,'es')||a.cueanexo.localeCompare(b.cueanexo)).map((g,i)=>[g.cueanexo,i]));
 const asc=ranks(1),desc=ranks(-1);
 await db.query('DELETE FROM institution_read WHERE dataset_id=$1',[id]);
 for(let i=0;i<cards.length;i+=500){
  const batch=cards.slice(i,i+500).map(g=>({card:g,a:asc.get(g.cueanexo),b:desc.get(g.cueanexo)}));
  await db.query(`INSERT INTO institution_read(dataset_id,cueanexo,province,department,locality,name,name_rank,reverse_rank,members,sectors,areas,offers,card) SELECT $1,card->>'cueanexo',card->>'province_code',card->>'department_code',
  card->>'locality_code',card->>'name',a,b,ARRAY(SELECT jsonb_array_elements_text(card->'members')),
  ARRAY(SELECT jsonb_array_elements_text(card->'sector_codes')),ARRAY(SELECT jsonb_array_elements_text(card->'area_codes')),
  ARRAY(SELECT o->>'code' FROM jsonb_array_elements(card->'offers') o),card FROM jsonb_to_recordset($2) x(card jsonb,a int,b int)`,[id,JSON.stringify(batch)]);
 }
 await db.query('SELECT refresh_institution_coverage($1)',[id]);
 // Finish bulk index maintenance here instead of charging the first readers.
 await db.query("SELECT gin_clean_pending_list('institution_member'),gin_clean_pending_list('institution_name_search')");
 await db.query('ANALYZE institution_read');
}
