from pathlib import Path
import os
PROJECT_ROOT = Path(__file__).resolve().parents[1]
CHROMIUM_BIN = os.environ.get('NIMBO_CHROMIUM_PATH') or ('/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None)
import json,traceback
from playwright.sync_api import sync_playwright
source=(PROJECT_ROOT / 'dist' / 'index.html').read_text()
allids=['sound','cinema','pdf-viewer','browser','converter','stopwatch','contacts','budget','habits','kanban','shopping','journal','flashcards','bookmarks','reading','recipes','inventory','goals','planner','snippets','markdown','json','csv','diff','textlab','regex','base64','urltool','unicode','hash','uuid','mail','colors','gradient','image-editor','datecalc','worldclock','passwords','metronome','tone']
results={}
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=CHROMIUM_BIN,args=['--no-sandbox','--disable-dev-shm-usage','--js-flags=--max-old-space-size=4096'])
 for width in [1440,390]:
  ctx=browser.new_context(viewport={'width':width,'height':900 if width==1440 else 844},accept_downloads=True)
  page=ctx.new_page();page.set_default_timeout(2500);errors=[]
  page.on('pageerror',lambda err:errors.append(str(err)))
  page.evaluate('''() => {let m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,get:()=>({getItem(k){return m.has(k)?m.get(k):null},setItem(k,v){m.set(k,String(v))},removeItem(k){m.delete(k)},clear(){m.clear()},key(i){return [...m.keys()][i]||null},get length(){return m.size}})});}''')
  page.set_content(source,wait_until='domcontentloaded',timeout=90000);page.wait_for_timeout(700)
  page.evaluate('''() => {const b=document.createElement('button');b.dataset.launch='store';document.body.append(b);b.click();b.remove();}''');page.wait_for_timeout(350)
  ids=page.evaluate('''() => [...new Set([...document.querySelectorAll('[data-store="details"]')].map(el=>el.dataset.id))]''')
  page.evaluate('''ids=>localStorage.setItem('nimbo-app-registry-v2',JSON.stringify(ids))''',ids)
  opened=[];enhanced=[];fails=[];features={}
  for app in allids:
   try:
    page.evaluate('''id=>{const b=document.createElement('button');b.dataset.launch=id;document.body.append(b);b.click();b.remove();}''',app)
    page.wait_for_timeout(70)
    win=page.locator('nimbo-window[data-app="'+app+'"]')
    if not win.count():fails.append(app+': não montou');continue
    opened.append(app)
    if app in ['markdown','json','csv','diff','textlab','regex','base64','urltool','unicode','hash','uuid','mail']:
     tools=win.locator('.suite-ops [data-action="operate"]').count()
     if tools<10:fails.append(app+': poucas operações '+str(tools))
     else:enhanced.append(app)
     features[app]=tools
    else:
     n=win.locator('.nu-pro').count()
     if n<1:fails.append(app+': painel ausente')
     else:enhanced.append(app)
     features[app]=n
    close=win.locator('[data-frame="close"]')
    if close.count():close.evaluate('e=>e.click()')
   except Exception as exc:fails.append(app+': '+str(exc)[:110])
  results[width]={'catalog':len(ids),'mounted':len(opened),'enhanced':len(enhanced),'failures':fails,'features':features,'errors':errors[:25],'no_overflow':page.evaluate('document.documentElement.scrollWidth<=innerWidth')}
  print(width,'catalog',len(ids),'mounted',len(opened),'enhanced',len(enhanced),'errors',errors[:5], 'fails',fails[:6],flush=True)
  ctx.close()
 browser.close()
(PROJECT_ROOT / 'reports' / 'QA_regression.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))