import { describe, expect, it, vi } from 'vitest'

import { ODataSapGateway } from './sap-gateway.js'

const payload = {
  internalCode: 'FJ-TEST-001',
  description: 'Motor de contrato OData',
  category: 'Motores',
  manufacturer: 'Forja Industrial',
  manufacturerPartNumber: 'M-001',
  baseUnit: 'UN',
  attributes: { POWER: 7.5 },
}

describe.each(['odata-v2', 'odata-v4'] as const)('SAP %s contract', (mode) => {
  it('obtiene CSRF, crea, lee y actualiza con ETag sin exponer credenciales', async () => {
    let created = false
    const requests: Array<{ url: string; method: string; headers: Headers }> = []
    const fakeFetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method ?? 'GET'
      const headers = new Headers(init?.headers)
      requests.push({ url, method, headers })
      if (headers.get('x-csrf-token') === 'fetch') {
        return new Response(JSON.stringify({ value: [] }), {
          status: 200,
          headers: { 'x-csrf-token': 'csrf-token', 'set-cookie': 'SAPSESSION=abc; Secure' },
        })
      }
      if (method === 'POST') {
        created = true
        return Response.json({ Product: payload.internalCode }, { status: 201 })
      }
      if (method === 'PATCH') {
        expect(headers.get('if-match')).toBe('"v1"')
        return new Response(null, { status: 204 })
      }
      if (url.includes('$metadata')) return new Response('<xml/>', { status: 200 })
      if (created) {
        return Response.json(
          { Product: payload.internalCode, Manufacturer: payload.manufacturer, BaseUnit: 'UN' },
          { headers: { etag: '"v1"' } },
        )
      }
      return Response.json({ error: { code: 'NOT_FOUND', message: 'Missing' } }, { status: 404 })
    })
    const gateway = new ODataSapGateway({
      mode,
      baseUrl: 'https://sap.example.test',
      productPath: mode === 'odata-v2' ? '/v2/A_Product' : '/v4/Product',
      apiKey: 'contract-secret',
      apiKeyHeader: 'APIKey',
      productType: 'ROH',
      industrySector: 'M',
      language: 'EN',
      timeoutMs: 5_000,
      fetch: fakeFetch as typeof fetch,
    })

    await expect(gateway.validateProduct(payload)).resolves.toEqual({ valid: true, errors: [] })
    const creation = await gateway.createProduct(payload)
    expect(creation).toEqual(expect.objectContaining({ success: true, httpStatus: 201 }))
    await expect(gateway.findProduct(payload.internalCode)).resolves.toEqual(
      expect.objectContaining({ id: payload.internalCode }),
    )
    await expect(gateway.updateProduct(payload.internalCode, payload)).resolves.toEqual(
      expect.objectContaining({ success: true, httpStatus: 204 }),
    )
    expect(requests.some((request) => request.headers.get('x-csrf-token') === 'csrf-token')).toBe(
      true,
    )
    expect(JSON.stringify(requests)).not.toContain('contract-secret')
  })
})
