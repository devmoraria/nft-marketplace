import { http } from '@/shared/api/http'
import type { Order, Quote, QuoteRequest, Wallet } from '@/shared/api/types'

export interface OrderBody {
  quoteId: string
  walletId: string
  network: Wallet['network']
  collector: { displayName: string; email: string; note?: string }
}

export const listWallets = () => http.get<Wallet[]>('/wallets').then((r) => r.data)

export const createQuote = (body: QuoteRequest) =>
  http.post<Quote>('/quotes', body).then((r) => r.data)

export const createOrder = (body: OrderBody, idempotencyKey: string) =>
  http
    .post<Order>('/orders', body, { headers: { 'Idempotency-Key': idempotencyKey } })
    .then((r) => r.data)

export const getOrder = (id: string) => http.get<Order>(`/orders/${id}`).then((r) => r.data)
