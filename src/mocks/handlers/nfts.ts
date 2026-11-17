import { HttpResponse, http } from 'msw'
import { apiError, prelude } from '../http-utils'
import { QueryError, getFacets, getNft, listNfts, parseNftQuery } from '../services/nfts'

// O prefixo "*" faz o mesmo handler valer no navegador e nos testes em Node.
// "facets" vem antes de ":id", senão o :id engoliria a rota.
export const nftsHandlers = [
  http.get('*/api/nfts/facets', async () => {
    const { scenario, failure } = await prelude()
    return failure ?? HttpResponse.json(getFacets(scenario))
  }),

  http.get('*/api/nfts/:id', async ({ params }) => {
    const { scenario, failure } = await prelude()
    if (failure) return failure
    const nft = getNft(String(params.id), scenario)
    return nft ? HttpResponse.json(nft) : HttpResponse.json(apiError('NFT_NOT_FOUND', 'NFT não encontrado.'), { status: 404 })
  }),

  http.get('*/api/nfts', async ({ request }) => {
    const { scenario, failure } = await prelude()
    if (failure) return failure
    try {
      const query = parseNftQuery(new URL(request.url).searchParams)
      return HttpResponse.json(listNfts(query, scenario))
    } catch (e) {
      if (e instanceof QueryError) {
        return HttpResponse.json(apiError('VALIDATION_ERROR', e.message, e.fields), { status: 422 })
      }
      throw e
    }
  }),
]
