import { loadConfig } from '@forjadata/config'
import { describe, expect, it, vi } from 'vitest'

import {
  AzureCommunicationNotificationEmail,
  DisabledNotificationEmail,
  LoggingNotificationEmail,
  type NotificationEmailMessage,
} from './notification-email.js'

const message: NotificationEmailMessage = {
  template: 'PROCESSING_COMPLETED',
  subject: 'Material <validado>',
  text: 'La revisión está lista.',
  link: 'https://forjadata.example/app/requests/req-1?a=1&b=2',
  correlationId: 'corr-email-test',
}

describe('notification email contract', () => {
  it('etiqueta explícitamente los modos disabled y log', async () => {
    const disabled = new DisabledNotificationEmail()
    const logging = new LoggingNotificationEmail()

    await expect(disabled.send(message)).resolves.toMatchObject({ status: 'disabled' })
    await expect(disabled.healthCheck()).resolves.toMatchObject({
      mode: 'disabled',
      status: 'unconfigured',
    })
    await expect(logging.send(message)).resolves.toMatchObject({ status: 'logged' })
    await expect(logging.healthCheck()).resolves.toMatchObject({
      mode: 'simulator',
      status: 'healthy',
    })
  })

  it('envía mediante el contrato real de Azure con contenido escapado', async () => {
    const pollUntilDone = vi.fn().mockResolvedValue({
      status: 'Succeeded',
      id: 'azure-email-message-1',
    })
    const beginSend = vi.fn().mockResolvedValue({ pollUntilDone })
    const adapter = new AzureCommunicationNotificationEmail(azureConfig(), { beginSend } as never)

    await expect(adapter.send(message)).resolves.toEqual({
      status: 'sent',
      providerMessageId: 'azure-email-message-1',
      errorCode: null,
    })
    expect(beginSend).toHaveBeenCalledWith(
      expect.objectContaining({
        senderAddress: 'DoNotReply@forjadata.azurecomm.net',
        recipients: { to: [{ address: 'portfolio@example.com' }] },
        content: expect.objectContaining({
          subject: 'Material <validado>',
          html: expect.stringContaining('Material &lt;validado&gt;'),
        }),
      }),
      expect.objectContaining({ abortSignal: expect.any(AbortSignal) }),
    )
    expect(pollUntilDone).toHaveBeenCalledWith({
      abortSignal: expect.any(AbortSignal),
    })
    await expect(adapter.healthCheck()).resolves.toMatchObject({
      mode: 'real',
      status: 'healthy',
    })
  })

  it('degrada sin romper el proceso cuando Azure rechaza el envío', async () => {
    const adapter = new AzureCommunicationNotificationEmail(azureConfig(), {
      beginSend: vi.fn().mockRejectedValue(new Error('service unavailable')),
    } as never)

    await expect(adapter.send(message)).resolves.toMatchObject({
      status: 'failed',
      errorCode: 'Error',
    })
    await expect(adapter.healthCheck()).resolves.toMatchObject({
      mode: 'real',
      status: 'degraded',
    })
  })
})

function azureConfig() {
  return loadConfig({
    NODE_ENV: 'test',
    EMAIL_MODE: 'azure-communication-services',
    AZURE_COMMUNICATION_EMAIL_ENDPOINT: 'https://forjadata.eastus.communication.azure.com',
    AZURE_COMMUNICATION_EMAIL_SENDER: 'DoNotReply@forjadata.azurecomm.net',
    NOTIFICATION_EMAIL_RECIPIENT: 'portfolio@example.com',
  })
}
