import type { IntegrationHealth, SapProductPayload } from '@forjadata/contracts'
import type {
  SapOperationResult,
  SapProduct,
  SapProductGateway,
  SapValidationResult,
} from '@forjadata/domain'
import { SapSimulatorGateway } from '@forjadata/domain'

import type { AppConfig } from '../config.js'

type Fetch = typeof fetch

export class DisabledSapGateway implements SapProductGateway {
  readonly adapter = 'disabled' as const

  async findProduct(): Promise<SapProduct | null> {
    throw new Error('SAP OData está deshabilitado porque no hay un endpoint real configurado.')
  }

  async createProduct(): Promise<SapOperationResult> {
    throw new Error('SAP OData está deshabilitado porque no hay un endpoint real configurado.')
  }

  async updateProduct(): Promise<SapOperationResult> {
    throw new Error('SAP OData está deshabilitado porque no hay un endpoint real configurado.')
  }

  async validateProduct(): Promise<SapValidationResult> {
    return {
      valid: false,
      errors: [
        {
          field: 'integration',
          message: 'SAP OData requiere un endpoint y credenciales reales.',
        },
      ],
    }
  }

  async healthCheck(): Promise<IntegrationHealth> {
    return {
      name: 'SAP',
      mode: 'disabled',
      status: 'unconfigured',
      checkedAt: new Date().toISOString(),
      message:
        'Integración deshabilitada: no se ejecutan simulaciones en cloud sin un endpoint SAP real.',
    }
  }
}

export class ODataSapGateway implements SapProductGateway {
  readonly adapter: 'odata-v2' | 'odata-v4'
  readonly #baseUrl: URL
  readonly #productPath: string

  constructor(
    private readonly options: {
      mode: 'odata-v2' | 'odata-v4'
      baseUrl: string
      productPath: string
      client?: string
      username?: string
      password?: string
      apiKey?: string
      apiKeyHeader: string
      productType: string
      industrySector: string
      language: string
      timeoutMs: number
      fetch?: Fetch
    },
  ) {
    this.adapter = options.mode
    this.#baseUrl = new URL(options.baseUrl)
    this.#productPath = options.productPath
  }

  async findProduct(productId: string): Promise<SapProduct | null> {
    const response = await this.#request(this.#entityUrl(productId), { method: 'GET' })
    if (response.status === 404) return null
    if (!response.ok) throw await sapHttpError(response)
    const body = unwrapOData(await response.json())
    return {
      id: readString(body, ['Product', 'product', 'id']) ?? productId,
      payload: {
        internalCode: readString(body, ['Product', 'product']) ?? productId,
        description:
          readString(body, ['ProductDescription', 'description']) ?? `Producto ${productId}`,
        category: readString(body, ['ProductGroup', 'category']) ?? 'SAP',
        manufacturer: readString(body, ['Manufacturer', 'manufacturer']) ?? 'SAP',
        manufacturerPartNumber:
          readString(body, ['ManufacturerPartNumber', 'manufacturerPartNumber']) ?? null,
        baseUnit: readString(body, ['BaseUnit', 'baseUnit']) ?? 'UN',
        attributes: {},
      },
    }
  }

  async createProduct(input: SapProductPayload): Promise<SapOperationResult> {
    const startedAt = performance.now()
    const validation = await this.validateProduct(input)
    if (!validation.valid) return validationFailure(validation, startedAt)
    return this.#mutate('POST', this.#collectionUrl(), input, startedAt)
  }

