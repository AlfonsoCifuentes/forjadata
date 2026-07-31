import { BlobServiceClient } from '@azure/storage-blob'
import type { ObjectStorage } from '@forjadata/domain'
import { describe, expect, it } from 'vitest'

import { AzureBlobObjectStorage, MemoryObjectStorage } from './object-storage.js'

objectStorageContract('memory', () => new MemoryObjectStorage())

const azuriteConnection = process.env.AZURITE_CONNECTION_STRING
if (azuriteConnection) {
  describe('contrato ObjectStorage: Azurite', () => {
    const container = `contract-${crypto.randomUUID()}`
    const client = BlobServiceClient.fromConnectionString(azuriteConnection)
    const storage = new AzureBlobObjectStorage({
      client,
      adapter: 'azurite',
      healthContainer: container,
    })

    objectStorageContract('azurite', () => storage, container)

    it('expone una comprobación de salud contra el emulador real', async () => {
      await client.getContainerClient(container).createIfNotExists()
      await expect(storage.healthCheck()).resolves.toEqual(
        expect.objectContaining({ mode: 'simulator', status: 'healthy' }),
      )
      await client.getContainerClient(container).deleteIfExists()
    })
  })
} else {
  describe.skip('contrato ObjectStorage: Azurite (requiere emulador)', () => {
    it('se habilita con AZURITE_CONNECTION_STRING', () => {})
  })
}

function objectStorageContract(
  adapter: string,
  factory: () => ObjectStorage,
  container = 'documents',
): void {
  describe(`contrato ObjectStorage: ${adapter}`, () => {
    it('escribe, lee y elimina bytes sin alterarlos', async () => {
      const storage = factory()
      const path = `contract/${crypto.randomUUID()}.txt`
      const bytes = new TextEncoder().encode('Forjadata contract')
      const stored = await storage.put({
        container,
        path,
        bytes,
        contentType: 'text/plain',
        metadata: { correlationId: crypto.randomUUID() },
      })

      expect(stored).toEqual(
        expect.objectContaining({
          container,
          path,
          contentType: 'text/plain',
          size: bytes.byteLength,
        }),
      )
      await expect(storage.get(container, path)).resolves.toEqual(bytes)
      await storage.delete(container, path)
      await expect(storage.get(container, path)).rejects.toThrow()
    })

    it('rechaza rutas que puedan escapar de la dirección lógica', async () => {
      await expect(
        factory().put({
          container,
          path: '../secret',
          bytes: new Uint8Array(),
          contentType: 'application/octet-stream',
        }),
      ).rejects.toThrow(/ruta/)
    })
  })
}
