import type { ReactNode } from 'react'
import { scrollToCatalog } from './scrollToCatalog'

/** Âncora para o catálogo: mantém o href (sem JS e para copiar o link), mas rola de verdade. */
export function CatalogLink({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <a
      href="#catalogo"
      className={className}
      onClick={(e) => {
        e.preventDefault()
        scrollToCatalog()
      }}
    >
      {children}
    </a>
  )
}
