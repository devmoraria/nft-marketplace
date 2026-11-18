import Decimal from 'decimal.js'
import type { Cart, Network, Order, Quote, Wallet } from '@/shared/api/types'
import { NETWORKS } from '@/shared/api/types'
import { getDb, mutate, type OrderRecord } from '../db'
import { MockError } from '../errors'
import { toNft } from '../fixtures/nfts'
import type { Scenario } from '../scenarios'
import { effectivePrice } from './cart'

const QUOTE_TTL_MS = 2 * 60 * 1000
const RESOLVE_MS = 3000
const TIMEOUT_MS = 45_000
const NETWORK_FEE: Record<Network, string> = { ethereum: '0.002', polygon: '0.0005', solana: '0.0001' }

const hex = (n: number) =>
  Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('')

function nftVersion(id: string): number {
  const r = getDb().nfts.find((n) => n.id === id)
  return r ? toNft(r).version : 0
}
const priceVersionOf = (lines: Quote['lines']) => lines.map((l) => `${l.nftId}@${nftVersion(l.nftId)}`).join(',')

// ---------- carteiras ----------
function fakeAddress(seed: string, len: number): string {
  let h = 2166136261
  let out = ''
  for (let i = 0; out.length < len; i++) {
    for (const c of `${seed}:${i}`) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0 }
    out += h.toString(16).padStart(8, '0')
  }
  return out.slice(0, len)
}

export function listWallets(userId: string): Wallet[] {
  return mutate((db) => {
    db.wallets[userId] ??= [
      { id: `${userId}-w1`, label: 'MetaMask', address: `0x${fakeAddress(`${userId}1`, 40)}`, network: 'ethereum', kind: 'primary' },
      { id: `${userId}-w2`, label: 'Carteira Polygon', address: `0x${fakeAddress(`${userId}2`, 40)}`, network: 'polygon', kind: 'secondary' },
      { id: `${userId}-w3`, label: 'Phantom', address: fakeAddress(`${userId}3`, 44), network: 'solana', kind: 'secondary' },
    ]
    return db.wallets[userId]
  })
}

