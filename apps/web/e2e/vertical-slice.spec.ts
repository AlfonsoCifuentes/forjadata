import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.reload()
})

test('completa la vertical slice de solicitud a SAP Simulator', async ({ page }) => {
  await page.getByRole('link', { name: /Explorar la demo/i }).click()
  await page.getByRole('radio', { name: /Data Steward/i }).check()
  await page.getByRole('button', { name: /Entrar como Data Steward/i }).click()
  await expect(page.getByRole('heading', { name: /Buenos días, Diego/i })).toBeVisible()

  await page.goto('/app/requests/new')
  await page.getByRole('button', { name: /Crear borrador/i }).click()
  await expect(page.getByRole('heading', { name: /Motor Siemens/i })).toBeVisible()

  await page.getByRole('button', { name: /Enviar y procesar/i }).click()
  await expect(page.getByText(/Pipeline mock completado/i)).toBeVisible()

  await page.getByRole('button', { name: /Aceptar todas/i }).click()
  await page.getByRole('button', { name: /No es duplicado/i }).click()
  await page.getByRole('button', { name: /^Aprobar$/i }).click()

  await expect(page.getByText(/Solicitud aprobada.*preparad/i)).toBeVisible()
  await page.getByRole('button', { name: /Cambiar a Especialista SAP/i }).click()
  await page.getByRole('button', { name: /^Sincronizar$/i }).click()

  await expect(page.getByText(/SAP Simulator creó SAP-/i)).toBeVisible()
  await expect(page.getByText('Sincronizada').first()).toBeVisible()
})

test('@a11y no presenta violaciones WCAG A/AA en el acceso demo', async ({ page }) => {
  await page.getByRole('link', { name: /Explorar la demo/i }).click()

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  expect(results.violations).toEqual([])
})

test('mantiene el recorrido principal en inglés al cambiar de idioma', async ({ page }) => {
  await page.getByRole('button', { name: 'Cambiar a inglés' }).click()

  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(
    page.getByRole('heading', { name: 'Turn raw information into trusted master data.' }),
  ).toBeVisible()
  await page.getByRole('link', { name: /Explore the demo/i }).click()
  await expect(page.getByRole('heading', { name: 'Which role do you want to try?' })).toBeVisible()

  await page.getByRole('radio', { name: /Data Steward/i }).check()
  await page.getByRole('button', { name: /Enter as Data Steward/i }).click()
  await expect(page.getByRole('heading', { name: /Good morning, Diego/i })).toBeVisible()
  await expect(page.getByText('Requests created', { exact: true })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible()
})

test('ejecuta UAT, adjunta evidencia demo, firma y audita el resultado', async ({ page }) => {
  await page.getByRole('link', { name: /Explorar la demo/i }).click()
  await page.getByRole('radio', { name: /Tester UAT/i }).check()
  await page.getByRole('button', { name: /Entrar como Tester UAT/i }).click()
  await page.goto('/app/uat')

  const scenario = page.locator('.uat-row').filter({ hasText: 'UAT-007' })
  await scenario
    .getByRole('textbox', { name: /Comentario para UAT-007/i })
    .fill('Aprobación validada mediante el recorrido E2E.')
  await scenario.getByRole('button', { name: /Ejecutar/i }).click()
  await expect(scenario.getByText('PASSED', { exact: true })).toBeVisible()
  await scenario.getByRole('button', { name: /Evidencia/i }).click()
  await scenario.getByRole('button', { name: /Firmar/i }).click()
  await expect(page.getByText('APPROVED', { exact: true }).first()).toBeVisible()

  await page.goto('/app/audit')
  await expect(page.getByText('uat.sign_off', { exact: true }).first()).toBeVisible()
})

test('construye y prueba reglas de calidad como administrador', async ({ page }) => {
  await page.getByRole('link', { name: /Explorar la demo/i }).click()
  await page.getByRole('radio', { name: /Administrador/i }).check()
  await page.getByRole('button', { name: /Entrar como Administrador/i }).click()
  await page.goto('/app/admin/rules')

  await expect(page.getByRole('heading', { name: 'Reglas de calidad' })).toBeVisible()
  await page.getByRole('button', { name: /Potencia de motor plausible/i }).click()
  await expect(page.getByRole('heading', { name: 'Potencia de motor plausible' })).toBeVisible()
  await page.getByLabel('Severidad').selectOption('ERROR')
  await page.getByRole('button', { name: /Guardar versión/i }).click()
  await expect(page.getByText('MOTOR_POWER_RANGE · v2')).toBeVisible()
  await page.getByRole('button', { name: /Probar con FJ-000241/i }).click()
  await expect(page.getByText('Resultado: PASS')).toBeVisible()
})

test('mantiene la ficha operativa si WebGL o el modelo 3D no están disponibles', async ({
  page,
}) => {
  await page.route('**/models/forjadata-industrial-motor.gltf', (route) => route.abort())
  await page.getByRole('link', { name: /Explorar la demo/i }).click()
  await page.getByRole('radio', { name: /Data Steward/i }).check()
  await page.getByRole('button', { name: /Entrar como Data Steward/i }).click()
  await page.goto('/app/materials/mat-motor-review')

  await expect(page.getByRole('heading', { name: /Motor trifásico/i })).toBeVisible()
  await expect(page.getByRole('img', { name: 'Vista 2D de un motor industrial' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Atributos gobernados' })).toBeVisible()
})

test('guía el recorrido, permite saltarlo y conserva la preferencia', async ({ page }) => {
  await page.getByRole('link', { name: /Explorar la demo/i }).click()
  await page.getByRole('radio', { name: /Data Steward/i }).check()
  await page.getByRole('button', { name: /Entrar como Data Steward/i }).click()
  await page.goto('/app/help')

  await page.getByRole('button', { name: 'Iniciar recorrido' }).click()
  const tour = page.getByRole('dialog', { name: 'Recorrido guiado' })
  await expect(tour.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  await expect(page).toHaveURL(/\/app\/dashboard$/)

  await tour.getByRole('button', { name: 'Siguiente' }).click()
  await expect(tour.getByRole('heading', { name: 'Catálogo' })).toBeVisible()
  await expect(page).toHaveURL(/\/app\/materials$/)

  await tour.getByRole('button', { name: 'Saltar recorrido' }).click()
  await expect(tour).toBeHidden()
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('forjadata-tour-status')))
    .toBe('skipped')

  await page.goto('/app/help')
  await page.getByRole('button', { name: 'Reiniciar recorrido' }).click()
  await expect(tour.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  await tour.getByRole('button', { name: 'Cerrar recorrido' }).click()
  await expect(tour).toBeHidden()
})
