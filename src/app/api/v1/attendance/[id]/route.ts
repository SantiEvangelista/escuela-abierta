import {NextRequest,NextResponse} from 'next/server';
import {createHmac,randomUUID,timingSafeEqual,createHash} from 'node:crypto';
import {getPool} from '@/lib/db';
import {normalizeName,normalizeAddress} from '@/lib/institutions';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const cookieName='escuela-visitor';
function signature(id:string){return createHmac('sha256',process.env.ATTENDANCE_SECRET!).update(id).digest('hex')}
function visitor(req:NextRequest){
 const value=req.cookies.get(cookieName)?.value||'';const [id,sig]=value.split('.');
 if(!/^[0-9a-f-]{36}$/.test(id||'')||!sig||sig.length!==64)return null;
 return timingSafeEqual(Buffer.from(sig),Buffer.from(signature(id)))?id:null;
}
function reply(body:object,status=200){return NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}})}
async function keyFor(id:string){
 if(!/^\d{9}$/.test(id))return null;
 const {rows}=await getPool().query('SELECT s.name,s.address,s.locality_code FROM schools s JOIN publication p ON p.dataset_id=s.dataset_id WHERE s.cueanexo=$1',[id]);
 if(!rows.length)return null;
 const r=rows[0],address=normalizeAddress(r.address||''),name=normalizeName(r.name);
 return createHash('sha256').update(address&&name?JSON.stringify([r.locality_code,address,name]):id).digest('hex');
}
async function read(key:string,id:string|null){
 const {rows}=await getPool().query('SELECT count(*)::int AS count, coalesce(bool_or(visitor_id=$2::uuid),false) AS attended FROM attendance_marks WHERE institution_key=$1',[key,id]);return rows[0];
}
type Context={params:Promise<{id:string}>};
export async function GET(req:NextRequest,ctx:Context){
 if(!process.env.ATTENDANCE_SECRET)return reply({error:'Participación no disponible'},503);
 try{
  const key=await keyFor((await ctx.params).id);if(!key)return reply({error:'Institución no encontrada'},404);
  const existing=visitor(req),id=existing||randomUUID();const res=reply(await read(key,id));
  if(!existing)res.cookies.set(cookieName,`${id}.${signature(id)}`,{httpOnly:true,sameSite:'lax',secure:req.nextUrl.protocol==='https:'||req.headers.get('x-forwarded-proto')==='https',maxAge:31536000,path:'/'});
  return res;
 }catch{return reply({error:'No se pudo consultar la participación'},503)}
}
export async function PUT(req:NextRequest,ctx:Context){
 if(!process.env.ATTENDANCE_SECRET)return reply({error:'Participación no disponible'},503);
 const origin=req.headers.get('origin');
 const host=req.headers.get('x-forwarded-host')||req.headers.get('host');
 try{if(!origin||new URL(origin).host!==host)return reply({error:'Origen no permitido'},403)}catch{return reply({error:'Origen no permitido'},403)}
 const id=visitor(req);if(!id)return reply({error:'Recargá la ficha para habilitar la participación'},401);
 if(!req.headers.get('content-type')?.startsWith('application/json'))return reply({error:'Formato inválido'},415);
 let attended:boolean;
 try{const body=await req.text();if(body.length>100)return reply({error:'Solicitud demasiado grande'},413);const data=JSON.parse(body);if(typeof data.attended!=='boolean')return reply({error:'Valor inválido'},400);attended=data.attended}catch{return reply({error:'Solicitud inválida'},400)}
 const key=await keyFor((await ctx.params).id);if(!key)return reply({error:'Institución no encontrada'},404);
 const client=await getPool().connect();
 try{
  await client.query('BEGIN');
  // Shared PostgreSQL limits work across concurrent requests and server instances.
  for(const [bucket,limit] of [['global',300],[id,20]] as const){
   const {rows}=await client.query(`INSERT INTO attendance_limits VALUES($1,date_trunc('minute',now()),1)
    ON CONFLICT(bucket) DO UPDATE SET window_start=date_trunc('minute',now()),requests=CASE WHEN attendance_limits.window_start=date_trunc('minute',now()) THEN attendance_limits.requests+1 ELSE 1 END RETURNING requests`,[bucket]);
   if(rows[0].requests>limit){await client.query('COMMIT');const res=reply({error:'Demasiados intentos. Esperá un minuto.'},429);res.headers.set('Retry-After','60');return res;}
  }
  if(attended)await client.query('INSERT INTO attendance_marks(institution_key,visitor_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[key,id]);
  else await client.query('DELETE FROM attendance_marks WHERE institution_key=$1 AND visitor_id=$2',[key,id]);
  await client.query("DELETE FROM attendance_limits WHERE window_start < now()-interval '1 day'");
  const {rows}=await client.query('SELECT count(*)::int AS count, coalesce(bool_or(visitor_id=$2::uuid),false) AS attended FROM attendance_marks WHERE institution_key=$1',[key,id]);
  await client.query('COMMIT');return reply(rows[0]);
 }catch{await client.query('ROLLBACK');return reply({error:'No se pudo guardar. Intentá nuevamente.'},503)}finally{client.release()}
}
