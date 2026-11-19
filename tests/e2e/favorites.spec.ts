import { expect, test, type Page } from '@playwright/test'

async function reset(page: Page) {
  await page.goto('/')
  await page.waitForFunction(() => !!window.__mocks)
  await page.evaluate(() => { localStorage.removeItem('auth'); sessionStorage.clear(); window.__mocks!.reset() })
}
async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill('ana@example.com')
  await page.getByLabel('Senha', { exact: true }).fill('Senha@123')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
}
const fav = (page: Page) => page.getByRole('button', { name: /Favoritar|Favoritado/ }).filter({ visible: true }).first()

test.beforeEach(async ({ page }) => { await reset(page) })

test('favorito persiste após refresh', async ({ page }) => {
  await login(page)
  await page.goto('/nft/nft-1')
  const saved = page.waitForResponse((r) => r.url().includes('/api/favorites/') && r.request().method() === 'PUT')
  await fav(page).click()
  await saved
  await expect(fav(page)).toHaveAttribute('aria-pressed', 'true')
  await saved
  await expect(fav(page)).toHaveAttribute('aria-pressed', 'true', { timeout: 10_000 })
  await page.reload()
  await expect(fav(page)).toHaveAttribute('aria-pressed', 'true')
})

test('falha de mutation faz rollback', async ({ page }) => {
  await login(page)
  await page.goto('/nft/nft-1')
  await expect(fav(page)).toHaveAttribute('aria-pressed', 'false')
  await page.evaluate(() => window.__mocks!.setScenario('server-error'))
  await fav(page).click()
  await expect(fav(page)).toHaveAttribute('aria-pressed', 'false')
})

test('favoritar sem sessão pede login', async ({ page }) => {
  await page.goto('/nft/nft-1')
  await fav(page).click()
  await expect(page).toHaveURL(/\/login/)
})
