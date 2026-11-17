import type { Nft } from '@/shared/api/types'

export function NftCard({ nft, priority = false }: { nft: Nft; priority?: boolean }) {
  const soldOut = nft.editions.length > 0 && nft.editions.every((e) => e.available === 0)

  return (
    // Rota /nft/$nftId entra na próxima fatia; <a> comum até lá.
    <a
      href={`/nft/${nft.id}`}
      className="group relative block rounded-md bg-card p-2 pb-3 transition-colors hover:bg-accent"
    >
      <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
        <img
          src={nft.images[0]}
          alt={nft.title}
          width={400}
          height={400}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className="size-full object-cover"
        />
        {soldOut && (
          <span className="absolute left-0 top-0 bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
            ESGOTADO
          </span>
        )}
      </div>
      <h3 className="mt-3 h-6 truncate text-sm">{nft.title}</h3>
      <p className="h-6 font-bold text-primary">{nft.priceEth} ETH</p>
    </a>
  )
}

/** Mesmas dimensões do card real: zera o CLS na troca skeleton → conteúdo. */
export function NftCardSkeleton() {
  return (
    <div className="rounded-md bg-card p-2 pb-3" aria-hidden="true">
      <div className="skeleton aspect-square w-full" />
      <div className="skeleton mt-3 h-4 w-3/4" />
      <div className="skeleton mt-2 h-4 w-1/3" />
    </div>
  )
}
