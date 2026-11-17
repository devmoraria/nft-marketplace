// Contratos REST e eventos (guia, seções 3 e 4).
// Extensões sobre o guia, para atender o Figma: ver ARCHITECTURE.md ("Desvios do contrato").

export type Eth = string // sempre string decimal, ex.: '0.125'

// O Figma mostra Ethereum, Polygon e Solana. Para trocar, edite só esta lista.
export const NETWORKS = ['ethereum', 'polygon', 'solana'] as const
export type Network = (typeof NETWORKS)[number]

export interface User { id: string; name: string; email: string; avatarUrl?: string }
export interface Session { token: string; user: User; expiresAt: string }

export type EditionName = '1/1' | '1/10' | '1/50' | 'ABERTA'
export interface Edition { id: string; name: EditionName; priceEth: Eth; available: number }

export interface Nft {
  id: string
  title: string
  collection: string
  creator: string
  category: string // slug, ver CATEGORIES
  description: string
  images: string[]
  thumbnail: string
  priceEth: Eth
  compareAtPriceEth?: Eth // preço antigo riscado (Figma: Neon Vessel)
  badge?: 'RARO'
  network: Network
  tokenId: string
  attributes: string[]
  rating: number
  reviewCount: number
  editions: Edition[]
  version: number
  updatedAt: string
}

export interface Page<T> { items: T[]; page: number; pageSize: number; total: number; totalPages: number }

export interface NftQuery {
  q?: string
  category?: string[]
  network?: Network[]
  minPrice?: Eth
  maxPrice?: Eth
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular'
  page?: number
  pageSize?: number
}

export interface NftFacets {
  categories: { slug: string; label: string; count: number }[]
  networks: { network: Network; count: number }[]
  priceRange: { min: Eth; max: Eth }
}

export interface CartItem {
  id: string; nftId: string; editionId: string; quantity: number; unitPriceEth: Eth
  nft: Pick<Nft, 'id' | 'title' | 'images'>
}
export interface Cart { id: string; items: CartItem[]; version: number }

export interface QuoteRequest {
  items: { nftId: string; editionId: string; quantity: number }[]
  couponCode?: string
  network: Network
}
export interface Quote {
  quoteId: string; expiresAt: string; priceVersion: string
  lines: { nftId: string; editionId: string; quantity: number; unitPriceEth: Eth; lineTotalEth: Eth }[]
  subtotalEth: Eth; discountEth: Eth; networkFeeEth: Eth; totalEth: Eth
  coupon?: { code: string; valid: boolean; reason?: 'INVALID' | 'EXPIRED' }
  issues: { code: 'PRICE_CHANGED' | 'SOLD_OUT' | 'LIMIT_EXCEEDED'; nftId: string; editionId: string }[]
}

export interface Wallet { id: string; label: string; address: string; network: Network; kind: 'primary' | 'secondary' }

export type OrderStatus = 'pending' | 'confirmed' | 'rejected'
export interface Order {
  id: string; status: OrderStatus; version: number; txRef?: string; rejectReason?: string
  receipt: {
    items: Quote['lines']; subtotalEth: Eth; discountEth: Eth; networkFeeEth: Eth; totalEth: Eth
    network: Network; walletId: string; createdAt: string
  } // snapshot: nunca muda
}

export interface ApiError { error: { code: string; message: string; fields?: Record<string, string> } }

export interface NftUpdatedEvent {
  eventId: string; nftId: string; version: number; priceEth: Eth
  editions: { id: string; priceEth: Eth; available: number }[]; occurredAt: string
}
export interface OrderUpdatedEvent {
  eventId: string; orderId: string; userId: string; version: number
  status: OrderStatus; txRef?: string; rejectReason?: string; occurredAt: string
}
