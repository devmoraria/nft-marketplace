import { FOOTER } from '@/features/home/figma-content'

const cols = 'grid grid-cols-[302px_302px_302px_1fr]'

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-24 w-full max-w-[1200px] text-[#f3ece3]">
      <div className="grid grid-cols-[297px_265px_266px_1fr] bg-[#221612] pb-4 pt-8">
        {FOOTER.features.map((f, i) => (
          <div key={f.l} className={i === 0 ? 'pl-12' : 'border-l border-[#d18a4e] pl-4'}>
            <div className="grid size-[74px] place-items-center rounded-full bg-[#d18a4e] text-2xl font-bold text-[#140d0b]">{f.l}</div>
            <h3 className="mt-[9px] text-[19px] font-bold leading-6">{f.t}</h3>
            <p className="mt-[7px] max-w-[200px] text-sm leading-[22px] text-[#b8946a]">{f.d}</p>
          </div>
        ))}
        <div className="border-l border-[#d18a4e] pl-4">
          <h3 className="max-w-[260px] text-lg font-bold leading-4">Antecipe-se ao próximo lançamento</h3>
          <div className="mt-[15px] flex w-[325px] opacity-80">
            <input disabled aria-label="E-mail" placeholder="digite seu e-mail..." className="h-10 w-[240px] rounded-l bg-[#2c1a10] px-3 text-sm placeholder:text-[#b8946a]" />
            <button disabled className="h-10 w-[85px] rounded-r bg-[#d18a4e] text-base font-bold text-[#140d0b]">Enviar</button>
          </div>
          <p className="mt-3 w-[300px] text-[13px] leading-[22px] text-[#b8946a]">Receba lançamentos selecionados, histórias de criadores e novidades do mercado.</p>
        </div>
      </div>
      <div className={`${cols} h-[88px] items-center bg-[#3a2413] pl-8 text-sm`}>
        <b className="tracking-widest">KURIO</b><span className="max-w-[230px]">{FOOTER.tagline}</span><span>{FOOTER.email}</span><span>{FOOTER.phone}</span>
      </div>
      <div className={`${cols} h-[236px] bg-[#221612] pl-8 pt-[29px]`}>
        {FOOTER.cols.map(([h, links]) => (
          <div key={h}>
            <h4 className="text-lg font-bold leading-6">{h}</h4>
            <ul className="mt-0.5 text-sm">{links.map((l) => <li key={l} className="flex h-[30px] items-center">{l}</li>)}</ul>
          </div>
        ))}
        <div>
          <h4 className="text-lg font-bold leading-6">Redes sociais</h4>
          <div className="mt-3.5 flex gap-2">{['f', 'ig', 't', 'in', 'yt'].map((x) => <span key={x} className="grid size-8 place-items-center rounded border border-[#6b4423] text-xs font-bold text-[#d18a4e]">{x}</span>)}</div>
          <h4 className="mt-7 text-lg font-bold leading-6">Carteiras compatíveis</h4>
          <span className="mt-[7px] flex h-[25px] w-[228px] items-center justify-between rounded border border-[#5a3a1f] bg-[#3a2413] px-2 text-[9px] font-bold text-[#d18a4e]"><i className="not-italic">METAMASK</i>•<i className="not-italic">WALLETCONNECT</i>•<i className="not-italic">COINBASE</i></span>
        </div>
      </div>
      <p className="pb-4 pt-[11px] text-center text-sm">© 2026 Kurio. Propriedade digital para todos.</p>
    </footer>
  )
}
