import { describe, expect, it } from 'vitest'

import { LocalMetrics, redactTelemetryAttributes } from './telemetry.js'

describe('telemetría local', () => {
  it('agrega volumen, errores y latencia sin conservar eventos individuales', () => {
    const metrics = new LocalMetrics()
    metrics.record({ method: 'get', path: '/health', status: 200, durationMs: 8 })
    metrics.record({ method: 'GET', path: '/health', status: 200, durationMs: 12 })
    metrics.record({ method: 'POST', path: '/requests', status: 422, durationMs: 5 })

    expect(metrics.snapshot(new Date('2026-07-30T10:00:00.000Z'))).toEqual({
      generatedAt: '2026-07-30T10:00:00.000Z',
      totalRequests: 3,
      errorRequests: 1,
      errorRate: 0.3333,
      routes: [
        {
          method: 'GET',
          path: '/health',
          status: 200,
          count: 2,
          averageDurationMs: 10,
          maxDurationMs: 12,
        },
        {
          method: 'POST',
          path: '/requests',
          status: 422,
          count: 1,
          averageDurationMs: 5,
          maxDurationMs: 5,
        },
      ],
    })
  })

  it('elimina secretos en atributos anidados', () => {
    expect(
      redactTelemetryAttributes({
        tenant: 'demo',
        Authorization: 'Bearer secreto',
        nested: [{ connection_string: 'postgres://secret', safe: true }],
      }),
    ).toEqual({
      tenant: 'demo',
      Authorization: '[REDACTED]',
      nested: [{ connection_string: '[REDACTED]', safe: true }],
    })
  })
})
