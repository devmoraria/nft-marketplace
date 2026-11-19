# NFT Marketplace

Marketplace de NFTs em React e TypeScript: descoberta, compra e conta do colecionador, em desktop e mobile. APIs, autenticação, carteiras, pagamentos e eventos em tempo real rodam com dados simulados (MSW), sem backend.

- Repositório: https://github.com/devmoraria/nft-marketplace
- URL pública: https://nft-marketplace-eight-tau.vercel.app/
- Decisões, limitações e desvios do Figma: [ARCHITECTURE.md](./ARCHITECTURE.md)

## Stack

React, TypeScript, TanStack Router, TanStack Query, Axios, Socket.IO (cliente), Tailwind CSS, shadcn/ui, MSW, Playwright e Lighthouse.

## Setup

Requisitos: Node.js 24 (testado com v24.21.0) e npm.

```bash
git clone https://github.com/devmoraria/nft-marketplace.git
cd nft-marketplace
npm ci
npx playwright install chromium
```

## Variáveis de ambiente

| Variável | Valor | Efeito |
|---|---|---|
| `VITE_ENABLE_MOCKS` | `true` | Inicia o MSW (service worker) antes de renderizar a aplicação |

O valor está em `.env` (desenvolvimento) e `.env.production` (build publicado), então os mocks funcionam no build de demonstração. Com qualquer outro valor, a aplicação não inicia o MSW e fala com uma API real, que não existe neste projeto.

## Comandos

| Objetivo | Comando |
|---|---|
| Desenvolvimento com mocks | `npm run dev` |
| Build de produção | `npm run build` |
| Preview do build | `npm run preview` |
| Verificação de tipos | `npm run typecheck` |
| Lint | `npm run lint` |
| Testes E2E (Playwright) | `npm run test:e2e` |
| Relatório HTML dos testes | `npx playwright show-report` |
| Auditoria Lighthouse (mediana de 3 medições) | `npm run lighthouse` |

Os testes rodam em Chromium, nos projetos `desktop` (1440x900) e `mobile` (390x844), sempre com os mocks. O Playwright sobe o servidor de desenvolvimento em `http://localhost:4173` com `VITE_ENABLE_MOCKS=true`. Falhas geram relatório HTML e traces (`retain-on-failure`).

Para testar o build publicado, troque `webServer.command` em `playwright.config.ts` por `npm run build && npm run preview -- --port 4173`.

## Credenciais fictícias

| E-mail | Senha |
|---|---|
| ana@example.com | Senha@123 |
| bruno@example.com | Senha@456 |

São dados de demonstração. As fixtures guardam apenas o hash SHA-256 das senhas. Use os dois usuários para verificar o isolamento de dados e a troca de usuário.

## Cenários dos mocks

Cenários são determinísticos e podem ser escolhidos de três formas:

1. Parâmetro na URL, que também persiste: `http://localhost:5173/?scenario=slow`
2. Console do navegador: `window.__mocks.setScenario('slow')`
3. `localStorage`, chave `mock:scenario`

Precedência: parâmetro da URL, valor já definido em memória, `localStorage`, `default`.

Cenários disponíveis: `default`, `empty`, `slow`, `flaky`, `offline`, `server-error`, `session-expired`, `signup-conflict`, `coupon-invalid`, `price-changed`, `soldout`, `order-timeout`, `payment-rejected`.

Latência: `default` 150 ms; `slow` 2500 ms; `flaky` alterna 1200 ms (requisição par) e 200 ms (ímpar) por um contador de requisições, nunca por `Math.random`, o que força respostas fora de ordem de forma reproduzível.

### Reset

```js
window.__mocks.reset()
```

Restaura o banco simulado, zera o contador de requisições, volta ao cenário `default` e reinicia o estado de tempo real.

### Controles de tempo real

Todos passam pelo servidor Socket.IO simulado e pelo `socket.io-client` da aplicação:

| Controle | Efeito |
|---|---|
| `__mocks.setNftPrice(nftId, priceEth)` | Muda o preço, sobe a `version` e emite `nft.updated` |
| `__mocks.setStock(nftId, editionId, available)` | Muda o estoque, sobe a `version` e emite `nft.updated` |
| `__mocks.resolveOrder(orderId?, 'confirmed' \| 'rejected')` | Resolve o pedido pendente e emite `order.updated` |
| `__mocks.disconnectSocket()` | Derruba os sockets; o cliente reconecta sozinho |
| `__mocks.replayLastEvent()` | Reenvia o último evento com o mesmo `eventId` (deve ser ignorado) |
| `__mocks.emitStale()` | Envia evento com `eventId` novo e `version` menor (deve ser ignorado) |

## Como reproduzir os fluxos de falha

| Fluxo | Como reproduzir |
|---|---|
| Lentidão e skeletons | `?scenario=slow` |
| Respostas fora de ordem | `?scenario=flaky`, alterne busca/filtros rapidamente |
| Sem conexão | `?scenario=offline` |
| Erro HTTP 5xx | `?scenario=server-error` |
| Sessão expirada | `?scenario=session-expired` |
| Conflito de cadastro | `?scenario=signup-conflict` |
| Cupom inválido ou expirado | `?scenario=coupon-invalid` |
| Preço alterado na compra | `?scenario=price-changed`, ou `__mocks.setNftPrice(...)` com o carrinho aberto |
| Edição esgotada | `?scenario=soldout`, ou `__mocks.setStock(...)` |
| Timeout após criar o pedido (recuperação por idempotência) | `?scenario=order-timeout`, depois `__mocks.resolveOrder()` |
| Pagamento recusado | `?scenario=payment-rejected` |
| Evento duplicado ou antigo | `__mocks.replayLastEvent()` e `__mocks.emitStale()` |
| Desconexão com pedido pendente | `__mocks.disconnectSocket()` durante o pedido pendente |

