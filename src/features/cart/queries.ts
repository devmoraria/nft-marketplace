import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useSession } from '@/features/auth/session'
import { shouldRetry } from '@/shared/api/http'
import type { Cart } from '@/shared/api/types'
import * as api from './api'

function announce(message: string): void {
  const el = document.getElementById('live')
  if (el) el.textContent = message
}

// Prefixo ['user', ...] para o logout limpar o carrinho do cache (guia, seção 8).
function useCartKey() {
  const session = useSession()
  return ['user', session?.user.id ?? 'guest', 'cart'] as const
}

export function useCart() {
  const key = useCartKey()
  return useQuery({ queryKey: key, queryFn: ({ signal }) => api.fetchCart(signal), staleTime: 10_000, retry: shouldRetry })
}

export function useCartCount(): number {
  const { data } = useCart()
  return data?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0
}

export function useCartQuote(cart: Cart | undefined, coupon: string) {
  const key = useCartKey()
  return useQuery({
    queryKey: [...key, 'quote', cart?.version ?? 0, coupon] as const,
    queryFn: ({ signal }) => api.fetchCartQuote(cart as Cart, coupon, signal),
    enabled: !!cart && cart.items.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 0,
    retry: shouldRetry,
  })
}

function useCartMutation<V>(fn: (v: V) => Promise<Cart>, okMessage?: string) {
  const qc = useQueryClient()
  const key = useCartKey()
  return useMutation({
    mutationFn: fn,
    onSuccess: (cart) => {
      qc.setQueryData(key, cart)
      if (okMessage) announce(okMessage)
    },
    onError: (e) => announce(e instanceof Error ? e.message : 'Não foi possível atualizar o carrinho.'),
  })
}

export const useAddToCart = () => useCartMutation(api.addToCart, 'Item adicionado ao carrinho.')
export const useSetQuantity = () => useCartMutation(api.setItemQuantity)
export const useRemoveItem = () => useCartMutation(api.removeCartItem, 'Item removido do carrinho.')
export const useRefreshPrices = () => useCartMutation(() => api.refreshCartPrices(), 'Preços atualizados.')

// Chamar logo apos setSession(...): junta o carrinho do visitante no do usuario e recarrega o cache do usuario.
export async function syncCartAfterLogin(qc: QueryClient): Promise<void> {
  try {
    await api.mergeGuestCart()
  } catch {
    // sem carrinho de visitante (ou falha no merge): segue com o carrinho do usuario
  }
  await qc.invalidateQueries({ queryKey: ['user'] })
}
