import { useRouter } from '@tanstack/react-router'
import { useCallback } from 'react'
import { getSession } from './session'

/**
 * Uso: const requireAuth = useRequireAuth()
 *      onClick={() => requireAuth(() => adicionarAoCarrinho())}
 * Sem sessão, leva a /login?redirect=<página atual> e volta para ela depois do login.
 */
export function useRequireAuth(): (action: () => void) => void {
  const router = useRouter()
  return useCallback(
    (action) => {
      if (getSession()) {
        action()
        return
      }
      const back = window.location.pathname + window.location.search
      router.history.push(`/login?redirect=${encodeURIComponent(back)}`)
    },
    [router],
  )
}
