import type { IntegrationHealth, IntegrationMessage, SapProductPayload } from '@forjadata/contracts'

export interface DocumentInput {
  documentId: string
  fileName: string
  mimeType: string
  bytes: Uint8Array
}

export interface DocumentAnalysisResult {
  text: string
  pageCount: number
  language: string
  provider: string
  providerVersion: string
}

export interface CategoryPrediction {
  code: string
  confidence: number
}

export interface AttributeSuggestionResult {
  code: string
  value: string | number | boolean | null
  unit: string | null
  confidence: number
  evidenceText: string
  page: number
}

export interface DocumentExtractionProvider {
  readonly mode: 'mock' | 'azure' | 'disabled'
  analyze(input: DocumentInput): Promise<DocumentAnalysisResult>
  healthCheck(): Promise<IntegrationHealth>
}

export interface MaterialClassificationProvider {
  readonly mode: 'mock' | 'azure' | 'disabled'
  classify(input: { text: string }): Promise<CategoryPrediction[]>
  healthCheck(): Promise<IntegrationHealth>
}

export interface AttributeExtractionProvider {
  readonly mode: 'mock' | 'azure' | 'disabled'
  extract(input: { text: string; categoryCode: string }): Promise<AttributeSuggestionResult[]>
  healthCheck(): Promise<IntegrationHealth>
}

export interface EmbeddingProvider {
  readonly mode: 'mock' | 'azure' | 'disabled'
  embed(texts: string[]): Promise<number[][]>
  healthCheck(): Promise<IntegrationHealth>
}

export interface StoredObject {
  container: string
  path: string
  contentType: string
  size: number
  etag: string | null
  metadata: Readonly<Record<string, string>>
}

export interface ObjectStoragePutInput {
  container: string
  path: string
  bytes: Uint8Array
  contentType: string
  metadata?: Readonly<Record<string, string>>
}

export interface ObjectStorage {
  readonly adapter: 'memory' | 'azurite' | 'azure'
  put(input: ObjectStoragePutInput): Promise<StoredObject>
  get(container: string, path: string): Promise<Uint8Array>
  delete(container: string, path: string): Promise<void>
  healthCheck(): Promise<IntegrationHealth>
}

export interface MessagePublisher {
  readonly adapter: 'inline' | 'service-bus'
  publish(message: IntegrationMessage): Promise<void>
  healthCheck(): Promise<IntegrationHealth>
  close(): Promise<void>
}

export interface SapProduct {
  id: string
  payload: SapProductPayload
}

export interface SapOperationResult {
  success: boolean
  productId: string | null
  httpStatus: number
  errorCode: string | null
  errorMessage: string | null
  durationMs: number
}

export interface SapValidationResult {
  valid: boolean
  errors: Array<{ field: string; message: string }>
}

export interface SapProductGateway {
  readonly adapter: 'disabled' | 'simulator' | 'odata-v2' | 'odata-v4'
  findProduct(productId: string): Promise<SapProduct | null>
  createProduct(input: SapProductPayload): Promise<SapOperationResult>
  updateProduct(productId: string, input: SapProductPayload): Promise<SapOperationResult>
  validateProduct(input: SapProductPayload): Promise<SapValidationResult>
  healthCheck(): Promise<IntegrationHealth>
}
