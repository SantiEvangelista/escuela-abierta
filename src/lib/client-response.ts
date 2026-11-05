/** Reject HTML proxy/dev error pages without exposing their contents to users. */
export async function readApiJson(response:Response){
 const type=response.headers.get('content-type')||'';
 const fail=()=>{
  console.warn('API_UNEXPECTED_RESPONSE',{status:response.status,contentType:type,path:response.url?new URL(response.url).pathname:'unknown'});
  return new Error('No pudimos cargar los datos. El servidor o la conexión devolvió una respuesta inesperada. Intentá nuevamente.');
 };
 if(!type.toLowerCase().includes('application/json'))throw fail();
 try{return await response.json()}catch(error){if(error instanceof Error&&error.name==='AbortError')throw error;throw fail()}
}
