import { handleApi } from '@/lib/api';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request: Request, context: {params: Promise<{segments:string[]}>}) {return handleApi(request,(await context.params).segments);}
export async function OPTIONS(){return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Accept','Access-Control-Max-Age':'86400'}});}
