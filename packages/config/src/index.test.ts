import { describe, expect, it } from 'vitest'

import { loadConfig } from './index'

describe('configuración segura por defecto', () => {
  it('arranca exclusivamente con proveedores demo sin secretos', () => {
    const config = loadConfig({})

    expect(config.AUTH_MODE).toBe('demo')
    expect(config.AI_MODE).toBe('mock')
    expect(config.SAP_MODE).toBe('simulator')
    expect(config.EMAIL_MODE).toBe('log')
    expect(config.CORS_ALLOWED_ORIGINS).toEqual(['http://localhost:5173'])
  })

  it('impide activar Entra con datos incompletos', () => {
    expect(() => loadConfig({ AUTH_MODE: 'entra' })).toThrow(/ENTRA_TENANT_ID/)
  })

  it('acepta Entra single-tenant y normaliza audiencias', () => {
    const config = loadConfig({
      AUTH_MODE: 'entra',
      ENTRA_TENANT_ID: '7480b2da-d055-4ab0-8f0e-22ba8316c329',
      ENTRA_API_CLIENT_ID: '11111111-1111-4111-8111-111111111111',
      ENTRA_ALLOWED_AUDIENCES:
        'api://11111111-1111-4111-8111-111111111111, 11111111-1111-4111-8111-111111111111',
    })

    expect(config.ENTRA_ALLOWED_AUDIENCES).toEqual([
      'api://11111111-1111-4111-8111-111111111111',
      '11111111-1111-4111-8111-111111111111',
    ])
  })

  it('exige una identidad utilizable al activar Blob y Service Bus', () => {
    expect(() => loadConfig({ STORAGE_MODE: 'azure' })).toThrow(/AZURE_STORAGE_ACCOUNT_NAME/)
    expect(() => loadConfig({ QUEUE_MODE: 'service-bus' })).toThrow(
      /SERVICE_BUS_FULLY_QUALIFIED_NAMESPACE/,
    )
  })

  it('impide desplegar simuladores cuando se exige el perfil cloud real', () => {
    expect(() => loadConfig({ ENFORCE_REAL_INTEGRATIONS: 'true' })).toThrow(
      /ENFORCE_REAL_INTEGRATIONS/,
    )
  })

  it('exige endpoint, remitente y destinatario para email real', () => {
    expect(() =>
      loadConfig({
        EMAIL_MODE: 'azure-communication-services',
      }),
    ).toThrow(/AZURE_COMMUNICATION_EMAIL_ENDPOINT/)

    expect(
      loadConfig({
        EMAIL_MODE: 'azure-communication-services',
        AZURE_COMMUNICATION_EMAIL_ENDPOINT: 'https://forjadata.communication.azure.com',
        AZURE_COMMUNICATION_EMAIL_SENDER: 'DoNotReply@forjadata.azurecomm.net',
        NOTIFICATION_EMAIL_RECIPIENT: 'portfolio@example.com',
      }).EMAIL_MODE,
    ).toBe('azure-communication-services')
  })
})
