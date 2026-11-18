import Decimal from 'decimal.js'
import type { Cart, CartItem } from '@/shared/api/types'
import { getDb, mutate } from '../db'
import { MockError } from '../errors'
import { toNft } from '../fixtures/nfts'
import type { Scenario } from '../scenarios'

const MAX_PER_LINE = 10

// No cenário price-changed o preço "do servidor" sobe 10% em relação ao que o carrinho guardou.
export function effectivePrice(priceEth: string, scenario: Scenario): string {
  return scenario === 'price-changed' ? new Decimal(priceEth).mul('1.1').toFixed() : priceEth
}

export function getCart(key: string): Cart {
  return getDb().carts[key] ?? { id: key, items: [], version: 0 }
}

function validQty(q: unknown): number {
  if (!Number.isInteger(q) || (q as number) < 1 || (q as number) > MAX_PER_LINE) {
    throw new MockError(422, 'VALIDATION_ERROR', 'Confira os campos informados.', { quantity: `Use de 1 a ${MAX_PER_LINE}` })
  }
  return q as number
}

function edition(nftId: string, editionId: string, scenario: Scenario) {
  const rec = getDb().nfts.find((n) => n.id === nftId)
  if (!rec) throw new MockError(404, 'NFT_NOT_FOUND', 'NFT não encontrado.')
  const nft = toNft(rec)
  const ed = nft.editions.find((e) => e.id === editionId)
  if (!ed) throw new MockError(404, 'EDITION_NOT_FOUND', 'Edição não encontrada.')
  const available = scenario === 'soldout' ? 0 : ed.available
  return { nft, ed, available }
}

function checkStock(available: number, wanted: number): void {
  if (available <= 0) throw new MockError(409, 'SOLD_OUT', 'Esta edição esgotou.')
  if (wanted > available) throw new MockError(409, 'LIMIT_EXCEEDED', `Restam apenas ${available} unidades.`)
}

export function addItem(key: string, input: unknown, scenario: Scenario): Cart {
  const b = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  if (typeof b.nftId !== 'string' || typeof b.editionId !== 'string') {
    throw new MockError(422, 'VALIDATION_ERROR', 'Confira os campos informados.', { nftId: 'Informe o NFT e a edição.' })
  }
  const qty = validQty(b.quantity ?? 1)
  const { nft, ed, available } = edition(b.nftId, b.editionId, scenario)

  return mutate((db) => {
    const cart = (db.carts[key] ??= { id: key, items: [], version: 0 })
    const existing = cart.items.find((i) => i.nftId === nft.id && i.editionId === ed.id)
    checkStock(available, (existing?.quantity ?? 0) + qty)
    if (existing) existing.quantity += qty
    else {
      cart.items.push({
        id: crypto.randomUUID(), nftId: nft.id, editionId: ed.id, quantity: qty, unitPriceEth: ed.priceEth,
        nft: { id: nft.id, title: nft.title, images: nft.images },
      })
    }
    cart.version += 1
    return cart
  })
}

export function setQuantity(key: string, itemId: string, input: unknown, scenario: Scenario): Cart {
  const b = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const qty = validQty(b.quantity)
  const item = getCart(key).items.find((i) => i.id === itemId)
  if (!item) throw new MockError(404, 'CART_ITEM_NOT_FOUND', 'Item não encontrado no carrinho.')
  checkStock(edition(item.nftId, item.editionId, scenario).available, qty)
  return mutate((db) => {
    const cart = db.carts[key]
    const it = cart.items.find((i) => i.id === itemId) as CartItem
    it.quantity = qty
    cart.version += 1
    return cart
  })
}

export function removeItem(key: string, itemId: string): Cart {
  return mutate((db) => {
    const cart = (db.carts[key] ??= { id: key, items: [], version: 0 })
    cart.items = cart.items.filter((i) => i.id !== itemId)
    cart.version += 1
    return cart
  })
}

export function clearCart(key: string): Cart {
  return mutate((db) => {
    const cart = (db.carts[key] ??= { id: key, items: [], version: 0 })
    cart.items = []
    cart.version += 1
    return cart
  })
}

// Ao logar: junta o carrinho do visitante no do usuário e descarta o do visitante.
export function mergeCart(guestKey: string | null, userId: string): Cart {
  return mutate((db) => {
    const user = (db.carts[userId] ??= { id: userId, items: [], version: 0 })
    const guest = guestKey && guestKey !== userId ? db.carts[guestKey] : undefined
    if (guest) {
      for (const g of guest.items) {
        const existing = user.items.find((i) => i.nftId === g.nftId && i.editionId === g.editionId)
        if (existing) existing.quantity = Math.min(MAX_PER_LINE, existing.quantity + g.quantity)
        else user.items.push({ ...g, id: crypto.randomUUID() })
      }
      delete db.carts[guestKey as string]
      user.version += 1
    }
    return user
  })
}

// "Aceitar novo preço": alinha o carrinho com o preço atual.
export function refreshPrices(key: string, scenario: Scenario): Cart {
  return mutate((db) => {
    const cart = (db.carts[key] ??= { id: key, items: [], version: 0 })
    for (const it of cart.items) {
      const rec = db.nfts.find((n) => n.id === it.nftId)
      const ed = rec ? toNft(rec).editions.find((e) => e.id === it.editionId) : undefined
      if (ed) it.unitPriceEth = effectivePrice(ed.priceEth, scenario)
    }
    cart.version += 1
    return cart
  })
}
