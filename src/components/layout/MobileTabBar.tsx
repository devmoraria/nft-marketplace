import { Heart, House, ScanLine, ShoppingCart, User } from 'lucide-react'

// Barra inferior do Figma mobile. Início, favoritos, carrinho e perfil navegam; "Escanear" fica fora do escopo (desabilitado).
const idle = 'grid size-11 place-items-center rounded-full text-[#cfb18c]'

export function MobileTabBar() {
  return (
    <nav aria-label="Navegação inferior" className="fixed inset-x-0 bottom-0 z-30 h-[84px] md:hidden">
      <div aria-hidden className="absolute inset-0 rounded-t-[26px] bg-[#231611]" />
      <div className="relative grid h-full grid-cols-[1fr_1fr_80px_1fr_1fr] items-center px-1.5 pt-2">
        <a href="/" aria-label="Início" aria-current="page" className="grid size-11 place-items-center justify-self-center rounded-full text-[#d18a4e]">
          <House size={22} className="fill-current" />
        </a>
        <a href="/favoritos" aria-label="Favoritos" className={`${idle} justify-self-center`}>
          <Heart size={22} className="fill-current" />
        </a>
        <span aria-hidden />
        <a href="/cart" aria-label="Carrinho" className={`${idle} justify-self-center`}>
          <ShoppingCart size={22} className="fill-current" />
        </a>
        <a href="/perfil" aria-label="Perfil" className={`${idle} justify-self-center`}>
          <User size={22} className="fill-current" />
        </a>
      </div>
      <button
        type="button"
        disabled
        title="Em breve"
        aria-label="Escanear"
        className="absolute left-1/2 top-0 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gradient-to-br from-[#d18a4e] to-[#b8763f] text-[#140d0b] ring-[7px] ring-[#140d0b]"
      >
        <ScanLine size={26} />
      </button>
    </nav>
  )
}
