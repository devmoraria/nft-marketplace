// Nomes dos eventos Socket.IO. Se o guia usar outros nomes, troque só aqui:
// o mock (src/mocks/realtime.ts) e o cliente (client.ts) importam desta constante.
export const EVENTS = {
  orderUpdated: 'order.updated',
  nftUpdated: 'nft.updated',
} as const
