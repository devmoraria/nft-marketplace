import { http } from '@/shared/api/http'
import type { Cart, Quote } from '@/shared/api/types'

export const fetchCart = (signal?: AbortSignal) => http.get<Cart>('/cart', { signal }).then((r) => r.data)

export const addToCart = (v: { nftId: string; editionId: string; quantity: number }) =>
  http.post<Cart>('/cart/items', v).then((r) => r.data)

export const setItemQuantity = (v: { id: string; quantity: number }) =>
  http.patch<Cart>(`/cart/items/${v.id}`, { quantity: v.quantity }).then((r) => r.data)

export const removeCartItem = (id: string) => http.delete<Cart>(`/cart/items/${id}`).then((r) => r.data)

export const refreshCartPrices = () => http.post<Cart>('/cart/refresh').then((r) => r.data)

// Chamar logo depois do login (com a sessão já salva): junta o carrinho do visitante no do usuário.
export const mergeGuestCart = () => http.post<Cart>('/cart/merge').then((r) => r.data)

export const fetchCartQuote = (cart: Cart, couponCode: string, signal?: AbortSignal) =>
  http
    .post<Quote>(
      '/quotes',
      {
        items: cart.items.map((i) => ({ nftId: i.nftId, editionId: i.editionId, quantity: i.quantity })),
        network: 'ethereum',
        couponCode: couponCode || undefined,
      },
      { signal },
    )
    .then((r) => r.data)
