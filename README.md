# Nimbo OS 0.14.1-beta.4 (PWA) · Código consolidado até o lote 10

Este repositório publica o Nimbo OS Beta 4. O HTML completo foi armazenado em partes comprimidas em `packed/index/` para manter os envios confiáveis; o comando `npm run build` reconstrói o arquivo em `dist/index.html` e verifica seu SHA-256. O conteúdo executável é idêntico ao artefato validado.

## Conteúdo
- `packed/index/`: HTML consolidado, autocontido, repartido em blocos de base64 gzip para armazenamento Git. A reconstrução gera `dist/index.html`.
- `src/lots_03_10.js`: ampliações dos apps 11–50 (40 aplicativos).
- `src/lots_03_10.css`: estilos adaptativos dos novos painéis.
- `scripts/assemble.mjs`: gera o HTML final na pasta `dist` sem dependências externas e valida SHA-256.
- `scripts/rebuild.py`: reconstrói o HTML a partir da Beta 3, caso a base tenha sido restaurada.
- `vercel.json`: publica `dist` após `npm run build`.
- `.github/workflows/pages.yml`: compilação para GitHub Pages (exige Pages habilitado nas configurações).
- `docs/CHANGELOG_LOTES_03_10.md`: registro das oito etapas implementadas.
- `docs/QA_LOTES_03_10.md`: alcance dos ensaios e restrições.
- `tests/`: scripts automatizados de regressão, operações e backup.
- `reports/`: resultados de teste em JSON, com evidências concretas.

## Como utilizar
1. Faça cópia de segurança no Nimbo atual, em Ajustes → Dados e backup.
2. Rode `npm run build` com Node 18 ou superior e abra `dist/index.html` em navegador atual. Se estiver hospedado, utilize HTTPS.
3. Os 50 aplicativos continuam na Loja. Instale o app desejado sem apagar seus dados. Os novos recursos aparecem em **Ferramentas avançadas**, **análises e produtividade** ou outros painéis complementares.
4. A sessão de mídia exige selecionar novamente o arquivo local; o app só retém o nome e a posição da reprodução.
5. Realize os testes no seu navegador e dispositivo antes de migrar qualquer dado valioso. Não trate esta Beta como estável.

## Política de dados
As novas preferências, marcações, revisões e relatórios salvos ficam em `localStorage` sob `nimbo-ops-v1` (teto de 850 KB). A chave foi incorporada à lista de backup e à restauração. Bases legadas continuam no modelo existente. Dados adicionais são originados exclusivamente de interações locais, sem APIs remotas nem transmissão a terceiros.

## Limitações importantes
- `file://` e navegadores móveis podem restringir armazenamento, File System Access, clipboard e outras APIs. Não há acesso irrestrito ao disco.
- A retomada de mídia não dispensa a seleção do arquivo após reabrir a janela.
- As notas do PDF são vinculadas ao nome do arquivo (não ao hash); dois PDFs com mesmo nome podem compartilhar notas.
- O navegador embutido usa iframe e não contorna bloqueios de sites externos.
- O agendamento de cartões utiliza aproximação de SM-2; não é FSRS.
- Os painéis de dados trabalham com entradas locais do usuário, não sincronizam bancos, contas, email ou serviços de terceiros.
- Os testes automatizados não comprovam desempenho prolongado, suporte a codecs, impressão/arquivos reais no Android, permissões de pastas ou atualizações online.
- Esta versão foi disponibilizada na branch `main` como prévia Beta 4; não é uma versão estável.
## Testes locais

Execute `npm run build` para reconstruir e verificar o HTML. Para testes de interface, instale Python 3 e `playwright`, execute `python -m playwright install chromium` (ou defina `NIMBO_CHROMIUM_PATH` com o binário disponível) e rode `python tests/test_regression.py`, `python tests/test_interactions.py` e `python tests/test_backup.py`. Os resultados são gravados em `reports/`. A automação não substitui os testes em dispositivos reais.

## Implantação

- **Vercel:** importe este repositório. A configuração `vercel.json` executa `npm run build` e publica `dist/`. Não exige serviços externos na execução do aplicativo.
- **GitHub Pages:** ative Pages com origem GitHub Actions em Settings → Pages. Até essa habilitação, o workflow apenas compila/verifica integridade; depois, também publica `dist/`.
- **Integridade:** `npm run build` falha se o HTML não coincidir com tamanho e SHA-256 documentados no manifesto. A versão é Beta e requer homologação em dispositivos reais.


## Nimbo OS PWA instalável (0.14.1-beta.4)

Esta atualização mantém a Beta 4 e os 50 miniaplicativos. O comando `npm run build` agora prepara a versão PWA instalável em `dist/`, com `manifest.webmanifest`, ícones 192/512, `sw.js` e `updates.json`. O HTML completo continua disponível em `dist/index.html` após a compilação. Para instalar, publique em HTTPS (Vercel/GitHub Pages) ou use `localhost`; abrir apenas o HTML por `file://` não habilita instalação ou Service Worker. A central Atualizações verifica a versão, baixa sistema e miniapps empacotados e exige confirmação para ativar. Ela não remove os dados locais do usuário.

- `npm run test:pwa` executa verificações do manifesto, scripts e ciclo de vida do Service Worker simulado.
- Veja [instalação e uso](docs/INSTALACAO_PWA.md) e [QA PWA](docs/QA_PWA.md) para limitações e próximos testes em hardware.
