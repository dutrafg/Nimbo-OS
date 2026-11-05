# Nimbo OS · Desenvolvimento dos lotes 3–10

Versão consolidada: **0.14.0-beta.4**. Base: `Nimbo_OS_0.13.0_Beta3_Lote2_5_Apps.html` (Beta 3). Nenhuma publicação na `main`.

## Etapa 3 · Som, Cinema, Documentos PDF, Horizonte, Conversor
- **Som e Cinema**: retomada após reabrir o arquivo original, posições marcadas e anotadas por mídia, exportação de marcações, preferências de volume/velocidade. A aplicação não obtém acesso permanente ao arquivo local.
- **PDF**: caderno de leitura com notas por página, última página guardada, exportação de anotações JSON, limpeza seletiva. Não modifica nem assina o PDF original.
- **Horizonte**: até 20 abas de sessão salvas como endereços; renomear, alternar, fechar e exportar. O navegador interno continua sujeito a políticas de iframe dos sites.
- **Conversor**: energia, pressão, frequência, ângulo e consumo de combustível, com validação, inversão, cópia e resultado legível. Mantém as oito categorias originais.

## Etapa 4 · Cronômetro, Contatos, Finanças pessoais, Hábitos, Projetos
- **Cronômetro**: análise de regularidade das voltas (coeficiente de variação), exportação JSON.
- **Contatos**: vCard 3.0, aniversários futuros e verificação sintática de email.
- **Finanças**: fluxo de caixa por mês, total de despesas por categoria e balanço em CSV.
- **Hábitos**: marcação diária, total semanal e cálculo da sequência atual. Histórico auxiliar versionado.
- **Projetos**: quadro por estágio, atrasos e prioridades.

## Etapa 5 · Lista de compras, Diário, Cartões de estudo, Favoritos, Lista de leitura
- **Compras**: estimativa do restante, checklist exportável, gasto por categoria.
- **Diário**: distribuição mensal, humor e volume de texto.
- **Cartões**: resposta disponível, notas de revisão novamente/bom/fácil e próximo vencimento pelo modelo simplificado SM-2 (não FSRS).
- **Favoritos**: agrupamento por domínio, sintaxe de URL e formato de favoritos Netscape HTML.
- **Leitura**: percentuais, páginas restantes e ordenação por progresso.

## Etapa 6 · Receitas, Inventário pessoal, Metas, Planejador semanal, Trechos de código
- **Receitas**: escalonamento numérico simples de ingredientes, tempos registrados e checklist de ingredientes.
- **Inventário**: valor total estimado, quantidade baixa e consolidação por localização.
- **Metas**: progresso percentual, prazo próximo e alvo atingido.
- **Planejador**: próximos sete dias, conflitos de horário e calendário ICS UTC.
- **Trechos de código**: cópia segura de texto inerte, distribuição de linguagens e exportação TXT.

## Etapa 7 · Markdown, Editor JSON, Tabelas CSV, Comparar textos, Laboratório de texto
- **Markdown**: sumário, links wiki, caixas de tarefa e contagem de termos.
- **JSON**: JSON Pointer, inventário de tipos, comparação de propriedades e propriedades ausentes.
- **CSV**: remoção de duplicatas, ordenação, estatística numérica e detecção de largura irregular.
- **Comparador**: contagem de diferenças, comparação de palavras, prefixos/sufixos comuns e espaços finais.
- **Texto**: slug para URL, frequências, normalização de espaços e divisão em frases.

## Etapa 8 · Expressões regulares, Base64, Ferramentas de URL, Unicode, Verificar arquivos
- **Regex**: modelos de padrões e validação sintática de flags sem execução.
- **Base64**: validação de sintaxe, bytes UTF-8 e interpretação de data-URI.
- **URL**: remoção de parâmetros conhecidos de rastreamento, ordenação/extração de parâmetros e diagnóstico de origem.
- **Unicode**: NFC, NFD, remoção de diacríticos, pontos de código e comprimento UTF-8.
- **Hash**: comparação SHA-256 com valor esperado, manifesto de linhas e estatísticas do conteúdo.

## Etapa 9 · UUID, Correio local, Cores, Gradientes, Oficina de imagens
- **UUID**: contagem de repetidos, arrays JSON e detecção básica de versão.
- **Correio local**: validação de cabeçalhos, resumo seguro de EML e indicação de anexos MIME sem executá-los.
- **Cores**: tríades, cores análogas, contraste AA/AAA e variáveis CSS.
- **Gradientes**: painel adicional com prévia e exportações CSS/SVG.
- **Imagem**: cores dominantes aproximadas, médias RGB e ampliação 2× respeitando limite de pixels.

## Etapa 10 · Calculadora de datas, Fusos horários, Gerador de senhas, Metrônomo, Gerador de tons
- **Datas**: semana ISO, trimestre, bissexto, dias inclusivos e finais de semana.
- **Fusos**: comparação de UTC e diferenças sazonais em janeiro/julho.
- **Senhas**: gerador local de frases com aleatoriedade criptográfica e informação explícita de entropia teórica; não guarda frases.
- **Metrônomo**: duração de batida, subdivisões e plano manual de progressão.
- **Tons**: frequências de notas temperadas, aplicação da frequência no gerador e harmônicos.

## Melhorias transversais
- Painéis complementares responsivos, menus acessíveis, tratamento de erros por app.
- Dados auxiliares em `nimbo-ops-v1`, chave incluída na whitelist do backup/restauração. Registros atuais `nimbo-suite-*` não são migrados nem substituídos.
- Preservados IDs, montagem, catálogo com 50 aplicativos, Loja, dock e dashboard anteriores.
- Verificação de limite de funções por classe na inicialização.

**Ressalva:** nenhuma das 40 implementações representa port completo do software de referência. A etapa 1 permanece pendente de homologação e a persistência por recarga em navegador real não foi testada neste ambiente por bloqueio da rede local.