import { useNavigate } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { scrollToCatalog } from '@/shared/scrollToCatalog'

/** Lupa do header: abre o campo de busca, leva à home com ?q= e rola até os resultados. */
export function HeaderSearch() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) input.current?.focus()
  }, [open])

  function close() {
    setOpen(false)
    toggle.current?.focus()
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const q = text.trim()
    await navigate({ to: '/', search: { q: q || undefined } })
    // Espera a home montar antes de rolar até o catálogo.
    requestAnimationFrame(() => scrollToCatalog())
  }

  return (
    <div className="flex items-center gap-2">
      {open && (
        <form
          role="search"
          onSubmit={(e) => void submit(e)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') close()
          }}
        >
          <label htmlFor="header-search" className="sr-only">
            Buscar NFTs
          </label>
          <input
            id="header-search"
            ref={input}
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Buscar NFTs..."
            className="h-9 w-56 rounded-md border border-[#3b2a20] bg-[#221612] px-3 text-sm text-[#f3ece3] placeholder:text-[#8a6f55] focus-visible:outline-2 focus-visible:outline-[#d18a4e]"
          />
        </form>
      )}
      <button
        ref={toggle}
        type="button"
        aria-label="Buscar"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
        className="text-[#f3ece3] hover:text-[#e89b55] motion-safe:transition-colors"
      >
        <Search size={22} />
      </button>
    </div>
  )
}