// ---------- cotação ----------
export function createQuote(input: unknown, scenario: Scenario, cart: Cart | null): Quote {
  const body = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const fields: Record<string, string> = {}
  const rawItems = Array.isArray(body.items) ? body.items : []
  const items: { nftId: string; editionId: string; quantity: number }[] = []
  if (!rawItems.length) fields.items = 'Informe ao menos um item.'
  for (const raw of rawItems) {
    const r = (raw ?? {}) as Record<string, unknown>
    if (typeof r.nftId === 'string' && typeof r.editionId === 'string' && Number.isInteger(r.quantity) && (r.quantity as number) >= 1) {
      items.push({ nftId: r.nftId, editionId: r.editionId, quantity: r.quantity as number })
    } else fields.items = 'Item inválido.'
  }
  const network = body.network
  if (typeof network !== 'string' || !(NETWORKS as readonly string[]).includes(network)) fields.network = 'Rede inválida.'
  if (Object.keys(fields).length) throw new MockError(422, 'VALIDATION_ERROR', 'Confira os campos informados.', fields)

  const issues: Quote['issues'] = []
  const lines: Quote['lines'] = items.map((it) => {
    const rec = getDb().nfts.find((n) => n.id === it.nftId)
    if (!rec) throw new MockError(404, 'NFT_NOT_FOUND', 'NFT não encontrado.')
    const ed = toNft(rec).editions.find((e) => e.id === it.editionId)
    if (!ed) throw new MockError(404, 'EDITION_NOT_FOUND', 'Edição não encontrada.')
    const unit = effectivePrice(ed.priceEth, scenario)
    const available = scenario === 'soldout' ? 0 : ed.available
    const ref = { nftId: it.nftId, editionId: it.editionId }
    if (available <= 0) issues.push({ code: 'SOLD_OUT', ...ref })
    else if (it.quantity > available) issues.push({ code: 'LIMIT_EXCEEDED', ...ref })
    const inCart = cart?.items.find((c) => c.nftId === it.nftId && c.editionId === it.editionId)
    if (inCart && !new Decimal(inCart.unitPriceEth).eq(unit)) issues.push({ code: 'PRICE_CHANGED', ...ref })
    return { ...ref, quantity: it.quantity, unitPriceEth: unit, lineTotalEth: new Decimal(unit).mul(it.quantity).toFixed() }
  })

  const subtotal = lines.reduce((s, l) => s.plus(l.lineTotalEth), new Decimal(0))
  let discount = new Decimal(0)
  let coupon: Quote['coupon']
  if (typeof body.couponCode === 'string' && body.couponCode.trim()) {
    const code = body.couponCode.trim().toUpperCase()
    const rec = getDb().coupons.find((c) => c.code === code)
    if (scenario === 'coupon-invalid' || !rec) coupon = { code, valid: false, reason: 'INVALID' }
    else if (Date.parse(rec.expiresAt) <= Date.now()) coupon = { code, valid: false, reason: 'EXPIRED' }
    else {
      coupon = { code, valid: true }
      discount = subtotal.mul(rec.percent).div(100)
    }
  }
  const fee = new Decimal(NETWORK_FEE[network as Network])
  const quote: Quote = {
    quoteId: `quote-${crypto.randomUUID().slice(0, 8)}`,
    expiresAt: new Date(Date.now() + QUOTE_TTL_MS).toISOString(),
    priceVersion: priceVersionOf(lines),
    lines,
    subtotalEth: subtotal.toFixed(),
    discountEth: discount.toFixed(),
    networkFeeEth: fee.toFixed(),
    totalEth: subtotal.minus(discount).plus(fee).toFixed(),
    ...(coupon ? { coupon } : {}),
    issues,
  }
  mutate((db) => {
    const cutoff = Date.now() - 60 * 60 * 1000
    for (const [id, q] of Object.entries(db.quotes)) if (Date.parse(q.expiresAt) < cutoff) delete db.quotes[id]
    db.quotes[quote.quoteId] = quote
  })
  return quote
}

// ---------- pedidos ----------
export function toOrder(r: OrderRecord): Order {
  return {
    id: r.id, status: r.status, version: r.version, receipt: r.receipt,
    ...(r.txRef ? { txRef: r.txRef } : {}),
    ...(r.rejectReason ? { rejectReason: r.rejectReason } : {}),
  }
}

// A cotação não guarda a rede; derivamos pela taxa para não mudar o tipo Quote.
function inferNetwork(q: Quote): Network {
  return (Object.keys(NETWORK_FEE) as Network[]).find((n) => NETWORK_FEE[n] === q.networkFeeEth) ?? 'ethereum'
}

