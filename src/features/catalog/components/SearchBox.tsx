import { useEffect, useRef, useState } from 'react'
import { SearchIcon } from '@/shared/components/icons'

interface SearchBoxProps {
  value: string
  onSearch: (q: string) => void
}

/** Digitação com debounce de 350 ms; Enter envia na hora; voltar do histórico ressincroniza. */
export function SearchBox({ value, onSearch }: SearchBoxProps) {
  const [text, setText] = useState(value)
  const lastSent = useRef(value)
  const onSearchRef = useRef(onSearch)

  useEffect(() => {
    onSearchRef.current = onSearch
  })

  // URL mudou por fora (histórico, limpar filtros): reflete no campo.
  useEffect(() => {
    if (value !== lastSent.current) {
      lastSent.current = value
      setText(value)
    }
  }, [value])

  useEffect(() => {
    if (text === lastSent.current) return
    const t = setTimeout(() => {
      lastSent.current = text
      onSearchRef.current(text)
    }, 350)
    return () => clearTimeout(t)
  }, [text])

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        lastSent.current = text
        onSearch(text)
      }}
      className="relative"
    >
      <label htmlFor="catalog-search" className="sr-only">
        Buscar NFTs
      </label>
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input
        id="catalog-search"
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Buscar NFTs..."
        className="w-full rounded-md border border-input bg-card py-2 pl-10 pr-3 placeholder:text-muted-foreground"
      />
    </form>
  )
}
