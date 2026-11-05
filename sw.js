/* Nimbo OS 0.14.2-beta.4: controle offline por versão, ativação manual. */
'use strict';
const CACHE_NAME="nimbo-os-shell-c3a72af60b6fccdff8d9";
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
