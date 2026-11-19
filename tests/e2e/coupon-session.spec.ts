import { expect, test, type Page } from '@playwright/test'

// Cupom (válido, expirado, remoção), troca de usuário sem vazamento de dados privados
// e operação do login só pelo teclado.

const ANA = { email: 'ana@example.com', password: 'Senha@123' }
const BRUNO = { email: 'bruno@example.com', password: 'Senha@456' }

async function resetMocks(page: Page) {
  await page.goto('/')
  await page.waitForFunction(() => !!window.__mocks)
  await page.evaluate(() => {
    localStorage.removeItem('auth')
    sessionStorage.clear()
    window.__mocks!.reset()
  })
}

async function fillLogin(page: Page, user: { email: string; password: string }) {
  await page.getByLabel('E-mail').fill(user.email)
  await page.getByLabel('Senha', { exact: true }).fill(user.password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).not.toHaveURL(/\/login/)
}

async function login(page: Page, user = ANA) {
  await page.goto('/login')
  await fillLogin(page, user)
}

// Desktop: "COMPRAR". Mobile: "Comprar NFT". Termina em /cart.
async function addNft1(page: Page) {
  await page.goto('/nft/nft-1')
  const added = page.waitForResponse(
    (r) => r.url().includes('/api/cart/items') && r.request().method() === 'POST',
  )
  await page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).click()
  await added
  await expect(page).toHaveURL(/\/cart/)
}

const finalizar = (page: Page) => page.getByRole('button', { name: 'Conectar e finalizar' })
const couponInput = (page: Page) => page.getByRole('textbox', { name: 'Código promocional' })
const applyButton = (page: Page) => page.getByRole('button', { name: 'Aplicar', exact: true })
const visible = (page: Page, text: string | RegExp) =>
  page.getByText(text).filter({ visible: true }).first()
const zeroDiscount = (page: Page) => page.getByText('(-) 00.00').filter({ visible: true })

async function cartReady(page: Page) {
  await addNft1(page)
  await expect(finalizar(page)).not.toHaveAttribute('aria-disabled', 'true', { timeout: 10_000 })
}

async function applyCoupon(page: Page, code: string) {
  await couponInput(page).fill(code)
  await applyButton(page).click()
}

test.beforeEach(async ({ page }) => {
  await resetMocks(page)
})

test('cupom válido aplica o desconto e acompanha o usuário ao checkout', async ({ page }) => {
  await login(page)
  await cartReady(page)
  await applyCoupon(page, 'WELCOME10')
  await expect(visible(page, 'Cupom WELCOME10 aplicado.')).toBeVisible()
  await expect(zeroDiscount(page)).toHaveCount(0)

  await finalizar(page).click()
  await expect(page).toHaveURL(/\/checkout\?coupon=WELCOME10/)
})

test('cupom expirado mostra a mensagem e não dá desconto', async ({ page }) => {
  await login(page)
  await cartReady(page)
  await applyCoupon(page, 'EXPIRED20')
  await expect(visible(page, 'Este cupom expirou.')).toBeVisible()
  await expect(zeroDiscount(page).first()).toBeVisible()
})

test('cupom: aplicar o campo vazio remove o desconto', async ({ page }) => {
  await login(page)
  await cartReady(page)
  await applyCoupon(page, 'WELCOME10')
  await expect(visible(page, 'Cupom WELCOME10 aplicado.')).toBeVisible()

  await couponInput(page).fill('')
  await applyButton(page).click()
  await expect(page.getByText('Cupom WELCOME10 aplicado.').filter({ visible: true })).toHaveCount(0)
  await expect(zeroDiscount(page).first()).toBeVisible()
})

test('troca de usuário: o carrinho da Ana não aparece para o Bruno', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'usa os links do header desktop')
  await login(page, ANA)
  await cartReady(page)

  await page.getByRole('button', { name: 'Sair' }).first().click()
  // Daqui em diante só navegação pelo cliente (sem recarregar a página):
  // se o cache da sessão anterior não fosse limpo, o carrinho da Ana apareceria.
  await page.getByRole('link', { name: 'Entrar' }).first().click()
  await fillLogin(page, BRUNO)
  await page.getByRole('link', { name: 'Carrinho' }).first().click()
  await expect(page).toHaveURL(/\/cart/)

  const aria = await finalizar(page)
    .getAttribute('aria-disabled', { timeout: 2000 })
    .catch(() => 'true')
  expect(aria).not.toBe('false')
})

test('login operável só pelo teclado', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('E-mail').focus()
  await page.keyboard.type(ANA.email)
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Senha', { exact: true })).toBeFocused()
  await page.keyboard.type(ANA.password)
  await page.keyboard.press('Enter')
  await expect(page).not.toHaveURL(/\/login/)
})
