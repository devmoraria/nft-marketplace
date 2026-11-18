import { HttpResponse, http } from 'msw'
import { errorResponse, readJson } from '../errors'
import { apiError, prelude } from '../http-utils'
import { addItem, clearCart, getCart, mergeCart, refreshPrices, removeItem, setQuantity } from '../services/cart'
import { cartKeyOf, requireUser } from '../session'

const noKey = () => HttpResponse.json(apiError('CART_ID_REQUIRED', 'Envie X-Cart-Id.'), { status: 400 })

export const cartHandlers = [
  http.get('*/api/cart', async ({ request }) => {
    const { failure } = await prelude()
    if (failure) return failure
    const key = cartKeyOf(request)
    return key ? HttpResponse.json(getCart(key)) : noKey()
  }),

  http.delete('*/api/cart', async ({ request }) => {
    const { failure } = await prelude()
    if (failure) return failure
    const key = cartKeyOf(request)
    return key ? HttpResponse.json(clearCart(key)) : noKey()
  }),

  http.post('*/api/cart/items', async ({ request }) => {
    const { scenario, failure } = await prelude()
    if (failure) return failure
    const key = cartKeyOf(request)
    if (!key) return noKey()
    try { return HttpResponse.json(addItem(key, await readJson(request), scenario), { status: 201 }) } catch (e) { return errorResponse(e) }
  }),

  http.patch('*/api/cart/items/:id', async ({ request, params }) => {
    const { scenario, failure } = await prelude()
    if (failure) return failure
    const key = cartKeyOf(request)
    if (!key) return noKey()
    try { return HttpResponse.json(setQuantity(key, String(params.id), await readJson(request), scenario)) } catch (e) { return errorResponse(e) }
  }),

  http.delete('*/api/cart/items/:id', async ({ request, params }) => {
    const { failure } = await prelude()
    if (failure) return failure
    const key = cartKeyOf(request)
    return key ? HttpResponse.json(removeItem(key, String(params.id))) : noKey()
  }),

  http.post('*/api/cart/merge', async ({ request }) => {
    const { scenario, failure } = await prelude()
    if (failure) return failure
    const user = requireUser(request, scenario)
    if (typeof user !== 'string') return user
    return HttpResponse.json(mergeCart(request.headers.get('X-Cart-Id'), user))
  }),

  http.post('*/api/cart/refresh', async ({ request }) => {
    const { scenario, failure } = await prelude()
    if (failure) return failure
    const key = cartKeyOf(request)
    return key ? HttpResponse.json(refreshPrices(key, scenario)) : noKey()
  }),
]
