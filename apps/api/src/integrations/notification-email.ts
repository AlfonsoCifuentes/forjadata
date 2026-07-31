import { EmailClient } from '@azure/communication-email'
import type { IntegrationHealth } from '@forjadata/contracts'

import type { AppConfig } from '../config.js'
import { logger } from '../logger.js'
import { createAzureCredential } from './azure-credential.js'

export interface NotificationEmailMessage {
  template: 'PROCESSING_COMPLETED' | 'PROCESSING_FAILED' | 'SAP_SYNC_COMPLETED' | 'SAP_SYNC_FAILED'
  subject: string
  text: string
  link?: string
  correlationId: string
}

export interface EmailDeliveryResult {
  status: 'sent' | 'logged' | 'disabled' | 'failed'
  providerMessageId: string | null
  errorCode: string | null
}

export interface NotificationEmailPort {
  readonly mode: 'disabled' | 'log' | 'azure-communication-services'
  send(message: NotificationEmailMessage): Promise<EmailDeliveryResult>
  healthCheck(): Promise<IntegrationHealth>
}

export class DisabledNotificationEmail implements NotificationEmailPort {
  readonly mode = 'disabled' as const

  async send(): Promise<EmailDeliveryResult> {
    return { status: 'disabled', providerMessageId: null, errorCode: null }
  }

  async healthCheck(): Promise<IntegrationHealth> {
    return health(
      'disabled',
      'unconfigured',
      'El canal email está deshabilitado; las notificaciones in-app siguen activas.',
    )
  }
}

export class LoggingNotificationEmail implements NotificationEmailPort {
  readonly mode = 'log' as const

  async send(message: NotificationEmailMessage): Promise<EmailDeliveryResult> {
    logger.info({
      message: 'Simulated notification email',
      emailMode: 'log',
      template: message.template,
      correlationId: message.correlationId,
    })
    return {
      status: 'logged',
      providerMessageId: `email-log-${message.correlationId}`,
      errorCode: null,
    }
  }

  async healthCheck(): Promise<IntegrationHealth> {
    return health(
      'simulator',
      'healthy',
      'Email simulado mediante log estructurado; no se envían mensajes fuera del equipo.',
    )
  }
}

export class AzureCommunicationNotificationEmail implements NotificationEmailPort {
  readonly mode = 'azure-communication-services' as const
  readonly #client: Pick<EmailClient, 'beginSend'>
  #lastDelivery: 'none' | 'sent' | 'failed' = 'none'

  constructor(
    private readonly config: AppConfig,
    client?: Pick<EmailClient, 'beginSend'>,
  ) {
    this.#client =
      client ??
      new EmailClient(
        requireValue(config.AZURE_COMMUNICATION_EMAIL_ENDPOINT, 'email endpoint'),
        createAzureCredential(),
      )
  }

  async send(message: NotificationEmailMessage): Promise<EmailDeliveryResult> {
    const abortSignal = AbortSignal.timeout(this.config.EMAIL_TIMEOUT_MS)
    try {
      const poller = await this.#client.beginSend(
        {
          senderAddress: requireValue(this.config.AZURE_COMMUNICATION_EMAIL_SENDER, 'email sender'),
          recipients: {
            to: [
              {
                address: requireValue(this.config.NOTIFICATION_EMAIL_RECIPIENT, 'email recipient'),
              },
            ],
          },
          content: {
            subject: message.subject,
            plainText: `${message.text}${message.link ? `\n\n${message.link}` : ''}`,
            html: renderHtml(message),
          },
        },
        { abortSignal },
      )
      const result = await poller.pollUntilDone({ abortSignal })
      this.#lastDelivery = result.status === 'Succeeded' ? 'sent' : 'failed'
      return {
        status: result.status === 'Succeeded' ? 'sent' : 'failed',
        providerMessageId: result.id ?? null,
        errorCode: result.error?.code ?? null,
      }
    } catch (error) {
      this.#lastDelivery = 'failed'
      logger.warn({
        message: 'Notification email delivery failed',
        emailMode: this.mode,
        template: message.template,
        correlationId: message.correlationId,
        error: error instanceof Error ? error.name : 'UnknownError',
      })
      return {
        status: 'failed',
        providerMessageId: null,
        errorCode: error instanceof Error ? error.name : 'UnknownError',
      }
    }
  }

  async healthCheck(): Promise<IntegrationHealth> {
    if (this.#lastDelivery === 'sent') {
      return health(
        'real',
        'healthy',
        'Último email entregado mediante Azure Communication Services.',
      )
    }
    if (this.#lastDelivery === 'failed') {
      return health(
        'real',
        'degraded',
        'Azure Communication Services está configurado, pero el último envío falló.',
      )
    }
    return health(
      'real',
      'degraded',
      'Azure Communication Services está configurado; aún no se ha ejecutado un envío verificable.',
    )
  }
}

export function createNotificationEmail(config: AppConfig): NotificationEmailPort {
  if (config.EMAIL_MODE === 'disabled') return new DisabledNotificationEmail()
  if (config.EMAIL_MODE === 'log') return new LoggingNotificationEmail()
  return new AzureCommunicationNotificationEmail(config)
}

function health(
  mode: IntegrationHealth['mode'],
  status: IntegrationHealth['status'],
  message: string,
): IntegrationHealth {
  return {
    name: 'Email',
    mode,
    status,
    checkedAt: new Date().toISOString(),
    message,
  }
}

function renderHtml(message: NotificationEmailMessage): string {
  const link = message.link
    ? `<p><a href="${escapeHtml(message.link)}">Abrir en Forjadata</a></p>`
    : ''
  return `<main><h1>${escapeHtml(message.subject)}</h1><p>${escapeHtml(message.text)}</p>${link}<hr><small>Forjadata · notificación transaccional</small></main>`
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function requireValue(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing ${name}.`)
  return value
}
