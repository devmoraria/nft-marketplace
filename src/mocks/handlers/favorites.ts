import { HttpResponse, http } from 'msw'
import { getDb, mutate } from '../db'
import { apiError, prelude } from '../http-utils'
import { requireUser } from '../session'

export const favoritesHandlers = [
  http.get('*/api/favorites', async ({ request }) => {
    const { scenario, failure } = await prelude()
    if (failure) return failure
    const user = requireUser(request, scenario)
    if (typeof user !== 'string') return user
    return HttpResponse.json(getDb().favorites[user] ?? [])
  }),

  http.put('*/api/favorites/:nftId', async ({ request, params }) => {
    const { scenario, failure } = await prelude()
    if (failure) return failure
    const user = requireUser(request, scenario)
    if (typeof user !== 'string') return user
    const id = String(params.nftId)
    if (!getDb().nfts.some((n) => n.id === id)) {
      return HttpResponse.json(apiError('NFT_NOT_FOUND', 'NFT não encontrado.'), { status: 404 })
    }
    mutate((db) => {
      const list = (db.favorites[user] ??= [])
      if (!list.includes(id)) list.push(id)
    })
    return new HttpResponse(null, { status: 204 })
  }),

  http.delete('*/api/favorites/:nftId', async ({ request, params }) => {
    const { scenario, failure } = await prelude()
    if (failure) return failure
    const user = requireUser(request, scenario)
    if (typeof user !== 'string') return user
    mutate((db) => { db.favorites[user] = (db.favorites[user] ?? []).filter((i) => i !== String(params.nftId)) })
    return new HttpResponse(null, { status: 204 })
  }),
]
