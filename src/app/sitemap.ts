export const dynamic='force-dynamic';
import type {MetadataRoute} from 'next';
import {siteUrl} from '../lib/site';
export default function sitemap():MetadataRoute.Sitemap{return siteUrl?[{url:siteUrl+'/'}]:[]}
