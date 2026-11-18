import '@/features/home/skeleton.css'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link, useRouter } from '@tanstack/react-router'
import Decimal from 'decimal.js'
import { ChevronLeft, Minus, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { useRequireAuth } from '@/features/auth/useRequireAuth'
import { nftsQuery } from '@/features/catalog/queries'
import { nftQueryOptions } from '@/features/nft/queries'
import type { CartItem, Nft, Quote } from '@/shared/api/types'
import { useCart, useCartQuote, useRefreshPrices, useRemoveItem, useSetQuantity } from './queries'

const CHECKOUT_PATH = '/checkout' 
const MAX_QTY = 10
const accent = 'text-[#e89b55]'

const ISSUE_TEXT: Record<string, string> = {
  SOLD_OUT: 'Esta edição esgotou. Remova o item para continuar.',
  LIMIT_EXCEEDED: 'Quantidade acima do estoque. Reduza para continuar.',
}
const lineIssue = (q: Quote | undefined, i: CartItem) =>
  q?.issues.find((x) => x.nftId === i.nftId && x.editionId === i.editionId && x.code in ISSUE_TEXT)?.code

function QtyControl({ qty, busy, onChange, mobile }: { qty: number; busy: boolean; onChange: (n: number) => void; mobile?: boolean }) {
  const btn = `grid place-items-center rounded-full bg-[#d18a4e] text-[#140d0b] aria-disabled:cursor-not-allowed aria-disabled:opacity-40 ${mobile ? 'size-[30px]' : 'size-[22px]'}`
  return (
    <div className="flex items-center gap-3">
      <button type="button" aria-label="Diminuir quantidade" aria-disabled={qty <= 1 || busy} onClick={() => qty > 1 && !busy && onChange(qty - 1)} className={btn}><Minus size={12} /></button>
      <span aria-live="polite" className="min-w-3 text-center text-sm">{qty}</span>
      <button type="button" aria-label="Aumentar quantidade" aria-disabled={qty >= MAX_QTY || busy} onClick={() => qty < MAX_QTY && !busy && onChange(qty + 1)} className={btn}><Plus size={12} /></button>
    </div>
  )
}

function CartRow({ item, issue, busy, onQty, onRemove }: { item: CartItem; issue?: string; busy: boolean; onQty: (n: number) => void; onRemove: () => void }) {
  const { data: nft } = useQuery(nftQueryOptions(item.nftId))
  const edition = nft?.editions.find((e) => e.id === item.editionId)?.name
  const line = new Decimal(item.unitPriceEth).mul(item.quantity).toFixed()
  const remove = (
    <button type="button" aria-label={`Remover ${item.nft.title}`} aria-disabled={busy} onClick={() => !busy && onRemove()} className="text-[#bfa07a] hover:text-[#e89b55]"><Trash2 size={16} /></button>
  )
  return (
    <li className="mt-2 list-none">
      {/* desktop */}
      <div className="hidden grid-cols-[minmax(0,1.7fr)_90px_120px_100px_32px] items-center gap-x-3 bg-[#221612] p-1.5 md:grid">
        <div className="flex min-w-0 items-center gap-3">
          <img src={item.nft.images[0]} alt="" width={48} height={48} className="size-12 rounded object-cover" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{item.nft.title}</p>
            <p className="truncate text-xs text-[#bfa07a]">ID do token: {nft?.tokenId ?? '…'}{edition ? ` • ${edition}` : ''}</p>
          </div>
        </div>
        <p className={`text-sm font-bold ${accent}`}>{item.unitPriceEth} ETH</p>
        <QtyControl qty={item.quantity} busy={busy} onChange={onQty} />
        <p className={`text-sm font-bold ${accent}`}>{line} ETH</p>
        {remove}
      </div>
      {/* mobile */}
      <div className="flex overflow-hidden rounded-2xl bg-[#221612] md:hidden">
        <img src={item.nft.images[0]} alt="" width={87} height={87} className="w-[87px] self-stretch object-cover" />
        <div className="relative flex-1 p-3">
          <div className="flex items-start justify-between gap-2"><p className="text-[15px] font-bold leading-5">{item.nft.title}</p>{remove}</div>
          <p className="mt-0.5 text-xs text-[#bfa07a]">Edição: {edition ?? '…'}</p>
          <div className="mt-2 flex items-center justify-between">
            <p className={`text-base font-bold ${accent}`}>{line} ETH</p>
            <QtyControl qty={item.quantity} busy={busy} onChange={onQty} mobile />
          </div>
        </div>
      </div>
      {issue && <p role="alert" className="mt-1 text-xs text-[#e89b55]">{ISSUE_TEXT[issue]}</p>}
    </li>
  )
}

interface SummaryProps {
  mobile: boolean
  input: string
  setInput: (v: string) => void
  onApply: (e: FormEvent) => void
  applied: string
  quote?: Quote
  fallbackSubtotal: string
  ready: boolean
  loading: boolean
  onCheckout: () => void
}

function Summary({ mobile, input, setInput, onApply, applied, quote, fallbackSubtotal, ready, loading, onCheckout }: SummaryProps) {
  const dash = loading ? '…' : '—'
  const discount = quote ? (new Decimal(quote.discountEth).isZero() ? '00.00' : quote.discountEth) : dash
  const coupon = quote?.coupon && quote.coupon.code === applied ? quote.coupon : undefined
  const couponMsg = coupon ? (coupon.valid ? `Cupom ${coupon.code} aplicado.` : coupon.reason === 'EXPIRED' ? 'Este cupom expirou.' : 'Cupom inválido.') : null
  const row = (label: string, value: string) => (
    <div className="flex items-center justify-between text-[15px]"><span>{label}</span><span>{value}</span></div>
  )
  return (
    <div>
      <form onSubmit={onApply} className={mobile ? 'flex overflow-hidden rounded-full border border-[#3b2a20] bg-[#221612]' : ''}>
        {!mobile && <label htmlFor="coupon-desktop" className="mb-1 block text-xs font-bold">Código promocional</label>}
        <div className={mobile ? 'flex flex-1' : 'flex border border-[#3b2a20]'}>
          <input id={mobile ? 'coupon-mobile' : 'coupon-desktop'} aria-label="Código promocional" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Digite o código promocional..." className="min-w-0 flex-1 bg-transparent px-3 py-2 text-xs text-[#f3ece3] outline-none placeholder:text-[#8a6f55]" />
          <button type="submit" className={`px-5 text-sm font-bold text-[#140d0b] ${mobile ? 'rounded-full bg-gradient-to-br from-[#d18a4e] to-[#b8763f]' : 'bg-[#d18a4e]'}`}>Aplicar</button>
        </div>
      </form>
      {couponMsg && <p role="status" className={`mt-1 text-xs ${coupon?.valid ? 'text-[#bfa07a]' : 'text-[#e89b55]'}`}>{couponMsg}</p>}
      <div className="mt-3 space-y-1.5">
        {row('Subtotal', `${quote?.subtotalEth ?? fallbackSubtotal} ETH`)}
        {row('Desconto do lançamento', `(-) ${discount}`)}
        {row('Taxa de rede', quote ? `${quote.networkFeeEth} ETH` : dash)}
        <p className={`text-right text-[10px] ${accent}`}>Taxa estimada</p>
      </div>
      <div className="mt-2 flex items-center justify-between text-[15px] font-bold"><span>Total</span><span className={accent}>{quote ? `${quote.totalEth} ETH` : dash}</span></div>
      <button type="button" aria-disabled={!ready} onClick={onCheckout} className={`mt-4 w-full font-bold text-[#140d0b] aria-disabled:opacity-50 ${mobile ? 'h-[52px] rounded-full bg-gradient-to-br from-[#d18a4e] to-[#b8763f] text-sm' : 'h-10 bg-[#d18a4e] text-[13px]'}`}>Conectar e finalizar</button>
      {!mobile && <Link to="/" className={`mt-3 block text-center text-sm ${accent}`}>Continuar explorando</Link>}
    </div>
  )
}

function Related({ exclude }: { exclude: Set<string> }) {
  const { data } = useQuery({ ...nftsQuery({ pageSize: 9, sort: 'newest' }), placeholderData: keepPreviousData })
  const [dot, setDot] = useState(0)
  const list: Nft[] = (data?.items ?? []).filter((n) => !exclude.has(n.id))
  if (!list.length) return null
  const dots = Math.min(3, Math.max(1, list.length - 4))
  return (
    <section className="mt-16 hidden md:block" aria-labelledby="also-h">
      <h2 id="also-h" className={`border-b border-[#3b2a20] pb-2 text-[17px] font-bold ${accent}`}>Colecionadores também viram</h2>
      <div className="mt-8 flex gap-[25px]">
        {list.slice(dot, dot + 5).map((n) => (
          <Link key={n.id} to="/nft/$nftId" params={{ nftId: n.id }} className="block w-[220px] shrink-0">
            <div className="grid h-[255px] place-items-center bg-[#221612]"><img src={n.thumbnail} alt={n.title} width={200} height={200} loading="lazy" className="size-[200px] rounded-[14px] object-contain" /></div>
            <p className="mt-2.5 text-[15px]">{n.title}</p><p className={`text-[15px] font-bold ${accent}`}>{n.priceEth} ETH</p>
          </Link>
        ))}
      </div>
      <div className="mt-[30px] flex justify-center gap-2">
        {Array.from({ length: dots }, (_, i) => <button key={i} type="button" aria-label={`Página ${i + 1}`} aria-current={i === dot} onClick={() => setDot(i)} className={`size-2.5 rounded-full border border-[#d18a4e] ${i === dot ? 'bg-[#d18a4e]' : ''}`} />)}
      </div>
    </section>
  )
}

export function CartPage() {
  const router = useRouter()
  const requireAuth = useRequireAuth()
  const cart = useCart()
  const [input, setInput] = useState('')
  const [applied, setApplied] = useState('')
  const quote = useCartQuote(cart.data, applied)
  const setQty = useSetQuantity()
  const remove = useRemoveItem()
  const refresh = useRefreshPrices()
  const busy = setQty.isPending || remove.isPending || refresh.isPending

  const items = cart.data?.items ?? []
  const q = quote.data
  const fresh = !!q && !quote.isPlaceholderData
  const priceChanged = !!q?.issues.some((i) => i.code === 'PRICE_CHANGED')
  const ready = fresh && q.issues.length === 0 && items.length > 0
  const fallbackSubtotal = items.reduce((s, i) => s.plus(new Decimal(i.unitPriceEth).mul(i.quantity)), new Decimal(0)).toFixed()

  const onApply = (e: FormEvent) => { e.preventDefault(); setApplied(input.trim().toUpperCase()) }
  const couponValid = !!q?.coupon?.valid && q.coupon.code === applied
  const onCheckout = () => {
  if (ready) requireAuth(() => router.history.push(couponValid ? `${CHECKOUT_PATH}?coupon=${encodeURIComponent(applied)}` : CHECKOUT_PATH))
}
  const summary = (mobile: boolean) => (
    <Summary mobile={mobile} input={input} setInput={setInput} onApply={onApply} applied={applied} quote={q} fallbackSubtotal={fallbackSubtotal} ready={ready} loading={quote.isPending} onCheckout={onCheckout} />
  )

  return (
    <div className="min-h-screen bg-[#140d0b] text-[#f3ece3]">
      <SiteHeader active="Mercado" />
      <main className="mx-auto w-full max-w-[1200px] px-[23px] pb-[420px] pt-5 md:px-0 md:pb-0 md:pt-[30px]">
        {cart.isPending ? (
          <div aria-busy className="space-y-2"><div className="skeleton h-20" /><div className="skeleton h-20" /><div className="skeleton h-20" /></div>
        ) : cart.isError ? (
          <div role="alert" className="grid min-h-[40vh] place-items-center text-center"><div>
            <p>Não foi possível carregar o carrinho.</p>
            <button type="button" onClick={() => cart.refetch()} className="mt-3 rounded bg-[#d18a4e] px-4 py-2 font-bold text-[#140d0b]">Tentar novamente</button>
          </div></div>
        ) : items.length === 0 ? (
          <div className="grid min-h-[40vh] place-items-center text-center"><div>
            <h1 className="text-lg font-bold">Seu carrinho está vazio</h1>
            <p className="mt-1 text-sm text-[#bfa07a]">Explore o mercado e adicione NFTs para começar.</p>
            <Link to="/" className="mt-4 inline-block rounded bg-[#d18a4e] px-5 py-2 font-bold text-[#140d0b]">Explorar o mercado</Link>
          </div></div>
        ) : (
          <>
            <nav aria-label="Trilha" className="hidden text-sm font-bold md:block"><Link to="/">Início</Link> / <span>Mercado</span> / <span>Carrinho</span></nav>
            <div className="relative flex items-center justify-center md:hidden">
              <button type="button" aria-label="Voltar" onClick={() => router.history.back()} className="absolute left-0 grid size-[30px] place-items-center rounded-full border border-[#4a3326] bg-[#2b1c15] text-[#d18a4e]"><ChevronLeft size={16} /></button>
              <h1 className="text-lg font-bold">Carrinho de NFTs</h1>
            </div>
            {priceChanged && (
              <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded border border-[#d18a4e] bg-[#221612] p-3 text-sm">
                <span>O preço de alguns NFTs mudou desde que você os adicionou.</span>
                <button type="button" aria-disabled={busy} onClick={() => !busy && refresh.mutate()} className="rounded bg-[#d18a4e] px-3 py-1.5 font-bold text-[#140d0b]">Aceitar novo preço</button>
              </div>
            )}
            <div className="mt-4 grid md:mt-3 md:grid-cols-[minmax(0,1fr)_280px] md:gap-x-[58px]">
              <section aria-label="Itens do carrinho">
                <div className="hidden grid-cols-[minmax(0,1.7fr)_90px_120px_100px_32px] gap-x-3 px-1.5 text-sm font-bold md:grid"><span>NFTs</span><span>Preço</span><span>Edições</span><span>Total</span><span /></div>
                <ul className="p-0">
                  {items.map((it) => (
                    <CartRow key={it.id} item={it} issue={lineIssue(q, it)} busy={busy}
                      onQty={(n) => setQty.mutate({ id: it.id, quantity: n })} onRemove={() => remove.mutate(it.id)} />
                  ))}
                </ul>
              </section>
              <aside aria-label="Resumo da carteira" className="hidden md:block">
                <h2 className="border-b border-[#3b2a20] pb-2 text-[17px] font-bold">Resumo da carteira</h2>
                <div className="mt-3">{summary(false)}</div>
              </aside>
            </div>
            <div className="fixed inset-x-0 bottom-0 z-20 rounded-t-[28px] bg-[#2a1c15] px-[21px] pb-[26px] pt-5 shadow-[0_-8px_24px_rgba(0,0,0,.35)] md:hidden">{summary(true)}</div>
            <Related exclude={new Set(items.map((i) => i.nftId))} />
          </>
        )}
      </main>
      <div className="hidden md:block"><SiteFooter /></div>
    </div>
  )
}
