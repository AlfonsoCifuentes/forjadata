import DocumentIntelligence, {
  getLongRunningPoller,
  isUnexpected,
  type AnalyzeOperationOutput,
} from '@azure-rest/ai-document-intelligence'
import { AzureKeyCredential } from '@azure/core-auth'
import type { IntegrationHealth } from '@forjadata/contracts'
import {
  materialExtractionSystemPrompt,
  MaterialExtractionResultSchema,
  promptVersions,
  type MaterialExtractionResult,
} from '@forjadata/ai-prompts'
import type {
  AttributeExtractionProvider,
  AttributeSuggestionResult,
  CategoryPrediction,
  DocumentAnalysisResult,
  DocumentExtractionProvider,
  DocumentInput,
  MaterialClassificationProvider,
} from '@forjadata/domain'
import OpenAI from 'openai'

import type { AppConfig } from '../config.js'
import { createAzureCredential } from './azure-credential.js'

type DocumentClient = ReturnType<typeof DocumentIntelligence>

export class AzureDocumentIntelligenceProvider implements DocumentExtractionProvider {
  readonly mode = 'azure' as const

  constructor(
    private readonly client: DocumentClient,
    private readonly modelId = 'prebuilt-layout',
  ) {}

  async analyze(input: DocumentInput): Promise<DocumentAnalysisResult> {
    const initialResponse = await this.client
      .path('/documentModels/{modelId}:analyze', this.modelId)
      .post({
        contentType: 'application/json',
        body: { base64Source: Buffer.from(input.bytes).toString('base64') },
        queryParameters: { locale: 'es-ES' },
      })
    if (isUnexpected(initialResponse)) {
      throw new Error(
        `Document Intelligence rechazó el documento: ${initialResponse.body.error.code}.`,
      )
    }
    const poller = getLongRunningPoller(this.client, initialResponse)
    const operation = (await poller.pollUntilDone()).body as AnalyzeOperationOutput
    const result = operation.analyzeResult
    if (operation.status !== 'succeeded' || !result) {
      throw new Error(
        `Document Intelligence terminó con estado ${operation.status}: ${operation.error?.code ?? 'sin resultado'}.`,
      )
    }
    return {
      text: result.content,
      pageCount: result.pages.length,
      language: result.languages?.[0]?.locale ?? 'und',
      provider: 'azure-document-intelligence',
      providerVersion: `${result.apiVersion}:${result.modelId}`,
    }
  }

  async healthCheck(): Promise<IntegrationHealth> {
    const checkedAt = new Date().toISOString()
    try {
      const response = await this.client.path('/info').get()
      return {
        name: 'Azure Document Intelligence',
        mode: 'real',
        status: isUnexpected(response) ? 'degraded' : 'healthy',
        checkedAt,
        message: isUnexpected(response)
          ? `Document Intelligence respondió ${response.status}.`
          : 'Endpoint accesible mediante la credencial configurada.',
      }
    } catch (error) {
      return degradedHealth('Azure Document Intelligence', checkedAt, error)
    }
  }
}

export class MockDocumentExtractionProvider implements DocumentExtractionProvider {
  readonly mode = 'mock' as const

  async analyze(input: DocumentInput): Promise<DocumentAnalysisResult> {
    const textual = input.mimeType === 'text/csv' ? new TextDecoder().decode(input.bytes) : ''
    return {
      text: textual || `Documento sintético ${input.fileName}`,
      pageCount: 1,
      language: 'es',
      provider: 'mock',
      providerVersion: 'forjadata-mock-1.0',
    }
  }

  async healthCheck(): Promise<IntegrationHealth> {
    return {
      name: 'Azure Document Intelligence',
      mode: 'mock',
      status: 'healthy',
      checkedAt: new Date().toISOString(),
      message: 'Proveedor determinista explícitamente identificado como mock.',
    }
  }
}

export class DisabledDocumentExtractionProvider implements DocumentExtractionProvider {
  readonly mode = 'disabled' as const

