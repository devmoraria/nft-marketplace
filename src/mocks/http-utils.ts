import { HttpResponse, delay } from 'msw'
import type { ApiError } from '@/shared/api/types'
import { getScenario, latencyFor, type Scenario } from './scenarios'

export function apiError(code: string, message: string, fields?: Record<string, string>): ApiError {
  return { error: { code, message, ...(fields ? { fields } : {}) } }
}

// Comportamento comum a todo handler: falha de rede, 503 ou latência do cenário.
// Devolve a resposta de falha, ou null para o handler seguir normalmente.
export async function prelude(): Promise<{ scenario: Scenario; failure: Response | null }> {
  const scenario = getScenario()
  if (scenario === 'offline') return { scenario, failure: HttpResponse.error() }
  if (scenario === 'server-error') {
    return { scenario, failure: HttpResponse.json(apiError('UNAVAILABLE', 'Serviço indisponível. Tente novamente.'), { status: 503 }) }
  }
  await delay(latencyFor(scenario))
  return { scenario, failure: null }
}
