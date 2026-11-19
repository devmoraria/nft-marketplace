import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http, shouldRetry } from '@/shared/api/http'
import { useSession } from '@/features/auth/session'

// A chave inclui o usuário: logout/troca de usuário não reaproveita o cache do anterior.
export const favoritesKey = (userId: string | undefined) => ['favorites', userId ?? 'anon'] as const

export function useFavorites() {
  const session = useSession()
  const userId = (session as { user?: { id?: string } } | null)?.user?.id
  return useQuery({
    queryKey: favoritesKey(userId),
    queryFn: ({ signal }) => http.get<string[]>('/favorites', { signal }).then((r) => r.data),
    enabled: !!userId,
    refetchOnMount: 'always',
    staleTime: 30_000,
    retry: shouldRetry,
  })
}

export function useToggleFavorite() {
  const qc = useQueryClient()
  const session = useSession()
  const userId = (session as { user?: { id?: string } } | null)?.user?.id
  const key = favoritesKey(userId)
  return useMutation({
    mutationFn: ({ nftId, on }: { nftId: string; on: boolean }) =>
      on ? http.put(`/favorites/${nftId}`) : http.delete(`/favorites/${nftId}`),
    // Atualização otimista: altera o cache já, desfaz se o servidor falhar.
    onMutate: async ({ nftId, on }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<string[]>(key) ?? []
      qc.setQueryData<string[]>(key, on ? [...new Set([...prev, nftId])] : prev.filter((i) => i !== nftId))
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx) qc.setQueryData(key, ctx.prev)
      const el = document.getElementById('live')
      if (el) el.textContent = 'Não foi possível atualizar os favoritos. Tente novamente.'
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })
}
