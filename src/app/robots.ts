export const dynamic='force-dynamic';
import type {MetadataRoute} from 'next';
import {siteUrl} from '../lib/site';
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:'*',...(siteUrl?{allow:'/',disallow:'/api/'}:{disallow:'/'})},...(siteUrl?{sitemap:siteUrl+'/sitemap.xml'}:{})}}
