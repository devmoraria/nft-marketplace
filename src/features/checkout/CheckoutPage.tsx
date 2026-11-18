import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { QuoteRequest } from '@/shared/api/types'
import { useSession } from '@/features/auth/session'
import { useCart } from '@/features/cart/queries'
import { fmtEth } from '@/shared/lib/eth'
import { getIdempotencyKey, networkLabel, useCreateOrder, useQuote, useWallets } from './queries'

type Err = { status?: number; code?: string; message?: string; fields?: Record<string, string> }

function useCountdown(expiresAt?: string) {
  const [left, setLeft] = useState(0)
  useEffect(() => {
    if (!expiresAt) return
    const tick = () => setLeft(Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt])
  return left
}

export function CheckoutPage({ coupon }: { coupon?: string }) {
  const session = useSession()
  const navigate = useNavigate()
  const { data: cart } = useCart()
  const wallets = useWallets()
  const [walletId, setWalletId] = useState<string>()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const wallet = useMemo(
    () => wallets.data?.find((w) => w.id === walletId) ?? wallets.data?.find((w) => w.kind === 'primary') ?? wallets.data?.[0],
    [wallets.data, walletId],
  )

  const req: QuoteRequest | null = useMemo(() => {
    if (!wallet || !cart || cart.items.length === 0) return null
    return {
      items: cart.items.map((i) => ({ nftId: i.nftId, editionId: i.editionId, quantity: i.quantity })),
      couponCode: coupon || undefined,
      network: wallet.network,
    }
  }, [wallet, cart, coupon])

  const quote = useQuote(req)
  const secondsLeft = useCountdown(quote.data?.expiresAt)
  const expired = !!quote.data && secondsLeft === 0
  const createOrder = useCreateOrder()

  if (!session) {
    return (
      <main className="mx-auto max-w-xl p-6 text-[#f3ece3]">
        <p>Entre na sua conta para finalizar a compra.</p>
        <a className="mt-4 inline-block rounded-lg bg-[#d18a4e] px-4 py-2 font-bold text-[#140d0b]" href="/login?redirect=%2Fcheckout">
          Entrar
        </a>
      </main>
    )
  }

  if (cart && cart.items.length === 0) {
    return (
      <main className="mx-auto max-w-xl p-6 text-[#f3ece3]">
        <p>Seu carrinho está vazio.</p>
        <a className="mt-4 inline-block text-[#d18a4e] underline" href="/">Continuar explorando</a>
      </main>
    )
  }

  const canSubmit =
    !!quote.data && !!wallet && !expired && !createOrder.isPending && quote.data.issues.length === 0

  function submit() {
    if (!quote.data || !wallet) return
    setMessage(null)
    setFieldErrors({})
    const key = getIdempotencyKey(`${quote.data.quoteId}:${wallet.id}`)
    createOrder.mutate(
      { key, body: { quoteId: quote.data.quoteId, walletId: wallet.id, network: wallet.network, collector: { displayName, email, note: note || undefined } } },
      {
        onSuccess: (order) => void navigate({ to: '/orders/$orderId', params: { orderId: order.id } }),
        onError: (e) => {
          const err = e as unknown as Err
          if (err.code === 'PRICE_CHANGED' || err.code === 'QUOTE_INVALID' || err.code === 'QUOTE_STALE') {
            setMessage('O preço ou a cotação mudou. Revise o resumo e confirme de novo.')
            void quote.refetch()
          } else if (err.code === 'QUOTE_EXPIRED' || err.status === 410) {
            setMessage('A cotação expirou. Atualizamos o valor, confirme novamente.')
            void quote.refetch()
          } else if (err.code === 'VALIDATION_ERROR') {
            setFieldErrors(err.fields ?? {})
            setMessage(err.fields?.walletId ?? 'Confira os dados da carteira.')
          } else {
            setMessage(err.message ?? 'Não foi possível criar o pedido. Tente de novo.')
          }
        },
      },
    )
  }

  const q = quote.data
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  return (
    <main className="mx-auto grid max-w-5xl gap-8 p-4 text-[#f3ece3] md:grid-cols-2 md:p-8">
      <section aria-labelledby="coletor">
        <h1 id="coletor" className="mb-4 text-xl font-bold">Pagamento com carteira</h1>

        <label className="block text-sm" htmlFor="displayName">Nome de exibição*</label>
        <input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
          className="mb-3 mt-1 w-full rounded-lg border border-[#3a2418] bg-transparent p-2" />

        <label className="block text-sm" htmlFor="email">E-mail*</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="mb-3 mt-1 w-full rounded-lg border border-[#3a2418] bg-transparent p-2" />

        <label className="block text-sm" htmlFor="note">Observação do colecionador (opcional)</label>
        <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={4}
          className="mt-1 w-full rounded-lg border border-[#3a2418] bg-transparent p-2" />
      </section>

      <section aria-labelledby="resumo" className="space-y-4">
        <h2 id="resumo" className="font-bold">Seus NFTs</h2>
        <ul className="space-y-2">
          {cart?.items.map((i) => (
            <li key={i.id} className="flex justify-between rounded-lg bg-[#22160f] p-3">
              <span>{i.nft.title} (x {i.quantity})</span>
            </li>
          ))}
        </ul>

        <fieldset>
          <legend className="mb-2 font-bold">Carteira e rede</legend>
          {wallets.isPending && <p>Carregando carteiras…</p>}
          {wallets.isError && <p role="alert">Não foi possível carregar as carteiras.</p>}
          {wallets.data?.map((w) => (
            <label key={w.id} className="mb-2 flex cursor-pointer items-center gap-3 rounded-lg bg-[#22160f] p-3">
              <input type="radio" name="wallet" checked={wallet?.id === w.id} onChange={() => setWalletId(w.id)} />
              <span>
                <strong>{w.label}</strong> · {networkLabel[w.network]}
                <br />
                <span className="text-sm text-[#b89b78]">{w.address}</span>
              </span>
            </label>
          ))}
          {fieldErrors.walletId && <p role="alert" className="text-sm text-red-400">{fieldErrors.walletId}</p>}
        </fieldset>

        <div aria-live="polite" className="space-y-1">
          {quote.isFetching && <p>Atualizando cotação…</p>}
          {quote.isError && <p role="alert">Não foi possível cotar. <button className="underline" onClick={() => quote.refetch()}>Tentar de novo</button></p>}
          {q && (
            <>
              <div className="flex justify-between"><span>Subtotal</span><span>{fmtEth(q.subtotalEth)} ETH</span></div>
              <div className="flex justify-between"><span>Desconto (-)</span><span>{fmtEth(q.discountEth)}</span></div>
              <div className="flex justify-between"><span>Taxa de rede (estimada)</span><span>{fmtEth(q.networkFeeEth)} ETH</span></div>
              <div className="flex justify-between text-lg font-bold text-[#d18a4e]"><span>Total</span><span>{fmtEth(q.totalEth)} ETH</span></div>
              <p className="text-sm text-[#b89b78]">
                {expired ? 'Cotação expirada.' : `Cotação válida por ${mm}:${ss}`}
                {expired && <button className="ml-2 underline" onClick={() => quote.refetch()}>Atualizar</button>}
              </p>
            </>
          )}
        </div>

        {q && q.issues.length > 0 && (
          <p role="status" className="text-sm text-amber-300">Há itens com preço alterado ou indisponíveis. Volte ao carrinho para revisar.</p>
        )}
        {message && <p role="alert" className="text-sm text-amber-300">{message}</p>}

        <button
          type="button"
          disabled={!canSubmit}
          onClick={submit}
          className="w-full rounded-full bg-[#d18a4e] p-3 font-bold text-[#140d0b] disabled:opacity-50"
        >
          {createOrder.isPending ? 'Confirmando…' : 'Confirmar compra'}
        </button>
      </section>
    </main>
  )
}
