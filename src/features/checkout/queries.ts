import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QuoteRequest } from '@/shared/api/types'
import { useSession } from '@/features/auth/session'
import * as api from './api'
import type { OrderBody } from './api'
import { isRealtimeConnected } from '@/shared/realtime/client'

const uidOf = (s: ReturnType<typeof useSession>) => s?.user.id ?? 'anon'

export function useWallets() {
  const uid = uidOf(useSession())
  return useQuery({ queryKey: ['user', uid, 'wallets'], queryFn: api.listWallets })
}

export function useQuote(req: QuoteRequest | null) {
  const uid = uidOf(useSession())
  return useQuery({
    queryKey: ['user', uid, 'quote', req],
    queryFn: () => api.createQuote(req as QuoteRequest),
    enabled: !!req && req.items.length > 0,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
  })
}

// Uma chave por (cotação + carteira): o retry reaproveita, mudou o conteúdo gera outra.
export function getIdempotencyKey(signature: string): string {
  try {
    const raw = sessionStorage.getItem('checkout:idem')
    if (raw) {
      const saved = JSON.parse(raw) as { signature: string; key: string }
      if (saved.signature === signature) return saved.key
    }
    const key = crypto.randomUUID()
    sessionStorage.setItem('checkout:idem', JSON.stringify({ signature, key }))
    return key
  } catch {
    return crypto.randomUUID()
  }
}

// O recibo só guarda o nftId; guardamos os títulos no momento da compra para exibir no recibo.
const TITLES_KEY = 'checkout:titles'
export function rememberTitles(items: { nftId: string; nft: { title: string } }[]): void {
  try {
    const prev = JSON.parse(sessionStorage.getItem(TITLES_KEY) ?? '{}') as Record<string, string>
    for (const i of items) prev[i.nftId] = i.nft.title
    sessionStorage.setItem(TITLES_KEY, JSON.stringify(prev))
  } catch { /* ignore */ }
}
export function titleOf(nftId: string): string {
  try {
    const map = JSON.parse(sessionStorage.getItem(TITLES_KEY) ?? '{}') as Record<string, string>
    return map[nftId] ?? nftId
  } catch {
    return nftId
  }
}

export const rejectText: Record<string, string> = {
  PAYMENT_DECLINED: 'A carteira recusou a transação.',
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    retry: false,
    mutationFn: ({ body, key }: { body: OrderBody; key: string }) => api.createOrder(body, key),
    onSuccess: (order) => {
      try { sessionStorage.setItem('checkout:pendingOrderId', order.id) } catch { /* ignore */ }
      void qc.invalidateQueries({ queryKey: ['user'] }) // o servidor já tirou os itens comprados do carrinho
    },
  })
}

export function useOrder(id: string) {
  const uid = uidOf(useSession())
  return useQuery({
    queryKey: ['user', uid, 'order', id],
    queryFn: () => api.getOrder(id),
    staleTime: 0,
    refetchInterval: (q) => (q.state.data?.status === 'pending' ? (isRealtimeConnected() ? 10_000 : 2000) : false),
  })
}

export const networkLabel: Record<string, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}
