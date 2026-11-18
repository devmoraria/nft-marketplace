import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useRouter } from '@tanstack/react-router'
import { Eye, EyeOff, X } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { useForm, type FieldPath, type UseFormRegisterReturn, type UseFormSetError } from 'react-hook-form'
import { AppError } from '@/shared/api/http'
import { login, signup } from './api'
import { loginSchema, signupSchema, type LoginValues, type SignupValues } from './schemas'
import { safeRedirect, setSession, useSession } from './session'
import { useQueryClient } from '@tanstack/react-query'
import { syncCartAfterLogin } from '@/features/cart/queries'

type Mode = 'login' | 'signup'

const INPUT =
  'h-12 w-full rounded-xl border border-[#3a2a22] bg-[#1d1310] px-4 text-sm text-[#f3ece3] placeholder:text-[#7d6552] focus:border-[#e89b55] focus:outline-none aria-[invalid=true]:border-[#e5645b]'

function Field({ label, error, registration, type = 'text', autoComplete, placeholder, autoFocus }: {
  label: string
  error?: string
  registration: UseFormRegisterReturn
  type?: string
  autoComplete?: string
  placeholder?: string
  autoFocus?: boolean
}) {
  const id = useId()
  const [shown, setShown] = useState(false)
  const isPassword = type === 'password'
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] text-[#bfa07a]">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && shown ? 'text' : type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : undefined}
          className={INPUT + (isPassword ? ' pr-12' : '')}
          {...registration}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShown((s) => !s)}
            aria-label={shown ? 'Ocultar senha' : 'Mostrar senha'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bfa07a] hover:text-[#f3ece3]"
          >
            {shown ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <p id={`${id}-err`} role="alert" className="mt-1.5 text-xs text-[#ff8a80]">{error}</p>}
    </div>
  )
}

// Erros 422/409 do servidor vão para o campo certo; o resto vira mensagem geral do formulário.
function applyServerError<T extends LoginValues | SignupValues>(
  err: unknown,
  setError: UseFormSetError<T>,
  known: readonly string[],
  setFormError: (m: string) => void,
): void {
  if (err instanceof AppError) {
    const fields = Object.entries(err.fields ?? {}).filter(([k]) => known.includes(k))
    if (fields.length) {
      fields.forEach(([k, message]) => setError(k as FieldPath<T>, { type: 'server', message }))
      return
    }
    setFormError(err.message)
    return
  }
  setFormError('Não foi possível concluir. Tente novamente.')
}

function SubmitButton({ busy, children }: { busy: boolean; children: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="h-12 w-full rounded-xl bg-[#e89b55] text-sm font-bold text-[#1a0f0a] transition hover:brightness-110 disabled:opacity-60"
    >
      {busy ? 'Aguarde…' : children}
    </button>
  )
}

function LoginForm() {
  const [formError, setFormError] = useState<string | null>(null)
  const qc = useQueryClient()
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  })
  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      setSession(await login(values))
      void syncCartAfterLogin(qc)
    } catch (e) {
      applyServerError(e, setError, ['email', 'password'], setFormError)
    }
  })
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Field label="E-mail" type="email" autoComplete="email" placeholder="voce@email.com" autoFocus
        registration={register('email')} error={errors.email?.message} />
      <Field label="Senha" type="password" autoComplete="current-password" placeholder="Sua senha"
        registration={register('password')} error={errors.password?.message} />
      {formError && <p role="alert" className="text-sm text-[#ff8a80]">{formError}</p>}
      <SubmitButton busy={isSubmitting}>Entrar</SubmitButton>
    </form>
  )
}

function SignupForm() {
  const [formError, setFormError] = useState<string | null>(null)
  const qc = useQueryClient()
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
  })
  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      setSession(await signup(values))
      void syncCartAfterLogin(qc)
    } catch (e) {
      applyServerError(e, setError, ['name', 'email', 'password'], setFormError)
    }
  })
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Field label="Nome" autoComplete="name" placeholder="Seu nome" autoFocus
        registration={register('name')} error={errors.name?.message} />
      <Field label="E-mail" type="email" autoComplete="email" placeholder="voce@email.com"
        registration={register('email')} error={errors.email?.message} />
      <Field label="Senha" type="password" autoComplete="new-password" placeholder="Mínimo de 8 caracteres"
        registration={register('password')} error={errors.password?.message} />
      {formError && <p role="alert" className="text-sm text-[#ff8a80]">{formError}</p>}
      <SubmitButton busy={isSubmitting}>Criar conta</SubmitButton>
    </form>
  )
}

/**
 * Mobile: página cheia. Desktop (lg): cartão central sobre fundo escurecido, como modal.
 * Com sessão ativa, vai para o ?redirect= (ou para o início).
 */
export function AuthPage({ mode, redirect }: { mode: Mode; redirect?: string }) {
  const router = useRouter()
  const session = useSession()
  const target = safeRedirect(redirect)
  const titleId = useId()
  const search = target ? { redirect: target } : {}

  useEffect(() => {
    if (session) router.history.replace(target ?? '/')
  }, [session, target, router])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') router.history.push(target ?? '/') }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [router, target])

  const tab = (active: boolean) =>
    `flex-1 border-b-2 pb-3 text-center text-sm font-semibold transition ${active ? 'border-[#e89b55] text-[#f3ece3]' : 'border-transparent text-[#bfa07a] hover:text-[#f3ece3]'}`

  return (
    <main className="min-h-dvh bg-[#140d0b] font-mono text-[#f3ece3] lg:grid lg:place-items-center lg:bg-black/70 lg:p-6 lg:backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="mx-auto w-full max-w-[440px] px-6 pb-10 pt-6 lg:rounded-2xl lg:border lg:border-[#3a2a22] lg:bg-[#140d0b] lg:p-8 lg:shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h1 id={titleId} className="text-[19px] font-bold">
            {mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </h1>
          <Link to="/" aria-label="Fechar" className="grid size-9 place-items-center rounded-full text-[#bfa07a] hover:bg-[#2a1c16] hover:text-[#f3ece3]">
            <X size={20} />
          </Link>
        </div>

        <nav aria-label="Entrar ou criar conta" className="mb-6 flex gap-2 border-b border-[#2a1c16]">
          <Link to="/login" search={search} aria-current={mode === 'login' ? 'page' : undefined} className={tab(mode === 'login')}>Entrar</Link>
          <Link to="/signup" search={search} aria-current={mode === 'signup' ? 'page' : undefined} className={tab(mode === 'signup')}>Criar conta</Link>
        </nav>

        {mode === 'login' ? <LoginForm /> : <SignupForm />}

        <div className="my-6 flex items-center gap-3 text-xs text-[#7d6552]">
          <span className="h-px flex-1 bg-[#2a1c16]" />
          ou
          <span className="h-px flex-1 bg-[#2a1c16]" />
        </div>

        <div className="flex flex-col gap-3">
          <button type="button" disabled title="Em breve" className="h-12 rounded-xl border border-[#3a2a22] text-sm text-[#bfa07a] opacity-50">
            Continuar com Google
          </button>
          <button type="button" disabled title="Em breve" className="h-12 rounded-xl border border-[#3a2a22] text-sm text-[#bfa07a] opacity-50">
            Continuar com Facebook
          </button>
        </div>
      </section>
    </main>
  )
}
