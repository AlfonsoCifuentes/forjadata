import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { buildSapSimulator } from './app'

const payload = {
  internalCode: 'FJ-HTTP-001',
  description: 'Motor sintético HTTP',
  category: 'Motores eléctricos',
  manufacturer: 'Forja Industrial',
  manufacturerPartNumber: 'DEMO-HTTP',
  baseUnit: 'UN',
  attributes: { POWER: 7.5 },
}

describe('SAP Simulator HTTP contract', () => {
  let app: Awaited<ReturnType<typeof buildSapSimulator>>

  beforeEach(async () => {
    app = await buildSapSimulator()
  })

  afterEach(async () => {
    await app.close()
  })

  it('validates, creates and reads a product', async () => {
    const validation = await app.inject({
      method: 'POST',
      url: '/odata/v4/products/validate',
      payload,
    })
    expect(validation.statusCode).toBe(200)

    const creation = await app.inject({
      method: 'POST',
      url: '/odata/v4/products',
      payload,
      headers: { 'x-correlation-id': 'contract-test' },
    })
    expect(creation.statusCode).toBe(201)
    const body = creation.json<{ productId: string }>()

    const reading = await app.inject({
      method: 'GET',
      url: `/odata/v4/products/${body.productId}`,
    })
    expect(reading.statusCode).toBe(200)
    expect(reading.json()).toEqual(
      expect.objectContaining({
        id: body.productId,
        payload: expect.objectContaining({ internalCode: payload.internalCode }),
      }),
    )
  })

  it('returns a normalized retryable error only when explicitly requested', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/odata/v4/products',
      payload,
      headers: { 'x-forjadata-simulate-error': 'transient' },
    })
    expect(response.statusCode).toBe(503)
    expect(response.json()).toEqual({
      error: expect.objectContaining({
        code: 'SIMULATED_TEMPORARY_FAILURE',
        retryable: true,
      }),
    })
  })

  it('rejects invalid payloads', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/odata/v4/products',
      payload: { description: '' },
    })
    expect(response.statusCode).toBe(422)
  })
})
