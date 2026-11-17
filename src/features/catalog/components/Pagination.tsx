import { Link } from '@tanstack/react-router'

function windowOf(page: number, total: number, size = 5): number[] {
  const half = Math.floor(size / 2)
  const start = Math.max(1, Math.min(page - half, total - size + 1))
  const end = Math.min(total, start + size - 1)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

const item =
  'inline-flex size-9 items-center justify-center rounded-md border border-border text-sm hover:bg-accent'

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Paginação" className="mt-8">
      <ul className="flex flex-wrap items-center gap-2">
        {page > 1 && (
          <li>
            <Link
              to="/"
              search={(prev) => ({ ...prev, page: page - 1 })}
              aria-label="Página anterior"
              className={item}
              resetScroll={false}
            >
              ‹
            </Link>
          </li>
        )}
        {windowOf(page, totalPages).map((n) => (
          <li key={n}>
            <Link
              to="/"
              search={(prev) => ({ ...prev, page: n })}
              aria-label={`Página ${n}`}
              aria-current={n === page ? 'page' : undefined}
              className={`${item} ${n === page ? 'border-primary bg-primary font-bold text-primary-foreground' : ''}`}
              resetScroll={false}
            >
              {n}
            </Link>
          </li>
        ))}
        {page < totalPages && (
          <li>
            <Link
              to="/"
              search={(prev) => ({ ...prev, page: page + 1 })}
              aria-label="Próxima página"
              className={item}
              resetScroll={false}
            >
              ›
            </Link>
          </li>
        )}
      </ul>
    </nav>
  )
}
