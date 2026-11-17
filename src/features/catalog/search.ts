import { z } from 'zod'
import type { NftQuery } from '@/shared/api/types'

export const PAGE_SIZE = 9

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Listados recentemente' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
  { value: 'popular', label: 'Mais populares' },
] as const

/** Estado do catálogo na URL (README: sobrevive a refresh e histórico). */
export const catalogSearchSchema = z.object({
  q: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === undefined || v === '' ? undefined : String(v)))
    .catch(undefined),
  category: z.array(z.string()).optional().catch(undefined),
  minPrice: z.number().nonnegative().optional().catch(undefined),
  maxPrice: z.number().nonnegative().optional().catch(undefined),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'popular']).catch('newest'),
  page: z.number().int().min(1).catch(1),
})

export type SortValue = 'newest' | 'price_asc' | 'price_desc' | 'popular'

/** Forma da URL: tudo opcional (é o que <Link search> e navigate aceitam). */
export interface CatalogSearchInput {
  q?: string
  category?: string[]
  minPrice?: number
  maxPrice?: number
  sort?: SortValue
  page?: number
}

/** Estado já com padrões aplicados. */
export type CatalogSearch = CatalogSearchInput & { sort: SortValue; page: number }

/** Valida a URL. Valores inválidos viram o padrão (nunca lança erro). */
export function validateCatalogSearch(raw: Record<string, unknown>): CatalogSearchInput {
  return catalogSearchSchema.parse(raw)
}

/** Aplica os padrões (ordenação 'newest', página 1) para uso na tela. */
export function resolveSearch(s: CatalogSearchInput): CatalogSearch {
  return { ...s, sort: s.sort ?? 'newest', page: s.page ?? 1 }
}

export function toNftQuery(s: CatalogSearch): NftQuery {
  return {
    q: s.q,
    category: s.category?.length ? s.category : undefined,
    minPrice: s.minPrice === undefined ? undefined : String(s.minPrice),
    maxPrice: s.maxPrice === undefined ? undefined : String(s.maxPrice),
    sort: s.sort,
    page: s.page,
    pageSize: PAGE_SIZE,
  }
}
