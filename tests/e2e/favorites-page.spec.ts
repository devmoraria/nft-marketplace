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
async function firstNftId(page: Page): Promise<string> {
  return page.evaluate(async () => {
    const res = await fetch('/api/nfts')
    const data = (await res.json()) as { items: { id: string }[] }
    return data.items[0]!.id
  })
}

test.beforeEach(async ({ page }) => { await reset(page) })

test('favoritar persiste após refresh e aparece na listagem; remover esvazia', async ({ page }) => {
  await login(page)
  const id = await firstNftId(page)
  await page.goto(`/nft/${id}`)
  const fav = page.locator('button[aria-pressed]:visible').first()
  await Promise.all([page.waitForResponse((r) => r.url().includes('/api/favorites/') && r.request().method() === 'PUT'), fav.click()])
  await expect(fav).toHaveAttribute('aria-pressed', 'true')
  await page.reload()
  await expect(page.locator('button[aria-pressed]:visible').first()).toHaveAttribute('aria-pressed', 'true')

  await page.goto('/favoritos')
  await expect(page.locator(`a[href="/nft/${id}"]`)).toBeVisible()
  await page.getByRole('button', { name: /Remover .* dos favoritos/ }).click()
  await expect(page.getByText('Você ainda não favoritou nenhum NFT.')).toBeVisible()
})

test('favoritos exigem sessão', async ({ page }) => {
  await page.goto('/favoritos')
  await expect(page).toHaveURL(/\/login/)
})

test('mobile: barra inferior leva ao perfil e permite sair', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'só no projeto mobile')
  await login(page)
  await page.goto('/')
  await page.getByRole('navigation', { name: 'Navegação inferior' }).getByRole('link', { name: 'Perfil' }).click()
  await expect(page).toHaveURL(/\/perfil/)
  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page).toHaveURL(/\/login/)
})
