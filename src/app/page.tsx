import type {Metadata} from 'next';
import Explorer from './explorer';
import {handleApi} from '../lib/api';
import {siteUrl} from '../lib/site';
type Props={searchParams:Promise<Record<string,string|string[]|undefined>>};
export async function generateMetadata({searchParams}:Props):Promise<Metadata>{
 const params=await searchParams;
 return {alternates:siteUrl?{canonical:siteUrl}:undefined,robots:{index:!!siteUrl&&!Object.keys(params).length,follow:true}};
}
export default async function Page({searchParams}:Props){
 const raw=await searchParams;const params=new URLSearchParams({page_size:'5'});
 for(const key of ['province','sector','q','page']){const value=raw[key];if(typeof value==='string'&&value)params.set(key,value)}
 const response=await handleApi(new Request('http://internal/api/v1/institutions?'+params),['institutions']);
 const initial=await response.json();
 return <Explorer initial={initial} initialQuery={params.toString()}/>;
}
