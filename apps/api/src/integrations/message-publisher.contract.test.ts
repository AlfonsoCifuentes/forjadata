import type { ServiceBusClient, ServiceBusReceiver, ServiceBusSender } from '@azure/service-bus'
import type { IntegrationMessage } from '@forjadata/contracts'
import { describe, expect, it, vi } from 'vitest'

import { AzureServiceBusPublisher, InlineMessagePublisher } from './message-publisher.js'

describe('contrato MessagePublisher', () => {
  it('valida y entrega mensajes inline al handler registrado', async () => {
    const handler = vi.fn(async () => undefined)
    const publisher = new InlineMessagePublisher(handler)
    const message = documentMessage()

    await publisher.publish(message)

    expect(handler).toHaveBeenCalledWith(message)
    await expect(publisher.healthCheck()).resolves.toEqual(
      expect.objectContaining({ mode: 'demo', status: 'healthy' }),
    )
  })

  it('envía contratos tipados a la cola correcta con trazabilidad', async () => {
    const sendMessages = vi.fn(async () => undefined)
    const sender = {
      sendMessages,
      close: vi.fn(async () => undefined),
    } as unknown as ServiceBusSender
    const receiver = {
      peekMessages: vi.fn(async () => []),
      close: vi.fn(async () => undefined),
    } as unknown as ServiceBusReceiver
    const createSender = vi.fn(() => sender)
    const client = {
      createSender,
      createReceiver: vi.fn(() => receiver),
      close: vi.fn(async () => undefined),
    } as unknown as ServiceBusClient
    const publisher = new AzureServiceBusPublisher(client, {
      documentProcessing: 'document-processing',
      sapSync: 'sap-sync',
    })
    const message = documentMessage()

    await publisher.publish(message)

    expect(createSender).toHaveBeenCalledWith('document-processing')
    expect(sendMessages).toHaveBeenCalledWith(
      expect.objectContaining({
        body: message,
        messageId: message.messageId,
        correlationId: message.correlationId,
        applicationProperties: { schemaVersion: 1, type: 'document.process' },
      }),
    )
    await expect(publisher.healthCheck()).resolves.toEqual(
      expect.objectContaining({ mode: 'real', status: 'healthy' }),
    )
    await publisher.close()
  })
})

function documentMessage(): IntegrationMessage {
  return {
    schemaVersion: 1,
    type: 'document.process',
    messageId: crypto.randomUUID(),
    correlationId: crypto.randomUUID(),
    occurredAt: new Date().toISOString(),
    payload: {
      requestId: 'req-contract',
      documentId: 'doc-contract',
      blobPath: 'documents/req-contract/doc-contract.pdf',
    },
  }
}
