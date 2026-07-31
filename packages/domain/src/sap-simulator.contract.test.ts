import { describe, expect, it } from 'vitest'

import type { SapProductGateway } from './providers'
import { SapSimulatorGateway } from './sap-simulator'

const payload = {
  internalCode: 'FJ-TEST-001',
  description: 'Motor sintético de contrato',
  category: 'Motores eléctricos',
  manufacturer: 'Forja Industrial',
  manufacturerPartNumber: 'DEMO-001',
  baseUnit: 'UN',
  attributes: { POWER: 7.5 },
}

function exerciseSapContract(createGateway: () => SapProductGateway): void {
  describe('SapProductGateway contract', () => {
    it('validates, creates, reads and updates a product', async () => {
      const gateway = createGateway()
      await expect(gateway.validateProduct(payload)).resolves.toEqual({
        valid: true,
        errors: [],
      })
      const creation = await gateway.createProduct(payload)
      expect(creation.success).toBe(true)
      expect(creation.productId).toBeTruthy()
      if (!creation.productId) throw new Error('El contrato exige productId en éxito.')
      await expect(gateway.findProduct(creation.productId)).resolves.toEqual(
        expect.objectContaining({ id: creation.productId }),
      )
      await expect(
        gateway.updateProduct(creation.productId, {
          ...payload,
          description: 'Motor sintético actualizado',
        }),
      ).resolves.toEqual(expect.objectContaining({ success: true, httpStatus: 200 }))
    })

    it('reports validation errors without throwing', async () => {
      const gateway = createGateway()
      const result = await gateway.validateProduct({
        ...payload,
        description: '',
      })
      expect(result.valid).toBe(false)
      expect(result.errors[0]?.field).toBe('description')
    })
  })
}

exerciseSapContract(() => new SapSimulatorGateway())

describe('SapSimulatorGateway failure injection', () => {
  it('fails once and succeeds on retry', async () => {
    const gateway = new SapSimulatorGateway({
      failFirstForCodes: [payload.internalCode],
    })
    await expect(gateway.createProduct(payload)).resolves.toEqual(
      expect.objectContaining({
        success: false,
        errorCode: 'SIMULATED_TEMPORARY_FAILURE',
      }),
    )
    await expect(gateway.createProduct(payload)).resolves.toEqual(
      expect.objectContaining({ success: true }),
    )
  })
})
