import type { IntegrationHealth } from '@forjadata/contracts'

import { EntraTokenVerifier } from '../auth/entra-token-verifier.js'
import { readConfig } from '../config.js'
import {
  createDocumentExtractionProvider,
  createMaterialIntelligenceProvider,
} from './ai-providers.js'
import { createMessagePublisher } from './message-publisher.js'
import { createNotificationEmail } from './notification-email.js'
import { createObjectStorage } from './object-storage.js'
import { createRuntimeStateStore } from '../persistence/runtime-state-store.js'
import { createSapGateway } from './sap-gateway.js'

export const runtimeConfig = readConfig()
export const objectStorage = createObjectStorage(runtimeConfig)
export const messagePublisher = createMessagePublisher(runtimeConfig)
export const notificationEmail = createNotificationEmail(runtimeConfig)
export const runtimeStateStore = createRuntimeStateStore(runtimeConfig)
export const sapGateway = createSapGateway(runtimeConfig)
export const documentExtractionProvider = createDocumentExtractionProvider(runtimeConfig)
export const materialIntelligenceProvider = createMaterialIntelligenceProvider(runtimeConfig)
export const entraTokenVerifier =
  runtimeConfig.AUTH_MODE === 'entra' ? new EntraTokenVerifier(runtimeConfig) : null

export async function externalIntegrationHealth(): Promise<IntegrationHealth[]> {
  return Promise.all([
    objectStorage.healthCheck(),
    messagePublisher.healthCheck(),
    notificationEmail.healthCheck(),
    ...(runtimeConfig.DOCUMENT_MODE === 'azure' ? [documentExtractionProvider.healthCheck()] : []),
    ...(runtimeConfig.AI_MODE === 'azure' ? [materialIntelligenceProvider.healthCheck()] : []),
    ...(runtimeConfig.SAP_MODE === 'simulator' ? [] : [sapGateway.healthCheck()]),
    ...(entraTokenVerifier ? [entraTokenVerifier.healthCheck()] : []),
  ])
}
