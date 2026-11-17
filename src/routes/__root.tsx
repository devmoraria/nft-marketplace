import { Outlet, createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => (<><Outlet /><div id="live" role="status" aria-live="polite" className="sr-only" /></>),
  notFoundComponent: () => <main className="grid min-h-screen place-items-center bg-[#140d0b] text-[#f3ece3]"><p>Página não encontrada. <a href="/" className="text-[#e89b55] underline">Voltar ao início</a></p></main>,
})
