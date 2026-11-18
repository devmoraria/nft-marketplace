import { resetDb } from './db'
import {
  disconnectSocket, emitStale, replayLastEvent, resetRealtime, resolveOrder, setNftPrice, setStock,
} from './realtime'
import { SCENARIOS, getScenario, resetRequestCounter, setScenario, type Scenario } from './scenarios'

// Painel de controle para Playwright, demonstração e README: window.__mocks
export interface MockControls {
  reset: () => void
  setScenario: (name: Scenario) => void
  getScenario: () => Scenario
  scenarios: readonly Scenario[]
  /** Vence agora o prazo do pedido pendente (o mais recente, sem id) e emite order.updated. Devolve o id ou null. */
  resolveOrder: (orderId?: string, outcome?: 'confirmed' | 'rejected') => string | null
  /** Derruba os sockets; o cliente reconecta sozinho. */
  disconnectSocket: () => void
  /** Reenvia o último evento com o mesmo eventId (deve ser ignorado). */
  replayLastEvent: () => boolean
  /** Envia o último evento com eventId novo e version menor (deve ser ignorado). */
  emitStale: () => boolean
  /** Muda o preço do NFT (todas as edições), sobe a version e emite nft.updated. */
  setNftPrice: (nftId: string, priceEth: string) => boolean
  /** Muda o estoque de uma edição, sobe a version e emite nft.updated. */
  setStock: (nftId: string, editionId: string, available: number) => boolean
}

declare global {
  interface Window { __mocks?: MockControls }
}

export function installControls(): void {
  window.__mocks = {
    reset: () => { resetDb(); resetRequestCounter(); setScenario('default'); resetRealtime() },
    setScenario,
    getScenario,
    scenarios: SCENARIOS,
    resolveOrder,
    disconnectSocket,
    replayLastEvent,
    emitStale,
    setNftPrice,
    setStock,
  }
}