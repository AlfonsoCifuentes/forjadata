import { DemoEngine } from '@forjadata/domain'

const endpoint = process.env.FORJADATA_API_URL ?? 'http://localhost:7071/api/v1/admin/demo/reset'

try {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-demo-role': 'admin',
    },
    body: '{}',
    signal: AbortSignal.timeout(2_000),
  })
  if (!response.ok) {
    throw new Error(`API respondió ${response.status}.`)
  }
  console.info(`Dataset demo restablecido mediante ${endpoint}.`)
} catch {
  const snapshot = new DemoEngine().getSnapshot()
  console.info(
    `La API no está activa. El siguiente arranque usará el seed determinista: ${snapshot.materials.length} materiales y ${snapshot.requests.length} solicitudes.`,
  )
  console.info('Para limpiar también el navegador usa “Restablecer datos demo” en Administración.')
}
