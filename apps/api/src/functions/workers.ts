import '../telemetry-bootstrap.js'

import { app, type InvocationContext } from '@azure/functions'
import {
  DocumentProcessingMessageSchema,
  IntegrationMessageSchema,
  SapSyncMessageSchema,
  type DocumentProcessingMessage,
  type IntegrationMessage,
  type SapSyncMessage,
} from '@forjadata/contracts'
import {
  DemoEngine,
  type AttributeExtractionProvider,
  type DocumentExtractionProvider,
  type MaterialClassificationProvider,
  type ObjectStorage,
  type SapProductGateway,
} from '@forjadata/domain'

import { RuleBasedMaterialProvider } from '../integrations/ai-providers.js'
import type { NotificationEmailPort } from '../integrations/notification-email.js'
import {
  documentExtractionProvider,
  materialIntelligenceProvider,
  notificationEmail,
  objectStorage,
  runtimeConfig,
  runtimeStateStore,
  sapGateway,
} from '../integrations/runtime-integrations.js'
import type { RuntimeStateStore } from '../persistence/runtime-state-store.js'

export async function documentProcessingHandler(
  input: unknown,
  context: InvocationContext,
): Promise<void> {
  const message = DocumentProcessingMessageSchema.parse(parseServiceBusPayload(input))
  context.log('Document processing message accepted', {
    messageId: message.messageId,
    correlationId: message.correlationId,
    requestId: message.payload.requestId,
    documentId: message.payload.documentId,
  })
  if (runtimeConfig.QUEUE_MODE === 'service-bus') {
    await processDocumentMessage(message, {
      stateStore: runtimeStateStore,
      storage: objectStorage,
      documentsContainer: runtimeConfig.BLOB_DOCUMENTS_CONTAINER,
      documentProvider: documentExtractionProvider,
      materialProvider: materialIntelligenceProvider,
      aiProviderVersion: runtimeConfig.AZURE_OPENAI_DEPLOYMENT_NAME ?? 'forjadata-rules-1.0',
      email: notificationEmail,
      publicAppUrl: runtimeConfig.PUBLIC_APP_URL,
    })
  }
}

export async function sapSyncHandler(input: unknown, context: InvocationContext): Promise<void> {
  const message = SapSyncMessageSchema.parse(parseServiceBusPayload(input))
  context.log('SAP synchronization message accepted', {
    messageId: message.messageId,
    correlationId: message.correlationId,
    requestId: message.payload.requestId,
    jobId: message.payload.jobId,
  })
  if (runtimeConfig.QUEUE_MODE === 'service-bus') {
    await processSapSyncMessage(message, {
      stateStore: runtimeStateStore,
      gateway: sapGateway,
      email: notificationEmail,
      publicAppUrl: runtimeConfig.PUBLIC_APP_URL,
    })
  }
}

export function parseServiceBusPayload(input: unknown): IntegrationMessage {
  if (typeof input === 'string') return IntegrationMessageSchema.parse(JSON.parse(input))
  if (input instanceof Uint8Array) {
    return IntegrationMessageSchema.parse(JSON.parse(new TextDecoder().decode(input)))
  }
  return IntegrationMessageSchema.parse(input)
}

