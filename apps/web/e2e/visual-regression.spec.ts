import { expect, test, type Page } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-07-30T09:30:00.000Z'))
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
    localStorage.setItem('forjadata-theme', 'light')
  })
  await enterDemo(page)
})

test('dashboard', async ({ page }) => {
  await page.goto('/app/dashboard')
  await expect(page.getByRole('heading', { name: /Buenos días, Diego/i })).toBeVisible()
  await expect(page).toHaveScreenshot('dashboard.png')
})

test('grid de materiales', async ({ page }) => {
  await page.goto('/app/materials')
  await expect(page.locator('.ag-root-wrapper')).toBeVisible()
  await expect(page).toHaveScreenshot('materials-grid.png')
})

test('detalle con visor 3D aislado', async ({ page }) => {
  await page.goto('/app/materials/mat-motor-review')
  await expect(page.getByRole('heading', { name: /Motor trifásico/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Modelo industrial/i })).toBeVisible()
  await expect(page).toHaveScreenshot('material-detail.png', {
    mask: [page.locator('.canvas-host')],
  })
})

test('formulario de solicitud', async ({ page }) => {
  await page.goto('/app/requests/new')
  await expect(page.getByRole('heading', { name: /Nueva solicitud/i })).toBeVisible()
  await expect(page).toHaveScreenshot('request-form.png')
})

test('comparación de duplicados', async ({ page }) => {
  await page.goto('/app/duplicates')
  await expect(page.getByRole('heading', { name: /Duplicados/i })).toBeVisible()
  await expect(page).toHaveScreenshot('duplicate-comparison.png')
})

test('dashboard en modo oscuro', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('forjadata-theme', 'dark'))
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page).toHaveScreenshot('dashboard-dark.png')
})

async function enterDemo(page: Page): Promise<void> {
  await page.goto('/demo')
  await page.getByRole('radio', { name: /Data Steward/i }).check()
  await page.getByRole('button', { name: /Entrar como Data Steward/i }).click()
  await expect(page).toHaveURL(/\/app\/dashboard/)
}
