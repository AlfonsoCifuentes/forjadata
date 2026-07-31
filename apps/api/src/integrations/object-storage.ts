import { createHash } from 'node:crypto'

import { BlobServiceClient, type ContainerClient } from '@azure/storage-blob'
import type { IntegrationHealth } from '@forjadata/contracts'
import type { ObjectStorage, ObjectStoragePutInput, StoredObject } from '@forjadata/domain'

import type { AppConfig } from '../config.js'
import { createAzureCredential } from './azure-credential.js'

export class MemoryObjectStorage implements ObjectStorage {
  readonly adapter = 'memory' as const
  readonly #objects = new Map<string, Uint8Array>()

  async put(input: ObjectStoragePutInput): Promise<StoredObject> {
    const bytes = Uint8Array.from(input.bytes)
    this.#objects.set(objectKey(input.container, input.path), bytes)
    return {
      container: input.container,
      path: input.path,
      contentType: input.contentType,
      size: bytes.byteLength,
      etag: `"${createHash('sha256').update(bytes).digest('hex')}"`,
      metadata: { ...input.metadata },
    }
  }

  async get(container: string, path: string): Promise<Uint8Array> {
    const value = this.#objects.get(objectKey(container, path))
    if (!value) throw new Error(`No existe el objeto ${container}/${path}.`)
    return Uint8Array.from(value)
  }

  async delete(container: string, path: string): Promise<void> {
    this.#objects.delete(objectKey(container, path))
  }

  async healthCheck(): Promise<IntegrationHealth> {
    return {
      name: 'Azure Blob Storage',
      mode: 'demo',
      status: 'healthy',
      checkedAt: new Date().toISOString(),
      message: 'Adaptador de memoria explícito para ejecución local y tests.',
    }
  }
}

export class AzureBlobObjectStorage implements ObjectStorage {
  readonly adapter: 'azurite' | 'azure'
  readonly #client: BlobServiceClient
  readonly #healthContainer: string

  constructor(options: {
    client: BlobServiceClient
    adapter: 'azurite' | 'azure'
    healthContainer: string
  }) {
    this.#client = options.client
    this.adapter = options.adapter
    this.#healthContainer = options.healthContainer
  }

  async put(input: ObjectStoragePutInput): Promise<StoredObject> {
    validateBlobAddress(input.container, input.path)
    const container = await this.#container(input.container)
    const blob = container.getBlockBlobClient(input.path)
    const response = await blob.uploadData(input.bytes, {
      blobHTTPHeaders: { blobContentType: input.contentType },
      ...(input.metadata ? { metadata: normalizeMetadata(input.metadata) } : {}),
    })
    return {
      container: input.container,
      path: input.path,
      contentType: input.contentType,
      size: input.bytes.byteLength,
      etag: response.etag ?? null,
      metadata: { ...input.metadata },
    }
  }

  async get(containerName: string, path: string): Promise<Uint8Array> {
    validateBlobAddress(containerName, path)
    const container = await this.#container(containerName)
    const buffer = await container.getBlobClient(path).downloadToBuffer()
    return Uint8Array.from(buffer)
  }

  async delete(containerName: string, path: string): Promise<void> {
    validateBlobAddress(containerName, path)
    const container = await this.#container(containerName)
    await container.deleteBlob(path, { deleteSnapshots: 'include' })
  }

  async healthCheck(): Promise<IntegrationHealth> {
    const checkedAt = new Date().toISOString()
    try {
      const exists = await this.#client.getContainerClient(this.#healthContainer).exists()
      return {
        name: 'Azure Blob Storage',
        mode: this.adapter === 'azure' ? 'real' : 'simulator',
        status: exists ? 'healthy' : 'degraded',
        checkedAt,
        message: exists
          ? `Contenedor ${this.#healthContainer} accesible mediante identidad configurada.`
          : `El contenedor ${this.#healthContainer} todavía no existe.`,
      }
    } catch (error) {
      return {
        name: 'Azure Blob Storage',
        mode: this.adapter === 'azure' ? 'real' : 'simulator',
        status: 'degraded',
        checkedAt,
        message: healthErrorMessage(error),
      }
    }
  }

  async #container(name: string): Promise<ContainerClient> {
    const container = this.#client.getContainerClient(name)
    if (this.adapter === 'azurite') await container.createIfNotExists()
    return container
  }
}

export function createObjectStorage(config: AppConfig): ObjectStorage {
  if (config.STORAGE_MODE === 'local') return new MemoryObjectStorage()
  if (config.AZURE_STORAGE_CONNECTION_STRING) {
    return new AzureBlobObjectStorage({
      client: BlobServiceClient.fromConnectionString(config.AZURE_STORAGE_CONNECTION_STRING),
      adapter: config.STORAGE_MODE,
      healthContainer: config.BLOB_DOCUMENTS_CONTAINER,
    })
  }
  if (!config.AZURE_STORAGE_ACCOUNT_NAME) {
    throw new Error('AZURE_STORAGE_ACCOUNT_NAME no está configurado.')
  }
  return new AzureBlobObjectStorage({
    client: new BlobServiceClient(
      `https://${config.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
      createAzureCredential(),
    ),
    adapter: 'azure',
    healthContainer: config.BLOB_DOCUMENTS_CONTAINER,
  })
}

function objectKey(container: string, path: string): string {
  validateBlobAddress(container, path)
  return `${container}/${path}`
}

function validateBlobAddress(container: string, path: string): void {
  if (!/^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/.test(container)) {
    throw new Error(`Nombre de contenedor no válido: ${container}.`)
  }
  if (path.length === 0 || path.startsWith('/') || path.includes('\\') || path.includes('..')) {
    throw new Error('La ruta de blob no es válida.')
  }
}

function normalizeMetadata(metadata: Readonly<Record<string, string>>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      key.toLocaleLowerCase('en').replaceAll(/[^a-z0-9_]/g, '_'),
      value.slice(0, 1_024),
    ]),
  )
}

function healthErrorMessage(error: unknown): string {
  const reason = error instanceof Error ? error.message : 'error desconocido'
  return `Blob no está accesible: ${reason.slice(0, 240)}`
}
