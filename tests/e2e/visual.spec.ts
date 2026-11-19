import { expect, test, type Page } from '@playwright/test'

// Regressão visual: início, detalhe, carrinho e pagamento (desktop 1440 e mobile 390).
// Baselines versionadas em tests/e2e/__screenshots__/ (ver snapshotPathTemplate no playwright.config.ts).

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

// "Comprar" adiciona e leva ao carrinho. Desktop: "COMPRAR". Mobile: "Comprar NFT".
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

// Deixa a página estável antes da captura: movimento reduzido, imagens lazy
// forçadas a carregar (fullPage não rola a página), fontes e imagens prontas.
async function stabilize(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.evaluate(() => {
    document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
      ;(img as HTMLImageElement).loading = 'eager'
    })
  })
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all(
      Array.from(document.images).map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.addEventListener('load', () => resolve(), { once: true })
              img.addEventListener('error', () => resolve(), { once: true })
            }),
      ),
    )
    window.scrollTo(0, 0)
  })
}

test.describe('regressão visual', () => {
  test('início', async ({ page }) => {
    await resetMocks(page)
    await page.goto('/')
    await expect(page.locator('article img').filter({ visible: true }).first()).toBeVisible()
    await stabilize(page)
    await expect(page).toHaveScreenshot('inicio.png', { fullPage: true })
  })

  test('detalhe do NFT', async ({ page }) => {
    await resetMocks(page)
    await page.goto('/nft/nft-1')
    await expect(
      page.getByRole('img', { name: 'Emerald Ape #042' }).filter({ visible: true }).first(),
    ).toBeVisible()
    await stabilize(page)
    await expect(page).toHaveScreenshot('detalhe.png', { fullPage: true })
  })

  test('carrinho', async ({ page }) => {
    await resetMocks(page)
    await login(page)
    await addNft1(page)
    await expect(page.getByText('Emerald Ape #042').filter({ visible: true }).first()).toBeVisible()
    await expect(finalizar(page)).not.toHaveAttribute('aria-disabled', 'true', { timeout: 10_000 })
    await stabilize(page)
    await expect(page).toHaveScreenshot('carrinho.png', { fullPage: true })
  })

  test('pagamento', async ({ page }) => {
    await resetMocks(page)
    await login(page)
    await addNft1(page)
    await expect(finalizar(page)).not.toHaveAttribute('aria-disabled', 'true', { timeout: 10_000 })
    await finalizar(page).click()
    await expect(page).toHaveURL(/\/checkout/)
    await expect(page.getByLabel('Nome de exibição')).toBeVisible()
    await stabilize(page)
    await expect(page).toHaveScreenshot('pagamento.png', { fullPage: true })
  })
})
