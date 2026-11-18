import '@/features/home/skeleton.css'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link, getRouteApi } from '@tanstack/react-router'
import { ChevronLeft, Heart, Mail, Minus, Plus, Search, ShoppingCart, Star } from 'lucide-react'
import { useState } from 'react'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { useRequireAuth } from '@/features/auth/useRequireAuth'
import { nftsQuery } from '@/features/catalog/queries'
import { RELATED_ORDER } from '@/features/home/figma-content'
import type { Nft } from '@/shared/api/types'
import { nftQueryOptions } from './queries'

const route = getRouteApi('/nft/$nftId')
const NET: Record<string, string> = { ethereum: 'Ethereum', polygon: 'Polygon', solana: 'Solana' }
const accent = 'text-[#e89b55]'
// Carrinho e favoritos ainda não existem: avisa na região aria-live em vez de simular sucesso.
const notYet = (what: string) => { const el = document.getElementById('live'); if (el) el.textContent = `${what} estará disponível quando o carrinho e os favoritos forem implementados.` }
const rank = (t: string) => { const i = RELATED_ORDER.indexOf(t); return i === -1 ? 99 : i }

// Ícones de marca inline: o lucide recente removeu os ícones de marca.
const InIcon = () => <svg aria-hidden viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M4 9h3.5v11H4zM5.75 3.5a2 2 0 110 4 2 2 0 010-4zM10 9h3.3v1.6c.5-.9 1.7-1.9 3.5-1.9 3.5 0 4.2 2.3 4.2 5.3V20h-3.5v-5.2c0-1.3 0-2.9-1.8-2.9s-2.2 1.4-2.2 2.8V20H10z" /></svg>
const BirdIcon = () => <svg aria-hidden viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" /></svg>

function MiniCard({ n }: { n: Nft }) {
  return (
    <Link to="/nft/$nftId" params={{ nftId: n.id }} className="block w-[220px] shrink-0">
      <div className="grid h-[255px] place-items-center bg-[#221612]"><img src={n.thumbnail} alt={n.title} width={200} height={200} loading="lazy" className="size-[200px] rounded-[14px] object-contain" /></div>
      <p className="mt-2.5 text-[15px]">{n.title}</p><p className={`text-[15px] font-bold ${accent}`}>{n.priceEth} ETH</p>
    </Link>
  )
}

// No Figma os botões são cápsulas laranja; "−" no mínimo continua com aparência normal.
function Qty({ qty, setQty, max, pill, icon, gap }: { qty: number; setQty: (n: number) => void; max: number; pill: string; icon: number; gap: string }) {
  const btn = `grid place-items-center rounded-full bg-[#d18a4e] text-[#140d0b] aria-disabled:cursor-not-allowed ${pill}`
  return (
    <div className={`flex items-center ${gap}`}>
      <button type="button" aria-label="Diminuir quantidade" aria-disabled={qty <= 1} onClick={() => qty > 1 && setQty(qty - 1)} className={btn}><Minus size={icon} /></button>
      <span aria-live="polite" className="min-w-2 text-center">{qty}</span>
      <button type="button" aria-label="Aumentar quantidade" aria-disabled={qty >= max} onClick={() => qty < max && setQty(qty + 1)} className={`${btn} aria-disabled:opacity-50`}><Plus size={icon} /></button>
    </div>
  )
}

