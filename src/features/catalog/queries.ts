import { queryOptions } from '@tanstack/react-query'
import { http } from '@/shared/api/http'
import type { Nft, NftQuery, Page } from '@/shared/api/types'

export const nftsQueryOptions = (p: NftQuery) =>
  queryOptions({
    queryKey: ['nfts', 'list', p] as const,
    queryFn: ({ signal }) =>
      http.get<Page<Nft>>('/nfts', { params: { ...p, category: p.category?.length ? p.category.join(',') : undefined }, signal }).then((r) => r.data),
    staleTime: 30_000,
  })
export const nftsQuery = nftsQueryOptions
