import { queryOptions } from '@tanstack/react-query'
import { http, shouldRetry } from '@/shared/api/http'
import type { Nft } from '@/shared/api/types'

export const nftQueryOptions = (id: string) =>
  queryOptions({
        queryKey: ['nfts', 'detail', id] as const,
    queryFn: ({ signal }) => http.get<Nft>(`/nfts/${id}`, { signal }).then((r) => r.data),
    staleTime: 15_000,
    retry: shouldRetry,
  })