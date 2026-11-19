import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http, shouldRetry } from '@/shared/api/http'
import { getSession, setSession, useSession } from '@/features/auth/session'
import type { Network, User, Wallet } from '@/shared/api/types'

// Chaves começam com ['user', id]: o logout já remove tudo isso (useLogout).
export const walletsKey = (uid: string | undefined) => ['user', uid ?? 'anon', 'wallets'] as const

export function apiFields(e: unknown): Record<string, string> {
  const x = e as { fields?: Record<string, string>; response?: { data?: { error?: { fields?: Record<string, string> } } } }
  return x?.fields ?? x?.response?.data?.error?.fields ?? {}
}
export const apiMessage = (e: unknown) => (e as Error)?.message || 'Não foi possível concluir. Tente novamente.'

export function useWallets() {
  const uid = useSession()?.user.id
  return useQuery({
    queryKey: walletsKey(uid),
    queryFn: ({ signal }) => http.get<Wallet[]>('/wallets', { signal }).then((r) => r.data),
    enabled: !!uid,
    staleTime: 30_000,
    retry: shouldRetry,
  })
}

export interface WalletInput { label: string; address: string; network: Network; kind: 'primary' | 'secondary' }

export function useSaveWallet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: WalletInput }) =>
      (id ? http.patch<Wallet>(`/wallets/${id}`, input) : http.post<Wallet>('/wallets', input)).then((r) => r.data),
    // O checkout usa a mesma lista: invalida qualquer consulta de carteiras.
    onSuccess: () => qc.invalidateQueries({ predicate: (q) => q.queryKey.includes('wallets') }),
  })
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (input: { name: string; email: string; avatarUrl?: string }) =>
      http.patch<User>('/profile', input).then((r) => r.data),
    onSuccess: (user) => {
      const s = getSession()
      if (s) setSession({ ...s, user })
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) => http.post('/profile/password', input),
  })
}
