from pathlib import Path
import json
from playwright.sync_api import sync_playwright
source=Path('/mnt/data/nimbo_work/upgrades/build/index.html').read_text();report={}
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 ctx=browser.new_context(accept_downloads=True)
 page=ctx.new_page();errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
 page.evaluate('''() => {const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,get:()=>({getItem(k){return m.has(k)?m.get(k):null},setItem(k,v){m.set(k,String(v))},removeItem(k){m.delete(k)},clear(){m.clear()},key(i){return [...m.keys()][i]||null},get length(){return m.size}})});}''')
 page.set_content(source,wait_until='domcontentloaded',timeout=90000);page.wait_for_timeout(600)
 page.evaluate('''() => {localStorage.setItem('nimbo-ops-v1',JSON.stringify({'habits-progress':{'a':['2026-11-05']},'flashcards-review':{'b':{due:'2026-11-07'}}}));localStorage.setItem('nimbo-suite-contacts',JSON.stringify([{key:'a',title:'QA Contato',tag:'Pessoal'}]));const b=document.createElement('button');b.dataset.launch='settings';document.body.append(b);b.click();b.remove();}''');page.wait_for_timeout(170)
 setting=page.locator('nimbo-window[data-app="settings"]')
 setting.locator('[data-do="section"][data-section="data"]').first.evaluate('x=>x.click()')
 page.wait_for_timeout(150)
 with page.expect_download(timeout=7000) as event:setting.locator('[data-do="backup"]').first.evaluate('x=>x.click()')
 dl=event.value;dl.save_as('/mnt/data/nimbo_work/upgrades/build/QA_Test_Backup.json');data=json.loads(Path('/mnt/data/nimbo_work/upgrades/build/QA_Test_Backup.json').read_text())
 appdata=data.get('appData',{})
 report={'file':dl.suggested_filename,'aux_key_present':'nimbo-ops-v1' in appdata,'existing_record_key':'nimbo-suite-contacts' in appdata,'decoded_aux':json.loads(appdata.get('nimbo-ops-v1','{}')),'errors':errs}
 print(json.dumps(report,ensure_ascii=False,indent=2))
 ctx.close();browser.close()
Path('/mnt/data/nimbo_work/upgrades/build/QA_backup_result.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))