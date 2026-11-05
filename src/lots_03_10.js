/* Nimbo OS 0.14-beta.4 | Lotes 03–10 | Ampliações locais incrementais.
   Sem rede, sem eval, sem bibliotecas de terceiros, sem alteração dos IDs existentes. */
const NIMBO_UPGRADE_RELEASE='0.14.0-beta.4';
const NIMBO_UPGRADE_KEY='nimbo-ops-v1';
function nuRead(){try{const o=JSON.parse(localStorage.getItem(NIMBO_UPGRADE_KEY)||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{};}catch{return {};}}
function nuGet(id,fallback={}){const x=nuRead()[id];return x===undefined?fallback:x;}
function nuSet(id,data){const o=nuRead();o[id]=data;const v=JSON.stringify(o);if(v.length>850000)throw Error('O armazenamento adicional passou de 850 KB. Exporte ou limpe os dados antigos.');localStorage.setItem(NIMBO_UPGRADE_KEY,v);}
function nuWrite(id,mutate){const old=nuGet(id,{}),next=JSON.parse(JSON.stringify(old));const result=mutate(next)||next;nuSet(id,result);return result;}
function nuEsc(s){return html(String(s==null?'':s));}
function nuDate(date){return String(date||'').slice(0,10);}
function nuToday(){const d=new Date(),shift=new Date(d.getTime()-d.getTimezoneOffset()*60000);return shift.toISOString().slice(0,10);}
function nuMoney(value){return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(value)||0);}
function nuNumber(value){const n=Number(String(value).replace(',','.'));if(!Number.isFinite(n))throw Error('Informe um número válido.');return n;}
function nuRows(id){try{const records=JSON.parse(localStorage.getItem('nimbo-suite-'+id)||'[]');return Array.isArray(records)?records.filter(r=>r&&typeof r==='object'&&!r.archived):[];}catch{return [];}}
function nuAllRows(id){try{const records=JSON.parse(localStorage.getItem('nimbo-suite-'+id)||'[]');return Array.isArray(records)?records.filter(r=>r&&typeof r==='object'):[];}catch{return [];}}
function nuDownload(ctx,name,data,type='text/plain'){ctx.download(name,data,type);}
function nuCSV(rows){return rows.map(row=>row.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\r\n');}
function nuPanel(root,ctx,title,body,handlers){const details=document.createElement('details');details.className='nu-pro';details.innerHTML='<summary>'+nuEsc(title)+'</summary><div class="nu-pro-body">'+body+'</div>';root.append(details);details.addEventListener('click',e=>{const button=e.target.closest('[data-nu]');if(!button||!details.contains(button))return;const action=handlers[button.dataset.nu];if(action)Promise.resolve().then(()=>action(details,button,e)).catch(ctx.error);});return details;}
const nuBtn=(key,label)=>'<button class="button quiet" type="button" data-nu="'+nuEsc(key)+'">'+nuEsc(label)+'</button>';
function nuWrap(id,install,added=[]){const app=applications[id];if(!app)throw Error('Aplicativo desconhecido: '+id);const previous=app.mount;app.mount=(root,ctx,payload)=>{const instance=previous(root,ctx,payload)||{};let clean;try{clean=install(root,ctx,instance)||null;}catch(err){ctx.error(err);}return {...instance,dispose(){if(typeof clean==='function')clean();instance.dispose?.();}};};if(added.length)app.features=[...new Set([...(app.features||[]),...added])];}
function nuCopy(text,ctx){return navigator.clipboard?.writeText(text).then(()=>ctx.toast('Copiado.')).catch(()=>nuDownload(ctx,'Nimbo_Copia.txt',text))||Promise.resolve(nuDownload(ctx,'Nimbo_Copia.txt',text));}
const nuCloseMenu='Os novos recursos utilizam os dados locais existentes. Sem sincronização com servidores.';

/* LOTE 03 — reprodução, leitura e utilitários. Os arquivos permanecem selecionados pelo usuário. */
for(const [id,media] of [['sound','audio'],['cinema','video']]){
 nuWrap(id,(root,ctx)=>{
  const player=root.querySelector(media);if(!player)return;
  const state=nuGet(id,{prefs:{rate:1,volume:.7},resume:{},marks:{}});
  if(!state.prefs)state.prefs={rate:1,volume:.7};if(!state.resume)state.resume={};if(!state.marks)state.marks={};
  player.playbackRate=Number(state.prefs.rate)||1;player.volume=Math.max(0,Math.min(1,Number(state.prefs.volume)??.7));
  const key=()=>root.querySelector('.media-status')?.textContent?.trim()||'';
  const valid=()=>{if(!player.src||!Number.isFinite(player.duration))throw Error('Selecione uma mídia carregada primeiro.');};
  const body='<p class="muted">Retomada e marcações por nome. Reabra o arquivo local ao reiniciar: o navegador não recebe acesso permanente ao seu disco.</p>'+nuBtn('bookmark','Marcar posição')+nuBtn('resume','Retomar posição salva')+nuBtn('markList','Ver marcações')+nuBtn('export','Exportar marcações')+nuBtn('clear','Limpar posições')+'<label>Marcador ou observação<input data-nu-field="note" maxlength="120" placeholder="Refrão, cena, anotação"></label>';
  nuPanel(root,ctx,(media==='audio'?'Som':'Cinema')+' · reprodução avançada',body,{
   bookmark(d){valid();const note=d.querySelector('[data-nu-field="note"]').value.trim();const name=key();const list=Array.isArray(state.marks[name])?state.marks[name]:[];list.push({sec:Math.round(player.currentTime*10)/10,note,at:Date.now()});state.marks[name]=list.slice(-80);nuSet(id,state);ctx.toast('Posição marcada.');},
   resume(){valid();const sec=Number(state.resume[key()]);if(!Number.isFinite(sec)||sec<0)throw Error('Sem posição registrada para esta mídia.');player.currentTime=Math.min(sec,Math.max(0,player.duration-0.1));},
   async markList(){valid();const rows=state.marks[key()]||[];if(!rows.length)throw Error('Nenhuma marcação nesta mídia.');const raw=await ctx.question({title:'Marcação para alcançar',description:rows.map((r,i)=>(i+1)+'. '+r.sec+'s · '+r.note).join('\n'),value:'1',confirm:'Ir'});if(!raw)return;const i=Number(raw)-1;if(!Number.isInteger(i)||i<0||i>=rows.length)throw Error('Número inválido.');player.currentTime=Math.min(rows[i].sec,player.duration);},
   export(){nuDownload(ctx,'Marcacoes_'+id+'.json',JSON.stringify({schema:1,type:id,marks:state.marks,resume:state.resume},null,2),'application/json');},
   async clear(){if(await ctx.question({title:'Limpar todas as posições salvas deste app?',confirm:'Limpar',danger:true})){state.marks={};state.resume={};nuSet(id,state);}}
  });
  let previousName='',savedAt=0;
  const tick=()=>{const name=key();if(name!==previousName){previousName=name;}if(name&&name!=='Fila vazia.'&&Number.isFinite(player.duration)&&player.duration>0&&Date.now()-savedAt>3500){savedAt=Date.now();state.resume[name]=Math.min(player.currentTime,player.duration);state.prefs={rate:player.playbackRate,volume:player.volume};const keys=Object.keys(state.resume);if(keys.length>150)delete state.resume[keys[0]];try{nuSet(id,state);}catch{}}};
  player.addEventListener('timeupdate',tick);player.addEventListener('ratechange',tick);player.addEventListener('volumechange',tick);
  return()=>{player.removeEventListener('timeupdate',tick);player.removeEventListener('ratechange',tick);player.removeEventListener('volumechange',tick);};
 },['Retomar reprodução de arquivo reaberto','Guardar posições de mídia','Anotar marcações','Navegar para marcação','Exportar marcações e retomada','Preferência persistente de volume/velocidade']);
}
nuWrap('pdf-viewer',(root,ctx)=>{
 const page=root.querySelector('#pdf-page'),status=root.querySelector('.pdf-status');let state=nuGet('pdf-viewer',{notes:{},last:{}});if(!state.notes)state.notes={};if(!state.last)state.last={};
 const file=()=>{const t=status?.textContent||'';const i=t.indexOf(' · Página ');return i>=0?t.slice(0,i):null;};
 const where=()=>{const filename=file();if(!filename)throw Error('Abra um PDF antes.');return{filename,page:Math.max(1,Math.floor(Number(page.value)||1))};};
 const body='<p class="muted">Anotações e leitura salvas pelo nome do PDF. Nenhum comentário é inserido no arquivo original.</p><label>Nota da página<textarea data-nu-field="annotation" rows="3" maxlength="1200" placeholder="Escreva sua anotação…"></textarea></label>'+nuBtn('save','Guardar nota')+nuBtn('read','Consultar nota')+nuBtn('resume','Retomar leitura')+nuBtn('export','Exportar notas')+nuBtn('clear','Limpar notas deste PDF');
 const panel=nuPanel(root,ctx,'PDF · caderno de leitura',body,{
  save(d){const at=where(),k=at.filename+'#'+at.page,txt=d.querySelector('textarea').value.trim();if(!txt)throw Error('Digite uma nota.');state.notes[k]=txt;state.last[at.filename]=at.page;nuSet('pdf-viewer',state);ctx.toast('Nota guardada.');},
  read(d){const at=where();d.querySelector('textarea').value=state.notes[at.filename+'#'+at.page]||'';},
  resume(){const at=where(),value=state.last[at.filename];if(!value)throw Error('Nenhuma página anterior registrada.');page.value=value;page.dispatchEvent(new Event('change',{bubbles:true}));},
  export(){const at=where(),rows=Object.entries(state.notes).filter(([k])=>k.startsWith(at.filename+'#'));nuDownload(ctx,'Notas_PDF.json',JSON.stringify({file:at.filename,notes:rows.map(([key,text])=>({page:Number(key.split('#').pop()),text}))},null,2),'application/json');},
  async clear(){const at=where();if(await ctx.question({title:'Limpar as notas deste PDF?',danger:true,confirm:'Limpar'})){for(const k of Object.keys(state.notes))if(k.startsWith(at.filename+'#'))delete state.notes[k];delete state.last[at.filename];nuSet('pdf-viewer',state);}}
 });
 const savePosition=()=>{try{const at=where();state.last[at.filename]=at.page;nuSet('pdf-viewer',state);}catch{}};
 page.addEventListener('change',savePosition);return()=>page.removeEventListener('change',savePosition);
},['Notas por página','Retomar última página','Exportar caderno de leitura','Limpar notas por documento']);
nuWrap('browser',(root,ctx)=>{
 let state=nuGet('browser',{tabs:[],active:0});if(!Array.isArray(state.tabs))state.tabs=[];
 const input=root.querySelector('#browser-address'),form=root.querySelector('form');
 const nav=url=>{if(!/^https?:\/\//i.test(url))throw Error('Aba requer http ou https.');input.value=url;form.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));};
 const body='<p class="muted">Sessões por endereços: a aba ativa usa o iframe do Horizonte. Sites podem bloquear incorporação.</p><div class="nu-tab-list" aria-label="Abas salvas"></div>'+nuBtn('add','Nova aba com URL atual')+nuBtn('switch','Trocar aba')+nuBtn('rename','Renomear aba')+nuBtn('close','Fechar aba')+nuBtn('export','Exportar sessão')+'<p class="muted">Por segurança, páginas não têm acesso aos arquivos locais do Nimbo.</p>';
 const panel=nuPanel(root,ctx,'Horizonte · sessões e abas',body,{
  add(){if(state.tabs.length>=20)throw Error('Limite de 20 abas.');const url=new URL(input.value).href;if(!/^https?:/.test(url))throw Error('URL não permitida.');state.tabs.push({url,title:new URL(url).hostname});state.active=state.tabs.length-1;draw();},
  async switch(){if(!state.tabs.length)throw Error('Não há abas.');const value=await ctx.question({title:'Número da aba',description:state.tabs.map((t,i)=>(i+1)+' · '+t.title).join('\n'),value:String(state.active+1),confirm:'Abrir'});if(!value)return;const i=Number(value)-1;if(!Number.isInteger(i)||i<0||i>=state.tabs.length)throw Error('Número inválido.');state.active=i;nav(state.tabs[i].url);draw();},
  async rename(){const t=state.tabs[state.active];if(!t)throw Error('Não há aba selecionada.');const title=await ctx.question({title:'Nome da aba',value:t.title,confirm:'Salvar'});if(title){t.title=title.slice(0,80);draw();}},
  close(){if(!state.tabs.length)throw Error('Nenhuma aba.');state.tabs.splice(state.active,1);state.active=Math.max(0,state.active-1);if(state.tabs.length)nav(state.tabs[state.active].url);draw();},
  export(){nuDownload(ctx,'Sessao_Horizonte.json',JSON.stringify(state,null,2),'application/json');}
 });
 function draw(){const node=panel.querySelector('.nu-tab-list');node.textContent=state.tabs.length?state.tabs.map((t,i)=>(i===state.active?'● ':'○ ')+(i+1)+'. '+t.title).join(' · '):'Nenhuma aba';nuSet('browser',state);}
 input.addEventListener('change',()=>{const t=state.tabs[state.active];if(t&&/^https?:\/\//i.test(input.value)){t.url=input.value;draw();}});draw();
},['Sessões salvas por endereço','Trocar abas virtuais','Renomear aba','Fechar aba','Exportar sessão']);
nuWrap('converter',(root,ctx)=>{
 const groups={
  Energia:{J:1,kJ:1000,cal:4.184,kcal:4184,Wh:3600,kWh:3600000},
  Pressão:{Pa:1,kPa:1000,bar:100000,psi:6894.757293178,atm:101325,mmHg:133.322387415},
  Frequência:{Hz:1,kHz:1000,MHz:1000000,rpm:1/60},
  Ângulo:{rad:1,grau:Math.PI/180,volta:2*Math.PI},
  Consumo:{'L/100km':1,'km/L':1}
 };
 const panel=nuPanel(root,ctx,'Conversor · engenharia e ciência', '<div class="nu-grid"><label>Categoria<select data-nu-field="cat">'+Object.keys(groups).map(x=>'<option>'+x+'</option>').join('')+'</select></label><label>Valor<input data-nu-field="value" type="number" step="any" value="1"></label><label>De<select data-nu-field="from"></select></label><label>Para<select data-nu-field="to"></select></label></div>'+nuBtn('convert','Converter')+nuBtn('swap','Inverter')+nuBtn('copy','Copiar')+'<output class="nu-result" aria-live="polite"></output>',{
  convert(d){const cat=d.querySelector('[data-nu-field="cat"]').value,from=d.querySelector('[data-nu-field="from"]').value,to=d.querySelector('[data-nu-field="to"]').value,value=nuNumber(d.querySelector('[data-nu-field="value"]').value);if(cat==='Consumo'&&value<=0)throw Error('Consumo deve ser positivo.');const result=cat==='Consumo'?100/value:value*groups[cat][from]/groups[cat][to];if(!Number.isFinite(result))throw Error('Resultado fora do intervalo numérico.');d.querySelector('output').textContent=new Intl.NumberFormat('pt-BR',{maximumSignificantDigits:12}).format(result)+' '+to;},
  swap(d){const a=d.querySelector('[data-nu-field="from"]'),b=d.querySelector('[data-nu-field="to"]');[a.value,b.value]=[b.value,a.value];},
  copy(d){return nuCopy(d.querySelector('output').textContent,ctx);}
 });
 const cat=panel.querySelector('[data-nu-field="cat"]');function opts(){const names=Object.keys(groups[cat.value]);for(const [sel,index]of [['from',0],['to',1]]){const node=panel.querySelector('[data-nu-field="'+sel+'"]');node.innerHTML=names.map(x=>'<option>'+nuEsc(x)+'</option>').join('');node.value=names[index]||names[0];}}cat.addEventListener('change',opts);opts();
},['Energia e potência energética','Conversão de pressão','Conversão de frequência','Conversão angular','Consumo de combustível','Inversão de medidas adicionais']);

/* LOTES 04–06 — recursos derivados dos cadastros já guardados pelo motor Suite.
   Relatórios são só leitura; as revisões de estudo e check-ins usam dados auxiliares. */
const NU_RECORD_APPS=[
 ['contacts','Contatos'],['budget','Finanças pessoais'],['habits','Hábitos'],['kanban','Projetos'],
 ['shopping','Lista de compras'],['journal','Diário'],['flashcards','Cartões de estudo'],['bookmarks','Favoritos'],['reading','Lista de leitura'],
 ['recipes','Receitas'],['inventory','Inventário pessoal'],['goals','Metas'],['planner','Planejador semanal'],['snippets','Trechos de código']
];
function nuRecordSummary(id){const rows=nuRows(id),arch=nuAllRows(id).filter(r=>r.archived).length,categories={};for(const r of rows){const k=r.tag||'Sem categoria';categories[k]=(categories[k]||0)+1;}return{active:rows.length,archived:arch,done:rows.filter(r=>r.done).length,categories};}
function nuRecordDetails(id,rows){return rows.map(r=>[r.title,r.tag||'',r.done?'Concluído':'Pendente',r.updated||'',r.notes||'']).slice(0,501);}
function nuPick(rows,d){const key=d.querySelector('[data-nu-field="record"]')?.value;const record=rows.find(r=>String(r.key)===key);if(!record)throw Error('Escolha um registro.');return record;}
function nuDateParts(v){const x=nuDate(v);return /^\d{4}-\d\d-\d\d$/.test(x)?x:null;}
function nuDaysBetween(a,b){return Math.round((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/86400000);}
function nuEscapeVC(s){return String(s||'').replaceAll('\\','\\\\').replace(/\r?\n/g,'\\n').replaceAll(',','\\,').replaceAll(';','\\;');}
for(const [id,title] of NU_RECORD_APPS){
 nuWrap(id,(root,ctx)=>{
  const rows=nuRows(id);
  const body='<p class="muted">Relatórios locais de '+nuEsc(title)+'. As alterações e arquivos existentes permanecem no mesmo formato.</p><div class="nu-report" aria-live="polite"></div>'+nuBtn('refresh','Resumo atualizado')+nuBtn('export','Exportar registros ativos CSV')+nuBtn('duplicates','Detectar títulos repetidos')+nuBtn('category','Resumo por categoria');
  const panel=nuPanel(root,ctx,title+' · análises e produtividade',body,{
   refresh(d){const sum=nuRecordSummary(id);d.querySelector('.nu-report').textContent=sum.active+' ativos · '+sum.archived+' arquivados · '+sum.done+' concluídos';},
   export(){const rows=nuRows(id);nuDownload(ctx,'Nimbo_'+id+'_ativos.csv',nuCSV([['Título','Categoria','Estado','Atualização','Notas'],...nuRecordDetails(id,rows)]),'text/csv');},
   duplicates(d){const seen=new Set(),duplicates=[];for(const r of nuRows(id)){const label=(r.title||'').trim().toLocaleLowerCase('pt-BR');if(seen.has(label))duplicates.push(r.title);seen.add(label);}d.querySelector('.nu-report').textContent=duplicates.length?duplicates.slice(0,40).join(' · '):'Sem títulos duplicados.';},
   category(d){const x=nuRecordSummary(id).categories;d.querySelector('.nu-report').textContent=Object.entries(x).sort((a,b)=>b[1]-a[1]).map(([name,n])=>name+': '+n).join(' · ')||'Sem registros.';}
  });
  return null;
 },['Painel analítico dos registros','Exportação CSV dos registros ativos','Detecção de duplicatas','Resumo por categoria']);
}
function nuRecordTools(id,body,handlers,features){nuWrap(id,(root,ctx)=>{const mapped=Object.fromEntries(Object.entries(handlers).map(([name,fn])=>[name,(panel,button,event)=>fn(panel,button,event,ctx)]));return nuPanel(root,ctx,applications[id].title+' · operações específicas',body,mapped);},features);}
nuRecordTools('contacts',nuBtn('vcard','Exportar vCard 3.0')+nuBtn('birthdays','Próximos aniversários')+nuBtn('check','Validar emails'),{
 vcard(d,b,e,ctx){const rows=nuRows('contacts');if(!rows.length)throw Error('Sem contatos.');const lines=rows.map(r=>['BEGIN:VCARD','VERSION:3.0','FN:'+nuEscapeVC(r.title),r.email?'EMAIL:'+nuEscapeVC(r.email):'',r.phone?'TEL:'+nuEscapeVC(r.phone):'',r.company?'ORG:'+nuEscapeVC(r.company):'',r.birthday?'BDAY:'+nuEscapeVC(r.birthday):'',r.notes?'NOTE:'+nuEscapeVC(r.notes):'','END:VCARD'].filter(Boolean).join('\r\n'));nuDownload(ctx,'Contatos_Nimbo.vcf',lines.join('\r\n'),'text/vcard');},
 birthdays(d){const now=new Date(),year=now.getFullYear(),upcoming=nuRows('contacts').map(r=>{if(!/^\d{4}-\d\d-\d\d$/.test(r.birthday||''))return null;const parts=r.birthday.split('-'),next=new Date(year,Number(parts[1])-1,Number(parts[2]));if(next<new Date(year,now.getMonth(),now.getDate()))next.setFullYear(year+1);return{name:r.title,day:Math.round((next-new Date(year,now.getMonth(),now.getDate()))/86400000)};}).filter(Boolean).sort((a,b)=>a.day-b.day).slice(0,15);d.insertAdjacentHTML('beforeend','<p class="nu-result">'+nuEsc(upcoming.map(x=>x.name+' em '+x.day+' dia(s)').join(' · ')||'Nenhum aniversário cadastrado.')+'</p>');},
 check(d){const invalid=nuRows('contacts').filter(r=>r.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email));d.insertAdjacentHTML('beforeend','<p class="nu-result">'+nuEsc(invalid.length?invalid.map(r=>r.title).join(' · '):'Emails sintaticamente válidos.')+'</p>');}
},['Exportar vCard real','Aniversários próximos','Validação de emails']);
nuRecordTools('budget',nuBtn('monthly','Fluxo dos últimos 12 meses')+nuBtn('category','Despesas por categoria')+nuBtn('export','Exportar balanço CSV'),{
 monthly(d){const rows=nuRows('budget'),months=new Map();for(const r of rows){const date=nuDateParts(r.date);if(!date)continue;const m=date.slice(0,7),v=Number(r.value);if(!Number.isFinite(v))continue;const z=months.get(m)||{incoming:0,outgoing:0};z[r.type==='Despesa'?'outgoing':'incoming']+=v;months.set(m,z);}const ordered=[...months].sort((a,b)=>a[0].localeCompare(b[0])).slice(-12);d.insertAdjacentHTML('beforeend','<p class="nu-result">'+nuEsc(ordered.map(([m,x])=>m+': '+nuMoney(x.incoming-x.outgoing)).join(' · ')||'Não há lançamentos datados.')+'</p>');},
 category(d){const r=nuRows('budget').filter(r=>r.type==='Despesa'),by={};for(const x of r)by[x.tag||'Outros']=(by[x.tag||'Outros']||0)+Math.max(0,Number(x.value)||0);d.insertAdjacentHTML('beforeend','<p class="nu-result">'+nuEsc(Object.entries(by).sort((a,b)=>b[1]-a[1]).map(([a,b])=>a+': '+nuMoney(b)).join(' · ')||'Não há despesas.')+'</p>');},
 export(d){const rows=nuRows('budget'),by=new Map();for(const r of rows){const m=nuDateParts(r.date)?.slice(0,7);if(!m)continue;const x=by.get(m)||{r:0,d:0};const n=Number(r.value);if(Number.isFinite(n))x[r.type==='Despesa'?'d':'r']+=n;by.set(m,x);}const output=nuCSV([['Mês','Receitas','Despesas','Saldo'],...[...by].sort().map(([m,x])=>[m,x.r.toFixed(2),x.d.toFixed(2),(x.r-x.d).toFixed(2)])]);const anchor=document.createElement('a');const url=URL.createObjectURL(new Blob([output],{type:'text/csv'}));anchor.href=url;anchor.download='Balanco_Nimbo.csv';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
},['Fluxo de caixa mensal','Despesas por categoria','Exportar balanço']);
nuRecordTools('habits','<label>Hábito<select data-nu-field="record"></select></label>'+nuBtn('check','Registrar prática hoje')+nuBtn('week','Conferir últimos 7 dias')+nuBtn('streak','Consultar sequência'),{
 check(d){const row=nuPick(nuRows('habits'),d),state=nuGet('habits-progress',{}),list=Array.isArray(state[row.key])?state[row.key]:[];if(!list.includes(nuToday()))list.push(nuToday());state[row.key]=list.slice(-366);nuSet('habits-progress',state);},
 week(d){const row=nuPick(nuRows('habits'),d),list=nuGet('habits-progress',{})[row.key]||[],days=[...Array(7)].map((_,i)=>{const z=new Date();z.setDate(z.getDate()-i);return nuDate(new Date(z.getTime()-z.getTimezoneOffset()*60000).toISOString());});d.insertAdjacentHTML('beforeend','<p class="nu-result">'+nuEsc(days.filter(day=>list.includes(day)).length+'/7 dias praticados')+'</p>');},
 streak(d){const row=nuPick(nuRows('habits'),d),done=new Set(nuGet('habits-progress',{})[row.key]||[]);let n=0,t=new Date();while(n<366){const day=nuDate(new Date(t.getTime()-t.getTimezoneOffset()*60000).toISOString());if(!done.has(day))break;n++;t.setDate(t.getDate()-1);}d.insertAdjacentHTML('beforeend','<p class="nu-result">'+nuEsc(n+' dia(s) seguidos até hoje.')+'</p>');}
},['Prática diária registrada','Histórico semanal','Sequência de hábitos']);
nuRecordTools('kanban',nuBtn('board','Quadro por etapa')+nuBtn('overdue','Prazos atrasados')+nuBtn('priority','Mapa de prioridades'),{
 board(d){const by={};for(const r of nuRows('kanban'))(by[r.stage||'Sem etapa']??=[]).push(r.title);d.insertAdjacentHTML('beforeend','<p class="nu-result">'+nuEsc(Object.entries(by).map(([a,b])=>a+': '+b.join(', ')).join(' | ')||'Sem projetos')+'</p>');},
 overdue(d){const today=nuToday(),rows=nuRows('kanban').filter(r=>nuDateParts(r.date)&&r.date<today&&r.stage!=='Concluído'&&!r.done);d.insertAdjacentHTML('beforeend','<p class="nu-result">'+nuEsc(rows.map(r=>r.title+' ('+r.date+')').join(' · ')||'Nenhum prazo vencido')+'</p>');},
 priority(d){const by={};for(const r of nuRows('kanban'))by[r.priority||'Normal']=(by[r.priority||'Normal']||0)+1;d.insertAdjacentHTML('beforeend','<p class="nu-result">'+nuEsc(Object.entries(by).map(([a,n])=>a+': '+n).join(' · '))+'</p>');}
},['Quadro por etapa','Detecção de prazos vencidos','Mapa de prioridades']);
nuRecordTools('shopping',nuBtn('pending','Estimativa do que falta comprar')+nuBtn('list','Exportar checklist TXT')+nuBtn('categories','Despesas por categoria'),{
 pending(d){const rs=nuRows('shopping').filter(r=>!r.done);const total=rs.reduce((v,r)=>v+(Number(r.value)||0)*(Number(r.quantity)||0),0);d.insertAdjacentHTML('beforeend','<p class="nu-result">'+nuEsc(rs.length+' itens · '+nuMoney(total))+'</p>');},
 list(d){const rows=nuRows('shopping');const blob=rows.map(r=>(r.done?'[x] ':'[ ] ')+r.title+' · '+(r.quantity||1)+' '+(r.unit||'un')).join('\n');const a=document.createElement('a'),url=URL.createObjectURL(new Blob([blob],{type:'text/plain'}));a.href=url;a.download='Lista_compras.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},
 categories(d){const by={};for(const r of nuRows('shopping'))by[r.tag||'Outros']=(by[r.tag||'Outros']||0)+(Number(r.value)||0)*(Number(r.quantity)||0);d.insertAdjacentHTML('beforeend','<p class="nu-result">'+nuEsc(Object.entries(by).map(([a,v])=>a+': '+nuMoney(v)).join(' · '))+'</p>');}
},['Estimativa de compras pendentes','Checklist TXT','Totalização por categoria']);
nuRecordTools('journal',nuBtn('month','Contar registros por mês')+nuBtn('mood','Distribuição de humor')+nuBtn('wordcount','Volume de escrita'),{
 month(d){const by={};for(const r of nuRows('journal')){const k=nuDateParts(r.date)?.slice(0,7)||'Sem data';by[k]=(by[k]||0)+1;}d.insertAdjacentHTML('beforeend','<p class="nu-result">'+nuEsc(Object.entries(by).sort().map(([k,n])=>k+': '+n).join(' · '))+'</p>');},
 mood(d){const by={};for(const r of nuRows('journal'))by[r.mood||'Não informado']=(by[r.mood||'Não informado']||0)+1;d.insertAdjacentHTML('beforeend','<p class="nu-result">'+nuEsc(Object.entries(by).map(([k,n])=>k+': '+n).join(' · '))+'</p>');},
 wordcount(d){const n=nuRows('journal').reduce((a,r)=>a+(r.notes||'').trim().split(/\s+/).filter(Boolean).length,0);d.insertAdjacentHTML('beforeend','<p class="nu-result">'+nuEsc(n+' palavras em notas')+'</p>');}
},['Atividade mensal','Distribuição de humor','Volume da escrita']);
nuRecordTools('flashcards','<label>Cartão<select data-nu-field="record"></select></label>'+nuBtn('reveal','Revelar resposta')+nuBtn('again','Revisar novamente')+nuBtn('good','Acertei')+nuBtn('easy','Muito fácil')+nuBtn('due','Revisões previstas'),{
 reveal(d){const r=nuPick(nuRows('flashcards'),d);d.insertAdjacentHTML('beforeend','<p class="nu-result">'+nuEsc(r.answer||'Sem resposta')+'</p>');},
 again(d){nuFlashGrade(d,1);},good(d){nuFlashGrade(d,4);},easy(d){nuFlashGrade(d,5);},
 due(d){const r=nuRows('flashcards'),records=nuGet('flashcards-review',{}),n=r.filter(x=>!records[x.key]||records[x.key].due<=nuToday()).length;d.insertAdjacentHTML('beforeend','<p class="nu-result">'+nuEsc(n+' cartões previstos para hoje ou pendentes')+'</p>');}
},['Revisão ativa de cartões','Repetição espaçada SM-2','Exibir resposta','Revisões pendentes']);
function nuFlashGrade(panel,q){const row=nuPick(nuRows('flashcards'),panel),all=nuGet('flashcards-review',{}),s=all[row.key]||{interval:0,repetitions:0,ease:2.5};if(q<3){s.repetitions=0;s.interval=1;}else{s.interval=s.repetitions===0?1:s.repetitions===1?6:Math.round(s.interval*s.ease);s.repetitions++;}s.ease=Math.max(1.3,s.ease+.1-(5-q)*(.08+(5-q)*.02));const due=new Date();due.setDate(due.getDate()+s.interval);s.due=nuDate(new Date(due.getTime()-due.getTimezoneOffset()*60000).toISOString());all[row.key]=s;nuSet('flashcards-review',all);panel.insertAdjacentHTML('beforeend','<p class="nu-result">'+nuEsc('Próxima revisão: '+s.due+' · intervalo '+s.interval+'d')+'</p>');}
nuRecordTools('bookmarks',nuBtn('hosts','Organizar por domínio')+nuBtn('invalid','Encontrar URLs inválidas')+nuBtn('export','Exportar Netscape HTML'),{
 hosts(d){const by={};for(const r of nuRows('bookmarks'))try{const host=new URL(r.url).hostname;by[host]=(by[host]||0)+1;}catch{}d.insertAdjacentHTML('beforeend','<p class="nu-result">'+nuEsc(Object.entries(by).sort((a,b)=>b[1]-a[1]).map(([k,n])=>k+': '+n).join(' · ')||'Nenhum domínio')+'</p>');},
 invalid(d){const invalid=nuRows('bookmarks').filter(r=>{try{return !/^https?:$/.test(new URL(r.url).protocol);}catch{return true;}});d.insertAdjacentHTML('beforeend','<p class="nu-result">'+nuEsc(invalid.length?invalid.map(r=>r.title).join(' · '):'URLs sintaticamente válidas. Isto não verifica conectividade.')+'</p>');},
 export(d){const rows=nuRows('bookmarks').filter(r=>{try{return ['https:','http:'].includes(new URL(r.url).protocol);}catch{return false;}});const escaped=t=>String(t).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');const text='<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n<DL><p>\n'+rows.map(r=>'<DT><A HREF="'+escaped(r.url)+'">'+escaped(r.title)+'</A>').join('\n')+'\n</DL><p>';const url=URL.createObjectURL(new Blob([text],{type:'text/html'}));const a=document.createElement('a');a.href=url;a.download='Favoritos_Nimbo.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
},['Distribuição de domínios','Verificação sintática de URL','Exportar HTML Netscape']);
nuRecordTools('reading',nuBtn('progress','Percentual de leitura')+nuBtn('remaining','Páginas restantes')+nuBtn('rank','Ranking de leituras'),{
 progress(d){const rows=nuRows('reading');d.insertAdjacentHTML('beforeend','<p class="nu-result">'+nuEsc(rows.map(r=>{const t=Number(r.total),p=Number(r.pages);return r.title+': '+(t>0?Math.min(100,Math.max(0,p/t*100)).toFixed(0)+'%':'sem total')}).join(' · '))+'</p>');},
 remaining(d){const sum=nuRows('reading').reduce((s,r)=>s+Math.max(0,(Number(r.total)||0)-(Number(r.pages)||0)),0);d.insertAdjacentHTML('beforeend','<p class="nu-result">'+nuEsc(sum+' páginas restantes')+'</p>');},
 rank(d){const r=nuRows('reading').filter(x=>Number(x.total)>0).sort((a,b)=>(Number(b.pages)/Number(b.total))-(Number(a.pages)/Number(a.total))).slice(0,10);d.insertAdjacentHTML('beforeend','<p class="nu-result">'+nuEsc(r.map(x=>x.title).join(' · '))+'</p>');}
},['Progresso percentual','Páginas restantes','Ranking por progresso']);
nuRecordTools('recipes','<label>Receita<select data-nu-field="record"></select></label><label>Multiplicador de porções<input data-nu-field="factor" type="number" value="2" min="0.1" max="100" step="0.1"></label>'+nuBtn('scale','Escalar ingredientes')+nuBtn('duration','Tempo total de preparo')+nuBtn('shopping','Extrair lista de ingredientes'),{
 scale(d){const r=nuPick(nuRows('recipes'),d),factor=nuNumber(d.querySelector('[data-nu-field="factor"]').value);if(factor<=0||factor>100)throw Error('Multiplicador fora do intervalo.');const text=String(r.ingredients||'').split('\n').map(line=>line.replace(/^\s*(\d+(?:[.,]\d+)?)/,(_,num)=>String(Number(num.replace(',','.'))*factor))).join('\n');d.insertAdjacentHTML('beforeend','<pre class="nu-result">'+nuEsc(text)+'</pre>');},
 duration(d){const rows=nuRows('recipes'),sum=rows.reduce((x,r)=>x+Math.max(0,Number(r.minutes)||0),0);d.insertAdjacentHTML('beforeend','<p class="nu-result">'+nuEsc(sum+' minutos somados nas receitas cadastradas')+'</p>');},
 shopping(d){const r=nuPick(nuRows('recipes'),d);const lines=String(r.ingredients||'').split(/\r?\n/).filter(Boolean).map(x=>'[ ] '+x);const url=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain'})),a=document.createElement('a');a.href=url;a.download='Ingredientes.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
},['Escalonar ingredientes numéricos','Tempo total catalogado','Exportar ingredientes']);
nuRecordTools('inventory',nuBtn('total','Valor de reposição')+nuBtn('low','Identificar estoque baixo')+nuBtn('where','Resumo por localização'),{
 total(d){const sum=nuRows('inventory').reduce((a,r)=>a+(Number(r.quantity)||0)*(Number(r.value)||0),0);d.insertAdjacentHTML('beforeend','<p class="nu-result">'+nuEsc(nuMoney(sum))+'</p>');},
 low(d){const low=nuRows('inventory').filter(r=>Number(r.quantity)<=1);d.insertAdjacentHTML('beforeend','<p class="nu-result">'+nuEsc(low.map(r=>r.title).join(' · ')||'Nenhum item com quantidade até 1')+'</p>');},
 where(d){const by={};for(const r of nuRows('inventory')){const k=r.location||'Sem localização';by[k]=(by[k]||0)+(Number(r.quantity)||0);}d.insertAdjacentHTML('beforeend','<p class="nu-result">'+nuEsc(Object.entries(by).map(([a,n])=>a+': '+n).join(' · '))+'</p>');}
},['Valor total do inventário','Alerta de baixo estoque','Quantidades por local']);
nuRecordTools('goals',nuBtn('percent','Progresso das metas')+nuBtn('due','Vencimento próximo')+nuBtn('complete','Metas atingidas'),{
 percent(d){const rows=nuRows('goals');d.insertAdjacentHTML('beforeend','<p class="nu-result">'+nuEsc(rows.map(r=>r.title+': '+(Number(r.target)>0?(Math.max(0,Number(r.progress)||0)/Number(r.target)*100).toFixed(0)+'%':'sem alvo')).join(' · '))+'</p>');},
 due(d){const today=nuToday(),rows=nuRows('goals').filter(r=>nuDateParts(r.date)&&nuDaysBetween(today,nuDate(r.date))<=14&&!r.done);d.insertAdjacentHTML('beforeend','<p class="nu-result">'+nuEsc(rows.map(r=>r.title+' · '+r.date).join(' · ')||'Nenhuma meta no período')+'</p>');},
 complete(d){const rows=nuRows('goals').filter(r=>Number(r.target)>0&&Number(r.progress)>=Number(r.target));d.insertAdjacentHTML('beforeend','<p class="nu-result">'+nuEsc(rows.map(r=>r.title).join(' · ')||'Nenhuma meta atingida por valor registrado')+'</p>');}
},['Percentuais de metas','Avisos de vencimento','Detecção de alvo alcançado']);
nuRecordTools('planner',nuBtn('week','Agenda dos próximos 7 dias')+nuBtn('conflicts','Conflitos de horários')+nuBtn('ics','Exportar planejamento ICS'),{
 week(d){const today=nuToday(),rows=nuRows('planner').filter(r=>nuDateParts(r.date)&&nuDaysBetween(today,nuDate(r.date))>=0&&nuDaysBetween(today,nuDate(r.date))<=7).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));d.insertAdjacentHTML('beforeend','<p class="nu-result">'+nuEsc(rows.map(r=>r.date+' '+r.time+' '+r.title).join(' · ')||'Sem atividades na semana')+'</p>');},
 conflicts(d){const rows=nuRows('planner').filter(r=>nuDateParts(r.date)&&/^\d\d:\d\d$/.test(r.time||'')),conflicts=[];for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){const a=rows[i],b=rows[j];if(a.date!==b.date)continue;const min=t=>Number(t.slice(0,2))*60+Number(t.slice(3));const ast=min(a.time),bst=min(b.time);if(ast<bst+(Number(b.duration)||0)&&bst<ast+(Number(a.duration)||0))conflicts.push(a.title+' × '+b.title);}d.insertAdjacentHTML('beforeend','<p class="nu-result">'+nuEsc(conflicts.slice(0,30).join(' · ')||'Nenhum conflito detectado')+'</p>');},
 ics(d){const rows=nuRows('planner').filter(r=>nuDateParts(r.date)&&/^\d\d:\d\d$/.test(r.time||''));const out=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Nimbo//Planner//PT'];for(const r of rows){const start=new Date(r.date+'T'+r.time+':00'),end=new Date(start.getTime()+Math.max(1,Number(r.duration)||30)*60000),dt=x=>x.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');out.push('BEGIN:VEVENT','UID:'+nuEscapeVC(r.key)+'@nimbo.local','DTSTAMP:'+dt(new Date()),'DTSTART:'+dt(start),'DTEND:'+dt(end),'SUMMARY:'+nuEscapeVC(r.title),'END:VEVENT');}out.push('END:VCALENDAR');const a=document.createElement('a'),url=URL.createObjectURL(new Blob([out.join('\r\n')],{type:'text/calendar'}));a.href=url;a.download='Planejamento_Nimbo.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
},['Agenda semanal','Conflitos entre eventos','Exportação ICS']);
nuRecordTools('snippets','<label>Trecho<select data-nu-field="record"></select></label>'+nuBtn('copy','Copiar código')+nuBtn('languages','Distribuição por linguagem')+nuBtn('export','Exportar texto com comentários'),{
 copy(d){return nuCopy(nuPick(nuRows('snippets'),d).code||'',{toast:()=>{}});},
 languages(d){const by={};for(const r of nuRows('snippets'))by[r.language||'Indefinida']=(by[r.language||'Indefinida']||0)+1;d.insertAdjacentHTML('beforeend','<p class="nu-result">'+nuEsc(Object.entries(by).map(([a,n])=>a+': '+n).join(' · '))+'</p>');},
 export(d){const r=nuPick(nuRows('snippets'),d),text='/* '+r.title.replaceAll('*/','')+' */\n'+(r.code||'');const a=document.createElement('a'),url=URL.createObjectURL(new Blob([text],{type:'text/plain'}));a.href=url;a.download='Trecho_Nimbo.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
},['Copiar trecho isolado','Relatório por linguagem','Exportar código inerte']);
/* Popula a seleção de registros no momento da abertura, sem exigir remontagem. */
for(const [id] of NU_RECORD_APPS){const app=applications[id],prev=app.mount;app.mount=(root,ctx,payload)=>{const obj=prev(root,ctx,payload)||{};const selects=[...root.querySelectorAll('.nu-pro [data-nu-field="record"]')];for(const select of selects){const fill=()=>{const saved=select.value;const rows=nuRows(id);select.innerHTML='<option value="">Selecione…</option>'+rows.map(r=>'<option value="'+nuEsc(r.key)+'">'+nuEsc(r.title)+'</option>').join('');if(rows.some(r=>String(r.key)===saved))select.value=saved;else if(rows.length)select.value=String(rows[0].key);};select.closest('details')?.addEventListener('toggle',e=>{if(e.target.open)fill();});fill();}return obj;};}
/* LOTE 04 — Cronômetro: análise de estabilidade da sessão salva; sem substituir relógio monotônico. */
nuWrap('stopwatch',(root,ctx)=>nuPanel(root,ctx,'Cronômetro · performance','<p class="muted">Análise das voltas guardadas pela medição anterior.</p>'+nuBtn('cv','Regularidade das voltas')+nuBtn('export','Exportar resumo'),{
 cv(d){const s=JSON.parse(localStorage.getItem('nimbo-stopwatch')||'{}'),laps=(s.laps||[]).map(x=>Number(x.duration)).filter(x=>Number.isFinite(x)&&x>0);if(!laps.length)throw Error('Registre voltas para analisar.');const mean=laps.reduce((a,b)=>a+b,0)/laps.length,sd=Math.sqrt(laps.reduce((n,v)=>n+(v-mean)**2,0)/laps.length),cv=mean?sd/mean*100:0;d.insertAdjacentHTML('beforeend','<p class="nu-result">'+nuEsc('Voltas: '+laps.length+' · CV: '+cv.toFixed(1)+'% · média: '+(mean/1000).toFixed(2)+'s')+'</p>');},
 export(d){const s=JSON.parse(localStorage.getItem('nimbo-stopwatch')||'{}');nuDownload(ctx,'Cronometro_Analise.json',JSON.stringify({schema:1,laps:s.laps||[]},null,2),'application/json');}
}),['Coeficiente de variação das voltas','Exportação de análise JSON']);

/* LOTES 07–08 e parte do 09 — novas operações nativas dos motores textuais.
   Todos os resultados passam pelo limite de 1 MB e pela proteção contra HTML já presentes no app. */
function nuOperation(id,label,fn){const spec=textSpecs.find(s=>s.id===id);if(!spec)throw Error('Motor não localizado: '+id);if(!spec.ops.some(op=>op[0]===label))spec.ops.push([label,fn]);applications[id].features=[...new Set([...(applications[id].features||[]),label])];}
function nuFreq(text,max=20){const map=new Map();for(const raw of text.toLocaleLowerCase('pt-BR').match(/[\p{L}\p{N}]{3,}/gu)||[]){map.set(raw,(map.get(raw)||0)+1);}return [...map.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,max);}
nuOperation('markdown','Gerar sumário Markdown',s=>s.split(/\r?\n/).filter(x=>/^#{1,6}\s+/.test(x)).map(line=>{const [,hashes,heading]=line.match(/^(#{1,6})\s+(.+)/)||[];return '  '.repeat(Math.max(0,hashes.length-1))+'- ['+heading+'](#'+heading.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\w\s-]/g,'').trim().replace(/\s+/g,'-')+')';}).join('\n'));
nuOperation('markdown','Listar links wiki',s=>[...new Set([...s.matchAll(/\[\[([^\]\n]{1,160})\]\]/g)].map(x=>x[1]))].join('\n'));
nuOperation('markdown','Extrair listas de tarefas',s=>s.split(/\r?\n/).filter(line=>/^\s*[-*]\s+\[[ xX]\]/.test(line)).join('\n'));
nuOperation('markdown','Frequência de termos',s=>nuFreq(s).map(([word,n])=>word+': '+n).join('\n'));
function nuPointer(obj,path){if(!path||path==='/')return obj;let o=obj;for(const p of path.replace(/^\//,'').split('/').map(x=>x.replace(/~1/g,'/').replace(/~0/g,'~'))){if(o===null||typeof o!=='object'||!(p in o))throw Error('Caminho JSON não localizado.');o=o[p];}return o;}
function nuStructure(data,max=200){const out=[];function walk(value,path,depth){if(out.length>=max)return;const type=Array.isArray(value)?'array':value===null?'null':typeof value;out.push(path+' · '+type+(Array.isArray(value)?' ('+value.length+')':''));if(depth>6||!value||typeof value!=='object')return;for(const [k,v]of Object.entries(value).slice(0,60))walk(v,path+'/'+k.replaceAll('~','~0').replaceAll('/','~1'),depth+1);}walk(data,'$',0);return out.join('\n');}
nuOperation('json','Consultar ponteiro JSON', (s,p)=>JSON.stringify(nuPointer(JSON.parse(s),p.trim()),null,2));
nuOperation('json','Esquema de tipos',s=>nuStructure(JSON.parse(s)));
nuOperation('json','Comparar JSON com parâmetro',(s,p)=>{const a=JSON.parse(s),b=JSON.parse(p),keys=new Set([...Object.keys(a||{}),...Object.keys(b||{})]);return [...keys].slice(0,300).filter(k=>JSON.stringify(a?.[k])!==JSON.stringify(b?.[k])).map(k=>k+': '+JSON.stringify(a?.[k])+' → '+JSON.stringify(b?.[k])).join('\n')||'Sem alterações nas propriedades de primeiro nível.';});
nuOperation('json','Listar propriedades ausentes',(s,p)=>{const a=JSON.parse(s),b=JSON.parse(p);if(!a||typeof a!=='object'||!b||typeof b!=='object')throw Error('Ambos devem ser objetos ou matrizes.');return Object.keys(b).filter(k=>!Object.hasOwn(a,k)).join('\n')||'Nenhuma propriedade ausente.';});
nuOperation('csv','Remover linhas repetidas',s=>csvWrite([...new Map(csvRead(s).map(r=>[JSON.stringify(r),r])).values()]));
nuOperation('csv','Ordenar por primeira coluna',s=>{const rows=csvRead(s);return csvWrite(rows.length<2?rows:[rows[0],...rows.slice(1).sort((a,b)=>String(a[0]||'').localeCompare(String(b[0]||''),'pt-BR',{numeric:true}))]);});
nuOperation('csv','Estatísticas de colunas',s=>{const rows=csvRead(s),headers=rows[0]||[];return headers.map((h,i)=>{const cells=rows.slice(1).map(r=>r[i]||''),nums=cells.map(x=>Number(String(x).replace(',','.'))).filter(Number.isFinite);return(h||('Coluna '+(i+1)))+': '+cells.length+' linhas · preenchidos '+cells.filter(Boolean).length+(nums.length?' · soma '+nums.reduce((a,b)=>a+b,0).toFixed(3):'');}).join('\n');});
nuOperation('csv','Detectar largura irregular',s=>{const rows=csvRead(s),width=rows[0]?.length||0;return rows.map((r,i)=>r.length===width?null:'Linha '+(i+1)+': '+r.length+' colunas, esperado '+width).filter(Boolean).join('\n')||'Todas as linhas têm o mesmo número de colunas.';});
nuOperation('diff','Contar linhas alteradas',(a,b)=>{const x=a.split(/\r?\n/),y=b.split(/\r?\n/);let same=0;for(let i=0;i<Math.max(x.length,y.length);i++)if(x[i]===y[i])same++;return JSON.stringify({primeiro:x.length,segundo:y.length,linhasCoincidentes:same,linhasDiferentes:Math.max(x.length,y.length)-same},null,2);});
nuOperation('diff','Comparar palavras',(a,b)=>{const x=a.match(/\S+/g)||[],y=b.match(/\S+/g)||[],sa=new Set(x),sb=new Set(y);return'Exclusivas do primeiro: '+x.filter(w=>!sb.has(w)).slice(0,100).join(' ')+'\nExclusivas do segundo: '+y.filter(w=>!sa.has(w)).slice(0,100).join(' ');});
nuOperation('diff','Comparar espaços ao final',(a,b)=>{const x=a.split(/\r?\n/),y=b.split(/\r?\n/);const a1=x.map((v,i)=>/\s$/.test(v)?i+1:null).filter(Boolean),b1=y.map((v,i)=>/\s$/.test(v)?i+1:null).filter(Boolean);return 'Linhas com espaços à direita no primeiro: '+(a1.join(', ')||'nenhuma')+'\nLinhas com espaços à direita no segundo: '+(b1.join(', ')||'nenhuma');});
nuOperation('diff','Detectar prefixo/sufixo comum',(a,b)=>{let prefix=0,suffix=0;while(prefix<Math.min(a.length,b.length)&&a[prefix]===b[prefix])prefix++;while(suffix<Math.min(a.length-prefix,b.length-prefix)&&a[a.length-1-suffix]===b[b.length-1-suffix])suffix++;return'Prefixo: '+prefix+' caracteres\nSufixo: '+suffix+' caracteres\nTrecho alterado 1:\n'+a.slice(prefix,a.length-suffix).slice(0,5000)+'\nTrecho alterado 2:\n'+b.slice(prefix,b.length-suffix).slice(0,5000);});
nuOperation('textlab','Criar slug para URL',s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''));
nuOperation('textlab','Contagem de palavras frequentes',s=>nuFreq(s,50).map(([k,n])=>k+' · '+n).join('\n'));
nuOperation('textlab','Normalizar espaços',s=>s.replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n'));
nuOperation('textlab','Remover linhas vazias',s=>s.split(/\r?\n/).filter(line=>line.trim()).join('\n'));
nuOperation('textlab','Dividir em frases',s=>s.replace(/([.!?])\s+(?=[\p{Lu}])/gu,'$1\n'));
nuOperation('regex','Modelos regex frequentes',()=>JSON.stringify({numero:'\\d+(?:[.,]\\d+)?',email:'[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}',dataISO:'\\b\\d{4}-\\d{2}-\\d{2}\\b',hexadecimal:'#[0-9a-fA-F]{6}',link:'https?:\\/\\/[^\\s]+'},null,2));
nuOperation('regex','Validar flags sem executar', (s,p)=>{const data=JSON.parse(p||'{}');const flags=String(data.flags||'');if(!/^[dgimsuvy]*$/.test(flags)||new Set(flags).size!==flags.length||flags.includes('u')&&flags.includes('v'))throw Error('Flags inválidas.');new RegExp(String(data.pattern||''),flags);return'Padrão e flags válidos. Não executou a expressão sobre o texto.';});
nuOperation('base64','Detectar Base64 padrão',s=>{const v=s.trim();return/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(v)?'Sintaxe Base64 compatível.':'Sintaxe Base64 inválida.';});
nuOperation('base64','Medir bytes UTF-8',s=>new TextEncoder().encode(s).length+' bytes');
nuOperation('base64','Base64 → URL de dados',s=>'data:application/octet-stream;base64,'+s.trim());
nuOperation('base64','URL de dados → Base64',s=>{const m=s.trim().match(/^data:[^,]*;base64,([A-Za-z0-9+/=\-_]+)$/);if(!m)throw Error('Informe data:...;base64,BASE64');return m[1];});
nuOperation('urltool','Remover parâmetros de rastreamento',s=>{const url=new URL(s.trim());const tracking=/^(utm_[a-z]+|fbclid|gclid|msclkid|mc_cid|mc_eid|igshid)$/i;[...url.searchParams.keys()].forEach(k=>{if(tracking.test(k))url.searchParams.delete(k);});return url.href;});
nuOperation('urltool','Ordenar parâmetros',s=>{const url=new URL(s.trim());url.searchParams.sort();return url.href;});
nuOperation('urltool','Extrair parâmetros JSON',s=>{const url=new URL(s.trim());const obj={};for(const [k,v]of url.searchParams){(obj[k]??=[]).push(v);}return JSON.stringify(obj,null,2);});
nuOperation('urltool','Obter domínio e origem',s=>{const u=new URL(s.trim());return JSON.stringify({origin:u.origin,hostname:u.hostname,port:u.port,protocol:u.protocol,username:u.username?'presente':'ausente'},null,2);});
nuOperation('unicode','Normalizar NFC',s=>s.normalize('NFC'));
nuOperation('unicode','Normalizar NFD',s=>s.normalize('NFD'));
nuOperation('unicode','Remover diacríticos',s=>s.normalize('NFD').replace(/\p{M}/gu,''));
nuOperation('unicode','Diagnóstico dos símbolos',s=>Array.from(s).slice(0,200).map((c,i)=>(i+1)+' · '+c+' · U+'+c.codePointAt(0).toString(16).toUpperCase()+' · '+new TextEncoder().encode(c).length+' byte(s)').join('\n'));
nuOperation('hash','Conferir SHA-256 esperado',async(s,p)=>{const expect=p.trim().toLowerCase();if(!/^[0-9a-f]{64}$/.test(expect))throw Error('No parâmetro, informe o hash SHA-256 de 64 dígitos.');const actual=crypto.subtle?await digest(s,'SHA-256'):lot2SHA256(s);return(actual===expect?'COINCIDE':'DIFERENTE')+'\nEsperado: '+expect+'\nCalculado: '+actual;});
nuOperation('hash','Manifesto SHA-256 de linhas',async s=>{const rows=s.split(/\r?\n/).slice(0,100);const out=[];for(const r of rows)out.push((crypto.subtle?await digest(r,'SHA-256'):lot2SHA256(r))+'  '+r);return out.join('\n');});
nuOperation('hash','Estatísticas de verificação',s=>JSON.stringify({caracteres:s.length,bytesUTF8:new TextEncoder().encode(s).length,linhas:s.split(/\r?\n/).length},null,2));
nuOperation('uuid','Conferir repetidos',s=>{const rows=s.split(/\r?\n/).map(x=>x.trim()).filter(Boolean),unique=new Set(rows);return JSON.stringify({quantidade:rows.length,unicos:unique.size,duplicados:rows.length-unique.size},null,2);});
nuOperation('uuid','UUIDs em JSON',s=>JSON.stringify(s.split(/\r?\n/).map(x=>x.trim()).filter(Boolean),null,2));
nuOperation('uuid','Identificar versões UUID',s=>s.split(/\r?\n/).map(v=>{const ok=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(v.trim());return v+': '+(ok?'versão '+v.trim()[14]:'inválido');}).join('\n'));
nuOperation('mail','Verificar cabeçalhos mínimos',s=>{const h=mailParts(s).headers;return JSON.stringify({from:!!h.from,to:!!h.to,subject:!!h.subject,date:!!h.date,format:h['content-type']||'text/plain',warnings:[...['from','to','subject'].filter(k=>!h[k]).map(k=>'Falta '+k)]},null,2);});
nuOperation('mail','Resumo de conversa',s=>{const m=mailParts(s);return 'Assunto: '+(m.headers.subject||'Sem assunto')+'\nDe: '+(m.headers.from||'—')+'\nPara: '+(m.headers.to||'—')+'\nCorpo (até 500 caracteres):\n'+m.body.slice(0,500);});
nuOperation('mail','Indicadores de anexos MIME',s=>{const count=(s.match(/Content-Disposition:\s*attachment/gi)||[]).length;return count+' cabeçalho(s) de anexo detectado(s). O Nimbo não executa nem extrai anexos binários de EML.';});

/* LOTES 09–10 — paletas, imagem e tempo, credenciais fortes e ferramentas sonoras. */
nuWrap('colors',(root,ctx)=>{
 const body=nuBtn('triad','Gerar tríade RGB')+nuBtn('analogous','Gerar tons análogos')+nuBtn('contrast','Diagnóstico de contraste')+nuBtn('vars','Exportar variáveis CSS')+'<output class="nu-result" aria-live="polite"></output>';
 const color=()=>root.querySelector('#color-a')?.value||'#287d68',bg=()=>root.querySelector('#color-b')?.value||'#ffffff';
 function shift(hex,deg){const rgb=colorRGB(hex).map(x=>x/255),max=Math.max(...rgb),min=Math.min(...rgb),d=max-min;let h=0,s=max===0?0:d/max,v=max;if(d){h=max===rgb[0]?(rgb[1]-rgb[2])/d%6:max===rgb[1]?(rgb[2]-rgb[0])/d+2:(rgb[0]-rgb[1])/d+4;h=(h*60+360)%360;}h=(h+deg+360)%360;const c=v*s,x=c*(1-Math.abs(h/60%2-1)),m=v-c;let val=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return'#'+val.map(n=>Math.round((n+m)*255).toString(16).padStart(2,'0')).join('');}
 nuPanel(root,ctx,'Cores · design system',body,{
  triad(d){d.querySelector('output').textContent=[color(),shift(color(),120),shift(color(),240)].join(' · ');},
  analogous(d){d.querySelector('output').textContent=[shift(color(),-30),color(),shift(color(),30)].join(' · ');},
  contrast(d){const x=colorContrast(color(),bg());d.querySelector('output').textContent=x.toFixed(2)+':1 · normal AA: '+(x>=4.5?'sim':'não')+' · AAA: '+(x>=7?'sim':'não');},
  vars(d){const code=':root {\n  --brand-primary: '+color()+';\n  --brand-background: '+bg()+';\n  --brand-contrast: '+colorContrast(color(),bg()).toFixed(2)+';\n}';nuDownload(ctx,'Paleta_Nimbo.css',code,'text/css');}
 });
},['Tríade cromática','Cores análogas','Auditoria de contraste AA/AAA','Exportar variáveis CSS']);
nuWrap('gradient',(root,ctx)=>{
 const saved=nuGet('gradient-pro',{a:'#397e73',b:'#e6d1eb',angle:120});
 const body='<div class="nu-grid"><label>Início<input type="color" data-nu-field="a" value="'+nuEsc(saved.a)+'"></label><label>Fim<input type="color" data-nu-field="b" value="'+nuEsc(saved.b)+'"></label><label>Ângulo<input type="range" data-nu-field="angle" min="0" max="360" value="'+Number(saved.angle||120)+'"></label></div><div class="nu-gradient-preview"></div>'+nuBtn('preview','Atualizar amostra')+nuBtn('invert','Inverter extremos')+nuBtn('css','Exportar CSS')+nuBtn('svg','Exportar SVG');
 const panel=nuPanel(root,ctx,'Gradientes · painel de exportação',body,{
  preview(){paint();},invert(d){const a=d.querySelector('[data-nu-field="a"]'),b=d.querySelector('[data-nu-field="b"]');[a.value,b.value]=[b.value,a.value];paint();},
  css(){nuDownload(ctx,'Gradiente_Nimbo.css','.gradiente-nimbo { background: '+css()+'; }\n','text/css');},
  svg(){const a=panel.querySelector('[data-nu-field="a"]').value,b=panel.querySelector('[data-nu-field="b"]').value;const angle=Number(panel.querySelector('[data-nu-field="angle"]').value)*Math.PI/180,dx=Math.cos(angle)*50,dy=Math.sin(angle)*50;const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675"><defs><linearGradient id="g" x1="'+(50-dx)+'%" y1="'+(50-dy)+'%" x2="'+(50+dx)+'%" y2="'+(50+dy)+'%"><stop offset="0%" stop-color="'+a+'"/><stop offset="100%" stop-color="'+b+'"/></linearGradient></defs><rect width="1200" height="675" fill="url(#g)"/></svg>';nuDownload(ctx,'Gradiente_Nimbo.svg',svg,'image/svg+xml');}
 });
 const css=()=>{const a=panel.querySelector('[data-nu-field="a"]').value,b=panel.querySelector('[data-nu-field="b"]').value,n=Number(panel.querySelector('[data-nu-field="angle"]').value);return'linear-gradient('+n+'deg, '+a+', '+b+')';};
 function paint(){panel.querySelector('.nu-gradient-preview').style.background=css();nuSet('gradient-pro',{a:panel.querySelector('[data-nu-field="a"]').value,b:panel.querySelector('[data-nu-field="b"]').value,angle:Number(panel.querySelector('[data-nu-field="angle"]').value)});}
 panel.querySelectorAll('input').forEach(n=>n.addEventListener('input',paint));paint();
},['Editor de gradiente independente','Prévia incremental','Inverter extremos','Exportar SVG vetorial']);
nuWrap('image-editor',(root,ctx)=>{
 const canvas=root.querySelector('canvas');if(!canvas)return;
 const body='<p class="muted">Opera sobre a imagem efetivamente renderizada pela Oficina. Não altera o arquivo original.</p>'+nuBtn('sample','Extrair cores predominantes')+nuBtn('double','Exportar versão 2×')+nuBtn('histogram','Diagnóstico RGB')+'<output class="nu-result" aria-live="polite"></output>';
 nuPanel(root,ctx,'Imagem · pós-processamento',body,{
  sample(d){if(!canvas.width||!canvas.height)throw Error('Abra e renderize uma imagem.');const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data,count={};const stride=Math.max(4,Math.floor(pixels.length/160000/4)*4);for(let i=0;i<pixels.length;i+=stride){if(pixels[i+3]<128)continue;const color='#'+[0,1,2].map(k=>Math.min(255,Math.round(pixels[i+k]/32)*32).toString(16).padStart(2,'0')).join('');count[color]=(count[color]||0)+1;}d.querySelector('output').textContent=Object.entries(count).sort((a,b)=>b[1]-a[1]).slice(0,6).map(x=>x[0]).join(' · ');},
  double(){if(!canvas.width||!canvas.height)throw Error('Abra uma imagem.');if(canvas.width*canvas.height*4>16000000)throw Error('Saída ampliada acima de 16 MP.');const out=document.createElement('canvas');out.width=canvas.width*2;out.height=canvas.height*2;const c=out.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(canvas,0,0,out.width,out.height);out.toBlob(blob=>{if(blob)nuDownload(ctx,'Imagem_Nimbo_2x.png',blob,'image/png');},'image/png');},
  histogram(d){if(!canvas.width||!canvas.height)throw Error('Abra uma imagem.');const pix=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;const sums=[0,0,0];let count=0;for(let i=0;i<pix.length;i+=Math.max(4,4*Math.floor(pix.length/(4*100000)))){if(pix[i+3]<128)continue;count++;for(let c=0;c<3;c++)sums[c]+=pix[i+c];}d.querySelector('output').textContent='Médias R/G/B: '+(count?sums.map(x=>Math.round(x/count)).join(' / '):'sem pixels opacos');}
 });
},['Extração de paleta aproximada','Ampliação 2× com reamostragem','Médias de cor RGB']);
nuWrap('datecalc',(root,ctx)=>{
 const a=root.querySelector('#date-a'),b=root.querySelector('#date-b');
 nuPanel(root,ctx,'Datas · calendário avançado',nuBtn('iso','Semana ISO da primeira data')+nuBtn('quarter','Trimestre e ano')+nuBtn('leap','Ano bissexto')+nuBtn('inclusive','Dias entre datas inclusive')+nuBtn('weekends','Contar finais de semana')+'<output class="nu-result" aria-live="polite"></output>',{
  iso(d){const value=dateOnly(a.value),target=new Date(value);target.setUTCHours(0,0,0,0);target.setUTCDate(target.getUTCDate()+4-(target.getUTCDay()||7));const yearStart=new Date(Date.UTC(target.getUTCFullYear(),0,1));const week=Math.ceil((((target-yearStart)/86400000)+1)/7);d.querySelector('output').textContent='Semana ISO '+week+' / '+target.getUTCFullYear();},
  quarter(d){const val=dateOnly(a.value);d.querySelector('output').textContent='T'+(Math.floor(val.getUTCMonth()/3)+1)+' de '+val.getUTCFullYear();},
  leap(d){const year=dateOnly(a.value).getUTCFullYear();d.querySelector('output').textContent=(year%4===0&&(year%100!==0||year%400===0))?'Bissexto':'Não bissexto';},
  inclusive(d){d.querySelector('output').textContent=(Math.abs(dateDifference(a.value,b.value))+1)+' dias (ambas as datas incluídas)';},
  weekends(d){let lo=Math.min(Date.parse(a.value+'T12:00:00Z'),Date.parse(b.value+'T12:00:00Z')),hi=Math.max(Date.parse(a.value+'T12:00:00Z'),Date.parse(b.value+'T12:00:00Z'));if((hi-lo)/86400000>36600)throw Error('Intervalo máximo de 100 anos.');let count=0;for(;lo<=hi;lo+=86400000){const day=new Date(lo).getUTCDay();if(day===0||day===6)count++;}d.querySelector('output').textContent=count+' dias de fim de semana';}
 });
},['Semana ISO','Trimestre civil','Checagem de ano bissexto','Diferença inclusiva','Contagem de finais de semana']);
nuWrap('worldclock',(root,ctx)=>{
 const saved=nuGet('worldclock-pro',{a:'America/Sao_Paulo',b:'Europe/Lisbon',date:nuToday()});
 const body='<div class="nu-grid"><label>Primeiro fuso<input data-nu-field="a" value="'+nuEsc(saved.a)+'"></label><label>Segundo fuso<input data-nu-field="b" value="'+nuEsc(saved.b)+'"></label><label>Data de referência<input data-nu-field="date" type="date" value="'+nuEsc(saved.date)+'"></label></div>'+nuBtn('difference','Comparar diferença de UTC')+nuBtn('dst','Comparar janeiro e julho')+'<output class="nu-result" aria-live="polite"></output>';
 const panel=nuPanel(root,ctx,'Fusos · comparação de horários',body,{
  difference(d){const x=params(d),at=new Date(x.date+'T12:00:00Z');d.querySelector('output').textContent=x.a+': '+offset(x.a,at)+' · '+x.b+': '+offset(x.b,at);nuSet('worldclock-pro',x);},
  dst(d){const x=params(d),year=x.date.slice(0,4),j=new Date(year+'-01-15T12:00:00Z'),u=new Date(year+'-07-15T12:00:00Z');d.querySelector('output').textContent='Janeiro: '+offset(x.a,j)+' / '+offset(x.b,j)+' · Julho: '+offset(x.a,u)+' / '+offset(x.b,u)+' (mudanças indicam diferença sazonal de horário)';nuSet('worldclock-pro',x);}
 });
 function params(d){const fields=['a','b','date'],r=Object.fromEntries(fields.map(x=>[x,d.querySelector('[data-nu-field="'+x+'"]').value]));for(const key of ['a','b'])new Intl.DateTimeFormat('pt-BR',{timeZone:r[key]});dateOnly(r.date);return r;}
 function offset(zone,day){const value=new Intl.DateTimeFormat('en-US',{timeZone:zone,timeZoneName:'shortOffset'}).formatToParts(day).find(x=>x.type==='timeZoneName')?.value;return value||'Fuso indisponível';}
},['Comparar dois fusos','Verificar variações sazonais','Persistir comparação']);
nuWrap('passwords',(root,ctx)=>{
 /* Lista curta deliberadamente destinada a frases de uso não crítico. O app principal
    já oferece 128 caracteres gerados com CSPRNG. A frase comunica sua entropia real. */
 const words=('arco areia atlas aurora azul banco barro barco bosque brisa calma campo canto casa cedo chama chuva claro cobre coral corda corpo curva dado dança dedo delta dente doce dúvida eco esfera estrela falha farol fauna feliz ferro fibra folha fonte força frase fruta gasto gato gelo gente girar globo grande grão guia idade ideia ilha imagem janela jardim jogo jovem junta lago lento livro lua luz magia manhã mapa mar marco massa medo mesa meta milho moeda montanha mundo navio neve noite norte nuvem onda ouro página palco papel parque pedra peixe pena perto pista plano planta praia preço prata prato prova quadro quarto queijo queda rede regra reino rio roda rosa rota rua salto samba santo seco sede selva sinal sino sorriso sorte sul tarde tempo terra tinta topo torre trilha tubo união urso vaga vale valor vento verde verso viagem vida vidro vila vinho violeta visão voz zelo zebra').split(' ');
 const body='<p class="muted">Frases memorizáveis de palavras comuns; não substituem o gerador criptográfico de senhas longas.</p><label>Quantidade de palavras<input data-nu-field="count" type="number" min="5" max="12" value="8"></label>'+nuBtn('phrase','Gerar frase aleatória')+nuBtn('entropy','Estimar entropia da frase')+'<textarea data-nu-field="value" readonly rows="3" aria-label="Frase gerada"></textarea><p class="nu-result"></p>';
 nuPanel(root,ctx,'Senhas · frases memorizáveis',body,{
  phrase(d){const n=Number(d.querySelector('[data-nu-field="count"]').value);if(!Number.isInteger(n)||n<5||n>12)throw Error('Escolha de 5 a 12 palavras.');const output=Array.from({length:n},()=>words[secureInteger(words.length)]).join('-');d.querySelector('textarea').value=output;d.querySelector('.nu-result').textContent='Frase gerada com aleatoriedade do navegador. Não foi guardada.';},
  entropy(d){const n=Number(d.querySelector('[data-nu-field="count"]').value);d.querySelector('.nu-result').textContent='Estimativa teórica: '+(n*Math.log2(words.length)).toFixed(1)+' bits, se as palavras forem escolhidas uniformemente. Prefira senhas mais longas para proteção de alto valor.';}
 });
},['Frase aleatória local','Estimativa de entropia teórica']);
nuWrap('metronome',(root,ctx)=>{
 const read=()=>Number(root.querySelector('[data-audio-control="bpm"]')?.value);
 nuPanel(root,ctx,'Metrônomo · estudo de andamento',nuBtn('beat','Duração de uma batida')+nuBtn('eighth','Subdivisões rítmicas')+nuBtn('ramp','Plano de progressão de BPM')+'<output class="nu-result" aria-live="polite"></output>',{
  beat(d){const bpm=read();if(!Number.isFinite(bpm)||bpm<=0)throw Error('BPM inválido.');d.querySelector('output').textContent=(60000/bpm).toFixed(1)+' ms por batida';},
  eighth(d){const bpm=read();d.querySelector('output').textContent='Semínima: '+(60000/bpm).toFixed(0)+' ms · colcheia: '+(30000/bpm).toFixed(0)+' ms · semicolcheia: '+(15000/bpm).toFixed(0)+' ms';},
  ramp(d){const bpm=read();d.querySelector('output').textContent='Plano sugerido: '+[0,5,10,15,20].map(inc=>Math.min(240,bpm+inc)+' BPM').join(' → ')+' (defina manualmente cada etapa).';}
 });
},['Duração de batida em milissegundos','Subdivisão colcheia e semicolcheia','Progressão de tempo para estudo']);
nuWrap('tone',(root,ctx)=>{
 const field=root.querySelector('[data-audio-control="frequency"]');
 const body='<label>Nota musical<select data-nu-field="note">'+['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'].map((v,i)=>'<option value="'+i+'">'+v+'</option>').join('')+'</select></label><label>Oitava<input data-nu-field="octave" type="number" value="4" min="0" max="8"></label>'+nuBtn('tune','Calcular frequência temperada')+nuBtn('set','Aplicar no gerador de tons')+nuBtn('harmonics','Harmônicos inteiros')+'<output class="nu-result" aria-live="polite"></output>';
 nuPanel(root,ctx,'Tons · afinador matemático',body,{
  tune(d){d.querySelector('output').textContent=frequency(d).toFixed(3)+' Hz (temperamento igual, A4 = 440 Hz)';},
  set(d){const v=frequency(d);if(v<20||v>12000)throw Error('Frequência fora do limite do sintetizador (20–12000 Hz).');field.value=Math.round(v);field.dispatchEvent(new Event('change',{bubbles:true}));ctx.toast('Frequência atualizada. Inicie o som manualmente.');},
  harmonics(d){const base=Number(field.value);if(!Number.isFinite(base)||base<=0)throw Error('Frequência inválida.');d.querySelector('output').textContent=[1,2,3,4,5,6].map(x=>x+'× '+(x*base).toFixed(2)+' Hz').join(' · ');}
 });
 function frequency(d){const index=Number(d.querySelector('[data-nu-field="note"]').value),oct=Number(d.querySelector('[data-nu-field="octave"]').value);if(!Number.isInteger(oct)||oct<0||oct>8)throw Error('Oitava fora do limite.');const midi=(oct+1)*12+index;return 440*Math.pow(2,(midi-69)/12);}
},['Tabela de notas com temperamento igual','Aplicar frequência musical','Análise harmônica']);

/* Conferência de cobertura: os 40 apps (IDs 11 a 50) devem existir e ter mínimo real.
   Este inventário é usado no build/QA, e não representa certificação de UX. */
const NU_LOTS={
 3:['sound','cinema','pdf-viewer','browser','converter'],
 4:['stopwatch','contacts','budget','habits','kanban'],
 5:['shopping','journal','flashcards','bookmarks','reading'],
 6:['recipes','inventory','goals','planner','snippets'],
 7:['markdown','json','csv','diff','textlab'],
 8:['regex','base64','urltool','unicode','hash'],
 9:['uuid','mail','colors','gradient','image-editor'],
 10:['datecalc','worldclock','passwords','metronome','tone']
};
for(const [lot,ids] of Object.entries(NU_LOTS)){
 if(ids.length!==5)throw Error('Lote '+lot+' não tem cinco apps.');
 for(const id of ids){const app=applications[id];if(!app||typeof app.mount!=='function')throw Error('App ausente em lote '+lot+': '+id);const min=app.level==='Complexo'?20:10;if(!Array.isArray(app.features)||new Set(app.features).size<min)throw Error('Catálogo insuficiente para '+id);}
}