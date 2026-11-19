import { useState } from 'react'
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query'
import { Shell } from '@/features/account/AccountPages'
import { useSession } from '@/features/auth/session'
import { http } from '@/shared/api/http'
import type { Nft } from '@/shared/api/types'
import { favoritesKey, useFavorites } from './queries'

export function FavoritesPage() {
  const uid = useSession()?.user.id
  const qc = useQueryClient()
  const favs = useFavorites()
  const ids = favs.data ?? []
  const nfts = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['nfts', 'detail', id] as const,
      queryFn: ({ signal }: { signal: AbortSignal }) => http.get<Nft>(`/nfts/${id}`, { signal }).then((r) => r.data),
      staleTime: 15_000,
    })),
  })
  const [ok, setOk] = useState('')
  const [fail, setFail] = useState('')
  const remove = useMutation({
    mutationFn: (id: string) => http.delete(`/favorites/${id}`),
    onSuccess: () => { setFail(''); setOk('Removido dos favoritos.'); void qc.invalidateQueries({ queryKey: favoritesKey(uid) }) },
    onError: () => { setOk(''); setFail('Não foi possível remover. Tente novamente.') },
  })

  return (
    <Shell title="Favoritos">
      <section aria-label="Seus favoritos" className="mt-6 rounded-2xl bg-[#221612] p-5">
        {favs.isPending && <div aria-busy className="skeleton h-[120px]" />}
        {favs.isError && (
          <p role="alert" className="text-red-300">
            Não foi possível carregar os favoritos.{' '}
            <button type="button" onClick={() => void favs.refetch()} className="underline">Tentar novamente</button>
          </p>
        )}
        {favs.data && ids.length === 0 && (
          <p>Você ainda não favoritou nenhum NFT. <a href="/" className="text-[#e89b55] underline">Explorar o mercado</a></p>
        )}
        <ul className="divide-y divide-[#3b2a20]">
          {ids.map((id, i) => {
            const title = nfts[i]?.data?.title ?? 'Carregando…'
            return (
              <li key={id} className="flex items-center justify-between gap-3 py-3">
                <a href={`/nft/${id}`} className="min-w-0 truncate font-bold text-[#f3ece3] hover:underline">{title}</a>
                <button
                  type="button"
                  aria-label={`Remover ${title} dos favoritos`}
                  aria-disabled={remove.isPending}
                  onClick={() => remove.mutate(id)}
                  className="h-9 rounded border border-[#d18a4e] px-3 text-sm font-bold text-[#e89b55]"
                >
                  Remover
                </button>
              </li>
            )
          })}
        </ul>
        <p role="status" className="mt-3 text-sm text-[#e89b55]">{ok}</p>
        <p role="alert" className="mt-3 text-sm text-red-300">{fail}</p>
      </section>
    </Shell>
  )
}
