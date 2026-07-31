import { PrismaPg } from '@prisma/adapter-pg'
import { createDemoSnapshot, type DemoSnapshot } from '@forjadata/domain'

import type { AppConfig } from '../config.js'
import { Prisma, PrismaClient } from '../generated/prisma/client.js'

const STATE_KEY = 'portfolio'

export interface RuntimeStateLease {
  snapshot: DemoSnapshot
  version: number
}

export interface RuntimeStateStore {
  readonly adapter: 'memory' | 'postgres'
  load(): Promise<RuntimeStateLease>
  save(snapshot: DemoSnapshot, expectedVersion: number): Promise<number>
  reset(): Promise<RuntimeStateLease>
  resetSync?(): void
  close(): Promise<void>
}

export class RuntimeStateConflictError extends Error {
  constructor() {
    super('El estado cambió durante la operación; vuelve a intentarlo con datos actualizados.')
    this.name = 'RuntimeStateConflictError'
  }
}

export class MemoryRuntimeStateStore implements RuntimeStateStore {
  readonly adapter = 'memory' as const
  #snapshot = createDemoSnapshot()
  #version = 1

  async load(): Promise<RuntimeStateLease> {
    return { snapshot: structuredClone(this.#snapshot), version: this.#version }
  }

  async save(snapshot: DemoSnapshot, expectedVersion: number): Promise<number> {
    if (expectedVersion !== this.#version) throw new RuntimeStateConflictError()
    this.#snapshot = structuredClone(snapshot)
    this.#version += 1
    return this.#version
  }

  async reset(): Promise<RuntimeStateLease> {
    this.resetSync()
    return this.load()
  }

  resetSync(): void {
    this.#snapshot = createDemoSnapshot()
    this.#version += 1
  }

  async close(): Promise<void> {}
}

export class PostgresRuntimeStateStore implements RuntimeStateStore {
  readonly adapter = 'postgres' as const
  #initialization: Promise<void> | undefined

  constructor(private readonly prisma: PrismaClient) {}

  async load(): Promise<RuntimeStateLease> {
    await this.ensureSchema()
    const state = await this.prisma.runtimeState.upsert({
      where: { key: STATE_KEY },
      create: {
        key: STATE_KEY,
        schemaVersion: 2,
        snapshot: toJson(createDemoSnapshot()),
      },
      update: {},
    })
    return {
      snapshot: fromJson(state.snapshot),
      version: state.version,
    }
  }

  async save(snapshot: DemoSnapshot, expectedVersion: number): Promise<number> {
    await this.ensureSchema()
    const result = await this.prisma.runtimeState.updateMany({
      where: { key: STATE_KEY, version: expectedVersion },
      data: {
        snapshot: toJson(snapshot),
        schemaVersion: snapshot.schemaVersion,
        version: { increment: 1 },
      },
    })
    if (result.count !== 1) throw new RuntimeStateConflictError()
    return expectedVersion + 1
  }

  async reset(): Promise<RuntimeStateLease> {
    await this.ensureSchema()
    const snapshot = createDemoSnapshot()
    const state = await this.prisma.runtimeState.upsert({
      where: { key: STATE_KEY },
      create: {
        key: STATE_KEY,
        schemaVersion: snapshot.schemaVersion,
        snapshot: toJson(snapshot),
      },
      update: {
        schemaVersion: snapshot.schemaVersion,
        snapshot: toJson(snapshot),
        version: { increment: 1 },
      },
    })
    return { snapshot, version: state.version }
  }

  async close(): Promise<void> {
    await this.prisma.$disconnect()
  }

  private async ensureSchema(): Promise<void> {
    this.#initialization ??= this.prisma
      .$executeRawUnsafe(
        `
        CREATE TABLE IF NOT EXISTS "RuntimeState" (
          "key" TEXT NOT NULL,
          "schemaVersion" INTEGER NOT NULL,
          "snapshot" JSONB NOT NULL,
          "version" INTEGER NOT NULL DEFAULT 1,
          "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "RuntimeState_pkey" PRIMARY KEY ("key")
        )
      `,
      )
      .then(() => undefined)

    try {
      await this.#initialization
    } catch (error) {
      this.#initialization = undefined
      throw error
    }
  }
}

export function createRuntimeStateStore(config: AppConfig): RuntimeStateStore {
  if (config.DATABASE_MODE === 'memory') return new MemoryRuntimeStateStore()
  const adapter = new PrismaPg({ connectionString: config.DATABASE_URL })
  return new PostgresRuntimeStateStore(new PrismaClient({ adapter }))
}

function toJson(snapshot: DemoSnapshot): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(snapshot)) as Prisma.InputJsonValue
}

function fromJson(value: Prisma.JsonValue): DemoSnapshot {
  const candidate = JSON.parse(JSON.stringify(value)) as Partial<DemoSnapshot>
  if (
    candidate.schemaVersion !== 2 ||
    !Array.isArray(candidate.requests) ||
    !Array.isArray(candidate.materials)
  ) {
    throw new Error('El snapshot persistido no cumple el contrato de estado versión 2.')
  }
  return candidate as DemoSnapshot
}
