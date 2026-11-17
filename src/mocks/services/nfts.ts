import Decimal from 'decimal.js'
import type { Nft, NftFacets, NftQuery, Network, Page } from '@/shared/api/types'
import { NETWORKS } from '@/shared/api/types'
import { getDb } from '../db'
import { CATEGORIES, toNft, type NftRecord } from '../fixtures/nfts'
import type { Scenario } from '../scenarios'

const DEFAULT_PAGE_SIZE = 12 // 48 NFTs = 4 páginas, como no Figma
const MAX_PAGE_SIZE = 48

export class QueryError extends Error {
  fields: Record<string, string>
  constructor(fields: Record<string, string>) {
    super('Parâmetros inválidos')
    this.fields = fields
  }
}

const strip = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

// Axios envia arrays como category[]=a; aceitamos as duas formas.
function all(sp: URLSearchParams, key: string): string[] {
  return [...sp.getAll(key), ...sp.getAll(`${key}[]`)].filter(Boolean)
}

function decimalParam(sp: URLSearchParams, key: string, fields: Record<string, string>): Decimal | null {
  const raw = sp.get(key)
  if (raw === null || raw === '') return null
  try { return new Decimal(raw) } catch { fields[key] = 'Valor decimal inválido'; return null }
}

export function parseNftQuery(sp: URLSearchParams): NftQuery {
  const fields: Record<string, string> = {}
  const page = sp.get('page') === null ? 1 : Number(sp.get('page'))
  const pageSize = sp.get('pageSize') === null ? DEFAULT_PAGE_SIZE : Number(sp.get('pageSize'))
  if (!Number.isInteger(page) || page < 1) fields.page = 'Página inválida'
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) fields.pageSize = `Use de 1 a ${MAX_PAGE_SIZE}`
  const sort = sp.get('sort') ?? 'newest'
  if (!['newest', 'price_asc', 'price_desc', 'popular'].includes(sort)) fields.sort = 'Ordenação inválida'
  const network = all(sp, 'network')
  if (network.some((n) => !(NETWORKS as readonly string[]).includes(n))) fields.network = 'Rede inválida'
  decimalParam(sp, 'minPrice', fields)
  decimalParam(sp, 'maxPrice', fields)
  if (Object.keys(fields).length) throw new QueryError(fields)
  return {
    q: sp.get('q') ?? undefined,
    category: all(sp, 'category'),
    network: network as Network[],
    minPrice: sp.get('minPrice') || undefined,
    maxPrice: sp.get('maxPrice') || undefined,
    sort: sort as NftQuery['sort'],
    page,
    pageSize,
  }
}

function present(r: NftRecord, scenario: Scenario): Nft {
  const nft = toNft(r)
  if (scenario !== 'soldout') return nft
  return { ...nft, editions: nft.editions.map((e) => ({ ...e, available: 0 })) }
}

export function listNfts(query: NftQuery, scenario: Scenario): Page<Nft> {
  const page = query.page ?? 1
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE
  if (scenario === 'empty') return { items: [], page, pageSize, total: 0, totalPages: 0 }

  const q = query.q ? strip(query.q.trim()) : ''
  const min = query.minPrice ? new Decimal(query.minPrice) : null
  const max = query.maxPrice ? new Decimal(query.maxPrice) : null
  const cats = query.category ?? []
  const nets = query.network ?? []

  const rows = getDb().nfts.filter((r) => {
    if (q && !strip(`${r.title} ${r.collection} ${r.creator}`).includes(q)) return false
    if (cats.length && !cats.includes(r.category)) return false
    if (nets.length && !nets.includes(r.network)) return false
    if (min && new Decimal(r.priceEth).lt(min)) return false
    if (max && new Decimal(r.priceEth).gt(max)) return false
    return true
  })

  // desempate por id: a ordem é sempre a mesma para a mesma consulta
  const byId = (a: NftRecord, b: NftRecord) => a.id.localeCompare(b.id, 'en', { numeric: true })
  const sorters: Record<NonNullable<NftQuery['sort']>, (a: NftRecord, b: NftRecord) => number> = {
    newest: (a, b) => b.updatedAt.localeCompare(a.updatedAt) || byId(a, b),
    price_asc: (a, b) => new Decimal(a.priceEth).cmp(b.priceEth) || byId(a, b),
    price_desc: (a, b) => new Decimal(b.priceEth).cmp(a.priceEth) || byId(a, b),
    popular: (a, b) => b.popularity - a.popularity || byId(a, b),
  }
  rows.sort(sorters[query.sort ?? 'newest'])

  const total = rows.length
  const start = (page - 1) * pageSize
  return {
    items: rows.slice(start, start + pageSize).map((r) => present(r, scenario)),
    page, pageSize, total, totalPages: Math.ceil(total / pageSize),
  }
}

export function getNft(id: string, scenario: Scenario): Nft | null {
  const r = getDb().nfts.find((n) => n.id === id)
  return r ? present(r, scenario) : null
}

export function getFacets(scenario: Scenario): NftFacets {
  const rows = scenario === 'empty' ? [] : getDb().nfts
  const prices = rows.map((r) => new Decimal(r.priceEth))
  return {
    categories: CATEGORIES.map((c) => ({ slug: c.slug, label: c.label, count: rows.filter((r) => r.category === c.slug).length })),
    networks: NETWORKS.map((n) => ({ network: n, count: rows.filter((r) => r.network === n).length })),
    priceRange: prices.length
      ? { min: Decimal.min(...prices).toFixed(), max: Decimal.max(...prices).toFixed() }
      : { min: '0', max: '0' },
  }
}