export async function processDocumentMessage(
  message: DocumentProcessingMessage,
  dependencies: {
    stateStore: RuntimeStateStore
    storage: ObjectStorage
    documentsContainer: string
    documentProvider: DocumentExtractionProvider
    materialProvider: MaterialClassificationProvider & AttributeExtractionProvider
    aiProviderVersion: string
    email?: NotificationEmailPort
    publicAppUrl?: string
  },
): Promise<void> {
  const lease = await dependencies.stateStore.load()
  const engine = new DemoEngine(lease.snapshot)
  const request = engine.getRequest(message.payload.requestId)
  if (request.status === 'NEEDS_REVIEW') return

  let text = request.description
  let pageCount = 1
  let documentProviderVersion = 'manual-input'
  let documentFallback = false
  if (message.payload.blobPath !== 'no-document') {
    const bytes = await dependencies.storage.get(
      dependencies.documentsContainer,
      message.payload.blobPath,
    )
    const document = request.documents.find((item) => item.id === message.payload.documentId)
    if (document && dependencies.documentProvider.mode !== 'disabled') {
      try {
        const analysis = await dependencies.documentProvider.analyze({
          documentId: document.id,
          fileName: document.fileName,
          mimeType: document.mimeType,
          bytes,
        })
        text = `${request.description}\n\n${analysis.text}`
        pageCount = analysis.pageCount
        documentProviderVersion = analysis.providerVersion
      } catch {
        documentFallback = true
      }
    }
  }

  let provider =
    dependencies.materialProvider.mode === 'azure'
      ? 'azure-openai'
      : dependencies.materialProvider.mode === 'mock'
        ? 'mock'
        : 'rules'
  let providerVersion =
    dependencies.materialProvider.mode === 'azure'
      ? dependencies.aiProviderVersion
      : provider === 'mock'
        ? 'forjadata-mock-1.0'
        : 'forjadata-rules-1.0'
  let category: string | undefined
  let attributes
  try {
    const predictions = await dependencies.materialProvider.classify({ text })
    category = predictions[0]?.code
    attributes = await dependencies.materialProvider.extract({
      text,
      categoryCode: category ?? request.category ?? 'UNCLASSIFIED',
    })
  } catch {
    const fallback = new RuleBasedMaterialProvider('disabled')
    category = (await fallback.classify({ text }))[0]?.code
    attributes = await fallback.extract({
      text,
      categoryCode: category ?? request.category ?? 'UNCLASSIFIED',
    })
    provider = 'rules-fallback'
    providerVersion = 'forjadata-rules-1.0'
  }

  engine.completeRequestProcessing(message.payload.requestId, {
    provider,
    providerVersion,
    reason: `${provider} completó la clasificación y extracción validadas.${
      documentFallback
        ? ' Document Intelligence falló y se utilizó la descripción humana como fallback.'
        : ` Extracción documental ${documentProviderVersion}.`
    }`,
    pageCount,
    ...(category ? { category } : {}),
    ...(attributes ? { attributes } : {}),
  })
  await dependencies.stateStore.save(engine.getSnapshot(), lease.version)
  await dependencies.email?.send({
    template: 'PROCESSING_COMPLETED',
    subject: `Solicitud ${request.id} lista para revisión`,
    text: 'El procesamiento terminó y la solicitud requiere revisión humana.',
    link: `${dependencies.publicAppUrl ?? 'http://localhost:5173'}/app/requests/${encodeURIComponent(request.id)}`,
    correlationId: message.correlationId,
  })
}

export async function processSapSyncMessage(
  message: SapSyncMessage,
  dependencies: {
    stateStore: RuntimeStateStore
    gateway: SapProductGateway
    email?: NotificationEmailPort
    publicAppUrl?: string
  },
): Promise<void> {
  const lease = await dependencies.stateStore.load()
  const engine = new DemoEngine(lease.snapshot)
  const job = engine.getSapJob(message.payload.jobId)
  if (job.status === 'SUCCEEDED') return
  if (job.status !== 'QUEUED') {
    throw new Error(`El trabajo SAP ${job.id} no está en cola.`)
  }
  const result =
    job.operation === 'CREATE'
      ? await dependencies.gateway.createProduct(job.payload)
      : await dependencies.gateway.updateProduct(
          job.sapProductId ?? job.payload.internalCode,
          job.payload,
        )
  engine.completeSapSync(job.id, result)
  await dependencies.stateStore.save(engine.getSnapshot(), lease.version)
  await dependencies.email?.send({
    template: result.success ? 'SAP_SYNC_COMPLETED' : 'SAP_SYNC_FAILED',
    subject: result.success
      ? `Sincronización ${job.id} completada`
      : `Sincronización ${job.id} con error`,
    text: result.success
      ? 'El material se sincronizó correctamente con SAP OData.'
      : 'La sincronización SAP requiere revisión o reintento.',
    link: `${dependencies.publicAppUrl ?? 'http://localhost:5173'}/app/sap`,
    correlationId: message.correlationId,
  })
}

app.serviceBusQueue('documentProcessingWorker', {
  queueName: runtimeConfig.SERVICE_BUS_DOCUMENT_QUEUE,
  connection: 'ServiceBusConnection',
  cardinality: 'one',
  handler: documentProcessingHandler,
})

app.serviceBusQueue('sapSyncWorker', {
  queueName: runtimeConfig.SERVICE_BUS_SAP_QUEUE,
  connection: 'ServiceBusConnection',
  cardinality: 'one',
  handler: sapSyncHandler,
})