  async updateProduct(productId: string, input: SapProductPayload): Promise<SapOperationResult> {
    const startedAt = performance.now()
    const validation = await this.validateProduct(input)
    if (!validation.valid) return validationFailure(validation, startedAt)
    const target = this.#entityUrl(productId)
    const current = await this.#request(target, { method: 'GET' })
    if (!current.ok) return operationFailure(current, startedAt)
    return this.#mutate(
      'PATCH',
      target,
      input,
      startedAt,
      current.headers.get('etag') ?? '*',
      productId,
    )
  }

  async validateProduct(input: SapProductPayload): Promise<SapValidationResult> {
    const errors: SapValidationResult['errors'] = []
    if (!input.internalCode.trim()) {
      errors.push({ field: 'internalCode', message: 'El código de producto es obligatorio.' })
    }
    if (!input.description.trim()) {
      errors.push({ field: 'description', message: 'La descripción SAP es obligatoria.' })
    }
    if (!input.baseUnit.trim()) {
      errors.push({ field: 'baseUnit', message: 'La unidad base SAP es obligatoria.' })
    }
    if (!input.manufacturer.trim()) {
      errors.push({ field: 'manufacturer', message: 'El fabricante SAP es obligatorio.' })
    }
    return { valid: errors.length === 0, errors }
  }

  async healthCheck(): Promise<IntegrationHealth> {
    const checkedAt = new Date().toISOString()
    try {
      const metadataUrl = new URL(this.#collectionUrl())
      metadataUrl.pathname = metadataUrl.pathname.replace(/\/[^/]+$/, '/$metadata')
      const response = await this.#request(metadataUrl, { method: 'GET' })
      return {
        name: 'SAP',
        mode: 'real',
        status: response.ok ? 'healthy' : 'degraded',
        checkedAt,
        message: response.ok
          ? `${this.adapter} accesible; metadatos verificados.`
          : `SAP respondió HTTP ${response.status} al comprobar metadatos.`,
      }
    } catch (error) {
      return {
        name: 'SAP',
        mode: 'real',
        status: 'degraded',
        checkedAt,
        message: safeErrorMessage(error),
      }
    }
  }

  async #mutate(
    method: 'POST' | 'PATCH',
    target: URL,
    input: SapProductPayload,
    startedAt: number,
    etag?: string,
    existingProductId?: string,
  ): Promise<SapOperationResult> {
    try {
      const csrf = await this.#csrfContext()
      const response = await this.#request(target, {
        method,
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          ...(csrf.token ? { 'x-csrf-token': csrf.token } : {}),
          ...(csrf.cookie ? { cookie: csrf.cookie } : {}),
          ...(etag ? { 'if-match': etag } : {}),
        },
        body: JSON.stringify(this.#mapPayload(input)),
      })
      if (!response.ok) return operationFailure(response, startedAt)
      const body = response.status === 204 ? {} : unwrapOData(await response.json())
      return {
        success: true,
        productId:
          readString(body, ['Product', 'product', 'productId', 'id']) ??
          existingProductId ??
          input.internalCode,
        httpStatus: response.status,
        errorCode: null,
        errorMessage: null,
        durationMs: Math.round(performance.now() - startedAt),
      }
    } catch (error) {
      return {
        success: false,
        productId: null,
        httpStatus: error instanceof DOMException && error.name === 'TimeoutError' ? 504 : 502,
        errorCode:
          error instanceof DOMException && error.name === 'TimeoutError' ? 'TIMEOUT' : 'IO_ERROR',
        errorMessage: safeErrorMessage(error),
        durationMs: Math.round(performance.now() - startedAt),
      }
    }
  }

  #mapPayload(input: SapProductPayload): Record<string, unknown> {
    const core = {
      Product: input.internalCode,
      ProductType: this.options.productType,
      IndustrySector: this.options.industrySector,
      BaseUnit: input.baseUnit,
      Manufacturer: input.manufacturer,
      ManufacturerPartNumber: input.manufacturerPartNumber ?? '',
      ProductGroup: input.category.slice(0, 9),
    }
    if (this.adapter === 'odata-v2') {
      return {
        ...core,
        to_Description: {
          results: [
            {
              Product: input.internalCode,
              Language: this.options.language,
              ProductDescription: input.description,
            },
          ],
        },
      }
    }
    return {
      ...core,
      _ProductDescription: [
        {
          Product: input.internalCode,
          Language: this.options.language,
          ProductDescription: input.description,
        },
      ],
    }
  }

  async #csrfContext(): Promise<{ token: string | null; cookie: string | null }> {
    const response = await this.#request(this.#collectionUrl(), {
      method: 'GET',
      headers: { 'x-csrf-token': 'fetch', accept: 'application/json' },
    })
    if (!response.ok) throw await sapHttpError(response)
    return {
      token: response.headers.get('x-csrf-token'),
      cookie: response.headers.get('set-cookie')?.split(';')[0] ?? null,
    }
  }

  #collectionUrl(): URL {
    const url = new URL(this.#productPath, this.#baseUrl)
    if (this.options.client) url.searchParams.set('sap-client', this.options.client)
    return url
  }

  #entityUrl(productId: string): URL {
    const escaped = productId.replaceAll("'", "''")
    const collection = this.#collectionUrl()
    collection.pathname += this.adapter === 'odata-v2' ? `(Product='${escaped}')` : `('${escaped}')`
    return collection
  }

  #request(url: URL, init: RequestInit): Promise<Response> {
    const requestHeaders = new Headers(init.headers)
    if (this.options.apiKey) {
      requestHeaders.set(this.options.apiKeyHeader, this.options.apiKey)
    } else if (this.options.username && this.options.password) {
      requestHeaders.set(
        'authorization',
        `Basic ${Buffer.from(`${this.options.username}:${this.options.password}`).toString('base64')}`,
      )
    }
    return (this.options.fetch ?? fetch)(url, {
      ...init,
      headers: requestHeaders,
      signal: AbortSignal.timeout(this.options.timeoutMs),
    })
  }
}

