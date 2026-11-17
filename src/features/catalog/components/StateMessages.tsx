import { toAppError } from '@/shared/api/http'

const ERROR_TEXT: Record<string, string> = {
  NETWORK_ERROR: 'Sem conexão com o servidor. Verifique sua internet.',
  TIMEOUT: 'A resposta demorou demais.',
  UNAVAILABLE: 'O serviço está temporariamente indisponível.',
}

const actionClass =
  'mt-4 rounded-md bg-primary px-4 py-2 font-bold text-primary-foreground hover:opacity-90'

export function EmptyState({ onClear, hasFilters }: { onClear: () => void; hasFilters: boolean }) {
  return (
    <div className="rounded-md bg-card px-6 py-12 text-center">
      <h3 className="text-base font-bold">Nenhum NFT encontrado</h3>
      <p className="mt-2 text-muted-foreground">
        {hasFilters ? 'Tente outros termos ou remova alguns filtros.' : 'O catálogo está vazio no momento.'}
      </p>
      {hasFilters && (
        <button type="button" onClick={onClear} className={actionClass}>
          Limpar filtros
        </button>
      )}
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const e = toAppError(error)
  const text = ERROR_TEXT[e.code] ?? 'Não foi possível carregar o catálogo.'

  return (
    <div role="alert" className="rounded-md border border-destructive/60 bg-card px-6 py-12 text-center">
      <h3 className="text-base font-bold">Algo deu errado</h3>
      <p className="mt-2 text-muted-foreground">{text}</p>
      <button type="button" onClick={onRetry} className={actionClass}>
        Tentar novamente
      </button>
    </div>
  )
}
