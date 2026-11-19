import heroImg from '@/assets/nfts/emerald-ape-800.webp'
import './skeleton.css'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link, getRouteApi } from '@tanstack/react-router'
import { ArrowRight, ChevronDown, ChevronRight, Heart, Search, ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { CatalogLink } from '@/shared/CatalogLink'
import { MobileTabBar } from '@/components/layout/MobileTabBar'
import { MobileHome } from './MobileHome'
import { nftsQuery } from '@/features/catalog/queries'
import type { Nft } from '@/shared/api/types'
import { BANNERS, BLOG, CATEGORIES, NETWORKS, PRICE_BOUNDS, SORTS, TABS } from './figma-content'

const route = getRouteApi('/')
const art = (items: Nft[] | undefined, title: string, i = 0) => (items?.find((n) => n.title === title) ?? items?.[i % (items?.length || 1)])?.images[0]
const accent = 'text-[#e89b55]'

function Card({ nft }: { nft: Nft }) {
  return (
    <article className="group relative w-full motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:-translate-y-1">
      <Link to="/nft/$nftId" params={{ nftId: nft.id }} aria-hidden tabIndex={-1} className="absolute inset-0 z-[1]" />
      <div className="relative grid h-[300px] place-items-center bg-[#221612]">
        {nft.badge && <span className="absolute left-0 top-0 bg-[#d18a4e] px-3 py-1 text-sm text-[#140d0b]">{nft.badge}</span>}
        <img src={nft.thumbnail} alt={nft.title} width={250} height={250} loading="lazy" className="size-[250px] rounded-[14px] object-contain" />
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2 opacity-0 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100 motion-safe:transition-opacity motion-safe:duration-200">
          <button disabled aria-label="Adicionar ao carrinho" className="grid size-9 place-items-center rounded bg-[#140d0b] text-[#f3ece3]"><ShoppingCart size={16} /></button>
          <button disabled aria-label="Favoritar" className="grid size-9 place-items-center rounded bg-[#140d0b] text-[#f3ece3]"><Heart size={16} /></button>
          <Link to="/nft/$nftId" params={{ nftId: nft.id }} aria-label={`Ver ${nft.title}`} className="grid size-9 place-items-center rounded bg-[#140d0b] text-[#f3ece3] hover:bg-[#d18a4e] hover:text-[#140d0b] motion-safe:transition-colors"><Search size={16} /></Link>
        </div>
      </div>
      <h3 className="mt-[10px] text-base text-[#f3ece3]">{nft.title}</h3>
      <p className={`mt-1.5 text-lg font-bold ${accent}`}>{nft.priceEth} ETH{nft.compareAtPriceEth && <span className="ml-2 font-normal text-[#b8946a]">{nft.compareAtPriceEth} ETH</span>}</p>
    </article>
  )
}

const Skeleton = () => <div aria-hidden><div className="skeleton h-[300px]" /><div className="skeleton mt-[10px] h-4 w-40" /><div className="skeleton mt-1.5 h-5 w-24" /></div>

function PriceRange({ onApply }: { onApply: (lo: string, hi: string) => void }) {
  const [lo, setLo] = useState(PRICE_BOUNDS.min), [hi, setHi] = useState(PRICE_BOUNDS.max)
  const th = '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-[14px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#d18a4e] [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-[14px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[#d18a4e]'
  const cls = `pointer-events-none absolute inset-0 w-full appearance-none bg-transparent ${th}`
  const fmt = (n: number) => n.toFixed(2).replace('.', ',')
  return (
    <div>
      <div className="relative mt-4 h-4"><div className="absolute inset-x-0 top-[7px] h-0.5 bg-[#d18a4e]" />
        <input aria-label="Preço mínimo" type="range" min={PRICE_BOUNDS.min} max={PRICE_BOUNDS.max} step={0.01} value={lo} onChange={(e) => setLo(Math.min(+e.target.value, hi))} className={cls} />
        <input aria-label="Preço máximo" type="range" min={PRICE_BOUNDS.min} max={PRICE_BOUNDS.max} step={0.01} value={hi} onChange={(e) => setHi(Math.max(+e.target.value, lo))} className={cls} /></div>
      <p className="mt-4 text-sm text-[#f3ece3]">Preço: {fmt(lo)} - {fmt(hi)} ETH</p>
      <button onClick={() => onApply(String(lo), String(hi))} className="mt-3 rounded bg-[#d18a4e] px-3 py-1.5 text-sm font-bold text-[#140d0b]">Aplicar</button>
    </div>
  )
}

export function HomePage() {
  const s = route.useSearch(), navigate = route.useNavigate()
  const tab = s.tab ?? 'all', page = s.page ?? 1
  const sort = tab === 'hot' ? 'popular' : tab === 'new' ? 'newest' : (s.sort ?? 'newest')
  const q = useQuery({ ...nftsQuery({ q: s.q, category: s.category, minPrice: s.min, maxPrice: s.max, sort, page, pageSize: 9 }), placeholderData: keepPreviousData })
  const items = q.data?.items
  const go = (patch: Partial<typeof s>) => navigate({ search: (p) => ({ ...p, ...patch, page: 1 }) })
  const toggleCat = (c: string) => go({ category: s.category?.includes(c) ? s.category.filter((x) => x !== c) || undefined : [...(s.category ?? []), c] })
  const featured = items?.[3]

  return (
    <div className="min-h-screen bg-[#140d0b] text-[#f3ece3]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1200px]">
        <MobileHome items={items} isPending={q.isPending} isError={q.isError} onRetry={() => q.refetch()} tab={tab} onTab={(id) => go({ tab: id })} />

        {/* DESKTOP */}
        <div className="hidden md:block">
          <section className="relative mt-[33px] flex h-[450px] items-start justify-between">
            <div className="pl-10 pt-[41px]">
              <p className="mb-2 text-base">Bem-vindo à Kurio</p>
              <h1 className="text-[43px] font-bold leading-[70px]">SEJA DONO DO FUTURO<br />DA ARTE DIGITAL</h1>
              <p className="mt-0.5 max-w-[550px] text-sm leading-6 text-[#b8946a]">Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet.</p>
              <CatalogLink className="mt-8 inline-grid h-10 w-[140px] place-items-center rounded-md bg-[#d18a4e] text-sm font-bold text-[#140d0b] hover:brightness-110 motion-safe:transition motion-safe:hover:-translate-y-0.5">EXPLORAR</CatalogLink>
            </div>
            <div className="absolute bottom-[43px] left-[600px] flex gap-1.5" aria-hidden>{[0, 1, 2].map((i) => <i key={i} className="size-2 rounded-full bg-[#d18a4e]" />)}</div>
            <img src={heroImg} alt="Emerald Ape #042" width={450} height={450} className="size-[450px] rounded-[28px] object-cover" />
          </section>

          <div id="catalogo" className="mt-24 grid grid-cols-[311px_1fr] gap-[45px]">
            <aside>
              <div className="bg-[#221612] p-5">
                <h2 className="mb-3 text-lg font-bold">Coleções</h2>
                <ul>{CATEGORIES.map(([c, slug, n]) => (
                  <li key={slug}><button onClick={() => toggleCat(slug)} aria-pressed={s.category?.includes(slug)} className={`flex h-10 w-full items-center justify-between pl-3 pr-[13px] text-[15px] ${s.category?.includes(slug) ? 'text-[#e89b55]' : 'text-[#b8946a]'}`}><span>{c}</span><b className="text-[#f3ece3]">({n})</b></button></li>))}</ul>
                <h2 className="mb-1 mt-6 text-lg font-bold">Faixa de preço</h2>
                <PriceRange onApply={(lo, hi) => go({ min: lo, max: hi })} />
                <h2 className="mb-2 mt-8 text-lg font-bold">Rede</h2>
                <ul>{NETWORKS.map(([c, n]) => <li key={c} className="flex h-10 items-center justify-between pl-3 pr-px text-[15px] text-[#b8946a]"><span>{c}</span><span>({n})</span></li>)}</ul>
              </div>
              <div className="mt-6 overflow-hidden rounded-b-3xl bg-[#221612] pt-6">
                <p className={`px-5 text-2xl font-bold ${accent}`}>NFT EM DESTAQUE</p><p className="mb-3 mt-3 text-center text-[22px] font-bold">OFERTA LIMITADA</p>
                {featured ? <img src={featured.images[0]} alt={featured.title} width={311} height={365} loading="lazy" className="h-[365px] w-full rounded-3xl object-cover" /> : <div className="skeleton h-[365px]" />}
              </div>
            </aside>

            <section aria-labelledby="cat-h">
              <h2 id="cat-h" className="sr-only">Catálogo</h2>
              <div className="mb-6 flex items-center justify-between text-[15px]">
                <div className="flex gap-5">{TABS.map((t) => <button key={t.id} onClick={() => go({ tab: t.id })} aria-pressed={tab === t.id} className={`pb-0.5 ${tab === t.id ? `border-b-2 border-[#d18a4e] ${accent}` : ''}`}>{t.label}</button>)}</div>
                <label className="relative flex items-center">Ordenar por:
                  <select value={s.sort ?? 'newest'} onChange={(e) => go({ sort: e.target.value as typeof s.sort, tab: 'all' })} className="appearance-none bg-transparent pr-5 text-[#f3ece3] focus-visible:outline-2 focus-visible:outline-[#d18a4e]">{SORTS.map((o) => <option key={o.id} value={o.id} className="bg-[#221612]">{o.label}</option>)}</select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-0" /></label>
              </div>
              {q.isError ? (
                <div role="alert" className="grid h-[300px] place-items-center bg-[#221612] text-center"><div><p>Não foi possível carregar os NFTs.</p><p className="mt-1 text-xs text-[#b8946a]">{(q.error as { status?: number; code?: string; message?: string } | null)?.code ?? (q.error as Error | null)?.message}</p><button onClick={() => q.refetch()} className="mt-3 rounded bg-[#d18a4e] px-4 py-2 font-bold text-[#140d0b]">Tentar novamente</button></div></div>
              ) : q.isPending ? (
                <div className="grid grid-cols-3 gap-x-[32px] gap-y-[60px]">{Array.from({ length: 9 }, (_, i) => <Skeleton key={i} />)}</div>
              ) : items?.length === 0 ? (
                <div role="status" className="grid h-[300px] place-items-center bg-[#221612]">Nenhum NFT encontrado para esses filtros.</div>
              ) : (
                <div className="grid grid-cols-3 gap-x-[32px] gap-y-[60px]">{items?.map((n) => <Card key={n.id} nft={n} />)}</div>
              )}
              {q.data && q.data.totalPages > 1 && (
                <nav aria-label="Paginação" className="mt-14 flex justify-end gap-2">
                  {Array.from({ length: q.data.totalPages }, (_, i) => i + 1).map((p) => <button key={p} aria-current={p === page ? 'page' : undefined} onClick={() => navigate({ search: (x) => ({ ...x, page: p }) })} className={`size-[35px] rounded-md border border-[#3b2a20] text-sm ${p === page ? 'border-[#d18a4e] bg-[#d18a4e] font-bold text-[#140d0b]' : ''}`}>{p}</button>)}
                  <button aria-label="Próxima página" disabled={page >= q.data.totalPages} onClick={() => navigate({ search: (x) => ({ ...x, page: page + 1 }) })} className="grid size-[35px] place-items-center rounded-md border border-[#3b2a20]"><ChevronRight size={16} /></button>
                </nav>
              )}
            </section>
          </div>

          <section className="mt-24 grid grid-cols-2 gap-[30px]">
            {BANNERS.map((b, i) => (
              <div key={i} className="flex h-[250px] overflow-hidden rounded-xl bg-[#221612]">
                {art(items, b.art, i) ? <img src={art(items, b.art, i)} alt="" width={288} height={250} loading="lazy" className="h-full w-[288px] object-cover" /> : <div className="skeleton h-full w-[288px]" />}
                <div className="flex flex-1 flex-col items-end justify-start pr-[30px] pt-[37px] text-right"><h2 className="text-lg font-bold leading-6">{b.title[0]}<br />{b.title[1]}</h2><p className="mb-3.5 mt-3.5 max-w-[262px] text-sm leading-6 text-[#b8946a]">{b.text}</p><CatalogLink className="inline-flex h-[38px] items-center gap-1 rounded bg-[#d18a4e] px-6 text-sm font-bold text-[#140d0b] hover:brightness-110 motion-safe:transition motion-safe:hover:-translate-y-0.5">Explorar<ArrowRight size={16} /></CatalogLink></div>
              </div>))}
          </section>

          <section className="mt-[70px] text-center">
            <h2 className="text-[28px] font-bold">{BLOG.title}</h2><p className="mt-3 text-[15px] text-[#b8946a]">{BLOG.subtitle}</p>
            <div className="mt-9 flex gap-6 text-left">{BLOG.posts.map((p) => (
              <article key={p.title} className="w-[268px] overflow-hidden rounded-lg bg-[#221612]">
                {art(items, p.art) ? <img src={art(items, p.art)} alt="" width={268} height={195} loading="lazy" className="h-[195px] w-full object-cover object-top" /> : <div className="skeleton h-[195px]" />}
                <div className="p-4"><p className="text-xs leading-4 text-[#b8946a]">{p.date} | Leitura de {p.read}</p><h3 className="mt-2.5 text-base font-bold leading-[21px]">{p.title}</h3><p className="mt-2 text-xs leading-4 text-[#b8946a]">{p.text}</p><span aria-disabled="true" title="Em breve" className={`mt-3 inline-block cursor-not-allowed text-xs font-bold ${accent}`}>Ler mais →</span></div>
              </article>))}</div>
          </section>
        </div>
      </main>
      <MobileTabBar />
      <div className="hidden md:block"><SiteFooter /></div>
    </div>
  )
}