function Detail({ nft, others }: { nft: Nft; others: Nft[] }) {
  const requireAuth = useRequireAuth()
  const first = nft.editions.find((e) => e.name === '1/50' && e.available > 0) ?? nft.editions.find((e) => e.available > 0) ?? nft.editions[0]
  const [edId, setEdId] = useState(first?.id), [qty, setQty] = useState(1), [img, setImg] = useState(0), [tab, setTab] = useState<'d' | 'r'>('d'), [dot, setDot] = useState(0)
  const ed = nft.editions.find((e) => e.id === edId) ?? nft.editions[0]
  const max = ed?.available ?? 0, soldOut = max === 0, price = ed?.priceEth ?? nft.priceEth, net = NET[nft.network] ?? nft.network
  const related = [...others].sort((a, b) => rank(a.title) - rank(b.title))
  const dots = Math.min(3, Math.max(1, related.length - 4))
  const pick = (id: string) => { setEdId(id); setQty(1) }
  const short = `Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na ${net}, com arte desbloqueável e acesso para colecionadores.`
  const chips = (cls: string, gap: string) => (
    <div className={`flex flex-wrap ${gap} ${cls}`} role="radiogroup" aria-label="Edição">
      {nft.editions.map((e) => (
        <button key={e.id} type="button" role="radio" aria-checked={e.id === ed?.id} disabled={e.available === 0} onClick={() => pick(e.id)}
          className={`h-6 rounded-full border px-2.5 text-xs disabled:line-through disabled:opacity-50 ${e.id === ed?.id ? 'border-[#d18a4e] text-[#f3ece3]' : 'border-[#4a3326] bg-[#221612] text-[#f3ece3]'}`}>{e.name}</button>
      ))}
    </div>
  )
  const status = soldOut && <p role="status" className="text-xs text-[#e89b55]">Edição esgotada. Escolha outra edição.</p>
  const meta = [`ID do token: ${nft.tokenId}`, `Coleção: ${nft.collection}`, `Atributos: ${nft.attributes.join(', ')}`]

  return (
    <>
      {/* MOBILE (frame do Figma: 362 px) */}
      <div className="flex min-h-dvh flex-col md:hidden">
        <div className="relative px-[23px] pt-[57px]">
          <Link to="/" aria-label="Voltar" className="absolute left-6 top-5 z-10 grid size-[30px] place-items-center rounded-full border border-[#4a3326] bg-[#2b1c15] text-[#d18a4e]"><ChevronLeft size={16} /></Link>
          <button type="button" aria-label="Favoritar" onClick={() => requireAuth(() => notYet('Favoritar'))} className="absolute right-6 top-5 z-10 grid size-[30px] place-items-center rounded-full border border-[#4a3326] bg-[#2b1c15] text-[#d18a4e]"><Heart size={15} /></button>
          <img src={nft.images[0]} alt={nft.title} width={315} height={315} className="aspect-square w-full rounded-2xl object-cover" />
        </div>
        <section className="relative -mt-[29px] flex-1 rounded-t-[28px] bg-[#221612] px-[21px] pb-[200px] pt-7">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-lg font-bold leading-6">{nft.title}</h1>
            <span className="inline-flex h-6 shrink-0 items-center gap-1 rounded-full border border-[#d18a4e] pl-[5px] pr-[3px] text-xs"><Star size={12} className="fill-[#e89b55] text-[#e89b55]" /><span>{nft.rating.toFixed(1)}<span className="text-[#cfb18c]">({nft.reviewCount})</span></span></span>
          </div>
          <p className="mt-2 max-w-[305px] text-xs leading-[21px] text-[#bfa07a]">{`Um colecionável digital ${ed?.name ?? ''} finalizado à mão da coleção Kurio Editions, verificado na ${net}.`}</p>
          <p className="mt-2 text-sm font-bold leading-[21px]">Edição:</p>{chips('mt-1', 'gap-[11px]')}
          <ul className="mt-1.5 text-[13px] leading-7 text-[#bfa07a]">{meta.map((m) => <li key={m}>{m}</li>)}</ul>
        </section>
        <div className="fixed inset-x-0 bottom-0 z-20 rounded-t-[28px] bg-[#2a1c15] px-[21px] pb-[26px] pt-[18px] shadow-[0_-8px_24px_rgba(0,0,0,.35)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[13px]">Qtd.<Qty qty={qty} setQty={setQty} max={max} pill="h-[25px] w-[17px]" icon={10} gap="gap-3" /></div>
            <p className={`text-[17px] font-bold ${accent}`}>{price} ETH</p>
          </div>
          {status}
          <div className="mt-[18px] flex items-center gap-3">
            <button type="button" aria-disabled={soldOut} onClick={() => (soldOut ? undefined : requireAuth(() => notYet('Comprar')))} className="h-[52px] w-[171px] rounded-full bg-gradient-to-br from-[#d18a4e] to-[#b8763f] text-sm font-bold text-[#140d0b] aria-disabled:opacity-50">Comprar NFT</button>
            <button type="button" aria-label="Adicionar ao carrinho" onClick={() => requireAuth(() => notYet('Adicionar ao carrinho'))} className="grid size-[52px] place-items-center rounded-full border border-[#3b2a20] bg-[#34231b] text-[#cfb18c]"><ShoppingCart size={20} /></button>
          </div>
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden md:block">
        <nav aria-label="Trilha" className="mt-[30px] text-sm font-bold"><Link to="/">Início</Link> / <span>Mercado</span></nav>
        <section className="mt-[9px] grid grid-cols-[100px_442px_1fr] gap-x-[29px]">
          <div className="flex flex-col gap-4">{nft.images.slice(0, 4).map((_, i) => (
            <button key={i} type="button" aria-label={`Imagem ${i + 1}`} aria-current={i === img} onClick={() => setImg(i)} className={`size-[100px] overflow-hidden rounded-xl border ${i === img ? 'border-[#d18a4e]' : 'border-transparent'}`}><img src={nft.thumbnail} alt="" width={100} height={100} className="size-full object-cover" /></button>))}</div>
          <div className="relative h-[443px] bg-[#221612] p-5"><img src={nft.images[img]} alt={nft.title} width={402} height={403} className="size-full rounded-2xl object-cover" /><span aria-hidden className="absolute right-8 top-8 text-[#140d0b]"><Search size={18} /></span></div>
          <div className="ml-[6px]">
            <h1 className="text-[28px] font-bold leading-9">{nft.title}</h1>
            <div className="mt-1 flex items-center justify-between border-b border-[#3b2a20] pb-2"><p className={`text-[22px] font-bold ${accent}`}>{price} ETH</p>
              <p className="flex items-center gap-2 text-[15px]"><span className="flex gap-1">{[0, 1, 2, 3, 4].map((i) => <Star key={i} size={14} className="fill-[#e89b55] text-[#e89b55]" />)}</span>{nft.reviewCount} avaliações de colecionadores</p></div>
            <p className="mt-3 text-[15px] font-bold">Sobre este NFT:</p><p className="mt-2 text-sm leading-6 text-[#bfa07a]">{short}</p>
            <p className="mt-1 text-[15px] font-bold">Edição:</p>{chips('mt-2', 'gap-2')}
            <div className="mt-[22px] flex items-center justify-between"><Qty qty={qty} setQty={setQty} max={max} pill="h-10 w-7" icon={14} gap="gap-4" />
              <div className="flex gap-2"><button type="button" aria-disabled={soldOut} onClick={() => (soldOut ? undefined : requireAuth(() => notYet('Comprar')))} className="h-10 w-[131px] rounded bg-[#d18a4e] text-[13px] font-bold text-[#140d0b] aria-disabled:opacity-50">COMPRAR</button>
                <button type="button" onClick={() => requireAuth(() => notYet('Favoritar'))} className="flex h-10 w-[134px] items-center justify-center gap-1.5 rounded border border-[#d18a4e] text-[13px] text-[#e89b55]"><Heart size={14} />Favoritar</button></div></div>
            {status && <div className="mt-1">{status}</div>}
            <ul className="mt-3 text-[15px] leading-8 text-[#bfa07a]">{meta.map((m) => <li key={m}>{m}</li>)}</ul>
            <p className="mt-1 flex items-center gap-2 text-[15px] font-bold">Compartilhar este NFT: <InIcon /><Mail size={14} aria-hidden /><BirdIcon /></p>
          </div>
        </section>
        <section className="mt-[84px]">
          <div role="tablist" className="flex gap-10 border-b border-[#3b2a20] text-[17px]">
            <button type="button" role="tab" aria-selected={tab === 'd'} onClick={() => setTab('d')} className={`pb-2 ${tab === 'd' ? `border-b-2 border-[#d18a4e] ${accent}` : ''}`}>Detalhes do NFT</button>
            <button type="button" role="tab" aria-selected={tab === 'r'} onClick={() => setTab('r')} className={`pb-2 ${tab === 'r' ? `border-b-2 border-[#d18a4e] ${accent}` : ''}`}>Avaliações de colecionadores ({nft.reviewCount})</button></div>
          <div role="tabpanel" className="mt-3 text-sm leading-6 text-[#bfa07a]">
            {tab === 'd' ? (<>
              <p>{nft.title} é uma obra digital {ed?.name} finalizada à mão da coleção Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na {net}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.</p>
              <p className="mt-6">A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. {nft.creator} recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.</p>
              <p className="mt-3 font-bold text-[#f3ece3]">Rede:</p><p>Cunhado na {net} com procedência imutável e metadados armazenados no IPFS.</p>
              <p className="mt-3 font-bold text-[#f3ece3]">Contrato:</p><p>Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.</p>
              <p className="mt-3 font-bold text-[#f3ece3]">Direitos autorais:</p><p>0x7A42...19E8 • Contrato inteligente ERC-721 verificado.</p></>
            ) : <p>Nota {nft.rating.toFixed(1)} de 5, com base em {nft.reviewCount} avaliações de colecionadores.</p>}
          </div>
        </section>
        {related.length > 0 && (
          <section className="mt-[92px]" aria-labelledby="more-h">
            <h2 id="more-h" className={`border-b border-[#3b2a20] pb-2 text-[17px] font-bold ${accent}`}>Mais desta coleção</h2>
            <div className="mt-8 flex gap-[25px]">{related.slice(dot, dot + 5).map((n) => <MiniCard key={n.id} n={n} />)}</div>
            <div className="mt-[30px] flex justify-center gap-2">{Array.from({ length: dots }, (_, i) => <button key={i} type="button" aria-label={`Página ${i + 1}`} aria-current={i === dot} onClick={() => setDot(i)} className={`size-2.5 rounded-full border border-[#d18a4e] ${i === dot ? 'bg-[#d18a4e]' : ''}`} />)}</div>
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
    <div className="min-h-screen bg-[#140d0b] text-[#f3ece3]">
      <SiteHeader active="Mercado" />
      <main className="mx-auto w-full max-w-[1200px]">
        {q.isPending ? (
          <div aria-busy className="px-[23px] pt-[57px] md:grid md:grid-cols-[100px_442px_1fr] md:gap-x-[29px] md:px-0 md:pt-[79px]"><div className="hidden md:block" /><div className="skeleton aspect-square md:aspect-auto md:h-[443px]" /><div className="skeleton mt-6 h-[300px] md:ml-[6px] md:mt-0" /></div>
        ) : q.isError ? (
          <div role="alert" className="grid min-h-[50vh] place-items-center px-6 text-center"><div>
            <p>{err?.code === 'NFT_NOT_FOUND' ? 'NFT não encontrado.' : 'Não foi possível carregar este NFT.'}</p>
            {err?.code !== 'NFT_NOT_FOUND' && <button type="button" onClick={() => q.refetch()} className="mt-3 rounded bg-[#d18a4e] px-4 py-2 font-bold text-[#140d0b]">Tentar novamente</button>}
            <Link to="/" className="mt-3 block text-[#e89b55] underline">Voltar ao início</Link></div></div>
        ) : (
          <Detail key={q.data.id} nft={q.data} others={(more.data?.items ?? []).filter((n) => n.id !== q.data.id)} />
        )}
      </main>
      <div className="hidden md:block"><SiteFooter /></div>
    </div>
  )
}
