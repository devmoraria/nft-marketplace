import { http } from '@/shared/api/http'
import type { Nft, NftQuery, Page } from '@/shared/api/types'

/**
 * GET /api/nfts. O abort signal cancela a requisição quando a busca muda,
 * então uma resposta atrasada nunca sobrescreve a atual.
 * `category` vai como lista separada por vírgula (category=a,b).
 */
export async function fetchNfts(query: NftQuery, signal?: AbortSignal): Promise<Page<Nft>> {
  const params: Record<string, string | number> = {}
  if (query.q) params.q = query.q
  if (query.category?.length) params.category = query.category.join(',')
  if (query.minPrice) params.minPrice = query.minPrice
  if (query.maxPrice) params.maxPrice = query.maxPrice
  if (query.sort) params.sort = query.sort
  if (query.page) params.page = query.page
  if (query.pageSize) params.pageSize = query.pageSize

  const { data } = await http.get<Page<Nft>>('/nfts', { params, signal })
  return data
}
