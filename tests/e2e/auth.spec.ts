import { expect, test, type Page } from '@playwright/test'

// Pressupõe baseURL e VITE_ENABLE_MOCKS=true no playwright.config (como nos testes do Detalhe).
async function resetMocks(page: Page) {
  await page.goto('/')
  await page.waitForFunction(() => !!window.__mocks)
  await page.evaluate(() => {
    localStorage.removeItem('auth')
    window.__mocks!.reset()
  })
}

async function fillLogin(page: Page, email: string, password: string) {
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
}

const storedToken = (page: Page) =>
  page.evaluate(() => (JSON.parse(localStorage.getItem('auth') ?? 'null') as { token?: string } | null)?.token)

test.beforeEach(async ({ page }) => { await resetMocks(page) })

test('mostra erros de validação sem chamar o servidor', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByText('E-mail inválido.')).toBeVisible()
  await expect(page.getByText('Informe sua senha.')).toBeVisible()
})

test('senha errada mostra erro geral e não cria sessão', async ({ page }) => {
  await page.goto('/login')
  await fillLogin(page, 'ana@example.com', 'errada123')
  await expect(page.getByRole('alert').filter({ hasText: 'E-mail ou senha incorretos.' })).toBeVisible()
  expect(await storedToken(page)).toBeUndefined()
})

test('login volta para o NFT do ?redirect=', async ({ page }) => {
  await page.goto('/login?redirect=/nft/nft-1')
  await fillLogin(page, 'ana@example.com', 'Senha@123')
  await expect(page).toHaveURL(/\/nft\/nft-1$/)
  await expect.poll(() => storedToken(page), { timeout: 5_000 }).toBeTruthy()
})

test('a sessão sobrevive ao F5', async ({ page }) => {
  await page.goto('/login')
  await fillLogin(page, 'ana@example.com', 'Senha@123')
  await expect(page).toHaveURL(/\/$/)
  const token = await storedToken(page)
  await page.reload()
  await page.waitForTimeout(500)
  expect(await storedToken(page)).toBe(token)
})

test('?redirect= externo é ignorado', async ({ page }) => {
  await page.goto('/login?redirect=//evil.example')
  await fillLogin(page, 'bruno@example.com', 'Senha@456')
  await expect(page).toHaveURL(/\/$/)
})

test('cadastro cria conta e entra', async ({ page }) => {
  await page.goto('/signup')
  await page.getByLabel('Nome').fill('Carla Dias')
  await page.getByLabel('E-mail').fill('carla@example.com')
  await page.getByLabel('Senha', { exact: true }).fill('Senha@789')
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
  expect(await storedToken(page)).toBeTruthy()
})

test('e-mail já cadastrado aparece no campo (409)', async ({ page }) => {
  await page.goto('/signup')
  await page.getByLabel('Nome').fill('Outra Ana')
  await page.getByLabel('E-mail').fill('ana@example.com')
  await page.getByLabel('Senha', { exact: true }).fill('Senha@789')
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click()
  await expect(page.getByText('Este e-mail já está cadastrado.')).toBeVisible()
  await expect(page).toHaveURL(/\/signup/)
})

test('cenário session-expired derruba a sessão no F5', async ({ page }) => {
  await page.goto('/login')
  await fillLogin(page, 'ana@example.com', 'Senha@123')
  await expect(page).toHaveURL(/\/$/)
  await page.evaluate(() => window.__mocks!.setScenario('session-expired'))
  await page.reload()
  await expect.poll(() => storedToken(page)).toBeUndefined()
})
