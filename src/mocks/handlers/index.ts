import { authHandlers } from './auth'
import { nftsHandlers } from './nfts'

export const handlers = [...authHandlers, ...nftsHandlers]
