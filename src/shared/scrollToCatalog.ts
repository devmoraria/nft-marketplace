/** Rola até o catálogo visível (a versão mobile e a desktop convivem no DOM, uma delas escondida). */
export function scrollToCatalog(): void {
  const target = Array.from(document.querySelectorAll<HTMLElement>('[id^="catalogo"]')).find(
    (el) => el.offsetParent !== null,
  )
  if (!target) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}
