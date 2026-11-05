from pathlib import Path
import hashlib,subprocess
base=Path(__file__).resolve().parent.parent
source=(base/'base/Nimbo_OS_0.13.0_Beta3_Lote2_5_Apps.html').read_text()
js=(base/'src/lots_03_10.js').read_text();css=(base/'src/lots_03_10.css').read_text()
source=source.replace("const RELEASE = '0.13.0-beta.3';","const RELEASE = '0.14.0-beta.4';")
source=source.replace('<title>Nimbo OS 0.13 — Seu espaço</title>','<title>Nimbo OS 0.14 — Seu espaço</title>')
source=source.replace('50 MINIAPLICATIVOS · BETA 3','50 MINIAPLICATIVOS · BETA 4')
source=source.replace('const appDataKeys=new Set([',"const appDataKeys=new Set(['nimbo-ops-v1',")
source=source.replace('\n})().catch(error=>{const boot=','\n'+js+'\n\n})().catch(error=>{const boot=')
source=source.replace('</style>','\n'+css+'\n</style>')
assert source.count('const NU_LOTS=')==1
out=base/'index.html';out.write_text(source)
script=source.split('<script>',1)[1].split('</script>',1)[0]
check=base/'check_all.js';check.write_text(script)
p=subprocess.run(['node','--check',str(check)],capture_output=True,text=True)
check.unlink()
if p.returncode:raise RuntimeError(p.stderr)
print('Reconstruído',out,len(source),'SHA-256',hashlib.sha256(out.read_bytes()).hexdigest())