import { createDemoSnapshot } from '@forjadata/domain'
import { describe, expect, it, vi } from 'vitest'

import type { PrismaClient } from '../generated/prisma/client.js'
import {
  MemoryRuntimeStateStore,
  PostgresRuntimeStateStore,
  RuntimeStateConflictError,
} from './runtime-state-store.js'

describe('MemoryRuntimeStateStore contract', () => {
  it('persiste snapshots mediante control optimista de versión', async () => {
    const store = new MemoryRuntimeStateStore()
    const first = await store.load()
    first.snapshot.activeRole = 'admin'

    const nextVersion = await store.save(first.snapshot, first.version)
    const reloaded = await store.load()

    expect(reloaded.version).toBe(nextVersion)
    expect(reloaded.snapshot.activeRole).toBe('admin')
    await expect(store.save(first.snapshot, first.version)).rejects.toBeInstanceOf(
      RuntimeStateConflictError,
    )
  })

  it('restablece el dataset canónico', async () => {
    const store = new MemoryRuntimeStateStore()
    const lease = await store.load()
    lease.snapshot.requests = []
    await store.save(lease.snapshot, lease.version)

    const reset = await store.reset()

    expect(reset.snapshot.requests.length).toBeGreaterThan(0)
  })
})

describe('PostgresRuntimeStateStore bootstrap', () => {
  it('crea idempotentemente la tabla mínima antes de acceder al estado', async () => {
    const snapshot = createDemoSnapshot()
    const executeRaw = vi.fn().mockResolvedValue(0)
    const upsert = vi.fn().mockResolvedValue({ snapshot, version: 1 })
    const updateMany = vi.fn().mockResolvedValue({ count: 1 })
    const disconnect = vi.fn().mockResolvedValue(undefined)
    const prisma = {
      $executeRawUnsafe: executeRaw,
      $disconnect: disconnect,
      runtimeState: { upsert, updateMany },
    } as unknown as PrismaClient
    const store = new PostgresRuntimeStateStore(prisma)

    const lease = await store.load()
    await store.save(lease.snapshot, lease.version)
    await store.reset()
    await store.close()

    expect(executeRaw).toHaveBeenCalledTimes(1)
    expect(executeRaw.mock.calls[0]?.[0]).toContain('CREATE TABLE IF NOT EXISTS "RuntimeState"')
    expect(upsert).toHaveBeenCalledTimes(2)
    expect(updateMany).toHaveBeenCalledTimes(1)
    expect(disconnect).toHaveBeenCalledTimes(1)
  })

  it('permite reintentar el bootstrap tras un fallo transitorio', async () => {
    const snapshot = createDemoSnapshot()
    const executeRaw = vi
      .fn()
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValueOnce(0)
    const prisma = {
      $executeRawUnsafe: executeRaw,
      $disconnect: vi.fn(),
      runtimeState: {
        upsert: vi.fn().mockResolvedValue({ snapshot, version: 1 }),
        updateMany: vi.fn(),
      },
    } as unknown as PrismaClient
    const store = new PostgresRuntimeStateStore(prisma)

    await expect(store.load()).rejects.toThrow('transient')
    await expect(store.load()).resolves.toMatchObject({ version: 1 })
    expect(executeRaw).toHaveBeenCalledTimes(2)
  })
})
