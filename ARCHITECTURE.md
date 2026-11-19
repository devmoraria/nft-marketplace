# ARCHITECTURE

Decisões, limitações e contratos do NFT Marketplace. Setup, comandos, credenciais, cenários e resultados do Lighthouse estão no [README.md](./README.md).

## Mocks (MSW)

- Handlers por recurso em `src/mocks/handlers` (auth, conta/perfil, nfts, favoritos, carrinho, checkout) sobre um banco em memória (`src/mocks/db.ts`).
- Cenários determinísticos em `src/mocks/scenarios.ts`; controles de teste e demonstração em `window.__mocks` (`src/mocks/controls.ts`).
- Ativados por `VITE_ENABLE_MOCKS=true`, que está em `.env` e `.env.production`, então também valem no build publicado. Componentes, hooks e o cliente Axios não têm respostas fictícias: tudo passa pela camada de rede do MSW.

## Transporte HTTP (Axios)

- Todas as chamadas REST passam pela instância `http` (`src/shared/api/http.ts`), com `baseURL: '/api'` e timeout de 8 s.
- O interceptor de requisição envia `Authorization: Bearer <token>` (lido da sessão) e `X-Cart-Id` (identificador do carrinho do visitante).
- O interceptor de resposta converte qualquer falha em `AppError` (`status`, `code`, `message`, `fields?`). Cancelamentos passam intactos, para o TanStack Query descartar respostas obsoletas.
- Corpo de erro da API: `{ error: { code, message, fields? } }`. Falhas sem resposta viram `TIMEOUT` (status 0, `ECONNABORTED`) ou `NETWORK_ERROR` (status 0). Códigos de sessão: `UNAUTHENTICATED` e `SESSION_EXPIRED` (401); `NFT_NOT_FOUND` para detalhe inexistente.

## Contratos REST

Tipos de requisição e resposta em `src/shared/api/types.ts`; implementação simulada em `src/mocks/handlers`. Erros seguem o formato descrito em "Transporte HTTP". Valores em ETH trafegam como strings decimais e as contas usam `decimal.js`.

| Recurso | Rotas |
|---|---|
| Sessão e conta | `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/session`, `POST /api/auth/logout` |
| NFTs | `GET /api/nfts` (busca, filtros, ordenação e paginação), `GET /api/nfts/facets`, `GET /api/nfts/:id` |
| Favoritos | `GET /api/favorites`, `PUT /api/favorites/:nftId`, `DELETE /api/favorites/:nftId` |
| Carrinho | `GET /api/cart`, `DELETE /api/cart`, `POST /api/cart/items`, `PATCH /api/cart/items/:id`, `DELETE /api/cart/items/:id`, `POST /api/cart/merge`, `POST /api/cart/refresh` |
| Cotação | `POST /api/quotes` |
| Pedidos | `POST /api/orders` (idempotente), `GET /api/orders`, `GET /api/orders/:id` |
| Perfil | `GET /api/profile`, `PATCH /api/profile`, `POST /api/profile/password` |
| Carteiras | `GET /api/wallets`, `POST /api/wallets`, `PATCH /api/wallets/:id` |

A criação de pedido aceita uma chave de idempotência: a mesma chave recupera o mesmo pedido.

## Sessão

- A sessão (`{ token, user }`) fica em `localStorage`, chave `auth` (`src/features/auth/session.ts`), e é lida por `useSyncExternalStore`. Por isso sobrevive ao refresh e sincroniza entre abas pelo evento `storage`.
- No servidor simulado, a sessão é um registro em `db.sessions` com `token`, `userId` e `expiresAt`. Um token ausente, desconhecido ou vencido resulta em 401 `UNAUTHENTICATED` (`src/mocks/session.ts`).
- O cenário `session-expired` faz toda rota protegida responder 401 `SESSION_EXPIRED`, para exercitar a expiração durante a navegação e o checkout.
- O carrinho é identificado pelo `userId` quando há sessão e pelo `X-Cart-Id` quando é visitante.
- O parâmetro `?redirect=` só aceita caminhos internos (`safeRedirect`), para não virar redirecionamento aberto.
- Senhas existem nas fixtures apenas como hash SHA-256.

