import {ApiReference} from '@scalar/nextjs-api-reference';
const renderReference=ApiReference({
 url:'/api/v1/openapi',pageTitle:'Escuela Abierta · Documentación API',
 cdn:'https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.76.4',
 theme:'none',darkMode:false,forceDarkModeState:'light',hideDarkModeToggle:true,
 customCss:`
   .light-mode, .light-mode .t-doc__sidebar {
     --scalar-background-1: #EEE9DA;
     --scalar-background-2: #f7f4eb;
     --scalar-background-3: #BDCDD6;
     --scalar-color-1: #193140;
     --scalar-color-2: #385566;
     --scalar-color-3: #496574;
     --scalar-color-accent: #315f79;
     --scalar-border-color: #93BFCF;
     --scalar-sidebar-background-1: #e6e7dd;
     --scalar-sidebar-color-1: #193140;
     --scalar-sidebar-color-2: #385566;
     --scalar-sidebar-color-active: #193140;
     --scalar-sidebar-item-active-background: #93BFCF;
     --scalar-button-1: #24495e;
     --scalar-button-1-color: #fff;
     --scalar-link-color: #315f79;
   }
   body {background:#EEE9DA;--scalar-custom-header-height:44px}
   .docs-navigation {position:sticky;top:0;z-index:10;height:44px;box-sizing:border-box;display:flex;align-items:center;padding:0 16px;background:#EEE9DA;border-bottom:1px solid #93BFCF}
   .docs-navigation a {display:inline-flex;align-items:center;min-height:44px;color:#24495e;font:600 14px system-ui;text-decoration:none}
   .docs-navigation a:hover,.docs-navigation a:focus-visible {text-decoration:underline}
 `,withDefaultFonts:false,showDeveloperTools:'never',agent:{disabled:true},telemetry:false,
});

export async function GET() {
  const reference = await renderReference();
  const navigation = '<nav class="docs-navigation" aria-label="Navegación del sitio"><a href="/"><span aria-hidden="true">←&nbsp;</span>Volver al sitio</a></nav>';
  const html = (await reference.text()).replace(/<body[^>]*>/i, tag => tag + navigation);
  return new Response(html, {headers: reference.headers});
}
