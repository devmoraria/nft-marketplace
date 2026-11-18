import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/shared/api/types'
import { EVENTS } from '@/shared/realtime/events'
import { getDb, mutate, type OrderRecord } from './db'
import { toNft } from './fixtures/nfts'
import { resolveDueOrders } from './services/checkout'

// O binding (index.js) já manda o handshake: "0{sid,pingInterval:25000,pingTimeout:5000}" e "40{sid}".
// O que falta para o mock:
//  1) ping: no Engine.IO v4 quem manda "2" é o SERVIDOR; o cliente responde "3". Sem ping o
//     socket.io-client derruba a conexão em ~30 s (pingInterval + pingTimeout).
//  2) auth: o binding não expõe o auth do CONNECT, então lemos o pacote bruto "40{...}".
//  3) entrega: order.updated só para o dono do pedido; nft.updated para todos.

type Connection = Parameters<typeof toSocketIo>[0]

interface Peer {
  conn: Connection
  io: ReturnType<typeof toSocketIo>
  userId: string | null
  pingTimer: ReturnType<typeof setInterval>
}

type Outgoing =
  | { name: typeof EVENTS.orderUpdated; ownerId: string; payload: OrderUpdatedEvent }
  | { name: typeof EVENTS.nftUpdated; payload: NftUpdatedEvent }

const PING_MS = 20_000
const TICK_MS = 1000

const peers = new Set<Peer>()
const seenOrders = new Map<string, number>()
const seenNfts = new Map<string, number>()
let ticker: ReturnType<typeof setInterval> | null = null
let last: Outgoing | null = null

const newEventId = () => `evt-${crypto.randomUUID().slice(0, 8)}`
const now = () => new Date().toISOString()

function userIdFromConnect(data: unknown): string | null | undefined {
  if (typeof data !== 'string' || !data.startsWith('40')) return undefined // não é CONNECT
  const body = data.slice(2)
  if (!body.startsWith('{')) return null
  try {
    const { token } = JSON.parse(body) as { token?: unknown }
    if (typeof token !== 'string') return null
    const s = getDb().sessions.find((x) => x.token === token && Date.parse(x.expiresAt) > Date.now())
    return s?.userId ?? null
  } catch {
    return null
  }
}

function deliver(out: Outgoing): void {
  last = out
  for (const peer of peers) {
    if (out.name === EVENTS.orderUpdated && peer.userId !== out.ownerId) continue
    try {
      peer.io.client.emit(out.name, out.payload)
    } catch {
      dropPeer(peer)
    }
  }
}

function orderPayload(o: OrderRecord): OrderUpdatedEvent {
  return {
    eventId: newEventId(),
    orderId: o.id,
    userId: o.userId,
    version: o.version,
    status: o.status,
    ...(o.txRef ? { txRef: o.txRef } : {}),
    ...(o.rejectReason ? { rejectReason: o.rejectReason } : {}),
    occurredAt: now(),
  }
}

// Emite por diferença de versão: não importa quem mudou o db (o polling REST, o resolveOrder, outro código).
function tick(): void {
  resolveDueOrders()
  if (!peers.size) return
  const db = getDb()
  for (const o of db.orders) {
    const prev = seenOrders.get(o.id) ?? 1
    seenOrders.set(o.id, o.version)
    if (o.version > prev) deliver({ name: EVENTS.orderUpdated, ownerId: o.userId, payload: orderPayload(o) })
  }
  for (const r of db.nfts) {
    const nft = toNft(r)
    const prev = seenNfts.get(r.id) ?? nft.version
    seenNfts.set(r.id, nft.version)
    if (nft.version > prev) {
      deliver({
        name: EVENTS.nftUpdated,
        payload: {
          eventId: newEventId(),
          nftId: nft.id,
          version: nft.version,
          priceEth: nft.priceEth,
          editions: nft.editions.map((e) => ({ id: e.id, priceEth: e.priceEth, available: e.available })),
          occurredAt: now(),
        },
      })
    }
  }
}

function startTicker(): void {
  if (ticker) return
  const db = getDb()
  for (const o of db.orders) seenOrders.set(o.id, o.version)
  for (const r of db.nfts) seenNfts.set(r.id, toNft(r).version)
  ticker = setInterval(tick, TICK_MS)
}

function stopTicker(): void {
  if (ticker) clearInterval(ticker)
  ticker = null
  seenOrders.clear()
  seenNfts.clear()
}

function dropPeer(peer: Peer): void {
  clearInterval(peer.pingTimer)
  peers.delete(peer)
  if (!peers.size) stopTicker()
}

const socketLink = ws.link('*/socket.io/')

export const realtimeHandlers = [
  socketLink.addEventListener('connection', (connection) => {
    // Precisa ser síncrono: o binding agenda o handshake num microtask logo após esta chamada.
    const io = toSocketIo(connection)
    const peer: Peer = {
      conn: connection,
      io,
      userId: null,
      pingTimer: setInterval(() => {
        try { connection.client.send('2') } catch { dropPeer(peer) }
      }, PING_MS),
    }
    connection.client.addEventListener('message', (event) => {
      const id = userIdFromConnect(event.data)
      if (id !== undefined) peer.userId = id
    })
    connection.client.addEventListener('close', () => dropPeer(peer))
    peers.add(peer)
    startTicker()
  }),
]

// ---------- controles para Playwright e demonstração (window.__mocks) ----------

/** Vence agora o prazo do pedido pendente (o mais recente, se não informar o id) e emite order.updated. */
export function resolveOrder(orderId?: string, outcome?: 'confirmed' | 'rejected'): string | null {
  const id = mutate((db) => {
    const o = orderId
      ? db.orders.find((x) => x.id === orderId)
      : [...db.orders].reverse().find((x) => x.status === 'pending')
    if (!o || o.status !== 'pending') return null
    o.resolveAt = Date.now()
    if (outcome) o.outcome = outcome
    return o.id
  })
  tick()
  return id
}

/** Fecha todos os sockets; o socket.io-client reconecta sozinho. */
export function disconnectSocket(): void {
  for (const peer of [...peers]) {
    try { peer.conn.client.close(1012, 'mock: queda forçada') } catch { /* já fechado */ }
    dropPeer(peer)
  }
}

/** Reenvia o último evento com o MESMO eventId (o cliente deve ignorar). */
export function replayLastEvent(): boolean {
  const cur = last
  if (!cur) return false
  deliver(cur)
  return true
}

/** Envia o último evento de novo com eventId novo, mas version menor (o cliente deve ignorar). */
export function emitStale(): boolean {
  const cur = last
  if (!cur) return false
  if (cur.name === EVENTS.orderUpdated) {
    const p = cur.payload
    deliver({
      name: EVENTS.orderUpdated,
      ownerId: cur.ownerId,
      payload: {
        eventId: newEventId(), orderId: p.orderId, userId: p.userId,
        version: Math.max(0, p.version - 1), status: 'pending', occurredAt: now(),
      },
    })
  } else {
    deliver({
      name: EVENTS.nftUpdated,
      payload: { ...cur.payload, eventId: newEventId(), version: Math.max(0, cur.payload.version - 1), priceEth: '0.000001' },
    })
  }
  return true
}

export function resetRealtime(): void {
  last = null
  seenOrders.clear()
  seenNfts.clear()
}