## Tempo real (Socket.IO)

### Transporte e limitações do ambiente de mocks

- O servidor Socket.IO é simulado pelo MSW (`ws.link('*')`) com `@mswjs/socket.io-binding`, e a aplicação usa o `socket.io-client` de verdade. Nenhum evento é injetado direto na UI, no cache ou em callbacks.
- O binding envia o handshake (`0{sid, pingInterval, pingTimeout}` e `40{sid}`). Três coisas foram completadas em `src/mocks/realtime.ts`:
  1. **Ping:** no Engine.IO v4 quem envia o ping (`2`) é o servidor. Sem ele, o `socket.io-client` derruba a conexão em cerca de 30 s (`pingInterval` mais `pingTimeout`). O mock envia `2` a cada 20 s.
  2. **Autenticação:** o binding não expõe o `auth` do pacote CONNECT, então o mock lê o pacote bruto `40{...}`, extrai o `token` e resolve o usuário em `db.sessions` (token inexistente ou vencido vira visitante).
  3. **Entrega:** `order.updated` só vai para o socket do dono do pedido; `nft.updated` vai para todos.
- O servidor simulado roda dentro da página. Por isso: os controles de `window.__mocks` só atingem sockets da mesma aba; cada aba tem seu próprio conjunto de conexões; só o fluxo servidor para cliente é tratado (do cliente, o mock lê apenas o CONNECT); WebSockets que não são `/socket.io` (como o HMR do Vite) passam direto para o servidor real.
- Os eventos saem de uma comparação periódica de versões no banco (tick de 1 s, ligado na primeira conexão e desligado quando não há sockets). Assim, qualquer mudança no banco (polling REST, `resolveOrder`, `setNftPrice`, `setStock`) gera o evento correspondente, e as respostas REST e os eventos nunca divergem. Os controles chamam o tick imediatamente, sem esperar 1 s.

### Eventos

| Evento | Campos |
|---|---|
| `nft.updated` | `eventId`, `nftId`, `version`, `priceEth`, `editions[] { id, priceEth, available }`, `occurredAt` |
| `order.updated` | `eventId`, `orderId`, `userId`, `version`, `status`, `txRef?`, `rejectReason?`, `occurredAt` |

Todo evento tem identidade estável (`eventId`), recurso afetado e `version`, para o cliente descartar duplicatas e eventos antigos. Valores em ETH trafegam como strings decimais.

### Controles para reproduzir as condições

| Controle | Situação reproduzida |
|---|---|
| `replayLastEvent()` | Duplicata: mesmo `eventId` reenviado |
| `emitStale()` | Evento antigo: `eventId` novo, `version` menor |
| `disconnectSocket()` | Queda de conexão (o cliente reconecta sozinho) |
| `resolveOrder(id?, outcome?)` | Vence o prazo do pedido pendente (`confirmed` ou `rejected`) |
| `setNftPrice(id, priceEth)` / `setStock(id, editionId, n)` | Mudança de preço ou estoque durante a navegação |

### Sessão e subscriptions

- `RealtimeBridge` (`src/shared/realtime/RealtimeBridge.tsx`) inicia o socket dentro do `QueryClientProvider` e depende do `userId` da sessão (`guest` sem sessão). Ao logar, deslogar ou trocar de usuário, o efeito encerra o socket anterior e abre outro com o token novo.
- No servidor simulado, eventos de pedido só chegam ao dono, o que impede que um usuário receba dados de outro.

### Cliente: deduplicação e reconciliação com a REST

Implementado em `src/shared/realtime/client.ts`.