  async analyze(): Promise<DocumentAnalysisResult> {
    throw new Error('La extracción documental está deshabilitada.')
  }

  async healthCheck(): Promise<IntegrationHealth> {
    return {
      name: 'Azure Document Intelligence',
      mode: 'disabled',
      status: 'unconfigured',
      checkedAt: new Date().toISOString(),
      message: 'Extracción deshabilitada; el flujo continúa con reglas y entrada manual.',
    }
  }
}

export class AzureMaterialIntelligenceProvider
  implements MaterialClassificationProvider, AttributeExtractionProvider
{
  readonly mode = 'azure' as const
  readonly #cache = new Map<string, MaterialExtractionResult>()

  constructor(
    private readonly client: OpenAI,
    private readonly deployment: string,
    private readonly maximumInputCharacters: number,
    private readonly maximumOutputTokens: number,
  ) {}

  async classify(input: { text: string }): Promise<CategoryPrediction[]> {
    const result = await this.#enrich(input.text)
    return [{ code: result.category, confidence: averageConfidence(result) }]
  }

  async extract(input: {
    text: string
    categoryCode: string
  }): Promise<AttributeSuggestionResult[]> {
    const result = await this.#enrich(input.text)
    return result.attributes.map((attribute) => ({
      code: attribute.code,
      value: attribute.value,
      unit: attribute.unit,
      confidence: attribute.confidence,
      evidenceText: attribute.evidence.text,
      page: attribute.evidence.page,
    }))
  }

  async healthCheck(): Promise<IntegrationHealth> {
    const checkedAt = new Date().toISOString()
    try {
      await this.client.models.list()
      return {
        name: 'Inteligencia artificial',
        mode: 'real',
        status: 'healthy',
        checkedAt,
        message: `Azure OpenAI accesible; deployment ${this.deployment}.`,
      }
    } catch (error) {
      return degradedHealth('Inteligencia artificial', checkedAt, error)
    }
  }

  async #enrich(text: string): Promise<MaterialExtractionResult> {
    const boundedText = text.slice(0, this.maximumInputCharacters)
    const cacheKey = await sha256(boundedText)
    const cached = this.#cache.get(cacheKey)
    if (cached) return cached
    const response = await this.client.responses.create({
      model: this.deployment,
      store: false,
      instructions: materialExtractionSystemPrompt(),
      input: boundedText,
      max_output_tokens: this.maximumOutputTokens,
      metadata: { prompt_version: promptVersions.materialExtraction },
      text: {
        format: {
          type: 'json_schema',
          name: 'forjadata_material_extraction',
          strict: true,
          schema: materialExtractionJsonSchema,
        },
      },
    })
    const parsed = MaterialExtractionResultSchema.parse(JSON.parse(response.output_text))
    if (this.#cache.size >= 50) this.#cache.delete(this.#cache.keys().next().value ?? '')
    this.#cache.set(cacheKey, parsed)
    return parsed
  }
}

export class RuleBasedMaterialProvider
  implements MaterialClassificationProvider, AttributeExtractionProvider
{
  readonly mode: 'mock' | 'disabled'

  constructor(mode: 'mock' | 'disabled') {
    this.mode = mode
  }

  async classify(input: { text: string }): Promise<CategoryPrediction[]> {
    const code = /\bmotor\b/i.test(input.text)
      ? 'Motores eléctricos'
      : /\b(bomba|pump)\b/i.test(input.text)
        ? 'Bombas'
        : 'Componentes electrónicos'
    return [{ code, confidence: this.mode === 'mock' ? 0.82 : 0.65 }]
  }

  async extract(input: {
    text: string
    categoryCode: string
  }): Promise<AttributeSuggestionResult[]> {
    const values: AttributeSuggestionResult[] = []
    const power = /(\d+(?:[.,]\d+)?)\s*kW/i.exec(input.text)
    if (power?.[1]) {
      values.push({
        code: 'POWER',
        value: Number(power[1].replace(',', '.')),
        unit: 'kW',
        confidence: this.mode === 'mock' ? 0.9 : 0.74,
        evidenceText: power[0],
        page: 1,
      })
    }
    return values
  }

  async healthCheck(): Promise<IntegrationHealth> {
    return {
      name: 'Inteligencia artificial',
      mode: this.mode,
      status: this.mode === 'mock' ? 'healthy' : 'unconfigured',
      checkedAt: new Date().toISOString(),
      message:
        this.mode === 'mock'
          ? 'Clasificador determinista explícitamente identificado como mock.'
          : 'IA deshabilitada; solo se ejecutan reglas transparentes.',
    }
  }
}