export function createSapGateway(config: AppConfig): SapProductGateway {
  if (config.SAP_MODE === 'disabled') return new DisabledSapGateway()
  if (config.SAP_MODE === 'simulator') return new SapSimulatorGateway()
  return new ODataSapGateway({
    mode: config.SAP_MODE,
    baseUrl: config.SAP_BASE_URL,
    productPath:
      config.SAP_MODE === 'odata-v2'
        ? config.SAP_ODATA_V2_PRODUCT_PATH
        : config.SAP_ODATA_V4_PRODUCT_PATH,
    ...(config.SAP_CLIENT ? { client: config.SAP_CLIENT } : {}),
    ...(config.SAP_USERNAME ? { username: config.SAP_USERNAME } : {}),
    ...(config.SAP_PASSWORD ? { password: config.SAP_PASSWORD } : {}),
    ...(config.SAP_API_KEY ? { apiKey: config.SAP_API_KEY } : {}),
    apiKeyHeader: config.SAP_API_KEY_HEADER,
    productType: config.SAP_PRODUCT_TYPE,
    industrySector: config.SAP_INDUSTRY_SECTOR,
    language: config.SAP_LANGUAGE,
    timeoutMs: config.SAP_TIMEOUT_MS,
  })
}

async function operationFailure(
  response: Response,
  startedAt: number,
): Promise<SapOperationResult> {
  const error = await sapHttpError(response)
  return {
    success: false,
    productId: null,
    httpStatus: response.status,
    errorCode: error.code,
    errorMessage: error.message,
    durationMs: Math.round(performance.now() - startedAt),
  }
}

function validationFailure(validation: SapValidationResult, startedAt: number): SapOperationResult {
  return {
    success: false,
    productId: null,
    httpStatus: 422,
    errorCode: 'VALIDATION_ERROR',
    errorMessage: validation.errors.map((item) => item.message).join(' '),
    durationMs: Math.round(performance.now() - startedAt),
  }
}

async function sapHttpError(response: Response): Promise<Error & { code: string }> {
  let code = `HTTP_${response.status}`
  let message = `SAP OData respondió HTTP ${response.status}.`
  try {
    const body = (await response.json()) as {
      error?: { code?: string; message?: string | { value?: string } }
    }
    code = body.error?.code ?? code
    const remoteMessage = body.error?.message
    message = typeof remoteMessage === 'string' ? remoteMessage : (remoteMessage?.value ?? message)
  } catch {
    // La respuesta puede ser XML/HTML; no se refleja para evitar exponer datos del backend.
  }
  const error = new Error(message) as Error & { code: string }
  error.code = code
  return error
}

function unwrapOData(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') return {}
  const root = value as Record<string, unknown>
  const candidate = root.d ?? root.value ?? root
  if (Array.isArray(candidate)) return (candidate[0] as Record<string, unknown> | undefined) ?? {}
  return candidate && typeof candidate === 'object' ? (candidate as Record<string, unknown>) : {}
}

function readString(value: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    if (typeof value[key] === 'string' && value[key]) return value[key]
  }
  return null
}

function safeErrorMessage(error: unknown): string {
  return error instanceof Error
    ? `SAP OData no está accesible: ${error.message.slice(0, 220)}`
    : 'SAP OData no está accesible.'
}
