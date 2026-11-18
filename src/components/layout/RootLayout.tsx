import { Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import { revalidateSession } from '@/features/auth/api'

export function RootLayout() {
  // F5: a sessão guardada é conferida no servidor; só um 401 derruba o login.
  useEffect(() => { void revalidateSession() }, [])
  return (<><Outlet /><div id="live" role="status" aria-live="polite" className="sr-only" /></>)
}
