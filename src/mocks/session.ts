import { HttpResponse } from 'msw'
import { getDb } from './db'
import { apiError } from './http-utils'
import type { Scenario } from './scenarios'

export function sessionUserId(req: Request): string | null {
  const h = req.headers.get('Authorization')
  if (!h?.startsWith('Bearer ')) return null
  const token = h.slice(7)
  const s = getDb().sessions.find((x) => x.token === token)
  if (!s || Date.parse(s.expiresAt) <= Date.now()) return null
  return s.userId
}

// Devolve o userId ou a resposta 401 pronta.
export function requireUser(req: Request, scenario: Scenario): string | Response {
  if (scenario === 'session-expired') {
    return HttpResponse.json(apiError('SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente.'), { status: 401 })
  }
  const id = sessionUserId(req)
  return id ?? HttpResponse.json(apiError('UNAUTHENTICATED', 'Entre para continuar.'), { status: 401 })
}

// Usuário logado usa o userId; visitante usa o X-Cart-Id.
export function cartKeyOf(req: Request): string | null {
  return sessionUserId(req) ?? req.headers.get('X-Cart-Id')
}
