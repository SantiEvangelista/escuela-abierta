// Solo el dominio público definitivo habilita indexación. Previews siempre noindex.
export function publicSiteUrl(value:string|undefined,preview=process.env.VERCEL_ENV==='preview'){
 if(!value||preview)return undefined;
 try{const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password||['localhost','127.0.0.1','[::1]'].includes(url.hostname))return undefined;return url.origin}catch{return undefined}
}
export const siteUrl=publicSiteUrl(process.env.SITE_URL);
