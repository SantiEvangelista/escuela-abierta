// Preload only in the isolated production benchmark.
const {createRequire}=require('node:module');
const {Pool}=createRequire('/app/server.js')('pg');
const original=Pool.prototype.connect;
const wait=[];
Pool.prototype.connect=function(callback){
 const start=performance.now();
 const sample=()=>wait.push(performance.now()-start);
 if(typeof callback==='function'){
  return original.call(this,(...args)=>{sample();callback(...args)});
 }
 return original.call(this).finally(sample);
};
setInterval(()=>{
 if(!wait.length)return;
 const values=wait.splice(0).sort((a,b)=>a-b);
 console.log(JSON.stringify({poolCheckouts:values.length,waitP95Ms:values[Math.ceil(values.length*.95)-1],waitMaxMs:values.at(-1)}));
},10000).unref();
// Optional diagnostic for reproducing the footprint after all 25 entries are prepared.
process.on('SIGUSR2',()=>{
 const {heapUsed,rss}=process.memoryUsage();
 const pages=globalThis.escuelaPages?.pages;
 console.log(JSON.stringify({cacheEntries:pages?.size??0,heapUsed,rss}));
});
