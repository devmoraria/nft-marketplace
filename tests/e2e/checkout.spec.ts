import { expect, test, type Page } from '@playwright/test'

async function resetMocks(page: Page) {
  await page.goto('/')
  await page.waitForFunction(() => !!window.__mocks)
  await page.evaluate(() => {
    localStorage.removeItem('auth')
    sessionStorage.clear()
    window.__mocks!.reset()
  })
}

async function login(page: Page, redirect?: string) {
  await page.goto(redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login')
  await page.getByLabel('E-mail').fill('ana@example.com')
  await page.getByLabel('Senha', { exact: true }).fill('Senha@123')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
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
const confirmar = (page: Page) => page.getByRole('button', { name: 'Confirmar compra' })
const itemTitle = (page: Page) => page.getByText('Emerald Ape #042').filter({ visible: true }).first()

async function goToCheckout(page: Page) {
  await addNft1(page)
  await expect(finalizar(page)).not.toHaveAttribute('aria-disabled', 'true', { timeout: 10_000 })
  await finalizar(page).click()
  await expect(page).toHaveURL(/\/checkout/)
}

async function fillCollector(page: Page) {
  await page.getByLabel('Nome de exibição').fill('Ana Teste')
  await page.getByLabel('E-mail', { exact: false }).fill('ana@example.com')
  await expect(page.getByRole('radio').first()).toBeChecked()
}

// force: o resumo (aria-live) re-renderiza durante a cotação e o Playwright acusa
// "intercepts pointer events"; o botão não fica coberto na tela (verificado com elementFromPoint).
async function submitOrder(page: Page, opts: { double?: boolean } = {}) {
  await expect(confirmar(page)).not.toHaveAttribute('aria-disabled', 'true', { timeout: 10_000 })
  if (opts.double) await confirmar(page).dblclick({ force: true })
  else await confirmar(page).click({ force: true })
}

test.beforeEach(async ({ page }) => {
  await resetMocks(page)
})

test('detalhe de NFT inexistente mostra mensagem', async ({ page }) => {
  await page.goto('/nft/nft-9999')
  await expect(page.getByRole('alert')).toContainText('NFT não encontrado.')
})

test('limite de quantidade: edição 1/1 não deixa aumentar', async ({ page }) => {
  await page.goto('/nft/nft-1')
  await page.getByRole('radio', { name: '1/1', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Aumentar quantidade' }).filter({ visible: true })).toHaveAttribute('aria-disabled', 'true')
})

test('carrinho: altera quantidade, mantém após refresh e remove o item', async ({ page }) => {
  await addNft1(page)
  await expect(itemTitle(page)).toBeVisible()

  await page.getByRole('button', { name: 'Aumentar quantidade' }).filter({ visible: true }).click()
  await expect(page.getByText('2.38 ETH').filter({ visible: true }).first()).toBeVisible()

  await page.reload()
  await expect(itemTitle(page)).toBeVisible()
  await expect(page.getByText('2.38 ETH').filter({ visible: true }).first()).toBeVisible()

  await page.getByRole('button', { name: 'Remover Emerald Ape #042' }).filter({ visible: true }).click()
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
})

test('cupom inválido mostra mensagem de erro', async ({ page }) => {
  await addNft1(page)
  await page.getByRole('textbox', { name: 'Código promocional' }).fill('NAOEXISTE')
  await page.getByRole('button', { name: 'Aplicar' }).filter({ visible: true }).click()
  await expect(page.getByRole('status').filter({ hasText: /inválido|expirou/ })).toBeVisible()
})

test('itens do visitante são preservados ao autenticar', async ({ page }) => {
  await addNft1(page)
  await login(page, '/cart')
  await expect(page).toHaveURL(/\/cart/)
  await expect(itemTitle(page)).toBeVisible()
})

test('checkout exige sessão', async ({ page }) => {
  await page.goto('/checkout')
  await expect
    .poll(async () => /\/login/.test(page.url()) || (await page.getByText('Entre na sua conta para finalizar a compra.').isVisible()))
    .toBe(true)
})

test('checkout valida os campos antes de enviar', async ({ page }) => {
  await login(page)
  await expect(page).toHaveURL(/\/$/)
  await goToCheckout(page)
  await expect(confirmar(page)).not.toHaveAttribute('aria-disabled', 'true', { timeout: 10_000 })
  await confirmar(page).click({ force: true })
  await expect(page.getByText('Informe seu nome de exibição.')).toBeVisible()
  await expect(page.getByText('Informe um e-mail válido.')).toBeVisible()
  await expect(page).toHaveURL(/\/checkout/)
})

test('compra completa: catálogo, carrinho, checkout e recibo confirmado', async ({ page }) => {
  await login(page)
  await expect(page).toHaveURL(/\/$/)
  await goToCheckout(page)
  await fillCollector(page)
  await submitOrder(page)

  await expect(page).toHaveURL(/\/orders\/ord-/)
  await expect(page.getByRole('heading', { name: /Processando seu pagamento/ })).toBeVisible()

  await page.evaluate(() => window.__mocks!.resolveOrder(undefined, 'confirmed'))
  await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible()
  await expect(page.getByText(/Emerald Ape #042/)).toBeVisible()
  await expect(page.getByText('Total')).toBeVisible()

  // após confirmar, o carrinho fica sem os itens comprados
  await page.goto('/cart')
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
})

test('pagamento recusado mostra o resultado e preserva o carrinho', async ({ page }) => {
  await login(page)
  await expect(page).toHaveURL(/\/$/)
  await goToCheckout(page)
  await fillCollector(page)
  await submitOrder(page)
  await expect(page).toHaveURL(/\/orders\/ord-/)

  await page.evaluate(() => window.__mocks!.resolveOrder(undefined, 'rejected'))
  await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible()

  await page.goto('/cart')
  await expect(itemTitle(page)).toBeVisible()
})

test('clique repetido cria um único pedido', async ({ page }) => {
  await login(page)
  await expect(page).toHaveURL(/\/$/)
  await goToCheckout(page)
  await fillCollector(page)

  let posts = 0
  page.on('request', (r) => {
    if (r.method() === 'POST' && new URL(r.url()).pathname === '/api/orders') posts++
  })
  await submitOrder(page, { double: true })
  await expect(page).toHaveURL(/\/orders\/ord-/)
  expect(posts).toBe(1)
})

test('timeout na criação do pedido: nova tentativa recupera o mesmo pedido', async ({ page }) => {
  test.setTimeout(90_000)
  await login(page)
  await expect(page).toHaveURL(/\/$/)
  await goToCheckout(page)
  await fillCollector(page)
  await expect(confirmar(page)).not.toHaveAttribute('aria-disabled', 'true', { timeout: 10_000 })

  await page.evaluate(() => window.__mocks!.setScenario('order-timeout'))
  await confirmar(page).click({ force: true })

  // Ou o pedido já abre, ou aparece o erro de criação; nos dois casos a nova tentativa usa a mesma chave.
  await expect
    .poll(
      async () =>
        /\/orders\/ord-/.test(page.url()) ||
        (await page.getByRole('alert').filter({ hasText: /Não foi possível criar o pedido/ }).isVisible()),
      { timeout: 60_000 },
    )
    .toBe(true)

  if (!/\/orders\/ord-/.test(page.url())) {
    await page.evaluate(() => window.__mocks!.setScenario('default'))
    await confirmar(page).click({ force: true })
  }
  await expect(page).toHaveURL(/\/orders\/ord-/)
  await expect(page.getByText(/Pedido ord-/)).toBeVisible()
})