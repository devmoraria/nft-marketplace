import { Link } from '@tanstack/react-router'
import { ArrowRight, Heart, Search, SlidersHorizontal } from 'lucide-react'
import heroImg from '@/assets/nfts/emerald-ape-800.webp'
import type { Nft } from '@/shared/api/types'
import { TABS } from './figma-content'
import './skeleton.css'

type TabId = (typeof TABS)[number]['id']

interface Props {
  items?: Nft[]
  isPending: boolean
  isError: boolean
  onRetry: () => void
  tab: string
  onTab: (id: TabId) => void
}

function MobileCard({ nft }: { nft: Nft }) {
  return (
    <article className="relative">
      <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="block">
        <div className="rounded-[20px] bg-[#221612] px-[3px] pb-[17px] pt-[10px]">
          <img src={nft.thumbnail} alt="" width={147} height={147} loading="lazy" className="aspect-square w-full rounded-[12px] object-cover" />
        </div>
        <h3 className="mt-1.5 px-[7px] text-[13px] leading-5">{nft.title}</h3>
        <p className="px-[7px] text-sm font-bold leading-5 text-[#e89b55]">{nft.priceEth} ETH</p>
      </Link>
      {nft.badge && <span className="absolute left-0 top-[13px] grid h-7 w-[60px] place-items-center bg-[#d18a4e] text-xs text-[#140d0b]">{nft.badge}</span>}
      <button type="button" disabled title="Em breve" aria-label={`Favoritar ${nft.title}`} className="absolute right-2 top-2.5 grid size-[25px] place-items-center rounded-full bg-[#221612]/90 text-[#d18a4e]">
        <Heart size={13} />
      </button>
    </article>
  )
}

export function MobileHome({ items, isPending, isError, onRetry, tab, onTab }: Props) {
  const sage = items?.find((n) => n.title === 'Sage Nomad #009')
  return (
    <div className="px-[21px] pb-[120px] pt-[35px] md:hidden">
      <div className="flex gap-[7px]">
        <div className="flex h-[39px] flex-1 items-center gap-2 rounded-2xl bg-[#221612] px-[11px] text-xs text-[#b8946a]">
          <Search size={17} aria-hidden />Explorar coleções
        </div>
        <button type="button" aria-label="Filtros" className="grid size-[39px] shrink-0 place-items-center rounded-[14px] bg-gradient-to-br from-[#d18a4e] to-[#b8763f] text-[#140d0b]">
          <SlidersHorizontal size={18} />
        </button>
      </div>

      <section className="relative mt-3.5 h-[166px] overflow-hidden rounded-[20px] bg-gradient-to-br from-[#5a3a24] to-[#2a1c15]">
        <span aria-hidden className="absolute -top-10 left-[85px] size-[250px] rounded-full bg-white/[0.05]" />
        <div className="relative px-3.5 pt-1">
          <p className="text-[11px] leading-4">Bem-vindo à Kurio</p>
          <h1 className="mt-[3px] text-base font-bold leading-[25.5px]">SEJA DONO DA<br />CULTURA DIGITAL</h1>
          <p className="mt-1.5 w-[168px] text-[10.5px] leading-[15.5px] text-[#bfa07a]">Descubra NFTs selecionados de criadores do mundo todo.</p>
          <a href="#catalogo-mobile" className="inline-flex items-center gap-1.5 text-[10.5px] font-bold leading-4 text-[#e89b55]">EXPLORAR<ArrowRight size={12} aria-hidden /></a>
        </div>
        <img src={heroImg} alt="" width={120} height={120} className="absolute right-3.5 top-[9px] size-[120px] rounded-[14px] object-cover" />
        {sage && <img src={sage.thumbnail} alt="" width={51} height={51} className="absolute left-[197px] top-[86px] size-[51px] rounded-[10px] object-cover" />}
        <div aria-hidden className="absolute bottom-[5px] left-1/2 flex -translate-x-1/2 gap-1.5">{[0, 1, 2].map((i) => <i key={i} className="size-1.5 rounded-full bg-[#d18a4e]" />)}</div>
      </section>

      <div className="mt-3 flex gap-3 text-xs">
        {TABS.map((t) => (
          <button key={t.id} type="button" onClick={() => onTab(t.id)} aria-pressed={tab === t.id} className={`pb-[3px] ${tab === t.id ? 'border-b-2 border-[#d18a4e]' : 'border-b-2 border-transparent'}`}>{t.label}</button>
        ))}
      </div>

      <div id="catalogo-mobile" className="mt-[15px]">
        {isError ? (
          <div role="alert" className="grid h-[175px] place-items-center rounded-[20px] bg-[#221612] text-center text-xs"><div>Não foi possível carregar os NFTs.<button type="button" onClick={onRetry} className="mt-2 block w-full font-bold text-[#e89b55] underline">Tentar novamente</button></div></div>
        ) : isPending ? (
          <div aria-hidden className="grid grid-cols-2 gap-x-3.5">
            {[0, 1].map((c) => <div key={c} className={`space-y-[18px] ${c ? 'mt-7' : ''}`}><div className="skeleton h-[175px] rounded-[20px]" /><div className="skeleton h-[175px] rounded-[20px]" /></div>)}
          </div>
        ) : items?.length === 0 ? (
          <div role="status" className="grid h-[175px] place-items-center rounded-[20px] bg-[#221612] text-xs">Nenhum NFT encontrado.</div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3.5">
            {[0, 1].map((c) => (
              <div key={c} className={`flex flex-col gap-[18px] ${c ? 'mt-7' : ''}`}>
                {(items ?? []).filter((_, i) => i % 2 === c).map((n) => <MobileCard key={n.id} nft={n} />)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
