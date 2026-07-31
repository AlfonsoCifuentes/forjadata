import { buildSapSimulator } from './app'

const port = Number.parseInt(process.env.SAP_SIMULATOR_PORT ?? '7072', 10)
const app = await buildSapSimulator()

try {
  await app.listen({ port, host: '0.0.0.0' })
} catch (error) {
  app.log.error(error)
  process.exit(1)
}
