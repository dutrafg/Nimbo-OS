# Relatório de qualidade — Nimbo OS 0.14.0-beta.4

**Resultado do desenvolvimento:** lotes 03–10 incorporados (40 miniaplicativos). As funções das etapas 01 e 02 permanecem na base. A etapa 01 não estava homologada na versão anterior e **não é declarada homologada aqui**.

## Ensaios concluídos

| Verificação | Resultado |
|---|---|
| Verificação sintática do script JS consolidado | **Passou** (`node --check`) |
| Catálogo na Loja | **50 apps encontrados** em ambas as larguras |
| Montagem e novos painéis dos 40 apps dos lotes 03–10 | **40/40 passaram** em 1440 px |
| Montagem e novos painéis dos 40 apps dos lotes 03–10 | **40/40 passaram** em 390 px |
| Exceções JavaScript de página nos cenários acima | **0 observadas** |
| Rolagem horizontal da página global nesses dois tamanhos | **Não observada** |
| Operações representativas de 34 aplicativos (dados controlados e ações de UI) | **34/34 passaram** |
| Backup completo por Ajustes → Dados e backup | **Passou**, incluiu `nimbo-ops-v1` e `nimbo-suite-contacts` |
| Comparação do manifesto de apps com etapas 03–10 | **40 IDs distintos, cinco por etapa** |
| Verificação de função mínima por tipo (Básico/Complexo) | **Passou na inicialização**; catálogo não garante profundidade de cada ação |

Nos testes de operação, os 34 cenários abrangem: conversão, cores, gradiente, datas, fusos, senha/frase, metrônomo, tons, Markdown, JSON, CSV, comparação textual, Unicode, Base64, URL, hashes, UUID, correio local e operações de registros. Consulte `reports/QA_interactions.json`.

## Ensaios não executados / bloqueados

- O navegador automatizado do ambiente bloqueou acesso a `http://127.0.0.1`, então não foi possível homologar o ciclo real de recarga/persistência em origem HTTP. O estado foi observado no armazenamento simulado e exportado por backup, mas isso não comprova durabilidade após reinício do navegador ou política de remoção de dados.
- Não foram testadas reprodução real de todos os codecs em Android, reabertura de vídeos com tamanho grande, PDF criptografado, PDF grande, permissão de pasta e arquivos do dispositivo, notificações em segundo plano, impressão, compatibilidade Firefox/Safari ou atualização online.
- As novas funções não foram submetidas a exploração manual completa em todas as combinações de dados. Também não houve teste de estresse com 10.000 arquivos, vazamentos de memória de longa duração nem auditoria de segurança externa.
- Sem testes de desempenho cronometrados ou comparação quantitativa com concorrentes.

## Restrições de produto

- O Nimbo é um **ambiente HTML/PWA**, não um kernel ou sistema operacional nativo; não pode instalar aplicativos executáveis do computador nem operar o sistema com privilégios do Windows/macOS/Linux.
- Nomes idênticos de PDFs compartilham anotações por nome; como melhoria futura, recomendar associação via hash quando suportado.
- Os extras são armazenamento local sob `nimbo-ops-v1`, limite de 850 KB. O backup de appData tem limite total preexistente de 4 MB.
- Os controles de revisão de cartões aplicam um modelo simplificado baseado em SM-2; não devem ser apresentados como Anki/FSRS.
- As sessões de Horizonte são endereços salvos, não navegadores isolados simultâneos e não contornam políticas CSP/X-Frame-Options.
- Processamento de imagem conserva limites de pixel e a escala de ingredientes só interpreta quantidades no início de linha.

## Decisão de release

**Apto para teste como Beta 4 local. Não homologado como 1.0 estável.**

Não houve push para GitHub nem publicação na branch `main`. Os testes restantes dependem de dispositivo/navegador real e autorização explícita para publicação.