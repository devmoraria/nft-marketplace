import { useId, useState, type FormEvent } from 'react'
import { CATEGORIES } from '../constants'

interface FiltersProps {
  category?: string[]
  minPrice?: number
  maxPrice?: number
  onCategoryChange: (next: string[]) => void
  onPriceApply: (min?: number, max?: number) => void
}

const input =
  'w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm placeholder:text-muted-foreground'

function PriceForm({
  minPrice,
  maxPrice,
  onApply,
}: {
  minPrice?: number
  maxPrice?: number
  onApply: (min?: number, max?: number) => void
}) {
  const id = useId()
  const [min, setMin] = useState(minPrice === undefined ? '' : String(minPrice))
  const [max, setMax] = useState(maxPrice === undefined ? '' : String(maxPrice))
  const [error, setError] = useState<string | null>(null)

  function submit(e: FormEvent) {
    e.preventDefault()
    const a = min === '' ? undefined : Number(min)
    const b = max === '' ? undefined : Number(max)
    if ((a !== undefined && Number.isNaN(a)) || (b !== undefined && Number.isNaN(b))) {
      setError('Informe valores numéricos.')
      return
    }
    if (a !== undefined && b !== undefined && a > b) {
      setError('O preço mínimo não pode ser maior que o máximo.')
      return
    }
    setError(null)
    onApply(a, b)
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="flex gap-2">
        <div className="flex-1">
          <label htmlFor={`${id}-min`} className="mb-1 block text-xs text-muted-foreground">
            Mínimo (ETH)
          </label>
          <input
            id={`${id}-min`}
            inputMode="decimal"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-err` : undefined}
            placeholder="0,02"
            className={input}
          />
        </div>
        <div className="flex-1">
          <label htmlFor={`${id}-max`} className="mb-1 block text-xs text-muted-foreground">
            Máximo (ETH)
          </label>
          <input
            id={`${id}-max`}
            inputMode="decimal"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-err` : undefined}
            placeholder="12,30"
            className={input}
          />
        </div>
      </div>
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      )}
      <button
        type="submit"
        className="mt-3 rounded-md bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground hover:opacity-90"
      >
        Aplicar
      </button>
    </form>
  )
}

export function Filters({ category = [], minPrice, maxPrice, onCategoryChange, onPriceApply }: FiltersProps) {
  const id = useId()

  function toggle(name: string) {
    onCategoryChange(category.includes(name) ? category.filter((c) => c !== name) : [...category, name])
  }

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-3 text-base font-bold">Coleções</legend>
        <ul className="space-y-1">
          {CATEGORIES.map((name, i) => (
            <li key={name}>
              <label
                htmlFor={`${id}-c${i}`}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
              >
                <input
                  id={`${id}-c${i}`}
                  type="checkbox"
                  checked={category.includes(name)}
                  onChange={() => toggle(name)}
                  className="size-4 accent-[var(--primary)]"
                />
                <span className={category.includes(name) ? 'text-accent-foreground' : 'text-muted-foreground'}>
                  {name}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <section aria-labelledby={`${id}-price`}>
        <h3 id={`${id}-price`} className="mb-3 text-base font-bold">
          Faixa de preço
        </h3>
        {/* key reinicia os campos quando a URL muda (voltar do histórico, limpar filtros) */}
        <PriceForm
          key={`${minPrice ?? ''}-${maxPrice ?? ''}`}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onApply={onPriceApply}
        />
      </section>
    </div>
  )
}
