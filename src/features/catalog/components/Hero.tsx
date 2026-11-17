import { useQuery } from '@tanstack/react-query'
import { nftsQueryOptions } from '../queries'

export function Hero() {
  // Destaque: NFT mais popular. Se a API falhar, o hero continua sem a imagem.
  const { data } = useQuery(nftsQueryOptions({ sort: 'popular', page: 1, pageSize: 1 }))
  const featured = data?.items[0]

  return (
    <section aria-labelledby="hero-title" className="mx-auto w-full max-w-[1200px] px-4 md:px-6 xl:px-0">
      <div className="grid items-center gap-8 py-10 lg:grid-cols-[1fr_383px] lg:gap-16 lg:py-14">
        <div>
          <p className="mb-6 text-xs tracking-[0.1em]">Bem-vindo à Kurio</p>
          <h1 id="hero-title" className="mb-6 text-3xl font-bold md:text-[43px] md:leading-[70px]">
            SEJA DONO DO FUTURO DA ARTE DIGITAL
          </h1>
          <p className="mb-8 max-w-[557px] text-muted-foreground">
            Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie
            artistas e tenha uma parte da cultura da internet.
          </p>
          <a
            href="#catalogo"
            className="inline-block rounded-md bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:opacity-90"
          >
            EXPLORAR
          </a>
        </div>

        {/* Altura reservada (aspect-ratio) para não gerar layout shift. */}
        <div className="aspect-[383/384] w-full max-w-[383px] justify-self-center overflow-hidden rounded-2xl bg-card lg:justify-self-end">
          {featured && (
            <img
              src={featured.images[0]}
              alt=""
              width={383}
              height={384}
              fetchPriority="high"
              className="size-full object-cover"
            />
          )}
        </div>
      </div>
    </section>
  )
}
