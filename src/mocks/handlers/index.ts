import { accountHandlers } from './account'
import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { checkoutHandlers } from './checkout'
import { favoritesHandlers } from './favorites'
import { nftsHandlers } from './nfts'

export const handlers = [...authHandlers, ...accountHandlers, ...nftsHandlers, ...favoritesHandlers, ...cartHandlers, ...checkoutHandlers]
