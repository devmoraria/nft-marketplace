import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate } from '@tanstack/react-router'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { useSession } from '@/features/auth/session'
import { NETWORKS, type Network, type Wallet } from '@/shared/api/types'
import { apiFields, apiMessage, useChangePassword, useSaveWallet, useUpdateProfile, useWallets, type WalletInput } from './account'

const NET: Record<Network, string> = { ethereum: 'Ethereum', polygon: 'Polygon', solana: 'Solana' }
const field = 'mt-1 h-11 w-full rounded border border-[#4a3326] bg-[#1b110d] px-3 text-[#f3ece3] aria-[invalid=true]:border-red-400'
const btn = 'h-11 rounded bg-[#d18a4e] px-5 font-bold text-[#140d0b] aria-disabled:opacity-50'
const btnGhost = 'h-11 rounded border border-[#d18a4e] px-5 font-bold text-[#e89b55]'
const card = 'mt-6 rounded-2xl bg-[#221612] p-5'

function TextField({ label, value, onChange, error, type = 'text', autoComplete }: {
  label: string; value: string; onChange: (v: string) => void; error?: string | undefined; type?: string; autoComplete?: string
}) {
  const id = useId()
  return (
    <div className="mt-4">
      <label htmlFor={id} className="block text-sm text-[#bfa07a]">{label}</label>
      <input id={id} type={type} value={value} autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} className={field} />
      {error && <p id={`${id}-err`} className="mt-1 text-sm text-red-300">{error}</p>}
    </div>
  )
}

function SelectField({ label, value, onChange, error, children }: {
  label: string; value: string; onChange: (v: string) => void; error?: string | undefined; children: ReactNode
}) {
  const id = useId()
  return (
    <div className="mt-4">
      <label htmlFor={id} className="block text-sm text-[#bfa07a]">{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined} className={field}>{children}</select>
      {error && <p id={`${id}-err`} className="mt-1 text-sm text-red-300">{error}</p>}
    </div>
  )
}

function Status({ ok, fail }: { ok: string; fail: string }) {
  return (
    <>
      <p role="status" className="mt-3 text-sm text-[#e89b55]">{ok}</p>
      <p role="alert" className="mt-3 text-sm text-red-300">{fail}</p>
    </>
  )
}

function Shell({ title, children }: { title: string; children: ReactNode }) {
  const session = useSession()
  if (!session) return <Navigate to="/login" search={{ redirect: window.location.pathname }} />
  return (
    <div className="min-h-screen bg-[#140d0b] text-[#f3ece3]">
      <SiteHeader active="Mercado" />
      <main className="mx-auto w-full max-w-xl px-4 pb-16 pt-24 md:pt-28">
        <nav aria-label="Conta" className="flex gap-5 text-sm text-[#e89b55]">
          <Link to="/perfil" className="underline-offset-4 aria-[current=page]:font-bold aria-[current=page]:underline">Perfil</Link>
          <Link to="/carteiras" className="underline-offset-4 aria-[current=page]:font-bold aria-[current=page]:underline">Carteiras</Link>
        </nav>
        <h1 className="mt-4 text-2xl font-bold">{title}</h1>
        {children}
      </main>
    </div>
  )
}

export function ProfilePage() {
  const session = useSession()
  const update = useUpdateProfile()
  const pwd = useChangePassword()
  const [name, setName] = useState(session?.user.name ?? '')
  const [email, setEmail] = useState(session?.user.email ?? '')
  const [avatar, setAvatar] = useState<string | undefined>(undefined) // undefined = sem alteração
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [ok, setOk] = useState('')
  const [fail, setFail] = useState('')
  const [cur, setCur] = useState('')
  const [next, setNext] = useState('')
  const [perrs, setPerrs] = useState<Record<string, string>>({})
  const [pok, setPok] = useState('')
  const [pfail, setPfail] = useState('')

  const shown = avatar === undefined ? session?.user.avatarUrl : avatar

  function onFile(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) return setErrs({ avatarUrl: 'Escolha um arquivo de imagem.' })
    if (file.size > 150_000) return setErrs({ avatarUrl: 'A imagem deve ter até 150 KB.' })
    const r = new FileReader()
    r.onload = () => { setErrs({}); setAvatar(String(r.result)) }
    r.readAsDataURL(file)
  }

  function saveProfile(e: FormEvent) {
    e.preventDefault()
    setOk(''); setFail(''); setErrs({})
    update.mutate({ name, email, ...(avatar !== undefined ? { avatarUrl: avatar } : {}) }, {
      onSuccess: () => { setOk('Perfil atualizado.'); setAvatar(undefined) },
      onError: (err) => { setErrs(apiFields(err)); setFail(apiMessage(err)) },
    })
  }

  function savePassword(e: FormEvent) {
    e.preventDefault()
    setPok(''); setPfail(''); setPerrs({})
    pwd.mutate({ currentPassword: cur, newPassword: next }, {
      onSuccess: () => { setPok('Senha alterada.'); setCur(''); setNext('') },
      onError: (err) => { setPerrs(apiFields(err)); setPfail(apiMessage(err)) },
    })
  }

  return (
    <Shell title="Meu perfil">
      <form onSubmit={saveProfile} noValidate className={card} aria-label="Dados do perfil">
        <div className="flex items-center gap-4">
          {shown ? (
            <img src={shown} alt="Avatar atual" width={72} height={72} className="size-[72px] rounded-full object-cover" />
          ) : (
            <div aria-hidden className="grid size-[72px] place-items-center rounded-full bg-[#3b2a20] text-2xl">{(session?.user.name ?? '?').slice(0, 1)}</div>
          )}
          <div className="text-sm">
            <label htmlFor="avatar-file" className="block text-[#bfa07a]">Foto de perfil</label>
            <input id="avatar-file" type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} className="mt-1 max-w-[220px] text-xs" />
            {shown && <button type="button" onClick={() => setAvatar('')} className="mt-1 block text-[#e89b55] underline">Remover foto</button>}
          </div>
        </div>
        {errs.avatarUrl && <p className="mt-2 text-sm text-red-300">{errs.avatarUrl}</p>}
        <TextField label="Nome" value={name} onChange={setName} error={errs.name} autoComplete="name" />
        <TextField label="E-mail" value={email} onChange={setEmail} error={errs.email} type="email" autoComplete="email" />
        <button type="submit" aria-disabled={update.isPending} className={`${btn} mt-5`}>Salvar perfil</button>
        <Status ok={ok} fail={fail && !Object.keys(errs).length ? fail : ''} />
      </form>

      <form onSubmit={savePassword} noValidate className={card} aria-label="Alterar senha">
        <h2 className="text-lg font-bold">Alterar senha</h2>
        <TextField label="Senha atual" value={cur} onChange={setCur} error={perrs.currentPassword} type="password" autoComplete="current-password" />
        <TextField label="Nova senha" value={next} onChange={setNext} error={perrs.newPassword} type="password" autoComplete="new-password" />
        <button type="submit" aria-disabled={pwd.isPending} className={`${btn} mt-5`}>Alterar senha</button>
        <Status ok={pok} fail={pfail && !Object.keys(perrs).length ? pfail : ''} />
      </form>
    </Shell>
  )
}

