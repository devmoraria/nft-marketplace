import { HttpResponse, http } from 'msw'
import type { Session, User } from '@/shared/api/types'
import { getDb, mutate, type SessionRecord } from '../db'
import type { UserRecord } from '../fixtures/users'
import { apiError, prelude } from '../http-utils'

const SESSION_TTL_MS = 24 * 60 * 60 * 1000
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
}

function toUser(r: UserRecord): User {
  return { id: r.id, name: r.name, email: r.email, ...(r.avatarUrl ? { avatarUrl: r.avatarUrl } : {}) }
}

async function readBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const v: unknown = await req.json()
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function bearer(req: Request): string | null {
  const h = req.headers.get('Authorization')
  return h?.startsWith('Bearer ') ? h.slice(7) : null
}

function validateEmailPassword(email: string, password: string, fields: Record<string, string>): void {
  if (!EMAIL_RE.test(email)) fields.email = 'E-mail inválido.'
  if (!password) fields.password = 'Informe sua senha.'
}

function validateSignup(name: string, email: string, password: string): Record<string, string> | null {
  const fields: Record<string, string> = {}
  if (name.length < 2) fields.name = 'Informe seu nome.'
  if (!EMAIL_RE.test(email)) fields.email = 'E-mail inválido.'
  if (password.length < 8) fields.password = 'Use ao menos 8 caracteres.'
  else if (!/[A-Za-z]/.test(password)) fields.password = 'Inclua uma letra.'
  else if (!/\d/.test(password)) fields.password = 'Inclua um número.'
  return Object.keys(fields).length ? fields : null
}

function openSession(user: UserRecord): Session {
  const record: SessionRecord = {
    token: crypto.randomUUID(),
    userId: user.id,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  }
  mutate((db) => { db.sessions.push(record) })
  return { token: record.token, user: toUser(user), expiresAt: record.expiresAt }
}

export const authHandlers = [
  http.post('*/api/auth/signup', async ({ request }) => {
    const { scenario, failure } = await prelude()
    if (failure) return failure
    const body = await readBody(request)
    const name = str(body.name).trim()
    const email = str(body.email).trim().toLowerCase()
    const password = str(body.password)

    const fields = validateSignup(name, email, password)
    if (fields) return HttpResponse.json(apiError('VALIDATION_ERROR', 'Confira os campos informados.', fields), { status: 422 })

    const taken = scenario === 'signup-conflict' || getDb().users.some((u) => u.email.toLowerCase() === email)
    if (taken) {
      return HttpResponse.json(
        apiError('EMAIL_TAKEN', 'Este e-mail já está cadastrado.', { email: 'Este e-mail já está cadastrado.' }),
        { status: 409 },
      )
    }

    const passwordHash = await sha256Hex(password)
    const user: UserRecord = { id: `user-${crypto.randomUUID().slice(0, 8)}`, name, email, passwordHash }
    mutate((db) => { db.users.push(user) })
    return HttpResponse.json(openSession(user), { status: 201 })
  }),

  http.post('*/api/auth/login', async ({ request }) => {
    const { failure } = await prelude()
    if (failure) return failure
    const body = await readBody(request)
    const email = str(body.email).trim().toLowerCase()
    const password = str(body.password)

    const fields: Record<string, string> = {}
    validateEmailPassword(email, password, fields)
    if (Object.keys(fields).length) {
      return HttpResponse.json(apiError('VALIDATION_ERROR', 'Confira os campos informados.', fields), { status: 422 })
    }

    const hash = await sha256Hex(password)
    const user = getDb().users.find((u) => u.email.toLowerCase() === email && u.passwordHash === hash)
    if (!user) return HttpResponse.json(apiError('INVALID_CREDENTIALS', 'E-mail ou senha incorretos.'), { status: 401 })
    return HttpResponse.json(openSession(user))
  }),

  http.get('*/api/auth/session', async ({ request }) => {
    const { scenario, failure } = await prelude()
    if (failure) return failure
    const token = bearer(request)
    if (!token) return HttpResponse.json(apiError('SESSION_INVALID', 'Sessão inválida.'), { status: 401 })

    const expired = () => HttpResponse.json(apiError('SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente.'), { status: 401 })
    if (scenario === 'session-expired') {
      mutate((db) => { db.sessions = db.sessions.filter((s) => s.token !== token) })
      return expired()
    }

    const db = getDb()
    const record = db.sessions.find((s) => s.token === token)
    if (!record) return HttpResponse.json(apiError('SESSION_INVALID', 'Sessão inválida.'), { status: 401 })
    if (Date.parse(record.expiresAt) <= Date.now()) return expired()

    const user = db.users.find((u) => u.id === record.userId)
    if (!user) return HttpResponse.json(apiError('SESSION_INVALID', 'Sessão inválida.'), { status: 401 })
    const session: Session = { token: record.token, user: toUser(user), expiresAt: record.expiresAt }
    return HttpResponse.json(session)
  }),

  http.post('*/api/auth/logout', async ({ request }) => {
    const { failure } = await prelude()
    if (failure) return failure
    const token = bearer(request)
    if (token) mutate((db) => { db.sessions = db.sessions.filter((s) => s.token !== token) })
    return new HttpResponse(null, { status: 204 })
  }),
]
