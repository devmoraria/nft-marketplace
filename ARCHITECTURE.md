# ARCHITECTURE

> Em construção: seções marcadas como pendentes serão completadas antes da entrega.

## Mocks (MSW)
- Handlers por recurso em `src/mocks/handlers` (auth, conta/perfil, nfts, favoritos, carrinho, checkout) sobre um banco em memória (`src/mocks/db.ts`).
- Eventos em tempo real via Socket.IO simulado no MSW (`src/mocks/realtime.ts`); controles de teste em `window.__mocks` (reset, resolveOrder, desconexão, replay de evento).
- Cenários determinísticos em `src/mocks/scenarios.ts`.

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

## Limitações conhecidas
- Ações auxiliares fora do escopo (ex.: favoritar nos cards da home, escanear) permanecem desabilitadas, sem aparentar sucesso.
- Completar: transporte Socket.IO e limitações, política de sessão/expiração, reconciliação REST x Socket.IO, resultados do Lighthouse, desvios do Figma.

