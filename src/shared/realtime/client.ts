import type { QueryClient } from '@tanstack/react-query'
import Decimal from 'decimal.js'
import type { Socket } from 'socket.io-client'
import { getSession } from '@/features/auth/session'
import type { Cart, CartItem, NftUpdatedEvent, Order, OrderUpdatedEvent } from '@/shared/api/types'
import { EVENTS } from './events'

// Lido pelo polling do pedido: com o socket conectado, o polling vira só reserva (intervalo maior).
let connected = false
export const isRealtimeConnected = () => connected

// Descarta evento repetido (mesmo eventId) e evento antigo (version <= a última aceita da mesma entidade).
class Dedup {
  private ids = new Set<string>()
  private versions = new Map<string, number>()

  accept(eventId: string, entity: string, version: number): boolean {
    if (this.ids.has(eventId)) return false
    this.ids.add(eventId)
    if (this.ids.size > 500) {
      const oldest = this.ids.values().next().value
      if (oldest !== undefined) this.ids.delete(oldest)
    }
    const last = this.versions.get(entity)
    if (last !== undefined && version <= last) return false
    this.versions.set(entity, version)
    return true
  }
}

const validEvent = (e: unknown): boolean => {
  if (typeof e !== 'object' || e === null) return false
  const { eventId, version } = e as { eventId?: unknown; version?: unknown }
  return typeof eventId === 'string' && typeof version === 'number'
}

function announce(message: string): void {
  const el = document.getElementById('live')
  if (el) el.textContent = message
}

function onOrderUpdated(qc: QueryClient, userId: string, dedup: Dedup, ev: OrderUpdatedEvent): void {
  if (!validEvent(ev) || ev.userId !== userId) return
  if (!dedup.accept(ev.eventId, `order:${ev.orderId}`, ev.version)) return
  const key = ['user', userId, 'order', ev.orderId]
  const cached = qc.getQueryData<Order>(key)
  if (!cached || ev.version <= cached.version) return
  qc.setQueryData<Order>(key, {
    ...cached,
    status: ev.status,
    version: ev.version,
    ...(ev.txRef ? { txRef: ev.txRef } : {}),
    ...(ev.rejectReason ? { rejectReason: ev.rejectReason } : {}),
  })
}

// O item do carrinho foi afetado se o preço da edição mudou ou o estoque ficou menor que a quantidade.
function affected(item: CartItem, ev: NftUpdatedEvent): boolean {
  if (item.nftId !== ev.nftId) return false
  const ed = ev.editions.find((e) => e.id === item.editionId)
  if (!ed) return false
  return !new Decimal(ed.priceEth).eq(item.unitPriceEth) || ed.available < item.quantity
}

function onNftUpdated(qc: QueryClient, userId: string, dedup: Dedup, ev: NftUpdatedEvent): void {
  if (!validEvent(ev) || typeof ev.nftId !== 'string') return
  if (!dedup.accept(ev.eventId, `nft:${ev.nftId}`, ev.version)) return

  // Catálogo e detalhe: não conheço as chaves dessas queries, então invalido pelo prefixo "nft"/"catalog".
  // Só refaz o que está na tela (queries ativas).
  void qc.invalidateQueries({
    predicate: (q) => typeof q.queryKey[0] === 'string' && /^(nft|catalog)/.test(q.queryKey[0]),
  })

  const cart = qc.getQueryData<Cart>(['user', userId, 'cart'])
  const hit = cart?.items.find((i) => affected(i, ev))
  if (!hit) return
  announce(`O preço ou a disponibilidade de ${hit.nft.title} mudou. Revise antes de finalizar.`)
  // Refaz o carrinho e a cotação do checkout: o servidor devolve PRICE_CHANGED e as telas já tratam.
  void qc.invalidateQueries({ queryKey: ['user', userId, 'cart'] })
  void qc.invalidateQueries({ queryKey: ['user', userId, 'quote'] })
}

export function startRealtime(qc: QueryClient, userId: string): () => void {
  const dedup = new Dedup()
  let everConnected = false
  let stopped = false
  let socket: Socket | undefined

  // Import dinâmico de propósito: o engine.io-client guarda o WebSocket global quando o módulo
  // carrega. Se isso acontecer antes de o MSW iniciar, o mock nunca enxerga a conexão.
  void import('socket.io-client').then(({ io }) => {
    if (stopped) return
    const s = io({
      transports: ['websocket'],
      // Função: o token é relido a cada (re)conexão, então acompanha login e logout.
      auth: (cb) => {
        const session = getSession()
        cb(session ? { token: session.token } : {})
      },
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
    })
    socket = s

    s.on('connect', () => {
      connected = true
      // Reconexão: pode ter perdido eventos, então refaz as queries ativas.
      if (everConnected) void qc.invalidateQueries()
      everConnected = true
    })
    s.on('disconnect', () => { connected = false })
    s.on(EVENTS.orderUpdated, (ev: OrderUpdatedEvent) => onOrderUpdated(qc, userId, dedup, ev))
    s.on(EVENTS.nftUpdated, (ev: NftUpdatedEvent) => onNftUpdated(qc, userId, dedup, ev))
  })

  return () => {
    stopped = true
    socket?.removeAllListeners()
    socket?.disconnect()
    connected = false
  }
}
