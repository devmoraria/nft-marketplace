import { resetDb } from './db'
import { SCENARIOS, getScenario, resetRequestCounter, setScenario, type Scenario } from './scenarios'

// Painel de controle para Playwright, demonstração e README: window.__mocks
export interface MockControls {
  reset: () => void
  setScenario: (name: Scenario) => void
  getScenario: () => Scenario
  scenarios: readonly Scenario[]
}

declare global {
  interface Window { __mocks?: MockControls }
}

export function installControls(): void {
  window.__mocks = {
    reset: () => { resetDb(); resetRequestCounter(); setScenario('default') },
    setScenario,
    getScenario,
    scenarios: SCENARIOS,
  }
}
