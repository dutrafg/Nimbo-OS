/** Enriquecimento reprodutível do Nimbo OS Beta 4 com PWA e atualização integrada. */
import {readFileSync, writeFileSync, mkdirSync, copyFileSync} from 'node:fs';
import {resolve, join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const release='0.14.4-beta.4';
const dist=join(root,'dist');mkdirSync(dist,{recursive:true});
const sha=buffer=>createHash('sha256').update(buffer).digest('hex');
let html=readFileSync(join(dist,'index.html'),'utf8');
if(!html.includes("const RELEASE = '0.14.0-beta.4';"))throw Error('A base não é a Beta 4 esperada.');
html=html.replace("const RELEASE = '0.14.0-beta.4';",`const RELEASE = '${release}';`);
html=html.replace('<title>Nimbo OS 0.14 — Seu espaço</title>','<title>Nimbo OS 0.14.4 · Beta 4 · WhiteSur</title>');
const tags=`<meta name="nimbo-version" content="${release}">
  <meta name="application-name" content="Nimbo OS">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="Nimbo OS">
  <meta name="mobile-web-app-capable" content="yes">
  <link rel="manifest" href="./manifest.webmanifest">
  <link rel="icon" type="image/png" sizes="192x192" href="./icons/icon-192.png">
  <link rel="apple-touch-icon" sizes="180x180" href="./icons/apple-touch-icon.png">`;
html=html.replace('  <style>',tags+'\n  <style>');
const css=`
/* Nimbo PWA: atualização discreta, não interfere na dock ou janelas existentes. */
.nimbo-pwa-actions{display:flex;gap:9px;flex-wrap:wrap;align-items:center;justify-content:center;margin:12px auto 18px}
.nimbo-pwa-actions button{min-height:40px;padding:9px 14px;border-radius:12px}
#nimbo-pwa-update-notice{position:fixed;top:76px;right:16px;z-index:22000;width:min(355px,calc(100vw - 32px));padding:17px 18px;border:1px solid rgba(57,105,84,.27);border-radius:18px;background:var(--panel,#fbfcf9);box-shadow:0 12px 42px rgba(16,45,36,.22);backdrop-filter:blur(15px);color:var(--ink,#263d36);font:13px/1.5 system-ui,sans-serif}
#nimbo-pwa-update-notice strong{font-weight:750;font-size:14px}
#nimbo-pwa-update-notice p{margin:7px 0 12px;font-size:12px;color:var(--muted,#647971)}
#nimbo-pwa-update-notice>div{display:flex;justify-content:flex-end;gap:9px}
#nimbo-pwa-update-notice button{border:1px solid var(--line,#dbe5e0);background:var(--soft,#eff5ef);padding:9px 12px;border-radius:10px;color:inherit}
#nimbo-pwa-update-notice button[data-pwa-action="apply"]{background:var(--accent,#387f76);border-color:transparent;color:#fff}
@media(max-width:520px){#nimbo-pwa-update-notice{top:70px;right:9px;width:calc(100vw - 18px)}.nimbo-pwa-actions button{flex:1 1 100%}}
@media(prefers-reduced-motion:reduce){#nimbo-pwa-update-notice{transition:none!important}}
`;
html=html.replace('</style>',css+'</style>');
const originalStart=html.indexOf('function updateCenter(root,context){');
const originalEnd=html.indexOf('applications.updater=',originalStart);
if(originalStart<0||originalEnd<0)throw Error('Central de atualizações não localizada.');
const replacement=readFileSync(join(root,'src','update-center.js'),'utf8');
html=html.slice(0,originalStart)+replacement+'\n'+html.slice(originalEnd);
const pwaScript=readFileSync(join(root,'src','pwa-client.js'),'utf8');
if(pwaScript.includes('</script'))throw Error('Script incorreto para incorporação inline.');
html=html.replace('</body>',`<script>\n${pwaScript}\n</script>\n</body>`);
// Mac-inspired Nimbo visual shell, preserving the original app model and data.
if (!html.includes("const DOCK_DEFAULT={position:'left',size:46")) {
  throw Error('Configuração original da dock não encontrada.');
}
html=html.replace("const DOCK_DEFAULT={position:'left',size:46",
                  "const DOCK_DEFAULT={position:'bottom',size:48");
html=html.replace("tone: '#286e62'", "tone: '#0860f2'");
html=html.replace('content="#e5eee9"', 'content="#0860f2"');
const macCSS=readFileSync(join(root,'src','mac-ui.css'),'utf8');
const whiteSurCSS=readFileSync(join(root,'src','whitesur-skin.css'),'utf8');
const macJS=readFileSync(join(root,'src','mac-ui.js'),'utf8');
if (macJS.includes('</script')) throw Error('Script de interface inválido.');
html=html.replace('</style>', '\n'+macCSS+'\n'+whiteSurCSS+'\n</style>');
html=html.replace('</body>', '<script>\n'+macJS+'\n</script>\n</body>');
const whiteSurMap=JSON.parse(readFileSync(join(root,'src','whitesur-icon-map.json'),'utf8'));
for(const marker of ['const iconTiles = {','const suiteGlyphs={']){
  const start=html.indexOf(marker),end=html.indexOf('};',start);
  if(start<0||end<0)throw Error(`Tabela de ícones Nimbo ausente: ${marker}`);
  const names=[...html.slice(start,end).matchAll(/^\s*([\w.-]+)\s*:/gm)].map(m=>m[1]);
  const missing=names.filter(name=>!whiteSurMap[name]);
  if(missing.length)throw Error(`Ícones WhiteSur sem associação: ${missing.join(', ')}`);
}
const whiteSurData=Object.fromEntries(Object.entries(whiteSurMap).map(([name,file])=>{
  const icon=readFileSync(join(root,'public','whitesur',file));
  if(!icon.toString('utf8',0,300).includes('<svg'))throw Error(`SVG inválido: ${file}`);
  return [name,icon.toString('base64')];
}));
if(!html.includes('const appArt = name => {'))throw Error('Gerador de ícones do Nimbo ausente.');
html=html.replace('const appArt = name => {',
  `const WHITE_SUR_ICONS=Object.freeze(${JSON.stringify(whiteSurData)});\nconst appArt = name => {\n  const whiteSurSvg=WHITE_SUR_ICONS[name];\n  if(whiteSurSvg)return '<img class="app-art whitesur-art" alt="" aria-hidden="true" draggable="false" src="data:image/svg+xml;base64,'+whiteSurSvg+'">';`);
html=html.replace('0.14.1 · Beta 4 PWA', '0.14.4 · Beta 4 · WhiteSur · Ícones originais');

const finalPath=join(dist,'index.html');writeFileSync(finalPath,html,'utf8');
const contentHash=sha(Buffer.from(html));
const manifest={
 name:'Nimbo OS — Seu espaço',short_name:'Nimbo OS',description:'Área de trabalho personalizável com 50 miniaplicativos, Loja, dock e arquivos locais.',
 id:'./',start_url:'./',scope:'./',display:'standalone',orientation:'any',
 background_color:'#f5f5f5',theme_color:'#0860f2',lang:'pt-BR',dir:'ltr',categories:['productivity','utilities'],
 prefer_related_applications:false,
 icons:[{src:'./icons/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},{src:'./icons/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'},{src:'./icons/icon-maskable-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'}]
};
writeFileSync(join(dist,'manifest.webmanifest'),JSON.stringify(manifest,null,2)+'\n');
const catalog={application:'nimbo-os',version:release,build:contentHash,apps_bundled:50,release_notes:'Ícones SVG originais WhiteSur incorporados aos módulos e miniaplicativos; tema WhiteSur GTK adaptado a janelas, barras, menus, botões e campos. Mantém o PWA, modo offline e atualizador.'};
writeFileSync(join(dist,'updates.json'),JSON.stringify(catalog,null,2)+'\n');
mkdirSync(join(dist,'icons'),{recursive:true});
for(const name of ['icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png'])copyFileSync(join(root,'public','icons',name),join(dist,'icons',name));
const assetHash=sha(Buffer.concat([Buffer.from(html),...['icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png'].map(name=>readFileSync(join(dist,'icons',name)))]));
const CACHE_NAME=`nimbo-os-shell-${assetHash.slice(0,20)}`;
const sw=`/* Nimbo OS ${release}: controle offline por versão, ativação manual. */
'use strict';
const CACHE_NAME=${JSON.stringify(CACHE_NAME)};
const PREFIX='nimbo-os-shell-';
const ASSETS=['./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png','./icons/apple-touch-icon.png','./updates.json'];
const SHELL_URL=new URL('./index.html',self.registration.scope).href;
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    // A versão antiga permanece ativa caso qualquer recurso essencial falhe.
    await cache.addAll(ASSETS.map(path=>new Request(new URL(path,self.registration.scope),{cache:'reload'})));
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE_NAME).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('message',event=>{if(event.data?.type==='NIMBO_APPLY_UPDATE')self.skipWaiting();});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin||!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
  const isShell=event.request.mode==='navigate'||url.pathname.endsWith('/index.html');
  if(isShell){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE_NAME);
      const stored=await cache.match(SHELL_URL);
      if(stored)return stored;
      return fetch(event.request);
    })());return;
  }
  if(url.pathname.endsWith('/updates.json')){
    event.respondWith(fetch(event.request,{cache:'no-store'}).catch(()=>caches.match(event.request)));return;
  }
  event.respondWith((async()=>{
    const stored=await caches.match(event.request);
    return stored||fetch(event.request);
  })());
});
`;
writeFileSync(join(dist,'sw.js'),sw);
console.log(JSON.stringify({release,cache:CACHE_NAME,html_bytes:Buffer.byteLength(html),sha256:contentHash,assets:ASSETS_COUNT()},null,2));
function ASSETS_COUNT(){return 7;}
