import { useSyncExternalStore } from 'react'
import type { Session } from '@/shared/api/types'

// A chave "auth" é a mesma que o interceptor de src/shared/api/http.ts lê para montar o Bearer.
const KEY = 'auth'
const listeners = new Set<() => void>()

let cachedRaw: string | null | undefined
let cachedValue: Session | null = null

function readRaw(): string | null {
  try { return localStorage.getItem(KEY) } catch { return null }
}

function parse(raw: string | null): Session | null {
  if (!raw) return null
  try {
    const v = JSON.parse(raw) as Partial<Session>
    return v.token && v.user ? (v as Session) : null
  } catch {
    return null
  }
}

// Mesmo texto no localStorage devolve o mesmo objeto, como o useSyncExternalStore exige.
export function getSession(): Session | null {
  const raw = readRaw()
  if (raw !== cachedRaw) {
    cachedRaw = raw
    cachedValue = parse(raw)
  }
  return cachedValue
}

function emit(): void {
  listeners.forEach((l) => l())
}

export function setSession(session: Session): void {
  try { localStorage.setItem(KEY, JSON.stringify(session)) } catch { /* modo privado */ }
  emit()
}

export function clearSession(): void {
  try { localStorage.removeItem(KEY) } catch { /* modo privado */ }
  emit()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => { if (e.key === KEY || e.key === null) listener() }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, getSession, () => null)
}

/** Aceita só caminhos internos, para o ?redirect= não virar redirecionamento aberto. */
export function safeRedirect(value: string | undefined): string | undefined {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return undefined
  return value
}
