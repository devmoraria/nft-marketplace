import { Link } from '@tanstack/react-router'
import { CartIcon, LoginIcon } from './icons'

// Seções fora do escopo do desafio: não são links (README seção 3).
const OUT_OF_SCOPE = ['Mercado', 'Criadores', 'Aprenda']

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-[72px] w-full max-w-[1200px] items-center justify-between gap-4 px-4 md:px-6 xl:px-0">
        <Link to="/" aria-label="Kurio, página inicial" className="text-xs font-bold tracking-[0.2em]">
          KURIO
        </Link>

        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center gap-8">
            <li>
              <Link
                to="/"
                activeOptions={{ exact: true }}
                activeProps={{ 'aria-current': 'page', className: 'text-accent-foreground border-b-2 border-primary' }}
                className="inline-block pb-1"
              >
                Início
              </Link>
            </li>
            {OUT_OF_SCOPE.map((label) => (
              <li key={label}>
                <button
                  type="button"
                  disabled
                  title="Em breve"
                  className="pb-1 text-foreground/70 disabled:cursor-not-allowed"
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          {/* Rotas /cart e /login entram nas próximas fatias; <a> comum até lá. */}
          <a href="/cart" aria-label="Carrinho" className="rounded-md p-2 hover:bg-card">
            <CartIcon />
          </a>
          <a
            href="/login"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 font-bold text-primary-foreground hover:opacity-90"
          >
            <LoginIcon />
            Entrar
          </a>
        </div>
      </div>
    </header>
  )
}
