import { Link } from '@tanstack/react-router'
import { LogIn, LogOut, ShoppingCart } from 'lucide-react'
import { useLogout } from '@/features/auth/api'
import { useSession } from '@/features/auth/session'
import { useCartCount } from '@/features/cart/queries'
import { NAV } from '@/features/home/figma-content'
import { HeaderSearch } from './HeaderSearch'

export function SiteHeader({ active = 'Início' }: { active?: string }) {
  const session = useSession()
  const logout = useLogout()
  const cartCount = useCartCount()
  return (
    <header className="relative mx-auto hidden h-[70px] w-full max-w-[1200px] items-center justify-between border-b border-[#3b2a20] md:flex">
      <a href="/" className="text-[13px] font-bold tracking-[0.12em] text-[#f3ece3]">KURIO</a>
      <nav aria-label="Principal" className="absolute left-1/2 flex h-full -translate-x-1/2 gap-9">
        {NAV.map((n) => (
          <a key={n} href={n === 'Início' ? '/' : undefined} aria-current={n === active ? 'page' : undefined}
            aria-disabled={n !== 'Início' || undefined}
            title={n !== 'Início' ? 'Em breve' : undefined}
            className={`relative flex items-center text-base ${n !== 'Início' ? 'cursor-not-allowed ' : ''}${n === active ? 'font-bold text-[#e89b55] after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-[#d18a4e]' : 'text-[#f3ece3]'}`}>
            {n}
          </a>
        ))}
      </nav>
      <div className="flex items-center gap-6">
        <HeaderSearch />
        <Link to="/cart" aria-label="Carrinho" className="relative text-[#f3ece3]">
            <ShoppingCart size={22} />
            {cartCount > 0 && <span data-testid="cart-badge" className="absolute -right-2 -top-2 grid size-4 place-items-center rounded-full bg-[#d18a4e] text-[9px] font-bold text-[#140d0b]">{cartCount}</span>}
          </Link>
        {session ? (
          <div className="flex items-center gap-3">
            <span data-testid="user-name" className="max-w-[140px] truncate text-sm text-[#f3ece3]">{session.user.name}</span>
            <button type="button" onClick={() => void logout()} className="flex h-9 items-center gap-1.5 rounded-md border border-[#d18a4e] px-3 text-sm font-bold text-[#e89b55]"><LogOut size={16} />Sair</button>
          </div>
        ) : (
          <Link to="/login" className="flex h-9 items-center gap-1.5 rounded-md bg-[#d18a4e] px-3 text-sm font-bold text-[#140d0b]"><LogIn size={16} />Entrar</Link>
        )}
      </div>
    </header>
  )
}
