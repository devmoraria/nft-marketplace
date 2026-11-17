import axios from 'axios'
import type { ApiError } from './types'

export class AppError extends Error {
  readonly status: number
  readonly code: string
  readonly fields?: Record<string, string>

  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.code = code
    this.fields = fields
  }
}

function readToken(): string | null {
  try {
    const raw = localStorage.getItem('auth')
    if (!raw) return null
    const parsed = JSON.parse(raw) as { token?: string }
    return parsed.token ?? null
  } catch {
    return null
  }
}

function getCartId(): string {
  try {
    let id = localStorage.getItem('cartId')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('cartId', id)
    }
    return id
  } catch {
    return crypto.randomUUID()
  }
}

export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err
  if (axios.isAxiosError(err)) {
    if (err.response) {
      const body = err.response.data as Partial<ApiError> | undefined
      return new AppError(
        err.response.status,
        body?.error?.code ?? 'HTTP_ERROR',
        body?.error?.message ?? 'Erro inesperado na requisição.',
        body?.error?.fields,
      )
    }
    if (err.code === 'ECONNABORTED') return new AppError(0, 'TIMEOUT', 'A resposta demorou demais.')
    return new AppError(0, 'NETWORK_ERROR', 'Sem conexão com o servidor.')
  }
  return new AppError(0, 'UNKNOWN', 'Erro inesperado.')
}

/** Retry só para 5xx e falha de rede (nunca 4xx), no máximo 2 vezes. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false
  const e = toAppError(error)
  return e.status === 0 || e.status >= 500
}

export const http = axios.create({ baseURL: '/api', timeout: 8000 })

http.interceptors.request.use((config) => {
  const token = readToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  config.headers.set('X-Cart-Id', getCartId())
  return config
})

http.interceptors.response.use(
  (response) => response,
  // cancelamentos passam intactos para o TanStack Query descartá-los
  (err: unknown) => Promise.reject(axios.isCancel(err) ? err : toAppError(err)),
)
