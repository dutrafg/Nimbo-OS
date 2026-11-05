from pathlib import Path
import os
PROJECT_ROOT = Path(__file__).resolve().parents[1]
CHROMIUM_BIN = os.environ.get('NIMBO_CHROMIUM_PATH') or ('/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None)
import json,traceback
from playwright.sync_api import sync_playwright
html=(PROJECT_ROOT / 'dist' / 'index.html').read_text();res={}
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=CHROMIUM_BIN,args=['--no-sandbox','--disable-dev-shm-usage'])
 context=browser.new_context(viewport={'width':1440,'height':900},accept_downloads=True)
 page=context.new_page();page.set_default_timeout(6500);errs=[]
 page.on('pageerror',lambda exc:errs.append(str(exc)))
 page.evaluate('''() => {const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,get:()=>({getItem(k){return m.has(k)?m.get(k):null},setItem(k,v){m.set(k,String(v))},removeItem(k){m.delete(k)},clear(){m.clear()},key(i){return [...m.keys()][i]||null},get length(){return m.size}})});}''')
 page.set_content(html,wait_until='domcontentloaded',timeout=90000);page.wait_for_timeout(500)
 page.evaluate('''()=>localStorage.setItem('nimbo-app-registry-v2',JSON.stringify(['sound','cinema','pdf-viewer','browser','converter','stopwatch','contacts','budget','habits','kanban','shopping','journal','flashcards','bookmarks','reading','recipes','inventory','goals','planner','snippets','markdown','json','csv','diff','textlab','regex','base64','urltool','unicode','hash','uuid','mail','colors','gradient','image-editor','datecalc','worldclock','passwords','metronome','tone']))''')
 def mount(id):
  page.evaluate('''id=>{let b=document.createElement('button');b.dataset.launch=id;document.body.append(b);b.click();b.remove();}''',id);page.wait_for_timeout(130)
  return page.locator(f'nimbo-window[data-app="{id}"]')
 def action(win,name):
  win.locator(f'[data-nu="{name}"]').first.evaluate('e=>e.click()');page.wait_for_timeout(150)
 def output(win):
  return win.locator('.nu-pro output, .nu-pro p.nu-result, .nu-pro .nu-report').all_text_contents()
 tests=[('converter','convert',lambda w:any('1000' in x or '1.000' in x or 'kJ' in x for x in output(w))),('colors','triad',lambda w:any('#' in x for x in output(w))),('gradient','preview',lambda w:'linear-gradient' in w.locator('.nu-gradient-preview').get_attribute('style')),('datecalc','iso',lambda w:any('Semana ISO' in x for x in output(w))),('worldclock','difference',lambda w:any('GMT' in x for x in output(w))),('passwords','phrase',lambda w:len(w.locator('.nu-pro textarea').input_value().split('-'))==8),('metronome','beat',lambda w:any('ms' in x for x in output(w))),('tone','tune',lambda w:any('Hz' in x for x in output(w)))]
 for id,cmd,assertion in tests:
  try:
   win=mount(id);action(win,cmd);res[id]={'passed':assertion(win),'output':output(win)[:2]}
  except Exception as e:res[id]={'passed':False,'exception':str(e)[:180]}
 # Core transformations: navigate by button text
 text_ops=[('markdown','# Título\n## Seção','Gerar sumário Markdown','[Seção]'),('json','{"person":{"name":"A"}}','Consultar ponteiro JSON','"A"','/person/name'),('csv','nome,nota\nA,1\nA,1','Remover linhas repetidas','\"A\",\"1\"'),('diff','a \nb','Comparar espaços ao final','Linhas com espaços'),('textlab','Olá Mundo!','Criar slug para URL','ola-mundo'),('regex','a','Modelos regex frequentes','numero'),('base64','SGVsbG8=','Detectar Base64 padrão','compatível'),('urltool','https://a.com/?utm_source=x&k=y','Remover parâmetros de rastreamento','k=y'),('unicode','café','Normalizar NFD','cafe'),('hash','abc','Estatísticas de verificação','bytesUTF8'),('uuid','abc','Conferir repetidos','unicos'),('mail','From: hi@example.org\nTo: you@example.org\nSubject: teste\n\nOlá','Verificar cabeçalhos mínimos','from')]
 for row in text_ops:
  id,input,op,expected=row[:4];param=row[4] if len(row)>4 else ''
  try:
   win=mount(id);win.locator('.suite-input').fill(input);win.locator('.suite-parameter').fill(param)
   btn=win.locator('.suite-ops button').filter(has_text=op).first
   btn.evaluate('b=>b.click()');page.wait_for_timeout(160)
   got=win.locator('.suite-output').input_value()
   passed=(expected.lower() in got.lower()) if id!='unicode' else ('e\u0301' in got)
   res[id]={'passed':passed,'output':got[:150]}
  except Exception as e:res[id]={'passed':False,'exception':str(e)[:180]}
 # Real records from existing suite storage keys; verify no second app database needed.
 test_record={'contacts':{'title':'Maria QA','email':'maria@example.org','phone':'4133331234','birthday':'1990-11-07'},'budget':{'title':'Conta QA','value':'120.00','type':'Despesa','date':'2026-11-05'},'habits':{'title':'Caminhada','frequency':'Diário'},'kanban':{'title':'Projeto Azul','date':'2026-11-01','stage':'Em andamento'},'shopping':{'title':'Arroz','value':'10.00','quantity':'2'},'journal':{'title':'Hoje','date':'2026-11-05','mood':'Bem'},'flashcards':{'title':'Capital do Brasil','answer':'Brasília'},'bookmarks':{'title':'Pesquisa','url':'https://www.example.org/'},'reading':{'title':'Livro teste','pages':'20','total':'100'},'recipes':{'title':'Pão','ingredients':'2 xícaras de farinha','servings':'4'},'inventory':{'title':'Caderno','quantity':'1','value':'20.00'},'goals':{'title':'Ler mais','progress':'4','target':'10','date':'2026-11-07'},'planner':{'title':'Reunião','date':'2026-11-05','time':'13:00','duration':'60'},'snippets':{'title':'console.log','code':'console.log(1)','language':'JavaScript'}}
 for i,(id,row) in enumerate(test_record.items()):
  try:
   page.evaluate('''({id,row})=>localStorage.setItem('nimbo-suite-'+id,JSON.stringify([{key:'qa_'+id,tag:'QA',notes:'Criado para teste',archived:false,done:false,updated:Date.now(),...row}]))''',{'id':id,'row':row})
   win=mount(id)
   if id=='habits':
    action(win,'check');saved=page.evaluate('JSON.parse(localStorage.getItem("nimbo-ops-v1"))')
    passed=bool(saved.get('habits-progress'))
   elif id=='flashcards':
    action(win,'good');saved=page.evaluate('JSON.parse(localStorage.getItem("nimbo-ops-v1"))');passed=bool(saved.get('flashcards-review'))
   elif id=='contacts':
    with page.expect_download(timeout=5000) as event:action(win,'vcard')
    name=event.value.suggested_filename;passed=name.endswith('.vcf')
   else:
    button={'budget':'monthly','kanban':'board','shopping':'pending','journal':'mood','bookmarks':'hosts','reading':'progress','recipes':'scale','inventory':'total','goals':'percent','planner':'week','snippets':'languages'}[id]
    action(win,button)
    passed=bool(output(win))
   res[id]={'passed':passed,'outputs':output(win)[:1]}
  except Exception as e:res[id]={'passed':False,'exception':str(e)[:200]}
 res['error_count']=len(errs);res['errors']=errs[:15];print(json.dumps(res,ensure_ascii=False,indent=2)[:11000],flush=True)
 context.close();browser.close()
(PROJECT_ROOT / 'reports' / 'QA_interactions.json').write_text(json.dumps(res,ensure_ascii=False,indent=2))