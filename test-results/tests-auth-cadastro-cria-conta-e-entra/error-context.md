# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\auth.spec.ts >> cadastro cria conta e entra
- Location: tests\auth.spec.ts:61:1

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

```

# Test source

```ts
  1  | import { expect, test, type Page } from '@playwright/test'
  2  | 
  3  | // Pressupõe baseURL e VITE_ENABLE_MOCKS=true no playwright.config (como nos testes do Detalhe).
  4  | async function resetMocks(page: Page) {
> 5  |   await page.goto('/')
     |              ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  6  |   await page.waitForFunction(() => !!window.__mocks)
  7  |   await page.evaluate(() => {
  8  |     localStorage.removeItem('auth')
  9  |     window.__mocks!.reset()
  10 |   })
  11 | }
  12 | 
  13 | async function fillLogin(page: Page, email: string, password: string) {
  14 |   await page.getByLabel('E-mail').fill(email)
  15 |   await page.getByLabel('Senha', { exact: true }).fill(password)
  16 |   await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  17 | }
  18 | 
  19 | const storedToken = (page: Page) =>
  20 |   page.evaluate(() => (JSON.parse(localStorage.getItem('auth') ?? 'null') as { token?: string } | null)?.token)
  21 | 
  22 | test.beforeEach(async ({ page }) => { await resetMocks(page) })
  23 | 
  24 | test('mostra erros de validação sem chamar o servidor', async ({ page }) => {
  25 |   await page.goto('/login')
  26 |   await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  27 |   await expect(page.getByText('E-mail inválido.')).toBeVisible()
  28 |   await expect(page.getByText('Informe sua senha.')).toBeVisible()
  29 | })
  30 | 
  31 | test('senha errada mostra erro geral e não cria sessão', async ({ page }) => {
  32 |   await page.goto('/login')
  33 |   await fillLogin(page, 'ana@example.com', 'errada123')
  34 |   await expect(page.getByRole('alert').filter({ hasText: 'E-mail ou senha incorretos.' })).toBeVisible()
  35 |   expect(await storedToken(page)).toBeUndefined()
  36 | })
  37 | 
  38 | test('login volta para o NFT do ?redirect=', async ({ page }) => {
  39 |   await page.goto('/login?redirect=/nft/nft-1')
  40 |   await fillLogin(page, 'ana@example.com', 'Senha@123')
  41 |   await expect(page).toHaveURL(/\/nft\/nft-1$/)
  42 |   expect(await storedToken(page)).toBeTruthy()
  43 | })
  44 | 
  45 | test('a sessão sobrevive ao F5', async ({ page }) => {
  46 |   await page.goto('/login')
  47 |   await fillLogin(page, 'ana@example.com', 'Senha@123')
  48 |   await expect(page).toHaveURL(/\/$/)
  49 |   const token = await storedToken(page)
  50 |   await page.reload()
  51 |   await page.waitForTimeout(500)
  52 |   expect(await storedToken(page)).toBe(token)
  53 | })
  54 | 
  55 | test('?redirect= externo é ignorado', async ({ page }) => {
  56 |   await page.goto('/login?redirect=//evil.example')
  57 |   await fillLogin(page, 'bruno@example.com', 'Senha@456')
  58 |   await expect(page).toHaveURL(/\/$/)
  59 | })
  60 | 
  61 | test('cadastro cria conta e entra', async ({ page }) => {
  62 |   await page.goto('/signup')
  63 |   await page.getByLabel('Nome').fill('Carla Dias')
  64 |   await page.getByLabel('E-mail').fill('carla@example.com')
  65 |   await page.getByLabel('Senha', { exact: true }).fill('Senha@789')
  66 |   await page.getByRole('button', { name: 'Criar conta', exact: true }).click()
  67 |   await expect(page).toHaveURL(/\/$/)
  68 |   expect(await storedToken(page)).toBeTruthy()
  69 | })
  70 | 
  71 | test('e-mail já cadastrado aparece no campo (409)', async ({ page }) => {
  72 |   await page.goto('/signup')
  73 |   await page.getByLabel('Nome').fill('Outra Ana')
  74 |   await page.getByLabel('E-mail').fill('ana@example.com')
  75 |   await page.getByLabel('Senha', { exact: true }).fill('Senha@789')
  76 |   await page.getByRole('button', { name: 'Criar conta', exact: true }).click()
  77 |   await expect(page.getByText('Este e-mail já está cadastrado.')).toBeVisible()
  78 |   await expect(page).toHaveURL(/\/signup/)
  79 | })
  80 | 
  81 | test('cenário session-expired derruba a sessão no F5', async ({ page }) => {
  82 |   await page.goto('/login')
  83 |   await fillLogin(page, 'ana@example.com', 'Senha@123')
  84 |   await expect(page).toHaveURL(/\/$/)
  85 |   await page.evaluate(() => window.__mocks!.setScenario('session-expired'))
  86 |   await page.reload()
  87 |   await expect.poll(() => storedToken(page)).toBeUndefined()
  88 | })
  89 | 
```