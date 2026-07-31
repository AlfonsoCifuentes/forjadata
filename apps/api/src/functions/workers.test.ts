import type { InvocationContext } from '@azure/functions'
import { DemoEngine, SapSimulatorGateway } from '@forjadata/domain'
import { MemoryObjectStorage } from '../integrations/object-storage.js'
import { MemoryRuntimeStateStore } from '../persistence/runtime-state-store.js'
import {
  DisabledDocumentExtractionProvider,
  RuleBasedMaterialProvider,
} from '../integrations/ai-providers.js'
import { describe, expect, it, vi } from 'vitest'

import {
  documentProcessingHandler,
  parseServiceBusPayload,
  processDocumentMessage,
  processSapSyncMessage,
} from './workers.js'

const message = {
  schemaVersion: 1 as const,
  type: 'document.process' as const,
  messageId: '11111111-1111-4111-8111-111111111111',
  correlationId: '22222222-2222-4222-8222-222222222222',
  occurredAt: '2026-07-30T20:00:00.000Z',
  payload: {
    requestId: 'req-1',
    documentId: 'doc-1',
    blobPath: 'req-1/doc-1.pdf',
  },
}

describe('Service Bus workers', () => {
  it('valida payloads objeto, texto y bytes con el mismo contrato', () => {
    expect(parseServiceBusPayload(message)).toEqual(message)
    expect(parseServiceBusPayload(JSON.stringify(message))).toEqual(message)
    expect(parseServiceBusPayload(new TextEncoder().encode(JSON.stringify(message)))).toEqual(
      message,
    )
  })

  it('propaga correlation y message ID al log estructurado', async () => {
    const log = vi.fn()
    await documentProcessingHandler(message, { log } as unknown as InvocationContext)
    expect(log).toHaveBeenCalledWith(
      'Document processing message accepted',
      expect.objectContaining({
        messageId: message.messageId,
        correlationId: message.correlationId,
      }),
    )
  })

  it('procesa de forma idempotente un mensaje validado y comparte el estado del worker', async () => {
    const stateStore = new MemoryRuntimeStateStore()
    const storage = new MemoryObjectStorage()
    const processingMessage = {
      ...message,
      payload: {
        requestId: 'req-pump-001',
        documentId: 'no-document',
        blobPath: 'no-document',
      },
    }

    await processDocumentMessage(processingMessage, {
      stateStore,
      storage,
      documentsContainer: 'documents',
      documentProvider: new DisabledDocumentExtractionProvider(),
      materialProvider: new RuleBasedMaterialProvider('disabled'),
      aiProviderVersion: 'forjadata-rules-1.0',
    })
    await processDocumentMessage(processingMessage, {
      stateStore,
      storage,
      documentsContainer: 'documents',
      documentProvider: new DisabledDocumentExtractionProvider(),
      materialProvider: new RuleBasedMaterialProvider('disabled'),
      aiProviderVersion: 'forjadata-rules-1.0',
    })

    const state = await stateStore.load()
    const request = state.snapshot.requests.find((item) => item.id === 'req-pump-001')
    expect(request).toEqual(
      expect.objectContaining({
        status: 'NEEDS_REVIEW',
        suggestions: expect.arrayContaining([expect.objectContaining({ provider: 'rules' })]),
      }),
    )
  })

  it('ejecuta un trabajo SAP encolado y persiste el resultado normalizado', async () => {
    const stateStore = new MemoryRuntimeStateStore()
    const lease = await stateStore.load()
    const engine = new DemoEngine(lease.snapshot)
    engine.switchRole('sap_specialist')
    const ready = engine.getRequest('req-cable-001')
    const job = engine.queueSapSync(ready.id, ready.version, 'odata-v4')
    await stateStore.save(engine.getSnapshot(), lease.version)
    const sapMessage = {
      schemaVersion: 1 as const,
      type: 'sap.sync' as const,
      messageId: '33333333-3333-4333-8333-333333333333',
      correlationId: '44444444-4444-4444-8444-444444444444',
      occurredAt: '2026-07-30T20:00:00.000Z',
      payload: { requestId: ready.id, jobId: job.id },
    }

    await processSapSyncMessage(sapMessage, {
      stateStore,
      gateway: new SapSimulatorGateway(),
    })
    await processSapSyncMessage(sapMessage, {
      stateStore,
      gateway: new SapSimulatorGateway(),
    })

    const current = await stateStore.load()
    expect(current.snapshot.sapJobs[0]).toEqual(
      expect.objectContaining({ id: job.id, status: 'SUCCEEDED' }),
    )
  })
})
