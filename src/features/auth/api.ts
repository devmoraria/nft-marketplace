import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { AppError, http } from '@/shared/api/http'
import type { Session } from '@/shared/api/types'
import { clearSession, getSession, setSession } from './session'

export interface LoginInput { email: string; password: string }
export interface SignupInput { name: string; email: string; password: string }

export async function login(input: LoginInput): Promise<Session> {
  const { data } = await http.post<Session>('/auth/login', input)
  return data
}

export async function signup(input: SignupInput): Promise<Session> {
  const { data } = await http.post<Session>('/auth/signup', input)
  return data
}

async function fetchSession(): Promise<Session> {
  const { data } = await http.get<Session>('/auth/session')
  return data
}

function announce(message: string): void {
  const el = document.getElementById('live')
  if (el) el.textContent = message
}

/** Valida a sessão guardada (F5). Só 401 derruba a sessão: erro de rede mantém o login. */
let inflight: Promise<void> | null = null

// O StrictMode roda o efeito duas vezes em dev: a segunda chamada reaproveita a primeira.
export function revalidateSession(): Promise<void> {
  if (!getSession()) return Promise.resolve()
  inflight ??= (async () => {
    try {
      setSession(await fetchSession())
    } catch (e) {
      if (e instanceof AppError && e.status === 401) {
        clearSession()
        announce('Sua sessão expirou. Entre novamente.')
      }
    } finally {
      inflight = null
    }
  })()
  return inflight
}

const PRIVATE_KEYS = ['cart', 'favorites', 'orders', 'wallets', 'quote']

export function useLogout(): () => Promise<void> {
  const qc = useQueryClient()
  return useCallback(async () => {
    try { await http.post('/auth/logout') } catch { /* sair localmente mesmo sem resposta */ }
    clearSession()
    qc.removeQueries({ predicate: (q) => PRIVATE_KEYS.includes(String(q.queryKey[0])) })
    announce('Você saiu da sua conta.')
  }, [qc])
}
