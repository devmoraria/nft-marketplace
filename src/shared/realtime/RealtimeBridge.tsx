import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useSession } from '@/features/auth/session'
import { startRealtime } from './client'

// Montar uma vez, dentro do QueryClientProvider. Ao trocar de usuário (login/logout) o efeito
// roda de novo: fecha o socket antigo e abre outro já com o token novo.
export function RealtimeBridge() {
  const qc = useQueryClient()
  const userId = useSession()?.user.id ?? 'guest'
  useEffect(() => startRealtime(qc, userId), [qc, userId])
  return null
}
