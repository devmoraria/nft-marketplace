import { Link } from '@tanstack/react-router'
import { CATEGORIES } from '@/features/catalog/constants'

const FEATURES = [
  {
    icon: 'W',
    title: 'Segurança da carteira',
    text: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    icon: 'C',
    title: 'Criadores em destaque',
    text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    icon: 'D',
    title: 'Alertas de lançamentos',
    text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
]

const PROFILE_ITEMS = ['Meu perfil', 'Minha coleção', 'Atividade', 'Estúdio do criador', 'Lista de interesse']
const HELP_ITEMS = ['Central de ajuda', 'Como comprar NFTs', 'Carteira e segurança', 'Política do mercado', 'Denunciar item']

function PlainList({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <div>
      <h2 className="mb-3 text-base font-bold">{title}</h2>
      <ul className="space-y-2 text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export function SiteFooter() {
  return (
    <footer className="mt-16">
      <div className="mx-auto w-full max-w-[1200px] px-4 md:px-6 xl:px-0">
        <div className="grid gap-8 bg-card p-6 md:grid-cols-2 lg:grid-cols-4 lg:p-8">
          {FEATURES.map((f) => (
            <div key={f.title}>
              <span
                aria-hidden="true"
                className="mb-3 flex size-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground"
              >
                {f.icon}
              </span>
              <h2 className="mb-2 text-base font-bold">{f.title}</h2>
              <p className="text-muted-foreground">{f.text}</p>
            </div>
          ))}
          <div>
            <h2 className="mb-3 text-base font-bold">Antecipe-se ao próximo lançamento</h2>
            {/* Newsletter está fora do escopo: desabilitada para não simular sucesso. */}
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
              <label htmlFor="newsletter" className="sr-only">
                E-mail para novidades
              </label>
              <input
                id="newsletter"
                type="email"
                disabled
                placeholder="digite seu e-mail..."
                className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled
                title="Em breve"
                className="rounded-md bg-primary px-4 py-2 font-bold text-primary-foreground disabled:opacity-60"
              >
                Enviar
              </button>
            </form>
            <p className="mt-3 text-muted-foreground">
              Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
            </p>
          </div>
        </div>

        <div className="grid gap-3 bg-[#3a2314] px-6 py-4 md:grid-cols-4 lg:px-8">
          <p className="font-bold tracking-[0.2em]">KURIO</p>
          <p className="md:col-span-1">Feito para colecionadores, criadores e cultura</p>
          <p>contato@email.com</p>
          <p>+55 11 4002 8922</p>
        </div>

        <div className="grid gap-8 bg-card px-6 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          <PlainList title="Meu perfil" items={PROFILE_ITEMS} />
          <PlainList title="Central de ajuda" items={HELP_ITEMS} />
          <div>
            <h2 className="mb-3 text-base font-bold">Coleções</h2>
            <ul className="space-y-2">
              {CATEGORIES.slice(0, 5).map((name) => (
                <li key={name}>
                  <Link
                    to="/"
                    search={{ category: [name] }}
                    className="text-muted-foreground hover:text-accent-foreground"
                  >
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-3 text-base font-bold">Carteiras compatíveis</h2>
            <p className="inline-block rounded-md border border-border px-2 py-1 text-xs text-accent-foreground">
              METAMASK • WALLETCONNECT • COINBASE
            </p>
          </div>
        </div>

        <p className="py-4 text-center text-muted-foreground">© 2026 Kurio. Propriedade digital para todos.</p>
      </div>
    </footer>
  )
}
