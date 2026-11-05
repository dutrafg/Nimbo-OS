function updateCenter(root,context){
 let active=true, busy=false;
 const api=window.NimboPWA;
 root.innerHTML='<div class="app-page update-center"><div class="eyebrow">NIMBO UPDATE · PWA</div><h1>Seu espaço, sempre melhor.</h1><p class="muted">Sistema e miniaplicativos atualizados juntos, sem apagar seus dados.</p><div class="update-orbit">'+appArt('cloud')+'</div><h2 id="update-status" role="status">Verificando o ambiente</h2><p id="update-detail" class="muted">Use esta central para instalar o Nimbo e gerenciar versões.</p><progress id="update-progress" max="100" value="0" hidden></progress><div class="nimbo-pwa-actions"><button class="button primary" id="update-check">Verificar atualizações</button><button class="button" id="update-apply" hidden>Aplicar e reiniciar</button><button class="button quiet" id="pwa-install">Instalar como aplicativo</button></div><section class="update-version"><b>Sistema instalado</b><p>Nimbo OS '+html(context.release)+'</p><b>Miniaplicativos</b><p>50 apps incluídos na distribuição. Quando o Nimbo recebe uma versão, os apps integrados também são atualizados.</p><b>Offline</b><p id="pwa-offline-detail">Na instalação hospedada, o PWA guarda a versão completa para uso sem internet.</p><b>Segurança dos dados</b><p>O atualizador substitui apenas o cache do aplicativo. Backups, documentos e registros locais não são apagados. Salve alterações abertas antes de reiniciar.</p></section></div>';
 const checkButton=root.querySelector('#update-check'),applyButton=root.querySelector('#update-apply'),installButton=root.querySelector('#pwa-install'),status=root.querySelector('#update-status'),detail=root.querySelector('#update-detail'),progress=root.querySelector('#update-progress');
 const paint = event => {
  if(!active||!event)return;
  const state=event.state;
  if(state==='ready'){
   status.textContent='Nova versão pronta para instalar';detail.textContent='Todos os arquivos foram preparados. Salve o trabalho e escolha Aplicar e reiniciar.';applyButton.hidden=false;progress.hidden=true;
  }else if(state==='downloading'){
   status.textContent='Preparando atualização offline…';detail.textContent=event.detail||'Baixando sistema e apps';progress.hidden=false;progress.removeAttribute('value');
  }else if(state==='current'){
   status.textContent='Nimbo atualizado';detail.textContent=event.detail||'Versão mais recente instalada.';progress.hidden=true;applyButton.hidden=true;
  }else if(state==='offline'){
   status.textContent='Você está offline';detail.textContent=event.detail;progress.hidden=true;
  }else if(state==='error'||state==='unavailable'){
   status.textContent=state==='unavailable'?'Instalação disponível após publicação':'Não foi possível verificar';detail.textContent=event.detail||api?.instruction()||'Abra o Nimbo em HTTPS.';progress.hidden=true;
  }else if(state==='applying'){
   status.textContent='Aplicando atualização…';detail.textContent='Reiniciando o sistema com a nova versão.';
  }
  installButton.hidden=Boolean(event.installed);
  root.querySelector('#pwa-offline-detail').textContent=event.supported?'Após abrir o Nimbo online uma vez e concluir o cache, esta instalação pode iniciar offline.':'Instalação e cache offline exigem HTTPS ou localhost; o HTML avulso funciona como prévia.';
 };
 const unsubscribe=api?.subscribe(paint)||(()=>{});
 const state=api?.current();if(state){paint({state:state.waiting?'ready':state.supported?'current':'unavailable',detail:api.instruction(),...state});}
 else {status.textContent='PWA indisponível nesta cópia';detail.textContent='Abra a versão hospedada para instalar e atualizar.';}
 checkButton.onclick=async()=>{
  if(busy||!api)return;busy=true;checkButton.disabled=true;status.textContent='Consultando versões…';progress.hidden=false;progress.removeAttribute('value');
  try{paint(await api.check());}finally{if(active){busy=false;checkButton.disabled=false;}}
 };
 applyButton.onclick=async()=>{
  if(!api)return;
  if(!confirm('Salvou as alterações abertas? O Nimbo será reiniciado para aplicar a versão nova.'))return;
  if(!await api.apply()) {status.textContent='Nenhuma atualização pronta';detail.textContent='Verifique novamente.';applyButton.hidden=true;}
 };
 installButton.onclick=async()=>{if(!api){detail.textContent='Abra o Nimbo por HTTPS para instalar.';return;}const result=await api.install();detail.textContent=result.message;};
 return{dispose(){active=false;unsubscribe();}};
}