const EMPTY: WalletInput = { label: '', address: '', network: 'ethereum', kind: 'secondary' }

export function WalletsPage() {
  const wallets = useWallets()
  const save = useSaveWallet()
  const [editing, setEditing] = useState<string | undefined>(undefined)
  const [form, setForm] = useState<WalletInput>(EMPTY)
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [ok, setOk] = useState('')
  const [fail, setFail] = useState('')
  const set = <K extends keyof WalletInput>(k: K, v: WalletInput[K]) => setForm((f) => ({ ...f, [k]: v }))

  function edit(w: Wallet) {
    setEditing(w.id); setErrs({}); setOk(''); setFail('')
    setForm({ label: w.label, address: w.address, network: w.network, kind: w.kind })
  }
  function reset() { setEditing(undefined); setForm(EMPTY); setErrs({}) }

  function submit(e: FormEvent) {
    e.preventDefault()
    setOk(''); setFail(''); setErrs({})
    save.mutate({ ...(editing ? { id: editing } : {}), input: form }, {
      onSuccess: () => { setOk(editing ? 'Carteira atualizada.' : 'Carteira adicionada.'); reset() },
      onError: (err) => { setErrs(apiFields(err)); setFail(apiMessage(err)) },
    })
  }

  return (
    <Shell title="Carteiras">
      <section aria-label="Suas carteiras" className={card}>
        {wallets.isPending && <div aria-busy className="skeleton h-[120px]" />}
        {wallets.isError && <p role="alert" className="text-red-300">Não foi possível carregar as carteiras. <button type="button" onClick={() => void wallets.refetch()} className="underline">Tentar novamente</button></p>}
        <ul className="divide-y divide-[#3b2a20]">
          {wallets.data?.map((w) => (
            <li key={w.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-bold">{w.label} <span className="ml-1 rounded-full border border-[#d18a4e] px-2 py-0.5 text-xs text-[#e89b55]">{w.kind === 'primary' ? 'Principal' : 'Secundária'}</span></p>
                <p className="truncate text-sm text-[#bfa07a]">{NET[w.network]} · {w.address}</p>
              </div>
              <button type="button" aria-label={`Editar ${w.label}`} onClick={() => edit(w)} className={`${btnGhost} h-9 px-3 text-sm`}>Editar</button>
            </li>
          ))}
        </ul>
      </section>

      <form onSubmit={submit} noValidate className={card} aria-label={editing ? 'Editar carteira' : 'Adicionar carteira'}>
        <h2 className="text-lg font-bold">{editing ? 'Editar carteira' : 'Adicionar carteira'}</h2>
        <TextField label="Apelido" value={form.label} onChange={(v) => set('label', v)} error={errs.label} />
        <SelectField label="Rede" value={form.network} onChange={(v) => set('network', v as Network)} error={errs.network}>
          {NETWORKS.map((n) => <option key={n} value={n}>{NET[n]}</option>)}
        </SelectField>
        <TextField label="Endereço" value={form.address} onChange={(v) => set('address', v)} error={errs.address} />
        <SelectField label="Tipo" value={form.kind} onChange={(v) => set('kind', v as WalletInput['kind'])} error={errs.kind}>
          <option value="primary">Principal</option>
          <option value="secondary">Secundária</option>
        </SelectField>
        <div className="mt-5 flex gap-3">
          <button type="submit" aria-disabled={save.isPending} className={btn}>{editing ? 'Salvar alterações' : 'Adicionar carteira'}</button>
          {editing && <button type="button" onClick={reset} className={btnGhost}>Cancelar</button>}
        </div>
        <Status ok={ok} fail={fail && !Object.keys(errs).length ? fail : ''} />
      </form>
    </Shell>
  )
}



