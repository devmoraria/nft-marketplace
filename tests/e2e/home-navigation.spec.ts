import { expect, test, type Page } from '@playwright/test'

// Navegação da home desktop: clique no card, lupa do header, EXPLORAR e itens fora do escopo.

async function resetMocks(page: Page) {
  await page.goto('/')
  await page.waitForFunction(() => !!window.__mocks)
  await page.evaluate(() => {
    localStorage.removeItem('auth')
    sessionStorage.clear()
    window.__mocks!.reset()
  })
}

const catalog = (page: Page) => page.getByRole('region', { name: 'Catálogo' })
const cards = (page: Page) => catalog(page).locator('article')

test.beforeEach(async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'Home desktop (a mobile é outro componente)')
  await resetMocks(page)
  await page.goto('/')
  await expect(cards(page).first()).toBeVisible()
})

test('clicar no card abre o detalhe do NFT', async ({ page }) => {
  await cards(page).first().click()
  await expect(page).toHaveURL(/\/nft\/nft-\d+/)
})

test('teclado: o link do card recebe foco e abre o detalhe com Enter', async ({ page }) => {
  const link = cards(page).first().getByRole('link', { name: /^Ver / })
  await link.focus()
  await expect(link).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/nft\/nft-\d+/)
})

test('EXPLORAR rola até o catálogo', async ({ page }) => {
  await page.getByRole('link', { name: 'EXPLORAR', exact: true }).click()
  // A rolagem é suave: espere a posição mudar (o catálogo já aparece parcialmente no topo).
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(200)
  await expect.poll(() => page.evaluate(() => Math.round(document.getElementById('catalogo')!.getBoundingClientRect().top))).toBeLessThan(120)
})

test('lupa do header abre a busca, filtra pela URL e rola até os resultados', async ({ page }) => {
  await page.getByRole('button', { name: 'Buscar' }).click()
  const field = page.getByLabel('Buscar NFTs')
  await expect(field).toBeFocused()
  await field.fill('Emerald')
  await field.press('Enter')

  await expect(page).toHaveURL(/q=Emerald/)
  await expect(cards(page).first()).toContainText('Emerald')
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(200)
})

test('busca sem resultado mostra a mensagem de vazio', async ({ page }) => {
  await page.getByRole('button', { name: 'Buscar' }).click()
  await page.getByLabel('Buscar NFTs').fill('zzzzzz')
  await page.getByLabel('Buscar NFTs').press('Enter')
  await expect(page.getByText('Nenhum NFT encontrado para esses filtros.')).toBeVisible()
})

test('Esc fecha a busca e devolve o foco à lupa', async ({ page }) => {
  const lupa = page.getByRole('button', { name: 'Buscar' })
  await lupa.click()
  await expect(page.getByLabel('Buscar NFTs')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByLabel('Buscar NFTs')).toHaveCount(0)
  await expect(lupa).toBeFocused()
})

test('Mercado, Criadores e Aprenda indicam "Em breve" e não navegam', async ({ page }) => {
  const nav = page.getByRole('navigation', { name: 'Principal' })
  const before = page.url()
  for (const label of ['Mercado', 'Criadores', 'Aprenda']) {
    const item = nav.getByText(label)
    await expect(item).toHaveAttribute('title', 'Em breve')
    await expect(item).toHaveAttribute('aria-disabled', 'true')
    await item.click()
  }
  expect(page.url()).toBe(before)
})