export function createDocumentExtractionProvider(config: AppConfig): DocumentExtractionProvider {
  if (config.DOCUMENT_MODE === 'mock') return new MockDocumentExtractionProvider()
  if (config.DOCUMENT_MODE === 'disabled') return new DisabledDocumentExtractionProvider()
  const endpoint = config.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT
  if (!endpoint) throw new Error('AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT no está configurado.')
  const credential = config.AZURE_DOCUMENT_INTELLIGENCE_KEY
    ? new AzureKeyCredential(config.AZURE_DOCUMENT_INTELLIGENCE_KEY)
    : createAzureCredential()
  return new AzureDocumentIntelligenceProvider(DocumentIntelligence(endpoint, credential))
}

export function createMaterialIntelligenceProvider(
  config: AppConfig,
): AzureMaterialIntelligenceProvider | RuleBasedMaterialProvider {
  if (config.AI_MODE !== 'azure') {
    return new RuleBasedMaterialProvider(config.AI_MODE === 'mock' ? 'mock' : 'disabled')
  }
  const endpoint = config.AZURE_OPENAI_ENDPOINT
  const deployment = config.AZURE_OPENAI_DEPLOYMENT_NAME
  if (!endpoint || !deployment) throw new Error('Azure OpenAI no está configurado.')
  const credential = createAzureCredential()
  const apiKey =
    config.AZURE_OPENAI_API_KEY ??
    (async () => {
      const token = await credential.getToken('https://cognitiveservices.azure.com/.default')
      if (!token) throw new Error('No se pudo obtener un token para Azure OpenAI.')
      return token.token
    })
  return new AzureMaterialIntelligenceProvider(
    new OpenAI({
      apiKey,
      baseURL: new URL('/openai/v1', endpoint).toString().replace(/\/$/, ''),
    }),
    deployment,
    config.AI_MAX_INPUT_CHARS,
    config.AI_MAX_OUTPUT_TOKENS,
  )
}

const materialExtractionJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['shortDescription', 'category', 'attributes', 'warnings'],
  properties: {
    shortDescription: { type: 'string', minLength: 1, maxLength: 120 },
    category: { type: 'string', minLength: 1 },
    attributes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['code', 'value', 'unit', 'confidence', 'evidence'],
        properties: {
          code: { type: 'string', minLength: 1 },
          value: {
            anyOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }, { type: 'null' }],
          },
          unit: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          evidence: {
            type: 'object',
            additionalProperties: false,
            required: ['text', 'page'],
            properties: {
              text: { type: 'string', minLength: 1 },
              page: { type: 'integer', minimum: 1 },
            },
          },
        },
      },
    },
    warnings: { type: 'array', items: { type: 'string' } },
  },
} as const

function averageConfidence(result: MaterialExtractionResult): number {
  return result.attributes.length === 0
    ? 0.5
    : result.attributes.reduce((total, item) => total + item.confidence, 0) /
        result.attributes.length
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Buffer.from(digest).toString('hex')
}

function degradedHealth(name: string, checkedAt: string, error: unknown): IntegrationHealth {
  return {
    name,
    mode: 'real',
    status: 'degraded',
    checkedAt,
    message: `${name} no está accesible: ${
      error instanceof Error ? error.message.slice(0, 200) : 'error desconocido'
    }`,
  }
}