- **Conexão:** `socket.io-client` com `transports: ['websocket']`. O `auth` é uma função, então o token é relido a cada (re)conexão e acompanha login e logout. Reconexão automática com atraso de 500 ms até 5 s. O módulo é importado dinamicamente de propósito: o `engine.io-client` guarda o `WebSocket` global ao carregar, e se isso ocorresse antes de o MSW iniciar, o mock nunca enxergaria a conexão.
- **Duplicatas:** um `eventId` já visto é descartado (guarda os últimos 500).
- **Eventos antigos:** para cada entidade (`order:<id>`, `nft:<id>`), um evento com `version` menor ou igual à última aceita é descartado, então um estado mais recente nunca regride. A deduplicação é criada a cada início do cliente, ou seja, é reiniciada a cada troca de usuário.
- **Validação:** eventos sem `eventId` (texto) ou `version` (número) são ignorados.
- **`order.updated`:** ignorado se o `userId` do evento não for o da sessão atual. Se o pedido está no cache (`['user', userId, 'order', orderId]`) e a versão do evento é maior, o cache é atualizado com `status`, `version`, `txRef` e `rejectReason`.
- **`nft.updated`:** invalida as consultas ativas cuja chave começa com `nft` ou `catalog` (catálogo e detalhe). Se algum item do carrinho foi afetado (preço da edição diferente do preço do item, comparado com `Decimal`, ou estoque menor que a quantidade), o cliente anuncia a mudança na região `aria-live` `#live` (por exemplo, "O preço ou a disponibilidade de X mudou. Revise antes de finalizar.") e invalida o carrinho e a cotação do checkout, que são refeitos pela REST.
- **Reconexão:** a cada `connect` depois da primeira, o cliente invalida todas as consultas ativas e refaz tudo pela REST, porque eventos podem ter sido perdidos durante a queda.
- **Polling como reserva:** enquanto o socket está conectado, o polling do pedido usa um intervalo maior; sem socket, ele cobre a atualização do estado.
- **Encerramento:** ao encerrar o ciclo de vida (troca de usuário ou desmontagem), o cliente remove os listeners e desconecta o socket.

A REST é a fonte da verdade: o evento só atualiza o cache diretamente no caso do pedido (com checagem de versão); no resto ele dispara a consulta de novo à API. O checkout nunca confirma com cotação antiga, porque a cotação é refeita pela API.

## Carrinho e pedidos

- O carrinho só é esvaziado dos itens comprados quando o pedido vira `confirmed` (`resolveDueOrders`). Em pedido `rejected` ou `pending`, os itens permanecem.
- Pedido criado com chave de idempotência; a mesma chave recupera o mesmo pedido.

## Cache e retries (TanStack Query)

- `shouldRetry` (`src/shared/api/http.ts`): até 2 tentativas, só para erro de rede (status 0) ou 5xx; 4xx não é repetido.
- Carrinho, detalhe do NFT e carteiras usam `shouldRetry`. As demais consultas usam o padrão do `QueryClient` (sem opções em `main.tsx`).
- Chaves privadas começam com `['user', id]` (carteiras) ou incluem o id do usuário (favoritos) e são limpas no logout.

## Conta

- Perfil (dados, avatar em data URL até 150 KB, senha) e carteiras (principal/secundária, validação de endereço por rede) em `src/features/account`.
- Favoritos: atualização otimista com rollback (`src/features/favorites/queries.ts`) e listagem em `/favoritos`.

## Mobile

- A barra inferior navega para início, favoritos, carrinho e perfil. "Escanear" permanece desabilitado (fora do escopo). "Sair" está no topo das páginas de conta.

## Performance

Resultados, ambiente e análise das auditorias Lighthouse estão no [README.md](./README.md#lighthouse). Resumo: Accessibility, Best Practices e SEO atingem as metas nos quatro perfis; só a Performance mobile (75 a 77) fica abaixo de 90, e a causa medida é a espera até o pedido da imagem do LCP (JavaScript e inicialização do MSW antes do primeiro render).

## Limitações conhecidas

- Ações auxiliares fora do escopo (ex.: favoritar nos cards da home, escanear) permanecem desabilitadas, sem aparentar sucesso.
- O servidor Socket.IO simulado não é compartilhado entre abas (ver "Transporte e limitações").
- Performance mobile abaixo da meta (ver "Performance").
- A atualização do catálogo e do detalhe por evento usa o prefixo da chave da consulta (`nft` ou `catalog`); consultas novas fora desse prefixo não são atualizadas por `nft.updated`.

## Desvios do Figma e decisões de UX

Pendente: substituições de asset, estados que não existiam nos frames (Perfil, Carteiras e Confirmação em mobile) e ajustes de acessibilidade em relação ao layout.
