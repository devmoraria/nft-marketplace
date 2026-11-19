import { expect, test, type Page } from '@playwright/test'

async function resetMocks(page: Page) {
  await page.goto('/')
  await page.waitForFunction(() => !!window.__mocks)
  await page.evaluate(() => {
    localStorage.removeItem('auth')
    window.__mocks!.reset()
  })
}

const catalog = (page: Page) => page.getByRole('region', { name: 'Catálogo' })
const cards = (page: Page) => catalog(page).locator('article')
const firstTitle = (page: Page) => cards(page).first().getByRole('heading', { level: 3 }).innerText()
const pagination = (page: Page) => page.getByRole('navigation', { name: 'Paginação' })
// O TanStack Router serializa os valores em JSON na URL (ex.: category=["musica"], min="1").
const params = (page: Page) => new URL(page.url()).searchParams

test.beforeEach(async ({ page }, info) => {
  // A home mobile é outro componente (MobileHome); este spec cobre o desktop.
  test.skip(info.project.name === 'mobile', 'Catálogo desktop')
  await resetMocks(page)
  await page.goto('/')
  await expect(cards(page).first()).toBeVisible()
})

test('catálogo inicial mostra 9 cards e paginação', async ({ page }) => {
  await expect(cards(page)).toHaveCount(9)
  await expect(pagination(page).getByRole('button', { name: '1', exact: true })).toHaveAttribute('aria-current', 'page')
})

test('busca pela URL filtra a lista e sobrevive ao refresh', async ({ page }) => {
  await page.goto('/?q=golden')
  await expect(cards(page).first()).toBeVisible()
  expect(await cards(page).count()).toBeGreaterThan(0)
  for (const t of await cards(page).getByRole('heading', { level: 3 }).allInnerTexts()) {
    expect(t.toLowerCase()).toContain('golden')
  }
  await page.reload()
  await expect(page).toHaveURL(/q=golden/)
  await expect(cards(page).first()).toContainText(/golden/i)
})

test('resultado vazio mostra mensagem', async ({ page }) => {
  await page.goto('/?q=zzzzzz')
  await expect(catalog(page).getByRole('status')).toHaveText('Nenhum NFT encontrado para esses filtros.')
  await expect(cards(page)).toHaveCount(0)
})

test('filtro de coleção entra na URL, é combinável e pode ser desfeito', async ({ page }) => {
  const arte = page.getByRole('button', { name: /^Arte digital/ })
  await arte.click()
  await expect.poll(() => params(page).get('category')).toBe('["arte-digital"]')
  await expect(arte).toHaveAttribute('aria-pressed', 'true')

  // segunda coleção soma ao filtro
  await page.getByRole('button', { name: /^Música/ }).click()
  await expect.poll(() => params(page).get('category')).toBe('["arte-digital","musica"]')

  // desfazer a primeira
  await arte.click()
  await expect(arte).toHaveAttribute('aria-pressed', 'false')
  await expect.poll(() => params(page).get('category')).toBe('["musica"]')
})

test('faixa de preço aplicada entra na URL e restringe os resultados', async ({ page }) => {
  await page.getByRole('slider', { name: 'Preço mínimo' }).fill('1')
  await page.getByRole('slider', { name: 'Preço máximo' }).fill('2')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect.poll(() => params(page).get('min')).toBe('"1"')
  await expect.poll(() => params(page).get('max')).toBe('"2"')

    // keepPreviousData mantém a lista antiga até a resposta chegar: espere estabilizar.
  await expect.poll(async () => {
    const prices = (await cards(page).locator('p').allInnerTexts()).map((t) => parseFloat(t))
    return prices.length > 0 && prices.every((v) => v >= 1 && v <= 2)
  }).toBe(true)

  await page.reload()
  await expect.poll(() => params(page).get('min')).toBe('"1"')
})

test('filtros combinados: coleção + faixa de preço', async ({ page }) => {
  await page.getByRole('button', { name: /^Música/ }).click()
  await page.getByRole('slider', { name: 'Preço máximo' }).fill('1')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect.poll(() => params(page).get('category')).toBe('["musica"]')
  await expect.poll(() => params(page).get('max')).toBe('"1"')
})

test('ordenação por menor preço entra na URL e ordena', async ({ page }) => {
  await page.getByRole('combobox', { name: 'Ordenar por:' }).selectOption({ label: 'Menor preço' })
  await expect(page).toHaveURL(/sort=price_asc/)
  await expect.poll(async () => {
    const prices = (await cards(page).locator('p').allInnerTexts()).map((t) => parseFloat(t))
    return prices.every((v, i) => i === 0 || prices[i - 1]! <= v)
  }).toBe(true)
})

test('aba "Em alta" entra na URL', async ({ page }) => {
  await page.getByRole('button', { name: 'Em alta' }).click()
  await expect(page).toHaveURL(/tab=hot/)
  await expect(page.getByRole('button', { name: 'Em alta' })).toHaveAttribute('aria-pressed', 'true')
})

test('paginação, histórico e reinício da página ao mudar filtro', async ({ page }) => {
  const first = await firstTitle(page)

  await pagination(page).getByRole('button', { name: '2', exact: true }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(pagination(page).getByRole('button', { name: '2', exact: true })).toHaveAttribute('aria-current', 'page')
  await expect.poll(() => firstTitle(page)).not.toBe(first)

  await page.goBack()
  await expect(page).not.toHaveURL(/page=2/)
  await expect.poll(() => firstTitle(page)).toBe(first)
  await page.goForward()
  await expect(page).toHaveURL(/page=2/)

  // mudar filtro reinicia a paginação
  await page.getByRole('button', { name: /^Arte digital/ }).click()
  await expect.poll(() => params(page).get('category')).toBe('["arte-digital"]')
  await expect.poll(() => params(page).get('page')).toBe('1')
})

test('botão "Próxima página" avança', async ({ page }) => {
  await page.getByRole('button', { name: 'Próxima página' }).click()
  await expect(page).toHaveURL(/page=2/)
})

test('acesso direto ao detalhe', async ({ page }) => {
  await page.goto('/nft/nft-1')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Emerald Ape')
})

test('lentidão mostra skeleton antes dos cards', async ({ page }) => {
  await page.goto('/?scenario=slow')
  await expect(catalog(page).locator('.skeleton').first()).toBeVisible()
  await expect(cards(page).first()).toBeVisible({ timeout: 10_000 })
})

// Os retries do TanStack Query atrasam o alerta de erro por varios segundos; por isso o timeout maior.
test('falha de servidor mostra erro e recupera com "Tentar novamente"', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/?scenario=server-error')
  await expect(catalog(page).getByRole('alert')).toContainText('Não foi possível carregar os NFTs.', { timeout: 25_000 })
  // A URL (?scenario=) vence o setScenario no mock: limpe o parametro tambem.
  await page.evaluate(() => {
    window.__mocks!.setScenario('default')
    history.replaceState(null, '', location.pathname)
  })
  await catalog(page).getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(cards(page).first()).toBeVisible()
})