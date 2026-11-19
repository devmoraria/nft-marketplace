import { expect, test, type Page } from '@playwright/test'

async function reset(page: Page) {
  await page.goto('/')
  await page.waitForFunction(() => !!window.__mocks)
  await page.evaluate(() => { localStorage.removeItem('auth'); sessionStorage.clear(); window.__mocks!.reset() })
}
async function login(page: Page, password = 'Senha@123') {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill('ana@example.com')
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
}
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')

test.beforeEach(async ({ page }) => { await reset(page) })

test('perfil: valida campos e persiste após refresh', async ({ page }) => {
  await login(page)
  await page.goto('/perfil')
  await page.getByLabel('Nome').fill('')
  await page.getByLabel('E-mail').fill('invalido')
  await page.getByRole('button', { name: 'Salvar perfil' }).click()
  await expect(page.getByText('Informe seu nome.')).toBeVisible()
  await expect(page.getByText('E-mail inválido.')).toBeVisible()

  await page.getByLabel('Nome').fill('Ana Atualizada')
  await page.getByLabel('E-mail').fill('ana@example.com')
  await page.getByRole('button', { name: 'Salvar perfil' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Perfil atualizado.' })).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Nome')).toHaveValue('Ana Atualizada')
})

test('perfil: avatar persiste após refresh', async ({ page }) => {
  await login(page)
  await page.goto('/perfil')
  await page.getByLabel('Foto de perfil').setInputFiles({ name: 'a.png', mimeType: 'image/png', buffer: PNG })
  await page.getByRole('button', { name: 'Salvar perfil' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Perfil atualizado.' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('img', { name: 'Avatar atual' })).toBeVisible()
})

test('senha: erro da API e troca com novo login', async ({ page }) => {
  await login(page)
  await page.goto('/perfil')
  await page.getByLabel('Senha atual').fill('errada123')
  await page.getByLabel('Nova senha').fill('Nova@12345')
  await page.getByRole('button', { name: 'Alterar senha' }).click()
  await expect(page.getByText('Senha atual incorreta.')).toBeVisible()

  await page.getByLabel('Senha atual').fill('Senha@123')
  await page.getByRole('button', { name: 'Alterar senha' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Senha alterada.' })).toBeVisible()

  await page.evaluate(() => { localStorage.removeItem('auth'); sessionStorage.clear() })
  await login(page, 'Nova@12345')
})

test('carteiras: erro de validação, cadastro e edição', async ({ page }) => {
  await login(page)
  await page.goto('/carteiras')
  await page.getByLabel('Apelido').fill('Cofre')
  await page.getByLabel('Endereço').fill('0x123')
  await page.getByRole('button', { name: 'Adicionar carteira' }).click()
  await expect(page.getByText('Endereço inválido para esta rede.')).toBeVisible()

  await page.getByLabel('Endereço').fill('0x' + 'ab'.repeat(20))
  await page.getByRole('button', { name: 'Adicionar carteira' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Carteira adicionada.' })).toBeVisible()
  await expect(page.getByText('Cofre')).toBeVisible()

  await page.getByRole('button', { name: 'Editar Cofre' }).click()
  await page.getByLabel('Apelido').fill('Cofre 2')
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Carteira atualizada.' })).toBeVisible()
  await page.reload()
  await expect(page.getByText('Cofre 2')).toBeVisible()
})

test('perfil e carteiras exigem sessão', async ({ page }) => {
  await page.goto('/perfil')
  await expect(page).toHaveURL(/\/login/)
  await page.goto('/carteiras')
  await expect(page).toHaveURL(/\/login/)
})
