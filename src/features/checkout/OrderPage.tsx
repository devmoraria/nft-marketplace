import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { fmtEth } from '@/shared/lib/eth'
import * as api from './api'
import { rejectText, titleOf, useOrder } from './queries'

const SLOW_AFTER_MS = 10_000

export function OrderPage({ orderId }: { orderId: string }) {
  const qc = useQueryClient()
  const { data: order, isPending, isError, refetch } = useOrder(orderId)
  const [slow, setSlow] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [retryMsg, setRetryMsg] = useState<string | null>(null)
  const pending = order?.status === 'pending'

  useEffect(() => {
    if (!pending) { setSlow(false); return }
    const id = setTimeout(() => setSlow(true), SLOW_AFTER_MS)
    return () => clearTimeout(id)
  }, [pending, orderId])

  // Reenvia a MESMA requisição com a MESMA Idempotency-Key: o servidor devolve o mesmo pedido (200), sem criar outro.
  async function retry() {
    setRetrying(true)
    setRetryMsg(null)
    try {
      const raw = sessionStorage.getItem('checkout:lastReq')
      if (raw) {
        const saved = JSON.parse(raw) as { key: string; body: Parameters<typeof api.createOrder>[0] }
        const again = await api.createOrder(saved.body, saved.key)
        if (again.id !== orderId) setRetryMsg('Recuperamos o pedido original.')
      }
      await refetch()
      void qc.invalidateQueries({ queryKey: ['user'] })
    } catch {
      setRetryMsg('Ainda não foi possível confirmar. Tente de novo em instantes.')
    } finally {
      setRetrying(false)
    }
  }

  if (isPending) return <main className="p-6 text-[#f3ece3]" aria-busy>Carregando pedido…</main>
  if (isError || !order)
    return (
      <main className="p-6 text-[#f3ece3]" role="alert">
        Não foi possível carregar o pedido. <button className="underline" onClick={() => refetch()}>Tentar de novo</button>
      </main>
    )

  const r = order.receipt
  return (
    <main className="mx-auto max-w-xl space-y-4 p-6 text-[#f3ece3]" aria-live="polite">
      {order.status === 'pending' && (
        <>
          <h1 className="text-xl font-bold">Processando seu pagamento…</h1>
          {slow && (
            <div role="status" className="rounded-lg border border-[#d18a4e] bg-[#22160f] p-3 text-sm">
              <p>Está demorando mais que o normal. Seu pedido já foi criado e não será cobrado duas vezes.</p>
              <button type="button" onClick={retry} aria-disabled={retrying} className="mt-2 rounded bg-[#d18a4e] px-3 py-1.5 font-bold text-[#140d0b]">
                {retrying ? 'Verificando…' : 'Tentar de novo'}
              </button>
              {retryMsg && <p className="mt-2">{retryMsg}</p>}
            </div>
          )}
        </>
      )}
      {order.status === 'confirmed' && <h1 className="text-xl font-bold">Seus NFTs agora estão na sua carteira</h1>}
      {order.status === 'rejected' && (
        <>
          <h1 className="text-xl font-bold">Pagamento recusado</h1>
          <p>{rejectText[order.rejectReason ?? ''] ?? 'A transação não foi concluída.'} Seus itens continuam no carrinho.</p>
          <a href="/cart" className="inline-block text-[#d18a4e] underline">Voltar ao carrinho</a>
        </>
      )}
      <p className="break-all text-sm text-[#b89b78]">Pedido {order.id}{order.txRef ? ` · ${order.txRef}` : ''}</p>
      <ul className="space-y-1">
        {r.items.map((l) => (
          <li key={`${l.nftId}-${l.editionId}`} className="flex justify-between">
            <span>{titleOf(l.nftId)} (x {l.quantity})</span><span>{fmtEth(l.lineTotalEth)} ETH</span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between"><span>Taxa de rede</span><span>{fmtEth(r.networkFeeEth)} ETH</span></div>
      <div className="flex justify-between text-lg font-bold text-[#d18a4e]"><span>Total</span><span>{fmtEth(r.totalEth)} ETH</span></div>
    </main>
  )
}
