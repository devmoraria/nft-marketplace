import { expect, test, type Page } from '@playwright/test'

// Só para o editor: o tests/ não enxerga o declare global do src/mocks/controls.ts.
declare global {
  interface Window {
    __mocks?: {
      reset: () => void
      resolveOrder: (orderId?: string, outcome?: 'confirmed' | 'rejected') => string | null
      disconnectSocket: () => void
      replayLastEvent: () => boolean
      emitStale: () => boolean
      setNftPrice: (nftId: string, priceEth: string) => boolean
      setStock: (nftId: string, editionId: string, available: number) => boolean
    }
  }
}

async function resetMocks(page: Page) {
  await page.goto('/')
  await page.waitForFunction(() => !!window.__mocks)
  await page.evaluate(() => {
    localStorage.removeItem('auth')
    window.__mocks!.reset()
  })
}

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill('ana@example.com')
  await page.getByLabel('Senha', { exact: true }).fill('Senha@123')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
}

// Compra 1 item e fica em /orders/:id com o pedido ainda "Processando".
async function placeOrder(page: Page) {
  await page.goto('/nft/nft-1')
  const added = page.waitForResponse(
    (r) => r.url().includes('/api/cart/items') && r.request().method() === 'POST',
  )
  await page.getByRole('button', { name: 'COMPRAR', exact: true }).click()
  await added
  await page.goto('/checkout')
  await page.locator('#displayName').fill('Ana Souza')
  await page.locator('#email').fill('ana@example.com')
  await page.locator('input[name="wallet"]').first().check()
  const confirm = page.getByRole('button', { name: 'Confirmar compra' })
  await expect(confirm).toBeVisible()
  await expect(confirm).not.toHaveAttribute('aria-disabled', 'true', { timeout: 10_000 })
  await confirm.click()
  await expect(page).toHaveURL(/\/orders\/ord-/)
  await expect(page.getByText('Processando seu pagamento')).toBeVisible()
}

const resolveNow = (page: Page, outcome?: 'confirmed' | 'rejected') =>
  expect
    .poll(() => page.evaluate((o) => window.__mocks!.resolveOrder(undefined, o), outcome))
    .not.toBeNull()

test.beforeEach(async ({ page }) => {
  await resetMocks(page)
  await login(page)
})

test('o pedido sai de Processando por evento, sem esperar o polling', async ({ page }) => {
  await placeOrder(page)
  await resolveNow(page)
  // Com o socket conectado o polling é de 10 s, então 3 s só passa se veio pelo evento.
  await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible({ timeout: 3000 })
})

test('pagamento recusado chega por evento', async ({ page }) => {
  await placeOrder(page)
  await resolveNow(page, 'rejected')
  await expect(page.getByText(/recusad/i).first()).toBeVisible({ timeout: 3000 })
  await expect(page.getByText('Processando seu pagamento')).toHaveCount(0)
})

test('evento repetido ou antigo não muda a tela', async ({ page }) => {
  await placeOrder(page)
  await resolveNow(page)
  await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible({ timeout: 3000 })
  expect(await page.evaluate(() => window.__mocks!.replayLastEvent())).toBe(true)
  expect(await page.evaluate(() => window.__mocks!.emitStale())).toBe(true)
  await page.waitForTimeout(1500)
  await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible()
  await expect(page.getByText('Processando seu pagamento')).toHaveCount(0)
})

test('nft.updated atualiza o preço no detalhe', async ({ page }) => {
  await page.goto('/nft/nft-1')
  await expect(page.locator('p:visible', { hasText: '1.19 ETH' }).first()).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.__mocks!.setNftPrice('nft-1', '2.50'))).toBe(true)
  await expect(page.locator('p:visible', { hasText: '2.50 ETH' }).first()).toBeVisible({ timeout: 3000 })
})