## Testes

Arquivos em `tests/e2e`: `auth`, `catalog`, `checkout`, `account`, `favorites`, `favorites-page` e `realtime`. Cada teste parte de um estado isolado via `__mocks.reset()`.

## Documentação técnica

Contratos REST e eventos, política de sessão, estado do carrinho, estratégia de cache e reconciliação entre REST e Socket.IO, além de limitações, decisões de UX e desvios do Figma, estão em [ARCHITECTURE.md](./ARCHITECTURE.md).

## Lighthouse

Auditoria de início (`/`) e detalhe do NFT (`/nft/nft-1`), nos perfis mobile e desktop, com build otimizado (`npm run build` + `npm run preview`), mocks ativos e cenário `default`. Cada página e perfil é medido 3 vezes e a tabela traz a **mediana**.

```bash
npm run lighthouse
```

Requer Google Chrome instalado. A configuração está em `lighthouse/median.mjs` (versionada). Para auditar outro NFT: `LH_NFT_ID=<id> npm run lighthouse`. Relatórios HTML e JSON de cada medição, mais `summary.json` e `summary.md`, ficam em `lighthouse/reports/`.

### Resultado (mediana de 3 medições, 19/11/2026)

| Página | Perfil | Performance | Accessibility | Best Practices | SEO | LCP (ms) | CLS | TBT (ms) |
|---|---|---|---|---|---|---|---|---|
| Início | mobile | **77** | 98 | 100 | 100 | 4343 | 0 | 358 |
| Início | desktop | 99 | 96 | 100 | 100 | 1043 | 0,002 | 0 |
| Detalhe | mobile | **75** | 100 | 100 | 100 | 4408 | 0 | 417 |
| Detalhe | desktop | 98 | 97 | 100 | 100 | 1186 | 0,019 | 0 |

Metas: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90. Só **Performance no mobile** (início e detalhe) fica abaixo da meta.

### Ambiente e condições

- Lighthouse 13.6.0, HeadlessChrome 157, Node v24.21.0
- Windows 10 (build 19045), 4 CPUs, 14 GB de RAM
- Preset padrão do Lighthouse: mobile com throttling simulado (rede lenta e CPU 4x mais lenta); desktop com o preset desktop
- Servidor: `vite preview` em `http://localhost:4173`, sem cache entre execuções
- Imagens, fontes e funcionalidades completas, sem simplificações para melhorar a pontuação

### Por que Performance mobile fica abaixo de 90

No mobile, LCP de 4,3 a 4,4 s e TBT de 358 a 417 ms, medidos com throttling simulado. O detalhamento do LCP na trilha observada (sem throttling) mostra onde o tempo vai:

| Página (mobile) | TTFB | Espera até pedir a imagem | Download da imagem | Atraso de renderização |
|---|---|---|---|---|
| Início | 12 ms | **794 ms** | 48 ms | 50 ms |
| Detalhe | 29 ms | **1054 ms** | 83 ms | 155 ms |

A espera até o pedido da imagem responde por cerca de 80 a 90% do LCP observado. O servidor responde rápido e a imagem é pequena (webp de 12 a 52 kB). O atraso está antes: a imagem do LCP não existe no HTML inicial e só é pedida depois que o JavaScript é baixado e executado, o MSW é iniciado e a API simulada responde. Em `src/main.tsx`, a renderização espera o `worker.start()` do MSW, porque as primeiras consultas dependem dos mocks. O chunk do MSW tem 473 kB (174 kB gzip), o bundle principal tem 328 kB (101 kB gzip), e o Lighthouse estima cerca de 120 KiB de JavaScript não usado. Sob CPU 4x mais lenta, esse custo de download, parse e execução domina o LCP e o TBT.

O MSW precisa estar no build publicado, porque o desafio exige os mocks e os fluxos de tempo real na demonstração, e por isso não foi removido nem adiado. Não medimos separadamente a fatia exata do MSW dentro dessa espera.

### Correções aplicadas a partir das primeiras medições

| Problema encontrado | Correção | Efeito |
|---|---|---|
| SEO 83: sem `meta description` e `robots.txt` inválido (a SPA devolvia HTML) | `meta description` em `index.html` e `public/robots.txt` | SEO 100 em todos os perfis |
| CLS 0,599 no detalhe desktop: o skeleton era bem mais curto que o conteúdo e o rodapé era empurrado ao carregar | Altura mínima reservada no skeleton do detalhe | CLS 0,019 |
| Imagem principal do detalhe sem `fetchpriority` | `fetchPriority="high"` nas imagens da galeria | Sem efeito isolado mensurável: Performance mobile do detalhe foi de 73 para 75 |

A Performance mobile do início variou de 63 para 77 entre as duas rodadas sem nenhuma alteração nessa página (o TBT foi de 915 para 358 ms). Isso indica variação entre execuções em ambiente local com throttling simulado, e por isso a tabela usa a mediana de 3 medições.
