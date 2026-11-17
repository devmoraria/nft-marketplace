import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { FilterIcon } from '@/shared/components/icons'
import { PAGE_SIZE, SORT_OPTIONS, resolveSearch, toNftQuery, type CatalogSearch } from '../search'
import { nftsQueryOptions } from '../queries'
import { Filters } from './Filters'
import { NftCard, NftCardSkeleton } from './NftCard'
import { Pagination } from './Pagination'
import { SearchBox } from './SearchBox'
import { EmptyState, ErrorState } from './StateMessages'

const routeApi = getRouteApi('/')

/** Diálogo nativo: já prende o foco e devolve o foco ao botão que o abriu. */
function FiltersDialog({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="filters-title"
      className="m-0 ml-auto h-dvh max-h-none w-full max-w-sm bg-card p-5 text-foreground backdrop:bg-black/70"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 id="filters-title" className="text-base font-bold">
          Filtros
        </h2>
        <button type="button" onClick={onClose} className="rounded-md px-3 py-1.5 hover:bg-accent">
          Fechar
        </button>
      </div>
      {open && children}
    </dialog>
  )
}

export function Catalog() {
  const search = resolveSearch(routeApi.useSearch())
  const navigate = routeApi.useNavigate()
  const [filtersOpen, setFiltersOpen] = useState(false)

  const { data, isPending, isError, error, isFetching, isPlaceholderData, refetch } = useQuery(
    nftsQueryOptions(toNftQuery(search)),
  )

  // Qualquer mudança de filtro, busca ou ordenação volta para a página 1.
  const update = (patch: Partial<CatalogSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch, page: 1 }) })
  const clearAll = () => navigate({ search: {} })

  const hasFilters = Boolean(
    search.q || search.category?.length || search.minPrice !== undefined || search.maxPrice !== undefined,
  )

  const filters = (
    <Filters
      category={search.category}
      minPrice={search.minPrice}
      maxPrice={search.maxPrice}
      onCategoryChange={(next) => update({ category: next.length ? next : undefined })}
      onPriceApply={(min, max) => update({ minPrice: min, maxPrice: max })}
    />
  )

  const stale = isPlaceholderData && isFetching
  const tab = (active: boolean) =>
    `border-b-2 px-1 pb-1 ${active ? 'border-primary text-accent-foreground' : 'border-transparent hover:text-accent-foreground'}`

  return (
    <section id="catalogo" aria-labelledby="catalog-title" className="mx-auto w-full max-w-[1200px] scroll-mt-4 px-4 md:px-6 xl:px-0">
      <h2 id="catalog-title" className="sr-only">
        Catálogo de NFTs
      </h2>

      <div className="grid gap-8 lg:grid-cols-[264px_1fr]">
        <aside aria-label="Filtros" className="hidden self-start bg-card p-5 lg:block">
          {filters}
        </aside>

        <div>
          <div className="mb-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div className="flex items-center gap-6">
              <button type="button" aria-pressed={search.sort !== 'popular'} onClick={() => update({ sort: 'newest' })} className={tab(search.sort !== 'popular')}>
                Todos os NFTs
              </button>
              <button type="button" aria-pressed={search.sort === 'popular'} onClick={() => update({ sort: 'popular' })} className={tab(search.sort === 'popular')}>
                Em alta
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-muted-foreground">
                Ordenar por:
              </label>
              <select
                id="sort"
                value={search.sort}
                onChange={(e) => update({ sort: e.target.value as CatalogSearch['sort'] })}
                className="rounded-md border border-input bg-card px-2 py-1.5"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-6 flex gap-3">
            <div className="flex-1">
              <SearchBox value={search.q ?? ''} onSearch={(q) => update({ q: q.trim() || undefined })} />
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 lg:hidden"
            >
              <FilterIcon />
              Filtros
            </button>
          </div>

          <p role="status" aria-live="polite" className="mb-4 min-h-6 text-muted-foreground">
            {data && !isPlaceholderData ? `${data.total} ${data.total === 1 ? 'NFT encontrado' : 'NFTs encontrados'}` : ''}
          </p>

          {isPending && (
            <ul aria-busy="true" aria-label="Carregando NFTs" className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {Array.from({ length: PAGE_SIZE }, (_, i) => (
                <li key={i}>
                  <NftCardSkeleton />
                </li>
              ))}
            </ul>
          )}

          {isError && !data && <ErrorState error={error} onRetry={() => void refetch()} />}

          {data && data.items.length === 0 && <EmptyState hasFilters={hasFilters} onClear={clearAll} />}

          {data && data.items.length > 0 && (
            <>
              {isError && (
                <p role="alert" className="mb-4 rounded-md border border-destructive/60 px-3 py-2 text-sm">
                  Não foi possível atualizar a lista. Mostrando os últimos resultados.{' '}
                  <button type="button" onClick={() => void refetch()} className="font-bold underline">
                    Tentar novamente
                  </button>
                </p>
              )}
              <ul
                aria-busy={stale}
                className={`grid grid-cols-2 gap-4 transition-opacity md:grid-cols-3 ${stale ? 'opacity-60' : ''}`}
              >
                {data.items.map((nft, i) => (
                  <li key={nft.id}>
                    <NftCard nft={nft} priority={i < 3} />
                  </li>
                ))}
              </ul>
              <Pagination page={data.page} totalPages={data.totalPages} />
            </>
          )}
        </div>
      </div>

      <FiltersDialog open={filtersOpen} onClose={() => setFiltersOpen(false)}>
        {filters}
      </FiltersDialog>
    </section>
  )
}
