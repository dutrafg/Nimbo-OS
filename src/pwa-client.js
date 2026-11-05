/* Nimbo PWA — lifecycle da instalação e atualizações do sistema e dos 50 miniapps. */
(() => {
  'use strict';
  const meta = document.querySelector('meta[name="nimbo-version"]');
  const release = meta?.content || '0.14.1-beta.4';
  const secure = location.protocol === 'https:' || ['localhost','127.0.0.1','[::1]'].includes(location.hostname);
  const supported = secure && 'serviceWorker' in navigator;
  let registration = null, deferredInstall = null, applying = false;
  const listeners = new Set();
  const $ = selector => document.querySelector(selector);
  const current = () => ({version:release, supported, installed:matchMedia('(display-mode: standalone)').matches || navigator.standalone === true, waiting:Boolean(registration?.waiting), installable:Boolean(deferredInstall)});
  function report(state, detail='') {
    for (const fn of listeners) {try {fn({state,detail,...current()});} catch (err) {console.warn('Nimbo PWA listener', err);}}
    if (state === 'ready') showUpdateNotice();
  }
  function subscribe(fn) {listeners.add(fn);return () => listeners.delete(fn);}
  function instruction() {
    if (!secure) return 'Para instalar e atualizar automaticamente, abra o Nimbo publicado em HTTPS ou localhost. O HTML local continua utilizável.';
    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) return 'Use Compartilhar → Adicionar à Tela de Início → Abrir como App.';
    return 'Use o menu do navegador → Instalar aplicativo / Adicionar à tela inicial.';
  }
  function showUpdateNotice() {
    if (applying || $('#nimbo-pwa-update-notice') || !document.body) return;
    const box = document.createElement('section');
    box.id = 'nimbo-pwa-update-notice';
    box.setAttribute('role','status');
    box.setAttribute('aria-live','polite');
    box.innerHTML = '<strong>Atualização do Nimbo pronta</strong><p>Nova versão do sistema e dos miniaplicativos disponível. Salve seu trabalho antes de aplicar.</p><div><button type="button" data-pwa-action="later">Depois</button><button type="button" data-pwa-action="apply">Atualizar agora</button></div>';
    box.addEventListener('click', async event => {
      const choice = event.target.closest('[data-pwa-action]')?.dataset.pwaAction;
      if (choice === 'later') box.remove();
      if (choice === 'apply') { if (confirm('Salvou suas alterações? O Nimbo será reiniciado para aplicar a atualização.')) await apply(); }
    });
    document.body.append(box);
  }
  function watchWorker(worker) {
    if (!worker) return;
    const changed = () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller) report('ready');
      else if (worker.state === 'installing') report('downloading');
      else if (worker.state === 'redundant') report('error','A atualização não foi concluída. A versão anterior permanece disponível.');
    };
    worker.addEventListener('statechange', changed);
    changed();
  }
  async function register() {
    if (!supported) {report('unavailable',instruction()); return null;}
    try {
      registration = await navigator.serviceWorker.register('./sw.js', {scope:'./', updateViaCache:'none'});
      registration.addEventListener('updatefound', () => watchWorker(registration.installing));
      if (registration.installing) watchWorker(registration.installing);
      if (registration.waiting && navigator.serviceWorker.controller) report('ready');
      else report('installed');
      return registration;
    } catch (error) {
      console.warn('Nimbo PWA: registro indisponível', error);
      report('error','Não foi possível ativar o armazenamento offline: '+error.message);
      return null;
    }
  }
  async function check() {
    if (!supported) return {state:'unavailable',detail:instruction(),...current()};
    if (!navigator.onLine) return {state:'offline',detail:'Sem conexão. A versão offline instalada continua disponível.',...current()};
    if (!registration) await register();
    if (!registration) return {state:'error',detail:'Service Worker não disponível.',...current()};
    try {
      const response = await fetch('./updates.json', {cache:'no-store',headers:{'Accept':'application/json'}});
      if (!response.ok) throw Error('Catálogo indisponível (HTTP '+response.status+').');
      const catalog = await response.json();
      if (catalog.application !== 'nimbo-os' || !/^[\w.+-]+$/.test(catalog.version||'')) throw Error('Catálogo inválido.');
      await registration.update();
      if (registration.waiting && navigator.serviceWorker.controller) {
        report('ready'); return {state:'ready',remote:catalog.version,detail:'Pronta para instalar. Sistema e apps são atualizados juntos.',...current()};
      }
      if (catalog.version !== release) {
        report('downloading');
        return {state:'downloading',remote:catalog.version,detail:'Nova versão encontrada. Aguarde a preparação offline e mantenha esta janela aberta.',...current()};
      }
      report('current');
      return {state:'current',remote:catalog.version,detail:'Sistema e 50 miniaplicativos estão na versão mais recente publicada.',...current()};
    } catch (error) {
      report('error',error.message);
      return {state:'error',detail:error.message,...current()};
    }
  }
  async function apply() {
    if (applying) return false;
    if (!registration?.waiting) return false;
    applying = true;
    report('applying');
    const worker = registration.waiting;
    let reloaded = false;
    const reload = () => {if (reloaded) return;reloaded = true;location.reload();};
    navigator.serviceWorker.addEventListener('controllerchange', reload,{once:true});
    worker.postMessage({type:'NIMBO_APPLY_UPDATE'});
    return true;
  }
  async function install() {
    if (current().installed) return {ok:false,message:'O Nimbo já está instalado como aplicativo.'};
    if (!deferredInstall) return {ok:false,message:instruction()};
    const promptEvent = deferredInstall;
    deferredInstall = null;
    await promptEvent.prompt();
    const outcome = await promptEvent.userChoice;
    const ok = outcome?.outcome === 'accepted';
    report(ok?'installed':'install-dismissed');
    return {ok,message:ok?'Instalação aceita pelo navegador.':'A instalação foi cancelada.'};
  }
  window.addEventListener('beforeinstallprompt',event => {event.preventDefault();deferredInstall=event;report('installable');});
  window.addEventListener('appinstalled',() => {deferredInstall=null;report('installed');});
  window.addEventListener('online',() => {if (registration) check().catch(()=>{});});
  document.addEventListener('visibilitychange',() => {if (!document.hidden && registration && navigator.onLine) registration.update().catch(()=>{});});
  window.NimboPWA = Object.freeze({release,register,check,apply,install,subscribe,current,instruction});
  window.addEventListener('load',() => {register().then(() => {if (registration && navigator.onLine) registration.update().catch(()=>{});});},{once:true});
})();