export function createOrder(
  userId: string, idemKey: string | null, input: unknown, scenario: Scenario,
): { order: Order; replay: boolean } {
  if (!idemKey) throw new MockError(400, 'IDEMPOTENCY_KEY_REQUIRED', 'Envie o header Idempotency-Key.')
  const b = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const fields: Record<string, string> = {}
  if (typeof b.quoteId !== 'string' || !b.quoteId) fields.quoteId = 'Informe a cotação.'
  if (typeof b.walletId !== 'string' || !b.walletId) fields.walletId = 'Escolha uma carteira.'
  if (Object.keys(fields).length) throw new MockError(422, 'VALIDATION_ERROR', 'Confira os campos informados.', fields)
  const quoteId = b.quoteId as string
  const walletId = b.walletId as string

  // 1) idempotência primeiro: repetir a mesma chave depois de a cotação expirar ainda devolve o mesmo pedido
  const bodyHash = `${quoteId}|${walletId}`
  const scoped = `${userId}:${idemKey}`
  const prior = getDb().idempotency[scoped]
  if (prior) {
    if (prior.bodyHash !== bodyHash) {
      throw new MockError(409, 'IDEMPOTENCY_CONFLICT', 'Esta chave já foi usada com outro corpo.')
    }
    const existing = getDb().orders.find((o) => o.id === prior.orderId)
    if (existing) return { order: toOrder(existing), replay: true }
  }

  // 2) cotação
  const quote = getDb().quotes[quoteId]
  if (!quote) throw new MockError(404, 'QUOTE_NOT_FOUND', 'Cotação não encontrada.')
  if (Date.parse(quote.expiresAt) <= Date.now()) throw new MockError(410, 'QUOTE_EXPIRED', 'A cotação expirou. Atualize o valor.')
  if (quote.issues.length) throw new MockError(409, 'QUOTE_INVALID', 'A cotação tem pendências.')
  if (priceVersionOf(quote.lines) !== quote.priceVersion) throw new MockError(409, 'PRICE_CHANGED', 'O preço mudou. Atualize a cotação.')

  // 3) carteira
  const wallet = listWallets(userId).find((w) => w.id === walletId)
  if (!wallet) throw new MockError(422, 'VALIDATION_ERROR', 'Carteira inválida.', { walletId: 'Carteira não encontrada.' })
  if (wallet.network !== inferNetwork(quote)) {
    throw new MockError(422, 'WALLET_NETWORK_MISMATCH', 'A carteira não é da rede da cotação.', { walletId: 'Rede diferente da cotação.' })
  }

  const record: OrderRecord = {
    id: `ord-${crypto.randomUUID().slice(0, 8)}`,
    status: 'pending',
    version: 1,
    userId,
    resolveAt: Date.now() + (scenario === 'order-timeout' ? TIMEOUT_MS : RESOLVE_MS),
    outcome: scenario === 'payment-rejected' ? 'rejected' : 'confirmed',
    receipt: {
      items: structuredClone(quote.lines),
      subtotalEth: quote.subtotalEth, discountEth: quote.discountEth,
      networkFeeEth: quote.networkFeeEth, totalEth: quote.totalEth,
      network: wallet.network, walletId: wallet.id, createdAt: new Date().toISOString(),
    },
  }
  mutate((db) => {
    db.orders.push(record)
    db.idempotency[scoped] = { bodyHash, orderId: record.id }
    const cart = db.carts[userId]
    if (cart) {
      cart.items = cart.items.filter((i) => !quote.lines.some((l) => l.nftId === i.nftId && l.editionId === i.editionId))
      cart.version += 1
    }
  })
  return { order: toOrder(record), replay: false }
}

// Move para confirmed/rejected os pedidos cujo prazo venceu. Retorna os alterados
// (o Socket.IO usa isso para emitir order.updated).
export function resolveDueOrders(now = Date.now()): OrderRecord[] {
  const due = getDb().orders.some((o) => o.status === 'pending' && o.resolveAt !== undefined && o.resolveAt <= now)
  if (!due) return []
  return mutate((db) => {
    const changed: OrderRecord[] = []
    for (const o of db.orders) {
      if (o.status !== 'pending' || o.resolveAt === undefined || o.resolveAt > now) continue
      o.status = o.outcome ?? 'confirmed'
      o.version += 1
      if (o.status === 'confirmed') o.txRef = `0x${hex(64)}`
      else o.rejectReason = 'PAYMENT_DECLINED'
      changed.push(o)
    }
    return changed
  })
}

export function listOrders(userId: string): Order[] {
  resolveDueOrders()
  return getDb().orders.filter((o) => o.userId === userId).map(toOrder).reverse()
}

export function getOrder(userId: string, id: string): Order {
  resolveDueOrders()
  // pedido de outro usuário responde 404, para não expor a existência dele
  const r = getDb().orders.find((o) => o.id === id && o.userId === userId)
  if (!r) throw new MockError(404, 'ORDER_NOT_FOUND', 'Pedido não encontrado.')
  return toOrder(r)
}
