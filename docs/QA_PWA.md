# Relatório QA · Nimbo OS 0.14.1-beta.4 · PWA

## Escopo

Conversão da Beta 4 original em PWA. Nenhum identificador ou implementação dos 50 miniaplicativos foi removido. O HTML é reconstruído a partir dos blocos compactados da Beta 4, com validação SHA-256 da base antes da aplicação do complemento PWA. O atualizador existente foi substituído internamente por uma interface integrada ao Service Worker, sem criar um segundo atualizador concorrente.

## Ensaios aprovados (2026-11-05)

- SHA-256 da Beta 4 fonte, conferência de 10.412.380 bytes.
- Build reprodutível gera HTML Beta 4 PWA 0.14.1 com 10.422.990 bytes.
- Node `--check` em dois scripts inline e no Service Worker, sem erros.
- Validação do manifesto: `name`, `start_url`, `scope`, `display: standalone`, três entradas de ícone (192/512/maskable), 4 imagens PNG válidas.
- Catálogo de atualização `updates.json`: 50 apps integrados e versão 0.14.1-beta.4.
- Teste unitário do Service Worker com CacheStorage e Fetch simulados: cache de 7 recursos, navegação offline no HTML principal, atualização somente após comando de confirmação e limpeza restrita aos caches do próprio Nimbo.
- Teste de inicialização do HTML completo no Chromium com conteúdo injetado em `about:blank`: nenhuma exceção de JavaScript, `window.NimboPWA` disponível, versão correta, ausência de transbordamento horizontal a 390px.

## Limites dos testes

- O ambiente bloqueou navegação Chromium em `http://127.0.0.1` e em URLs `file://` por política administrativa (`ERR_BLOCKED_BY_ADMINISTRATOR`), portanto não foi possível validar o ciclo real `navigator.serviceWorker.register()` → instalação/atualização → navegador offline nesse ambiente. A simulação do Service Worker não substitui o teste de integração real.
- Instalação Android/WebAPK, iOS Tela de Início, Windows Edge/Chrome, persistência do armazenamento real após reboot e PWA hospedado externamente ainda dependem de homologação em dispositivo.
- Os 50 aplicativos não foram submetidos novamente a todos os testes funcionais; a base foi preservada byte a byte antes da aplicação PWA.

## Próximos testes de homologação em HTTPS

1. Abrir o site e instalar pelo Chrome/Edge/Samsung Internet.
2. Executar uma operação real em um miniaplicativo, instalar o PWA e conferir a permanência dos dados.
3. Colocar o aparelho em modo avião e abrir o Nimbo pela tela inicial; validar Loja, apps, arquivos locais e dashboard.
4. Publicar nova versão com novo fingerprint do Service Worker; verificar detecção da atualização, espera, confirmação e reinício.
5. Antes de autorizar atualização, manter um formulário com edição não salva e confirmar que nenhum reload acontece automaticamente.
6. Durante download de nova versão, interromper rede e verificar permanência da versão anterior.
7. Restaurar backup e conferir que não houve exclusão de `localStorage`, IndexedDB ou arquivos dos usuários.