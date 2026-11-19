import { HttpResponse, http } from 'msw'
import { NETWORKS, type Network, type User, type Wallet } from '@/shared/api/types'
import { getDb, mutate } from '../db'
import type { UserRecord } from '../fixtures/users'
import { apiError, prelude } from '../http-utils'
import { requireUser } from '../session'
import { listWallets } from '../services/checkout'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_AVATAR = 200_000

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
}
const str = (v: unknown) => (typeof v === 'string' ? v : '')
async function body(req: Request): Promise<Record<string, unknown>> {
  try { const v: unknown = await req.json(); return v && typeof v === 'object' ? (v as Record<string, unknown>) : {} } catch { return {} }
}
const toUser = (r: UserRecord): User => ({ id: r.id, name: r.name, email: r.email, ...(r.avatarUrl ? { avatarUrl: r.avatarUrl } : {}) })
const invalid = (fields: Record<string, string>) =>
  HttpResponse.json(apiError('VALIDATION_ERROR', 'Confira os campos informados.', fields), { status: 422 })

function addressOk(network: Network, a: string): boolean {
  return network === 'solana' ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a) : /^0x[0-9a-fA-F]{40}$/.test(a)
}
function walletsOf(userId: string): Wallet[] {
  const base = listWallets(userId)
  mutate((db) => { db.wallets[userId] ??= structuredClone(base) })
  return getDb().wallets[userId]!
}

function validateWallet(b: Record<string, unknown>, others: Wallet[]): { fields: Record<string, string>; w?: Omit<Wallet, 'id'> } {
  const fields: Record<string, string> = {}
  const label = str(b.label).trim()
  const address = str(b.address).trim()
  const network = str(b.network) as Network
  const kind = b.kind === 'primary' ? 'primary' : b.kind === 'secondary' ? 'secondary' : null
  if (label.length < 2) fields.label = 'Informe um apelido.'
  if (!NETWORKS.includes(network)) fields.network = 'Escolha a rede.'
  else if (!addressOk(network, address)) fields.address = 'Endereço inválido para esta rede.'
  else if (others.some((o) => o.address.toLowerCase() === address.toLowerCase())) fields.address = 'Esta carteira já está cadastrada.'
  if (!kind) fields.kind = 'Escolha o tipo.'
  if (Object.keys(fields).length) return { fields }
  return { fields, w: { label, address, network, kind: kind! } }
}

export const accountHandlers = [
  http.get('*/api/profile', async ({ request }) => {
    const { scenario, failure } = await prelude()
    if (failure) return failure
    const user = requireUser(request, scenario)
    if (typeof user !== 'string') return user
    const rec = getDb().users.find((u) => u.id === user)
    return rec ? HttpResponse.json(toUser(rec)) : HttpResponse.json(apiError('SESSION_INVALID', 'Sessão inválida.'), { status: 401 })
  }),

  http.patch('*/api/profile', async ({ request }) => {
    const { scenario, failure } = await prelude()
    if (failure) return failure
    const userId = requireUser(request, scenario)
    if (typeof userId !== 'string') return userId
    const b = await body(request)
    const name = str(b.name).trim()
    const email = str(b.email).trim().toLowerCase()
    const fields: Record<string, string> = {}
    if (name.length < 2) fields.name = 'Informe seu nome.'
    if (!EMAIL_RE.test(email)) fields.email = 'E-mail inválido.'
    const hasAvatar = 'avatarUrl' in b
    const avatar = str(b.avatarUrl)
    if (hasAvatar && avatar && !avatar.startsWith('data:image/')) fields.avatarUrl = 'Arquivo de imagem inválido.'
    if (hasAvatar && avatar.length > MAX_AVATAR) fields.avatarUrl = 'Imagem muito grande.'
    if (Object.keys(fields).length) return invalid(fields)
    if (getDb().users.some((u) => u.id !== userId && u.email.toLowerCase() === email)) {
      return HttpResponse.json(apiError('EMAIL_TAKEN', 'Este e-mail já está cadastrado.', { email: 'Este e-mail já está cadastrado.' }), { status: 409 })
    }
    const out = mutate((db) => {
      const u = db.users.find((x) => x.id === userId)!
      u.name = name
      u.email = email
      if (hasAvatar) { if (avatar) u.avatarUrl = avatar; else delete u.avatarUrl }
      return toUser(u)
    })
    return HttpResponse.json(out)
  }),

  http.post('*/api/profile/password', async ({ request }) => {
    const { scenario, failure } = await prelude()
    if (failure) return failure
    const userId = requireUser(request, scenario)
    if (typeof userId !== 'string') return userId
    const b = await body(request)
    const current = str(b.currentPassword)
    const next = str(b.newPassword)
    const fields: Record<string, string> = {}
    const rec = getDb().users.find((u) => u.id === userId)!
    if (!current) fields.currentPassword = 'Informe a senha atual.'
    else if ((await sha256Hex(current)) !== rec.passwordHash) fields.currentPassword = 'Senha atual incorreta.'
    if (next.length < 8) fields.newPassword = 'Use ao menos 8 caracteres.'
    else if (!/[A-Za-z]/.test(next)) fields.newPassword = 'Inclua uma letra.'
    else if (!/\d/.test(next)) fields.newPassword = 'Inclua um número.'
    else if (next === current) fields.newPassword = 'A nova senha deve ser diferente.'
    if (Object.keys(fields).length) return invalid(fields)
    const hash = await sha256Hex(next)
    mutate((db) => { db.users.find((u) => u.id === userId)!.passwordHash = hash })
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('*/api/wallets', async ({ request }) => {
    const { scenario, failure } = await prelude()
    if (failure) return failure
    const userId = requireUser(request, scenario)
    if (typeof userId !== 'string') return userId
    return HttpResponse.json(walletsOf(userId))
  }),

  http.post('*/api/wallets', async ({ request }) => {
    const { scenario, failure } = await prelude()
    if (failure) return failure
    const userId = requireUser(request, scenario)
    if (typeof userId !== 'string') return userId
    const list = walletsOf(userId)
    const { fields, w } = validateWallet(await body(request), list)
    if (!w) return invalid(fields)
    const created: Wallet = { id: `w-${crypto.randomUUID().slice(0, 8)}`, ...w }
    mutate((db) => {
      const l = db.wallets[userId]!
      if (created.kind === 'primary') l.forEach((x) => { x.kind = 'secondary' })
      l.push(created)
    })
    return HttpResponse.json(created, { status: 201 })
  }),

  http.patch('*/api/wallets/:id', async ({ request, params }) => {
    const { scenario, failure } = await prelude()
    if (failure) return failure
    const userId = requireUser(request, scenario)
    if (typeof userId !== 'string') return userId
    const id = String(params.id)
    const list = walletsOf(userId)
    if (!list.some((x) => x.id === id)) return HttpResponse.json(apiError('WALLET_NOT_FOUND', 'Carteira não encontrada.'), { status: 404 })
    const { fields, w } = validateWallet(await body(request), list.filter((x) => x.id !== id))
    if (!w) return invalid(fields)
    if (w.kind === 'secondary' && !list.some((x) => x.id !== id && x.kind === 'primary')) {
      return invalid({ kind: 'Mantenha ao menos uma carteira principal.' })
    }
    const out = mutate((db) => {
      const l = db.wallets[userId]!
      if (w.kind === 'primary') l.forEach((x) => { x.kind = 'secondary' })
      const t = l.find((x) => x.id === id)!
      Object.assign(t, w)
      return t
    })
    return HttpResponse.json(out)
  }),
]
