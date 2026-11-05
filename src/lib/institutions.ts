type Offer={code:string;name:string;modality:string};
type Location={cueanexo:string;name:string;address:string|null;locality_code:string;sector_code:string;offers:Offer[];[key:string]:unknown};
export const normalizeText=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim().replace(/\s+/g,' ');
export const normalizeName=(value:string)=>normalizeText(value).replace(/\bINST\b/g,'INSTITUTO').replace(/\bCOL\b/g,'COLEGIO').replace(/\bESC\b/g,'ESCUELA');
export const normalizeAddress=(value:string)=>normalizeText(value).replace(/\bAV(?:DA)?\b/g,'AVENIDA').replace(/\s+(?:BARRIO )?CENTRO$/,'').trim();
export function groupInstitutions(rows:Location[]){
 const groups=new Map<string,Location & {members:string[];sector_codes:string[];area_codes:string[]}>();
 for(const row of rows){
  const address=normalizeAddress(row.address||''); const name=normalizeName(row.name);
  // Sin domicilio o nombre utilizable, conservar la localización individual.
  const key=address&&name?JSON.stringify([row.locality_code,address,name]):row.cueanexo;
  const current=groups.get(key);
  if(!current){groups.set(key,{...row,name,members:[row.cueanexo],sector_codes:[row.sector_code],area_codes:[String(row.area_code)],offers:[...row.offers]});continue;}
  current.members.push(row.cueanexo);
  if(!current.area_codes.includes(String(row.area_code)))current.area_codes.push(String(row.area_code));
  if(!current.sector_codes.includes(row.sector_code))current.sector_codes.push(row.sector_code);
  for(const offer of row.offers)if(!current.offers.some(o=>o.code===offer.code))current.offers.push(offer);
 }
 return [...groups.values()].map(g=>({...g,offers:g.offers.sort((a,b)=>a.code.localeCompare(b.code)),sector_code:g.sector_codes.length===1?g.sector_codes[0]:'mixed',grouping_method:'locality_address_name_v1'}));
}
