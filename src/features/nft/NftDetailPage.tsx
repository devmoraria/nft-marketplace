import '@/features/home/skeleton.css'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link, getRouteApi } from '@tanstack/react-router'
import { ChevronLeft, Heart, Mail, Minus, Plus, Search, ShoppingCart, Star } from 'lucide-react'
import { useState } from 'react'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { nftsQuery } from '@/features/catalog/queries'
import type { Nft } from '@/shared/api/types'
import { nftQueryOptions } from './queries'

const route = getRouteApi('/nft/$nftId')
const NET: Record<string, string> = { ethereum: 'Ethereum', polygon: 'Polygon', solana: 'Solana' }
const accent = 'text-[#e89b55]'
// Carrinho e favoritos ainda não existem: avisa na região aria-live em vez de simular sucesso.
const notYet = (what: string) => { const el = document.getElementById('live'); if (el) el.textContent = `${what} estará disponível quando o carrinho e os favoritos forem implementados.` }

function MiniCard({ n }: { n: Nft }) {
  return (
    <Link to="/nft/$nftId" params={{ nftId: n.id }} className="block w-[220px] shrink-0">
      <div className="grid h-[255px] place-items-center bg-[#221612]"><img src={n.thumbnail} alt={n.title} width={200} height={200} loading="lazy" className="size-[200px] rounded-[14px] object-contain" /></div>
      <p className="mt-2.5 text-[15px]">{n.title}</p><p className={`text-[15px] font-bold ${accent}`}>{n.priceEth} ETH</p>
    </Link>
  )
}

function Qty({ qty, setQty, max, size }: { qty: number; setQty: (n: number) => void; max: number; size: string }) {
  return (
    <div className="flex items-center gap-3">
      <button aria-label="Diminuir quantidade" disabled={qty <= 1} onClick={() => setQty(qty - 1)} className={`grid place-items-center rounded-full bg-[#d18a4e] text-[#140d0b] disabled:opacity-40 ${size}`}><Minus size={14} /></button>
      <span aria-live="polite" className="min-w-4 text-center">{qty}</span>
      <button aria-label="Aumentar quantidade" disabled={qty >= max} onClick={() => setQty(qty + 1)} className={`grid place-items-center rounded-full bg-[#d18a4e] text-[#140d0b] disabled:opacity-40 ${size}`}><Plus size={14} /></button>
    </div>
  )
}

