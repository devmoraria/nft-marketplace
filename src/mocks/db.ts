import type { Cart, Order, Quote, Wallet } from '@/shared/api/types'
import { buildCoupons, type CouponRecord } from './fixtures/coupons'
import { buildNftRecords, type NftRecord } from './fixtures/nfts'
import { buildUsers, type UserRecord } from './fixtures/users'

// "Servidor" em memória, espelhado no localStorage a cada mutação para o refresh funcionar.
// Se mudar o formato, incremente DB_VERSION (o db antigo é descartado e refeito).
const DB_VERSION = 2
const STORAGE_KEY = `mock:db:v${DB_VERSION}`

export interface SessionRecord { token: string; userId: string; expiresAt: string }
export interface OrderRecord extends Order { userId: string; resolveAt?: number; outcome?: 'confirmed' | 'rejected' }

export interface DbState {
  version: number
  nfts: NftRecord[]
  users: UserRecord[]
  coupons: CouponRecord[]
  sessions: SessionRecord[]
  favorites: Record<string, string[]> // userId -> nftIds
  carts: Record<string, Cart> // userId ou cartId de visitante
  orders: OrderRecord[]
  idempotency: Record<string, { bodyHash: string; orderId: string }>
  quotes: Record<string, Quote>
  wallets: Record<string, Wallet[]> // userId -> carteiras
}

export function seedDb(): DbState {
  return {
    version: DB_VERSION,
    nfts: buildNftRecords(),
    users: buildUsers(),
    coupons: buildCoupons(),
    sessions: [],
    favorites: {},
    carts: {},
    orders: [],
    idempotency: {},
    quotes: {},
    wallets: {},
  }
}

let memory: DbState | null = null

function storage(): Storage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage } catch { return null }
}

function load(): DbState | null {
  try {
    const raw = storage()?.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<DbState>
    return parsed.version === DB_VERSION && Array.isArray(parsed.nfts) ? (parsed as DbState) : null
  } catch {
    return null
  }
}

function persist(db: DbState): void {
  try { storage()?.setItem(STORAGE_KEY, JSON.stringify(db)) } catch { /* cota cheia ou modo privado */ }
}

export function getDb(): DbState {
  if (!memory) memory = load() ?? seedDb()
  return memory
}

export function mutate<T>(fn: (db: DbState) => T): T {
  const db = getDb()
  const result = fn(db)
  persist(db)
  return result
}

export function resetDb(seed: DbState = seedDb()): void {
  memory = seed
  persist(seed)
}
