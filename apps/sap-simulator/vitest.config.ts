import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // El arranque en frío de Fastify compite con las suites de `api` y `web`
    // cuando `pnpm test` las ejecuta en paralelo, así que el presupuesto por
    // defecto de 10 s resulta insuficiente en Windows y en CI.
    hookTimeout: 30_000,
    testTimeout: 30_000,
    env: {
      LOG_LEVEL: 'silent',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/server.ts'],
    },
  },
})