function Detail({ nft, others }: { nft: Nft; others: Nft[] }) {
  const first = nft.editions.find((e) => e.name === '1/50' && e.available > 0) ?? nft.editions.find((e) => e.available > 0) ?? nft.editions[0]
  const [edId, setEdId] = useState(first?.id), [qty, setQty] = useState(1), [img, setImg] = useState(0), [tab, setTab] = useState<'d' | 'r'>('d'), [dot, setDot] = useState(0)
  const ed = nft.editions.find((e) => e.id === edId) ?? nft.editions[0]
  const max = ed?.available ?? 0, soldOut = max === 0, price = ed?.priceEth ?? nft.priceEth, net = NET[nft.network] ?? nft.network
  const dots = Math.min(3, Math.max(1, others.length - 4))
  const pick = (id: string) => { setEdId(id); setQty(1) }
  const short = `Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na ${net}, com arte desbloqueável e acesso para colecionadores.`
  const chips = (cls: string) => (
    <div className={`flex flex-wrap gap-2 ${cls}`} role="radiogroup" aria-label="Edição">
      {nft.editions.map((e) => (
        <button key={e.id} role="radio" aria-checked={e.id === ed?.id} disabled={e.available === 0} onClick={() => pick(e.id)}
          className={`rounded-full border px-2.5 py-0.5 text-xs disabled:line-through disabled:opacity-50 md:h-6 max-md:px-3 max-md:py-1.5 max-md:text-[15px] ${e.id === ed?.id ? 'border-[#d18a4e] text-[#f3ece3]' : 'border-[#4a3326] bg-[#221612] text-[#f3ece3]'}`}>{e.name}</button>
      ))}
    </div>
  )
  const status = soldOut && <p role="status" className="text-xs text-[#e89b55]">Edição esgotada. Escolha outra edição.</p>
  const meta = [`ID do token: ${nft.tokenId}`, `Coleção: ${nft.collection}`, `Atributos: ${nft.attributes.join(', ')}`]

  return (
    <>
      {/* MOBILE */}
      <div className="pb-[190px] md:hidden">
        <div className="relative px-[26px] pt-[22px]">
          <Link to="/" aria-label="Voltar" className="absolute left-[27px] top-[22px] z-10 grid size-8 place-items-center rounded-full bg-[#221612]/80 text-[#d18a4e]"><ChevronLeft size={18} /></Link>
          <button aria-label="Favoritar" onClick={() => notYet('Favoritar')} className="absolute right-[27px] top-[22px] z-10 grid size-8 place-items-center rounded-full bg-[#221612]/80 text-[#d18a4e]"><Heart size={16} /></button>
          <img src={nft.images[0]} alt={nft.title} width={340} height={308} className="mt-10 h-[308px] w-full rounded-t-3xl object-cover" />
        </div>
        <section className="-mt-1 rounded-t-[32px] bg-[#221612] px-[23px] pb-8 pt-6">
          <div className="flex items-start justify-between gap-3"><h1 className="text-[19px] font-bold">{nft.title}</h1>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#d18a4e] px-2 py-0.5 text-sm"><Star size={12} className="fill-[#e89b55] text-[#e89b55]" />{nft.rating.toFixed(1)}<span className="text-[#b8946a]">({nft.reviewCount})</span></span></div>
          <p className="mt-3 text-[13px] leading-[22px] text-[#b8946a]">{`Um colecionável digital ${ed?.name ?? ''} finalizado à mão da coleção Kurio Editions, verificado na ${net}.`}</p>
          <p className="mt-3 text-[15px] font-bold">Edição:</p>{chips('mt-2')}
          <ul className="mt-4 space-y-1.5 text-[15px] text-[#b8946a]">{meta.map((m) => <li key={m}>{m}</li>)}</ul>
        </section>
        <div className="fixed inset-x-0 bottom-0 z-20 rounded-t-[32px] bg-[#2a1c15] px-[22px] pb-5 pt-5">
          <div className="flex items-center justify-between"><div className="flex items-center gap-3 text-[15px]">Qtd.<Qty qty={qty} setQty={setQty} max={max} size="size-6" /></div><p className={`text-2xl font-bold ${accent}`}>{price} ETH</p></div>
          {status}
          <div className="mt-4 flex gap-4"><button aria-disabled={soldOut} onClick={() => (soldOut ? undefined : notYet('Comprar'))} className="h-14 w-[185px] rounded-full bg-gradient-to-br from-[#d18a4e] to-[#b8763f] text-base font-bold text-[#140d0b] aria-disabled:opacity-50">Comprar NFT</button>
            <button aria-label="Adicionar ao carrinho" onClick={() => notYet('Adicionar ao carrinho')} className="grid size-14 place-items-center rounded-full bg-[#221612] text-[#b8946a]"><ShoppingCart size={20} /></button></div>
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden md:block">
        <nav aria-label="Trilha" className="mt-[30px] text-sm font-bold"><Link to="/">Início</Link> / <span>Mercado</span></nav>
        <section className="mt-[19px] grid grid-cols-[100px_442px_1fr] gap-x-[29px]">
          <div className="flex flex-col gap-4">{nft.images.slice(0, 4).map((_, i) => (
            <button key={i} aria-label={`Imagem ${i + 1}`} aria-current={i === img} onClick={() => setImg(i)} className={`size-[100px] overflow-hidden rounded-xl border ${i === img ? 'border-[#d18a4e]' : 'border-transparent'}`}><img src={nft.thumbnail} alt="" width={100} height={100} className="size-full object-cover" /></button>))}</div>
          <div className="relative h-[443px] bg-[#221612] p-5"><img src={nft.images[img]} alt={nft.title} width={402} height={403} className="size-[403px] rounded-2xl object-cover" /><span aria-hidden className="absolute right-8 top-8 text-[#140d0b]"><Search size={18} /></span></div>
          <div className="ml-[6px]">
            <h1 className="text-[28px] font-bold leading-9">{nft.title}</h1>
            <div className="mt-1 flex items-center justify-between border-b border-[#3b2a20] pb-2"><p className={`text-[22px] font-bold ${accent}`}>{price} ETH</p>
              <p className="flex items-center gap-1 text-xs"><span className="flex">{[0, 1, 2, 3, 4].map((i) => <Star key={i} size={11} className="fill-[#e89b55] text-[#e89b55]" />)}</span> {nft.reviewCount} avaliações de colecionadores</p></div>
            <p className="mt-4 text-sm font-bold">Sobre este NFT:</p><p className="mt-2 text-[13px] leading-6 text-[#b8946a]">{short}</p>
            <p className="mt-3 text-sm font-bold">Edição:</p>{chips('mt-2')}
            <div className="mt-4 flex items-center justify-between"><Qty qty={qty} setQty={setQty} max={max} size="size-8" />
              <div className="flex gap-2"><button aria-disabled={soldOut} onClick={() => (soldOut ? undefined : notYet('Comprar'))} className="h-10 w-[131px] rounded bg-[#d18a4e] text-xs font-bold text-[#140d0b] aria-disabled:opacity-50">COMPRAR</button>
                <button onClick={() => notYet('Favoritar')} className="flex h-10 w-[134px] items-center justify-center gap-1.5 rounded border border-[#d18a4e] text-xs text-[#e89b55]"><Heart size={14} />Favoritar</button></div></div>
            <div className="mt-1">{status}</div>
            <ul className="mt-3 text-[13px] leading-8 text-[#b8946a]">{meta.map((m) => <li key={m}>{m}</li>)}</ul>
            <p className="mt-1 flex items-center gap-2 text-[13px] font-bold">Compartilhar este NFT: <span aria-hidden className="text-xs">in</span><Mail size={13} aria-hidden /><span aria-hidden className="text-xs">t</span></p>
          </div>
        </section>
        <section className="mt-[42px]">
          <div role="tablist" className="flex gap-8 border-b border-[#3b2a20] text-base">
            <button role="tab" aria-selected={tab === 'd'} onClick={() => setTab('d')} className={`pb-2 ${tab === 'd' ? `border-b-2 border-[#d18a4e] ${accent}` : ''}`}>Detalhes do NFT</button>
            <button role="tab" aria-selected={tab === 'r'} onClick={() => setTab('r')} className={`pb-2 ${tab === 'r' ? `border-b-2 border-[#d18a4e] ${accent}` : ''}`}>Avaliações de colecionadores ({nft.reviewCount})</button></div>
          <div role="tabpanel" className="mt-4 text-sm leading-6 text-[#b8946a]">
            {tab === 'd' ? (<>
              <p>{nft.title} é uma obra digital {ed?.name} finalizada à mão da coleção Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na {net}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.</p>
              <p className="mt-6">A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. {nft.creator} recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.</p>
              <p className="mt-4 font-bold text-[#f3ece3]">Rede:</p><p>Cunhado na {net} com procedência imutável e metadados armazenados no IPFS.</p>
              <p className="mt-4 font-bold text-[#f3ece3]">Contrato:</p><p>Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.</p>
              <p className="mt-4 font-bold text-[#f3ece3]">Direitos autorais:</p><p>0x7A42...19E8 • Contrato inteligente ERC-721 verificado.</p></>
            ) : <p>Nota {nft.rating.toFixed(1)} de 5, com base em {nft.reviewCount} avaliações de colecionadores.</p>}
          </div>
        </section>
        {others.length > 0 && (
          <section className="mt-[60px]" aria-labelledby="more-h">
            <h2 id="more-h" className={`border-b border-[#3b2a20] pb-2 text-base font-bold ${accent}`}>Mais desta coleção</h2>
            <div className="mt-5 flex gap-[25px]">{others.slice(dot, dot + 5).map((n) => <MiniCard key={n.id} n={n} />)}</div>
            <div className="mt-6 flex justify-center gap-2">{Array.from({ length: dots }, (_, i) => <button key={i} aria-label={`Página ${i + 1}`} aria-current={i === dot} onClick={() => setDot(i)} className={`size-2.5 rounded-full border border-[#d18a4e] ${i === dot ? 'bg-[#d18a4e]' : ''}`} />)}</div>
          </section>)}
      </div>
    </>
  )
}

export function NftDetailPage() {
  const { nftId } = route.useParams()
  const q = useQuery(nftQueryOptions(nftId))
  const more = useQuery({ ...nftsQuery({ pageSize: 9, sort: 'newest' }), placeholderData: keepPreviousData })
  const err = q.error as { code?: string } | null
  return (
    <div className="min-h-screen bg-[#140d0b] font-mono text-[#f3ece3]">
      <SiteHeader active="Mercado" />
      <main className="mx-auto w-full max-w-[1200px]">
        {q.isPending ? (
          <div aria-busy className="px-[26px] pt-10 md:px-0 md:pt-[79px] md:grid md:grid-cols-[100px_442px_1fr] md:gap-x-[29px]"><div className="hidden md:block" /><div className="skeleton h-[308px] md:h-[443px]" /><div className="skeleton mt-6 h-[300px] md:ml-[6px] md:mt-0" /></div>
        ) : q.isError ? (
          <div role="alert" className="grid min-h-[50vh] place-items-center px-6 text-center"><div>
            <p>{err?.code === 'NFT_NOT_FOUND' ? 'NFT não encontrado.' : 'Não foi possível carregar este NFT.'}</p>
            {err?.code !== 'NFT_NOT_FOUND' && <button onClick={() => q.refetch()} className="mt-3 rounded bg-[#d18a4e] px-4 py-2 font-bold text-[#140d0b]">Tentar novamente</button>}
            <Link to="/" className="mt-3 block text-[#e89b55] underline">Voltar ao início</Link></div></div>
        ) : (
          <Detail key={q.data.id} nft={q.data} others={(more.data?.items ?? []).filter((n) => n.id !== q.data.id)} />
        )}
      </main>
      <div className="hidden md:block"><SiteFooter /></div>
    </div>
  )
}
