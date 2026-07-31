import { ServiceBusClient, type ServiceBusSender } from '@azure/service-bus'
import {
  IntegrationMessageSchema,
  type IntegrationHealth,
  type IntegrationMessage,
} from '@forjadata/contracts'
import type { MessagePublisher } from '@forjadata/domain'

import type { AppConfig } from '../config.js'
import { createAzureCredential } from './azure-credential.js'

type InlineHandler = (message: IntegrationMessage) => Promise<void>

export class InlineMessagePublisher implements MessagePublisher {
  readonly adapter = 'inline' as const

  constructor(private readonly handler?: InlineHandler) {}

  async publish(input: IntegrationMessage): Promise<void> {
    const message = IntegrationMessageSchema.parse(input)
    if (this.handler) await this.handler(message)
  }

  async healthCheck(): Promise<IntegrationHealth> {
    return {
      name: 'Azure Service Bus',
      mode: 'demo',
      status: 'healthy',
      checkedAt: new Date().toISOString(),
      message: 'Procesamiento inline explícito para ejecución local y tests.',
    }
  }

  async close(): Promise<void> {}
}

export class AzureServiceBusPublisher implements MessagePublisher {
  readonly adapter = 'service-bus' as const
  readonly #senders = new Map<string, ServiceBusSender>()

  constructor(
    private readonly client: ServiceBusClient,
    private readonly queues: {
      documentProcessing: string
      sapSync: string
    },
  ) {}

  async publish(input: IntegrationMessage): Promise<void> {
    const message = IntegrationMessageSchema.parse(input)
    const queue = this.#queueFor(message)
    const sender = this.#sender(queue)
    await sender.sendMessages({
      body: message,
      contentType: 'application/json',
      correlationId: message.correlationId,
      messageId: message.messageId,
      applicationProperties: {
        schemaVersion: message.schemaVersion,
        type: message.type,
      },
    })
  }

  async healthCheck(): Promise<IntegrationHealth> {
    const checkedAt = new Date().toISOString()
    const receiver = this.client.createReceiver(this.queues.documentProcessing, {
      receiveMode: 'peekLock',
    })
    try {
      await receiver.peekMessages(1)
      return {
        name: 'Azure Service Bus',
        mode: 'real',
        status: 'healthy',
        checkedAt,
        message: `Namespace accesible; cola ${this.queues.documentProcessing} verificada.`,
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'error desconocido'
      return {
        name: 'Azure Service Bus',
        mode: 'real',
        status: 'degraded',
        checkedAt,
        message: `Service Bus no está accesible: ${reason.slice(0, 240)}`,
      }
    } finally {
      await receiver.close()
    }
  }

  async close(): Promise<void> {
    await Promise.all([...this.#senders.values()].map((sender) => sender.close()))
    await this.client.close()
  }

  #queueFor(message: IntegrationMessage): string {
    return message.type === 'document.process'
      ? this.queues.documentProcessing
      : this.queues.sapSync
  }

  #sender(queue: string): ServiceBusSender {
    const existing = this.#senders.get(queue)
    if (existing) return existing
    const sender = this.client.createSender(queue)
    this.#senders.set(queue, sender)
    return sender
  }
}

export function createMessagePublisher(config: AppConfig): MessagePublisher {
  if (config.QUEUE_MODE === 'inline') return new InlineMessagePublisher()
  const client = config.AZURE_SERVICE_BUS_CONNECTION_STRING
    ? new ServiceBusClient(config.AZURE_SERVICE_BUS_CONNECTION_STRING)
    : new ServiceBusClient(
        requireNamespace(config.SERVICE_BUS_FULLY_QUALIFIED_NAMESPACE),
        createAzureCredential(),
      )
  return new AzureServiceBusPublisher(client, {
    documentProcessing: config.SERVICE_BUS_DOCUMENT_QUEUE,
    sapSync: config.SERVICE_BUS_SAP_QUEUE,
  })
}

function requireNamespace(value: string | undefined): string {
  if (!value) throw new Error('SERVICE_BUS_FULLY_QUALIFIED_NAMESPACE no está configurado.')
  return value
}
