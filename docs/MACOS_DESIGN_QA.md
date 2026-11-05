# Nimbo OS 0.14.2 Beta 4 — Revisão visual inspirada no macOS

Data: 2026-11-05
Base: Nimbo OS 0.14.1 Beta 4 PWA (50 miniaplicativos).

## Referências
- Apple Human Interface Guidelines — Designing for macOS: https://developer.apple.com/design/human-interface-guidelines/designing-for-macos
- Apple HIG — Windows e Dock menus: https://developer.apple.com/design/human-interface-guidelines/windows
- Suporte Apple Brasil — macOS Tahoe 26, Liquid Glass: https://support.apple.com/pt-br/122868

## Mudanças implementadas
1. Barra superior compacta com menus reais e atalhos.
2. Nova paleta azul/ciano, suporte a tema claro/escuro e wallpaper abstrato original.
3. Dock em vidro com fundo translúcido, favoritos, indicadores e posicionamento (rodapé/esquerda/direita).
4. Ícones internos com gradientes suaves e ícones do PWA originais.
5. Janelas arredondadas, sombras, barras de título e botões fechar/minimizar/maximizar.
6. Widgets refinados, busca e painéis translúcidos; adaptação por largura.
7. Central de controle do Nimbo, ações contextuais e menu Sobre.
8. Preservação do sistema, IDs, armazenamento, 50 miniaplicativos, Service Worker e versão de cache.

## Testes executados
- `npm run build`: aprovado, SHA-256 validado para a base Beta 4.
- `npm run test:pwa`: aprovado — manifesto, 4 ícones PNG, atualizador, Service Worker e offline simulado.
- Chromium com HTML completo por inserção controlada e armazenamento simulado:
  - 390 px, 768 px, 1440 px: 0 exceções JavaScript; 0 rolagem horizontal.
  - 8 widgets presentes nas três larguras, 6 menus disponíveis, dock inicialmente no rodapé.
  - Loja lista 50 miniaplicativos; Loja e Arquivos montados em janelas independentes.
  - Três controles de janela presentes; menu de minimizar e abrir Ajustes testados.
  - Atalhos Meta+Espaço, alternância de vidro e preferências simuladas aprovados.
- As evidências de interface estão em screenshots capturadas no Chromium.

## Limites da homologação
- A inserção controlada não equivale a teste de instalação PWA por HTTPS em hardware físico.
- Os dados de IndexedDB/localStorage reais, inclusive persistência após reinício de Android/Windows, precisam ser validados pelo usuário.
- A presença de 50 miniaplicativos na Loja não homologa todas as funções internas de cada app.
- Não usa ícones, logotipos, fontes ou wallpapers proprietários da Apple.