import type { Metadata } from "next";
import "./globals.css";
import {siteUrl} from "../lib/site";
export const metadata: Metadata = {
  metadataBase:siteUrl?new URL(siteUrl):undefined,
  robots:{index:!!siteUrl,follow:true},
  icons:{icon:[{url:'/brand/favicon-32.png',sizes:'32x32',type:'image/png'},{url:'/brand/favicon-192.png',sizes:'192x192',type:'image/png'}],apple:'/brand/apple-touch-icon.png'},
  openGraph:{images:[{url:'/brand/share.png',width:1200,height:630,alt:'Escuela Abierta: libro abierto con el Sol de Mayo'}],type:'website',locale:'es_AR',siteName:'Escuela Abierta',title:'Escuelas y colegios de Argentina | Escuela Abierta',description:'Explorá escuelas y colegios de Argentina por provincia, consultá sus niveles educativos y reutilizá los datos del padrón oficial con la API abierta.'},
  twitter:{card:'summary_large_image',images:['/brand/share.png'],title:'Escuela Abierta',description:'Explorá escuelas y colegios de Argentina por provincia, consultá sus niveles educativos y reutilizá los datos del padrón oficial con la API abierta.'},
  title: "Escuelas y colegios de Argentina | Escuela Abierta",
  description: "Explorá escuelas y colegios de Argentina por provincia, consultá sus niveles educativos y reutilizá los datos del padrón oficial con la API abierta.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es-AR"><body>{children}</body></html>;
}
