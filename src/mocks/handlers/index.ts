import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { checkoutHandlers } from './checkout'
import { favoritesHandlers } from './favorites'
import { nftsHandlers } from './nfts'

export const handlers = [...authHandlers, ...nftsHandlers, ...favoritesHandlers, ...cartHandlers, ...checkoutHandlers]
