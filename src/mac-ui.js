
/* Nimbo OS – Mac-inspired interactive desktop shell; native app model preserved. */
(() => {
 'use strict';
 if (window.NimboMacUI) return;
 const $ = q => document.querySelector(q);
 const host = $('#systembar');
 if (!host) return;
 const STYLE_KEY = 'nimbo-mac-ui-v1';
 let view = {glass:true};
 try {
   const saved = JSON.parse(localStorage.getItem(STYLE_KEY) || '{}');
   if (saved && typeof saved === 'object') view.glass = saved.glass !== false;
 } catch {}
 const paint = () => {document.documentElement.dataset.nimboGlass = view.glass?'on':'off';};
 paint();
 // New installations use the macOS-style bottom Dock. Existing user preferences remain authoritative.
 try {
   if (!localStorage.getItem('nimbo-dock-v2')) {
     localStorage.setItem('nimbo-dock-v2',JSON.stringify({
       position:'bottom', size:48, magnify:true, autohide:false,
       recents:true, indicators:true, bounce:true
     }));
     document.documentElement.dataset.nimboDockPosition='bottom';
     document.documentElement.style.setProperty('--nimbo-dock-size','48px');
   }
 } catch {}
 const svg = (name) => {
   const shapes={
     control:'<rect x="3" y="4" width="18" height="6" rx="3"/><rect x="3" y="14" width="18" height="6" rx="3"/><circle cx="10" cy="7" r="2" fill="currentColor" stroke="none"/><circle cx="16" cy="17" r="2" fill="currentColor" stroke="none"/>',
     wifi:'<path d="M2 9a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0"/><circle cx="12" cy="20" r="1" fill="currentColor" stroke="none"/>',
     about:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.5"/>'
   };
   return '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(shapes[name]||shapes.about)+'</svg>';
 };
 const nav=document.createElement('nav');nav.id='mac-menus';nav.setAttribute('aria-label','Menus do Nimbo OS');
 const titles=['Nimbo','Arquivo','Editar','Visualizar','Janela','Ajuda'];
 nav.innerHTML=titles.map((name,i)=>`<button type="button" data-mac-menu="${i}" aria-haspopup="menu" aria-expanded="false">${name}</button>`).join('');
 host.querySelector('.wordmark')?.after(nav);
 const status=document.createElement('div');status.id='mac-status';
 status.innerHTML=`<button type="button" class="mac-network" title="Conectividade do navegador" aria-label="Conectividade do navegador">${svg('wifi')}<span class="net-dot"></span></button><button type="button" data-mac-controls aria-haspopup="menu" aria-label="Central de controle" title="Central de controle">${svg('control')}</button>`;
 host.insertBefore(status, $('#global-search'));
 const pop=document.createElement('aside');pop.id='mac-popover';pop.hidden=true;pop.setAttribute('role','menu');
 document.body.append(pop);
 let opened=null,anchor=null;
 function closeMenu(){
   pop.hidden=true;opened=null;anchor=null;
   nav.querySelectorAll('[aria-expanded]').forEach(b=>b.setAttribute('aria-expanded','false'));
   status.querySelector('[data-mac-controls]')?.setAttribute('aria-expanded','false');
 }
 function focusWindow(){
   return document.querySelector('nimbo-window.focused:not([hidden]),nimbo-window:not([hidden]).focused') ||
     [...document.querySelectorAll('nimbo-window:not([hidden])')].at(-1);
 }
 function launch(id){
   const trigger=document.createElement('button');
   trigger.dataset.launch=id;trigger.hidden=true;
   document.body.append(trigger);trigger.click();trigger.remove();
 }
 function system(name){const target=document.querySelector(`[data-system="${name}"]`);target?.click();}
 const menuItems={
  0:[['Nimbo OS · Beta 4','about',''],['','divider',''],['Preferências do Sistema…','settings','⌘ ,'],['Loja de aplicativos','store',''],['Central de atualizações','updater',''],['','divider',''],['Mostrar área de trabalho','desktop','⌘ H']],
  1:[['Abrir Arquivos','files',''],['Novo documento','writer',''],['Novo desenho','studio',''],['','divider',''],['Biblioteca de aplicativos','store','']],
  2:[['Escrita · Editor','writer',''],['Meus passos','tasks',''],['','divider',''],['Buscar aplicativos ou arquivos','search','⌘ Espaço']],
  3:[['Mostrar área de trabalho','desktop','⌘ H'],['Todas as janelas','overview',''],['Buscar','search','⌘ Espaço'],['','divider',''],['Personalizar widgets','widgets',''],['Aparência e cores','settings','']],
  4:[['Minimizar janela','min',''],['Ampliar / restaurar','max',''],['Fechar janela','close',''],['','divider',''],['Ver todas as janelas','overview','']],
  5:[['Pesquisa global','search','⌘ Espaço'],['Central de atualizações','updater',''],['Sobre o Nimbo OS','about','']]
 };
 function entries(index){
   if(index==='controls')return [
      ['CENTRAL DE CONTROLE','caption',''],
      [navigator.onLine?'Conexão do navegador: online':'Conexão do navegador: offline','connection',''],
      ['Efeito de vidro: '+(view.glass?'Ativado':'Desativado'),'glass',''],
      ['Aparência e plano de fundo…','settings',''],['','divider',''],
      ['Notificações','notices',''],['Atualizações','updater','']
   ];
   return menuItems[index]||menuItems[0];
 }
 function openMenu(index,el){
   if(opened===index && !pop.hidden){closeMenu();return;}
   closeMenu();opened=index;anchor=el;
   const items=entries(index);
   pop.replaceChildren();
   items.forEach(([label,action,hint])=>{
     if(action==='divider'){pop.append(document.createElement('hr'));return;}
     if(action==='caption'){const h=document.createElement('span');h.className='mac-menu-caption';h.textContent=label;pop.append(h);return;}
     const btn=document.createElement('button');btn.type='button';btn.dataset.macAction=action;
     const span=document.createElement('span');span.textContent=label;btn.append(span);
     if(hint){const k=document.createElement('kbd');k.textContent=hint;btn.append(k);}
     pop.append(btn);
   });
   if(typeof index==='number')nav.querySelector(`[data-mac-menu="${index}"]`)?.setAttribute('aria-expanded','true');
   else el?.setAttribute('aria-expanded','true');
   pop.hidden=false;
   const rect=el.getBoundingClientRect();
   const maxLeft=Math.max(8,innerWidth-pop.offsetWidth-9);
   pop.style.left=Math.max(8,Math.min(rect.left,pop.offsetWidth>innerWidth-30?8:maxLeft))+'px';
   pop.style.top=Math.min(innerHeight-pop.offsetHeight-12,rect.bottom+6)+'px';
   const first=pop.querySelector('button');first?.focus({preventScroll:true});
 }
 function showAbout(){
   const existing=$('#mac-about');if(existing){existing.remove();return;}
   const wrap=document.createElement('div');wrap.id='mac-about';wrap.style.cssText='position:fixed;inset:0;z-index:30500;display:grid;place-items:center;background:#07182d70;backdrop-filter:blur(8px);padding:20px';
   const modal=document.createElement('section');modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','Sobre o Nimbo OS');
   modal.style.cssText='border-radius:22px;max-width:420px;width:100%;padding:27px;background:#f9fbff;color:#182b46;box-shadow:0 25px 70px #06173388;text-align:center';
   modal.innerHTML='<div style="display:grid;place-items:center;width:68px;height:68px;margin:0 auto 14px;border-radius:19px;background:linear-gradient(145deg,#ace6ff,#3796e8,#1556a7);color:white;font-size:39px;box-shadow:0 8px 16px #1556a74a">n.</div><h2 style="font-size:23px;margin:0 0 8px">Nimbo OS</h2><p style="font-size:13px;color:#65788d;line-height:1.6">Beta 4 · Desktop Web PWA<br>50 miniaplicativos e área de trabalho personalizável.</p><p style="font-size:11px;color:#8994a3;margin:15px 0">Visual inspirado no macOS · Identidade Nimbo original</p><button type="button" style="padding:10px 25px;border-radius:9px;background:#247dd6;color:white">Fechar</button>';
   wrap.append(modal);document.body.append(wrap);
   function dismiss(){wrap.remove();}
   wrap.addEventListener('click',e=>{if(e.target===wrap||e.target.closest('button'))dismiss();});
   modal.querySelector('button')?.focus();
 }
 function editWidgets(){
   // Uses the original Nimbo desktop context menu, preserving its own event handlers.
   const menu=$('#desktop-menu');
   if(!menu)return;
   const target=$('#desktop-widgets')||$('#desktop');
   target?.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:Math.min(innerWidth-250,80),clientY:95}));
   const button=menu.querySelector('[data-menu="widgets"]');if(button)button.click();
 }
 function run(action){
   closeMenu();
   if(['files','writer','studio','store','settings','updater','tasks'].includes(action)){launch(action);return;}
   if(['search','overview','desktop','notices'].includes(action)){system(action);return;}
   if(action==='widgets'){editWidgets();return;}
   if(action==='about'){showAbout();return;}
   if(action==='glass'){view.glass=!view.glass;paint();try{localStorage.setItem(STYLE_KEY,JSON.stringify(view));}catch{}return;}
   if(['min','max','close'].includes(action)){
     const frame=focusWindow();
     const tool=frame?.querySelector(`[data-frame="${action}"]`);
     if(tool) tool.click();
     else if(frame===null) {system('overview');}
   }
 }
 nav.addEventListener('click',event=>{
   const b=event.target.closest('[data-mac-menu]');if(!b)return;
   openMenu(Number(b.dataset.macMenu),b);
 });
 status.querySelector('[data-mac-controls]').addEventListener('click',e=>openMenu('controls',e.currentTarget));
 pop.addEventListener('click',event=>{const b=event.target.closest('[data-mac-action]');if(b)run(b.dataset.macAction);});
 status.querySelector('.mac-network').addEventListener('click',event=>openMenu('controls',status.querySelector('[data-mac-controls]')));
 document.addEventListener('pointerdown',event=>{
   if(!pop.hidden&&!event.target.closest('#mac-popover,#mac-menus,#mac-status'))closeMenu();
 });
 document.addEventListener('keydown',event=>{
   if(event.key==='Escape'&&!pop.hidden){closeMenu();event.preventDefault();return;}
   if(event.metaKey && event.key===' '){event.preventDefault();system('search');}
   if(event.metaKey && event.key===','){event.preventDefault();launch('settings');}
   if(event.metaKey && event.key.toLowerCase()==='h' && !event.altKey){event.preventDefault();system('desktop');}
 });
 window.addEventListener('resize',closeMenu);
 function updateNetwork(){status.querySelector('.net-dot')?.classList.toggle('offline',!navigator.onLine);}
 window.addEventListener('online',updateNetwork);window.addEventListener('offline',updateNetwork);updateNetwork();
 window.NimboMacUI=Object.freeze({version:'1.0',openMenu:(i)=>openMenu(i,nav.querySelector(`[data-mac-menu="${i}"]`)||status.querySelector('[data-mac-controls]')),closeMenu,run});
})();