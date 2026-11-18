import { fmtEth } from '@/shared/lib/eth'
import { useOrder } from './queries'

export function OrderPage({ orderId }: { orderId: string }) {
  const { data: order, isPending, isError, refetch } = useOrder(orderId)

  if (isPending) return <main className="p-6 text-[#f3ece3]">Carregando pedido…</main>
  if (isError || !order)
    return (
      <main className="p-6 text-[#f3ece3]" role="alert">
        Não foi possível carregar o pedido. <button className="underline" onClick={() => refetch()}>Tentar de novo</button>
      </main>
    )

  const r = order.receipt
  return (
    <main className="mx-auto max-w-xl space-y-4 p-6 text-[#f3ece3]" aria-live="polite">
      {order.status === 'pending' && <h1 className="text-xl font-bold">Processando seu pagamento…</h1>}
      {order.status === 'confirmed' && <h1 className="text-xl font-bold">Seus NFTs agora estão na sua carteira</h1>}
      {order.status === 'rejected' && (
        <>
          <h1 className="text-xl font-bold">Pagamento recusado</h1>
          <p>{order.rejectReason ?? 'A carteira recusou a transação.'} Seus itens continuam no carrinho.</p>
          <a href="/cart" className="inline-block text-[#d18a4e] underline">Voltar ao carrinho</a>
        </>
      )}
      <p className="text-sm text-[#b89b78]">Pedido {order.id}{order.txRef ? ` · ${order.txRef}` : ''}</p>
      <ul className="space-y-1">
        {r.items.map((l) => (
          <li key={`${l.nftId}-${l.editionId}`} className="flex justify-between">
            <span>{l.nftId} (x {l.quantity})</span><span>{fmtEth(l.lineTotalEth)} ETH</span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between"><span>Taxa de rede</span><span>{fmtEth(r.networkFeeEth)} ETH</span></div>
      <div className="flex justify-between text-lg font-bold text-[#d18a4e]"><span>Total</span><span>{fmtEth(r.totalEth)} ETH</span></div>
    </main>
  )
}
