import Decimal from 'decimal.js'
import { NETWORKS, type Edition, type EditionName, type Network, type Nft } from '@/shared/api/types'

// Todo dado fictício vive em mocks/. Sem Math.random: tudo derivado do índice.

export const CATEGORIES = [
  { slug: 'arte-digital', label: 'Arte digital' },
  { slug: 'fotografia', label: 'Fotografia' },
  { slug: 'musica', label: 'Música' },
  { slug: 'arte-3d', label: 'Arte 3D' },
  { slug: 'colecionaveis', label: 'Colecionáveis' },
  { slug: 'generativa', label: 'Generativa' },
  { slug: 'jogos', label: 'Jogos' },
  { slug: 'assinaturas', label: 'Assinaturas' },
  { slug: 'utilidade', label: 'Utilidade' },
] as const

export type ArtKey = 'emerald-ape' | 'violet-nomad' | 'ivory-baron' | 'golden-beat'

// Chaves (e não URLs) vão para o db: URL com hash muda a cada build e quebraria o localStorage antigo.
// Os literais em new URL(...) são o que o Vite precisa para empacotar cada arquivo.
const ART: Record<ArtKey, { full: string; thumb: string }> = {
  'emerald-ape': {
    full: new URL('../../assets/nfts/emerald-ape-800.webp', import.meta.url).href,
    thumb: new URL('../../assets/nfts/emerald-ape-400.webp', import.meta.url).href,
  },
  'violet-nomad': {
    full: new URL('../../assets/nfts/violet-nomad-800.webp', import.meta.url).href,
    thumb: new URL('../../assets/nfts/violet-nomad-400.webp', import.meta.url).href,
  },
  'ivory-baron': {
    full: new URL('../../assets/nfts/ivory-baron-800.webp', import.meta.url).href,
    thumb: new URL('../../assets/nfts/ivory-baron-400.webp', import.meta.url).href,
  },
  'golden-beat': {
    full: new URL('../../assets/nfts/golden-beat-800.webp', import.meta.url).href,
    thumb: new URL('../../assets/nfts/golden-beat-400.webp', import.meta.url).href,
  },
}

export type NftRecord = Omit<Nft, 'images' | 'thumbnail'> & { art: ArtKey; popularity: number }

export function toNft(r: NftRecord): Nft {
  const { art, popularity: _popularity, ...rest } = r
  const { full, thumb } = ART[art]
  return { ...rest, images: [full, full, full, full], thumbnail: thumb }
}

const ARTS: ArtKey[] = ['emerald-ape', 'violet-nomad', 'ivory-baron', 'golden-beat']
const COLLECTION: Record<ArtKey, string> = {
  'emerald-ape': 'Kurio Apes', 'violet-nomad': 'Kurio Nomads', 'ivory-baron': 'Kurio Barons', 'golden-beat': 'Kurio Beats',
}
const ATTRS: Record<ArtKey, string[]> = {
  'emerald-ape': ['Óculos', 'Esmeralda', 'Raro'],
  'violet-nomad': ['Chapéu', 'Moletom', 'Roxo'],
  'ivory-baron': ['Terno', 'Marfim', 'Gola alta'],
  'golden-beat': ['Fones', 'Dourado', 'Jaqueta'],
}
const CREATORS = ['Nova Sato', 'Rafa Lima', 'Ayo Bell', 'Mika Duarte']
const ADJ = ['Emerald', 'Sage', 'Neon', 'Cosmic', 'Violet', 'Ivory', 'Golden', 'Crimson', 'Amber', 'Lunar', 'Solar', 'Onyx']
const NOUN = ['Ape', 'Nomad', 'Vessel', 'Bloom', 'Baron', 'Beat', 'Frequency', 'Signal', 'Oracle', 'Drifter', 'Echo', 'Relic']
const PRICES = ['0.39', '0.59', '0.99', '1.19', '1.29', '1.39', '1.69', '1.79', '1.99', '2.49', '3.20', '4.75', '6.10', '12.30']

interface Seed {
  title: string; number: number; art: ArtKey; price: string
  category: string; network: Network; badge?: 'RARO'; compareAt?: string
}

