import { Outlet, createRootRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { revalidateSession } from '@/features/auth/api'

function Root() {
  // F5: a sessão guardada é conferida no servidor; só um 401 derruba o login.
  useEffect(() => { void revalidateSession() }, [])
  return (<><Outlet /><div id="live" role="status" aria-live="polite" className="sr-only" /></>)
}

export const Route = createRootRoute({
  component: Root,
  notFoundComponent: () => <main className="grid min-h-screen place-items-center bg-[#140d0b] text-[#f3ece3]"><p>Página não encontrada. <a href="/" className="text-[#e89b55] underline">Voltar ao início</a></p></main>,
})
