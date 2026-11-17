// Conteúdo estático copiado do Figma. TODO: mover para mocks/ (facets, badges, posts) quando a API tiver esses campos.
export const CATEGORIES = [['Arte digital', 'arte-digital', 33], ['Fotografia', 'fotografia', 12], ['Música', 'musica', 65], ['Arte 3D', 'arte-3d', 39], ['Colecionáveis', 'colecionaveis', 23], ['Generativa', 'generativa', 17], ['Jogos', 'jogos', 19], ['Assinaturas', 'assinaturas', 13], ['Utilidade', 'utilidade', 18]] as const
export const NETWORKS = [['Ethereum', 119], ['Polygon', 78], ['Solana', 86]] as const
export const PRICE_BOUNDS = { min: 0.02, max: 12.3 }
export const CART_BADGE = 6
export const TABS = [{ id: 'all', label: 'Todos os NFTs' }, { id: 'new', label: 'Novos lançamentos' }, { id: 'hot', label: 'Em alta' }] as const
export const SORTS = [
  { id: 'newest', label: 'Listados recentemente' }, { id: 'price_asc', label: 'Menor preço' },
  { id: 'price_desc', label: 'Maior preço' }, { id: 'popular', label: 'Mais populares' },
] as const
export const NAV = ['Início', 'Mercado', 'Criadores', 'Aprenda']
export const BANNERS = [
  { title: ['Lançamentos gênesis', 'de edição limitada'], text: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.', art: 'Emerald Ape #042' },
  { title: ['Arte digital selecionada', 'e muito mais'], text: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.', art: 'Ivory Baron #088' },
]
export const BLOG = {
  title: 'Diário da Cunhagem',
  subtitle: 'Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.',
  posts: [
    { date: '12 de setembro', read: '6 min', title: 'Como funciona a propriedade de NFTs', text: 'Aprenda a colecionar, negociar e verificar ativos digitais.', art: 'Ivory Baron #088' },
    { date: '13 de setembro', read: '2 min', title: '10 artistas digitais para acompanhar', text: 'Conheça criadores que moldam a cultura digital.', art: 'Emerald Ape #042' },
    { date: '15 de setembro', read: '3 min', title: 'Raridade, atributos e procedência', text: 'Entenda raridade, procedência, direitos autorais e utilidade.', art: 'Violet Nomad #314' },
    { date: '15 de setembro', read: '2 min', title: 'Como proteger sua carteira', text: 'Proteja sua carteira, seus ativos e sua identidade.', art: 'Golden Beat #207' },
  ],
}
export const FOOTER = {
  features: [
    { l: 'W', t: 'Segurança da carteira', d: 'Proteja sua carteira e colecione arte digital verificada com confiança.' },
    { l: 'C', t: 'Criadores em destaque', d: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.' },
    { l: 'D', t: 'Alertas de lançamentos', d: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.' },
  ],
  tagline: 'Feito para colecionadores, criadores e cultura', email: 'contato@email.com', phone: '+55 11 4002 8922',
  cols: [
    ['Meu perfil', ['Meu perfil', 'Minha coleção', 'Atividade', 'Estúdio do criador', 'Lista de interesse']],
    ['Central de ajuda', ['Central de ajuda', 'Como comprar NFTs', 'Carteira e segurança', 'Política do mercado', 'Denunciar item']],
    ['Coleções', ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade']],
  ] as const,
}
