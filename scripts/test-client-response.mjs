import assert from 'node:assert/strict';
import {readApiJson} from '../src/lib/client-response.ts';
assert.deepEqual(await readApiJson(Response.json({data:[]})),{data:[]});
for(const response of [new Response('<!DOCTYPE html><h1>Bad Gateway</h1>',{status:502,headers:{'content-type':'text/html'}}),new Response('<!DOCTYPE html>',{headers:{'content-type':'application/json'}})]){
 await assert.rejects(()=>readApiJson(response),error=>error.message.includes('respuesta inesperada')&&!error.message.includes('DOCTYPE'));
}
console.log('PASS: JSON, HTML gateway response, malformed JSON');
