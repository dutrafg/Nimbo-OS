# Nimbo OS 0.14.1 Beta 4 — Pacote PWA instalável

Este pacote reúne o Nimbo OS com **50 miniaplicativos**, dock, dashboard, Loja e atualizador integrado ao PWA.

## Como utilizar

**Para abrir uma prévia imediatamente:** abra `dist/index.html` ou o HTML completo separado no Chrome/Edge. Em `file://`, a instalação PWA e o Service Worker não ficam disponíveis; o restante do sistema permanece em modo local, respeitando as APIs permitidas pelo navegador.

**Para instalar como aplicativo:** publique todo o conteúdo de `dist/` em hospedagem HTTPS, como Vercel, ou inicie servidor local em `localhost`. O site deve manter `index.html`, `manifest.webmanifest`, `sw.js`, `updates.json` e `icons/` no mesmo diretório-base. Em Android, Chrome/Samsung Internet pode oferecer Instalar aplicativo; no desktop, use Instalar no Chrome/Edge; em iPhone/iPad, use Compartilhar → Adicionar à Tela de Início.

**Atualizar:** abra Atualizações no Nimbo; clique Verificar atualizações. O novo Service Worker faz download da versão integral. Somente quando a versão estiver pronta, a opção Aplicar e reiniciar aparece. O sistema e os apps integrados são atualizados juntos. A atualização não apaga os registros locais, mas alterações abertas e ainda não salvas devem ser guardadas antes da confirmação.

## Desenvolvimento e QA

- `npm run build`: reconstrói a versão original compactada e produz a versão PWA na pasta `dist/`.
- `npm run test:pwa`: valida manifesto, JS, arquivos PNG e comportamento do Service Worker simulado.
- `src/`: código de integração PWA e central de atualizações.
- `public/icons/`: quatro ícones PNG originais.
- `docs/QA_PWA.md`: ensaios executados, limitações e checklist de homologação.

A versão é Beta 4 (`0.14.1-beta.4`). Uma hospedagem HTTPS e testes reais são necessários antes de classificá-la como estável.