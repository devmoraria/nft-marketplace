import { HttpResponse, http } from 'msw'
import { errorResponse, readJson } from '../errors'
import { prelude } from '../http-utils'
import { getCart } from '../services/cart'
import { createOrder, createQuote, getOrder, listOrders, listWallets } from '../services/checkout'
import { cartKeyOf, requireUser } from '../session'

export const checkoutHandlers = [
  http.get('*/api/wallets', async ({ request }) => {
    const { scenario, failure } = await prelude()
    if (failure) return failure
    const user = requireUser(request, scenario)
    return typeof user === 'string' ? HttpResponse.json(listWallets(user)) : user
  }),

  http.post('*/api/quotes', async ({ request }) => {
    const { scenario, failure } = await prelude()
    if (failure) return failure
    const key = cartKeyOf(request)
    try {
      return HttpResponse.json(createQuote(await readJson(request), scenario, key ? getCart(key) : null))
    } catch (e) { return errorResponse(e) }
  }),

  http.post('*/api/orders', async ({ request }) => {
    const { scenario, failure } = await prelude()
    if (failure) return failure
    const user = requireUser(request, scenario)
    if (typeof user !== 'string') return user
    try {
      const { order, replay } = createOrder(user, request.headers.get('Idempotency-Key'), await readJson(request), scenario)
      return HttpResponse.json(order, { status: replay ? 200 : 201 })
    } catch (e) { return errorResponse(e) }
  }),

  http.get('*/api/orders', async ({ request }) => {
    const { scenario, failure } = await prelude()
    if (failure) return failure
    const user = requireUser(request, scenario)
    return typeof user === 'string' ? HttpResponse.json(listOrders(user)) : user
  }),

  http.get('*/api/orders/:id', async ({ request, params }) => {
    const { scenario, failure } = await prelude()
    if (failure) return failure
    const user = requireUser(request, scenario)
    if (typeof user !== 'string') return user
    try { return HttpResponse.json(getOrder(user, String(params.id))) } catch (e) { return errorResponse(e) }
  }),
]
