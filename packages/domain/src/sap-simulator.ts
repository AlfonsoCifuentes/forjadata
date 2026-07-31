import type { IntegrationHealth, SapProductPayload } from '@forjadata/contracts'

import type {
  SapOperationResult,
  SapProduct,
  SapProductGateway,
  SapValidationResult,
} from './providers'

export interface SapSimulatorOptions {
  latencyMs?: number
  failFirstForCodes?: readonly string[]
}

export class SapSimulatorGateway implements SapProductGateway {
  readonly adapter = 'simulator' as const
  private readonly products = new Map<string, SapProduct>()
  private readonly attempts = new Map<string, number>()

  constructor(private readonly options: SapSimulatorOptions = {}) {}

  async findProduct(productId: string): Promise<SapProduct | null> {
    await this.delay()
    return this.products.get(productId) ?? null
  }

  async createProduct(input: SapProductPayload): Promise<SapOperationResult> {
    const startedAt = Date.now()
    await this.delay()
    const validation = await this.validateProduct(input)
    if (!validation.valid) {
      return {
        success: false,
        productId: null,
        httpStatus: 422,
        errorCode: 'SAP_VALIDATION_ERROR',
        errorMessage: validation.errors.map((error) => error.message).join(' '),
        durationMs: Date.now() - startedAt,
      }
    }

    const attempt = (this.attempts.get(input.internalCode) ?? 0) + 1
    this.attempts.set(input.internalCode, attempt)
    if (this.options.failFirstForCodes?.includes(input.internalCode) && attempt === 1) {
      return {
        success: false,
        productId: null,
        httpStatus: 503,
        errorCode: 'SIMULATED_TEMPORARY_FAILURE',
        errorMessage: 'Fallo temporal inyectado por SAP Simulator.',
        durationMs: Date.now() - startedAt,
      }
    }

    const productId = `SAP-${input.internalCode}`
    this.products.set(productId, { id: productId, payload: structuredClone(input) })
    return {
      success: true,
      productId,
      httpStatus: 201,
      errorCode: null,
      errorMessage: null,
      durationMs: Date.now() - startedAt,
    }
  }

  async updateProduct(productId: string, input: SapProductPayload): Promise<SapOperationResult> {
    const startedAt = Date.now()
    await this.delay()
    if (!this.products.has(productId)) {
      return {
        success: false,
        productId: null,
        httpStatus: 404,
        errorCode: 'PRODUCT_NOT_FOUND',
        errorMessage: `El producto ${productId} no existe en SAP Simulator.`,
        durationMs: Date.now() - startedAt,
      }
    }
    this.products.set(productId, { id: productId, payload: structuredClone(input) })
    return {
      success: true,
      productId,
      httpStatus: 200,
      errorCode: null,
      errorMessage: null,
      durationMs: Date.now() - startedAt,
    }
  }

  async validateProduct(input: SapProductPayload): Promise<SapValidationResult> {
    const errors: SapValidationResult['errors'] = []
    if (input.description.trim().length === 0) {
      errors.push({ field: 'description', message: 'La descripción SAP es obligatoria.' })
    }
    if (input.baseUnit.trim().length === 0) {
      errors.push({ field: 'baseUnit', message: 'La unidad base SAP es obligatoria.' })
    }
    if (input.manufacturer.trim().length === 0) {
      errors.push({ field: 'manufacturer', message: 'El fabricante SAP es obligatorio.' })
    }
    return { valid: errors.length === 0, errors }
  }

  async healthCheck(): Promise<IntegrationHealth> {
    return {
      name: 'SAP Simulator',
      mode: 'simulator',
      status: 'healthy',
      checkedAt: new Date().toISOString(),
      message: 'Simulador determinista activo; no conectado a SAP.',
    }
  }

  private async delay(): Promise<void> {
    const latencyMs = this.options.latencyMs ?? 0
    if (latencyMs > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, latencyMs))
    }
  }
}