// Os 9 primeiros espelham os cards do Figma (nome, preço, arte).
const FIGMA: Seed[] = [
  { title: 'Emerald Ape #042', number: 42, art: 'emerald-ape', price: '1.19', category: 'arte-digital', network: 'ethereum' },
  { title: 'Sage Nomad #009', number: 9, art: 'violet-nomad', price: '1.69', category: 'fotografia', network: 'ethereum' },
  { title: 'Neon Vessel #552', number: 552, art: 'ivory-baron', price: '1.99', category: 'arte-3d', network: 'polygon', badge: 'RARO', compareAt: '2.29' },
  { title: 'Cosmic Bloom #118', number: 118, art: 'violet-nomad', price: '1.29', category: 'generativa', network: 'solana' },
  { title: 'Violet Nomad #314', number: 314, art: 'violet-nomad', price: '1.39', category: 'colecionaveis', network: 'ethereum' },
  { title: 'Ivory Baron #088', number: 88, art: 'ivory-baron', price: '1.79', category: 'arte-digital', network: 'polygon' },
  { title: 'Golden Beat #207', number: 207, art: 'golden-beat', price: '0.99', category: 'musica', network: 'ethereum' },
  { title: 'Golden Frequency #071', number: 71, art: 'golden-beat', price: '0.59', category: 'musica', network: 'solana' },
  { title: 'Golden Signal #160', number: 160, art: 'golden-beat', price: '0.39', category: 'jogos', network: 'polygon' },
]

function generated(i: number): Seed {
  const number = ((i * 37 + 11) % 900) + 1
  const price = PRICES[(i * 3 + 1) % PRICES.length]!
  return {
    title: `${ADJ[(i * 5 + 3) % ADJ.length]} ${NOUN[(i * 7 + 1) % NOUN.length]} #${String(number).padStart(3, '0')}`,
    number,
    art: ARTS[i % ARTS.length]!,
    price,
    category: CATEGORIES[(i * 5 + 2) % CATEGORIES.length]!.slug,
    network: NETWORKS[(i * 7) % NETWORKS.length]!,
    badge: i % 9 === 2 ? 'RARO' : undefined,
    compareAt: i % 13 === 5 ? new Decimal(price).plus('0.30').toFixed() : undefined,
  }
}

const SEEDS: Seed[] = [...FIGMA, ...Array.from({ length: 39 }, (_, i) => generated(i))]

function editionsFor(i: number, price: string, soldOut: boolean): Edition[] {
  const stock: [EditionName, number][] = i < FIGMA.length ? [['1/1', 1], ['1/10', 10], ['1/50', 50], ['ABERTA', 99]] : [
    ['1/1', i % 5 === 0 ? 0 : 1],
    ['1/10', i % 7 === 0 ? 0 : ((i * 3) % 10) + 1],
    ['1/50', ((i * 7) % 50) + 1],
    ['ABERTA', ((i * 11) % 99) + 1],
  ]
  return stock.map(([name, available], j) => ({
    id: `ed-${i + 1}-${j + 1}`, name, priceEth: price, available: soldOut ? 0 : available,
  }))
}

export function buildNftRecords(): NftRecord[] {
  return SEEDS.map((s, i) => {
    const soldOut = i >= FIGMA.length && (i - FIGMA.length) % 11 === 4
    const fromFigma = i < FIGMA.length
    return {
      id: `nft-${i + 1}`,
      title: s.title,
      collection: COLLECTION[s.art],
      creator: CREATORS[i % CREATORS.length]!,
      category: s.category,
      description: `${s.title} é uma obra digital finalizada à mão da coleção ${COLLECTION[s.art]}, verificada na rede ${s.network}.`,
      priceEth: s.price,
      compareAtPriceEth: s.compareAt,
      badge: s.badge,
      network: s.network,
      tokenId: `#${String(s.number).padStart(4, '0')}`,
      attributes: ATTRS[s.art],
      rating: i === 0 ? 4.8 : 4 + ((i * 3) % 10) / 10,
      reviewCount: i === 0 ? 19 : ((i * 5) % 40) + 3,
      editions: editionsFor(i, s.price, soldOut),
      version: 1,
      // mais recentes primeiro: um item por hora, a partir de uma data fixa
      updatedAt: new Date(Date.UTC(2026, 10, 1, 12) - i * 3_600_000).toISOString(),
      art: s.art,
      popularity: fromFigma ? 90 - i : (i * 53) % 100,
    }
  })
}
