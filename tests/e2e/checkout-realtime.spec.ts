import { expect, test, type Page } from '@playwright/test'

// Cenário central do tempo real (enunciado, seção 7): o preço de um NFT que está no
// carrinho muda durante a navegação, a interface avisa e o checkout não deixa
// confirmar a compra com a cotação desatualizada. O preço muda pelo socket (nft.updated).

async function resetMocks(page: Page) {
  await page.goto('/')
  await page.waitForFunction(() => !!window.__mocks)
  await page.evaluate(() => {
    localStorage.removeItem('auth')
    sessionStorage.clear()
    window.__mocks!.reset()
  })
}

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill('ana@example.com')
  await page.getByLabel('Senha', { exact: true }).fill('Senha@123')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).not.toHaveURL(/\/login/)
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

// Abre o checkout com 1 item, dados preenchidos e carteira escolhida.
async function openCheckoutReady(page: Page) {
  await addNft1(page)
  await page.goto('/checkout')
  await page.locator('#displayName').fill('Ana Souza')
  await page.locator('#email').fill('ana@example.com')
  await page.locator('input[name="wallet"]').first().check()
  const confirm = page.getByRole('button', { name: 'Confirmar compra' })
  await expect(confirm).toBeVisible()
  await expect(confirm).not.toHaveAttribute('aria-disabled', 'true', { timeout: 10_000 })
  return confirm
}

// O mock devolve false enquanto não há socket conectado; por isso o poll.
const changePrice = (page: Page, priceEth = '2.50') =>
  expect
    .poll(() => page.evaluate((p) => window.__mocks!.setNftPrice('nft-1', p), priceEth))
    .toBe(true)

const visible = (page: Page, text: string | RegExp) =>
  page.getByText(text).filter({ visible: true }).first()

test.beforeEach(async ({ page }) => {
  await resetMocks(page)
  await login(page)
})

test('carrinho: preço alterado por evento avisa o usuário', async ({ page }) => {
  await addNft1(page)
  await changePrice(page)
  await expect(visible(page, 'O preço de alguns NFTs mudou desde que você os adicionou.')).toBeVisible({
    timeout: 10_000,
  })
})

test('checkout: preço alterado por evento avisa e a compra não é confirmada', async ({ page }) => {
  const confirm = await openCheckoutReady(page)
  await changePrice(page)
  await expect(visible(page, /preço alterado ou indisponíveis/)).toBeVisible({ timeout: 10_000 })

  await confirm.click({ force: true })
  // Sem confirmação: segue no checkout e nenhum recibo é exibido.
  await page.waitForTimeout(1000)
  await expect(page).toHaveURL(/\/checkout/)
  await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toHaveCount(0)
})
