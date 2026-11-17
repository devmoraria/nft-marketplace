export const SCENARIOS = [
  'default', 'empty', 'slow', 'flaky', 'offline', 'server-error', 'session-expired',
  'signup-conflict', 'coupon-invalid', 'price-changed', 'soldout', 'order-timeout', 'payment-rejected',
] as const
export type Scenario = (typeof SCENARIOS)[number]

const KEY = 'mock:scenario'
let current: Scenario | null = null

function isScenario(v: string | null | undefined): v is Scenario {
  return !!v && (SCENARIOS as readonly string[]).includes(v)
}

function safeStorage(): Storage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage } catch { return null }
}

export function setScenario(name: string): void {
  if (!isScenario(name)) throw new Error(`Cenário desconhecido: ${name}. Use: ${SCENARIOS.join(', ')}`)
  current = name
  try { safeStorage()?.setItem(KEY, name) } catch { /* modo privado: fica só em memória */ }
}

// Ordem: ?scenario= na URL (e persiste), valor já definido, localStorage, default.
export function getScenario(): Scenario {
  if (typeof location !== 'undefined') {
    const fromUrl = new URLSearchParams(location.search).get('scenario')
    if (isScenario(fromUrl)) {
      if (fromUrl !== current) setScenario(fromUrl)
      return fromUrl
    }
  }
  if (current) return current
  try {
    const stored = safeStorage()?.getItem(KEY)
    if (isScenario(stored)) return (current = stored)
  } catch { /* ignora */ }
  return 'default'
}

// Determinístico: contador de requisições, nunca Math.random.
// "flaky": requisição par demora 1200 ms, ímpar 200 ms, o que força resposta fora de ordem.
let requestCounter = 0
export function resetRequestCounter(): void { requestCounter = 0 }

export function latencyFor(sc: Scenario): number {
  const n = requestCounter++
  if (sc === 'slow') return 2500
  if (sc === 'flaky') return n % 2 === 0 ? 1200 : 200
  return 150
}
