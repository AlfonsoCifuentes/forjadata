import 'dotenv/config'

import { fakerES as faker } from '@faker-js/faker'
import { PrismaPg } from '@prisma/adapter-pg'
import { createDemoSnapshot } from '@forjadata/domain'

import { Prisma, PrismaClient } from '../apps/api/src/generated/prisma/client'

const connectionString =
  process.env.DATABASE_URL ?? 'postgresql://forjadata:forjadata@localhost:5432/forjadata'
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })
const seedSize = process.env.DEMO_SEED_SIZE === 'large' ? 'large' : 'small'
const materialCount = seedSize === 'large' ? 50_000 : 250
const requestCount = seedSize === 'large' ? 1_500 : 80

faker.seed(20_260_730)

const categories = [
  'Motores eléctricos',
  'Bombas',
  'Válvulas',
  'Rodamientos',
  'Tornillería',
  'Sensores',
  'Cables',
  'Equipos de protección',
  'Lubricantes',
  'Componentes electrónicos',
]
const manufacturers = ['Forja Industrial', 'Siemens', 'SKF', 'ABB', 'Festo']

async function main(): Promise<void> {
  await prisma.runtimeState.deleteMany()
  await prisma.qualityResult.deleteMany()
  await prisma.qualityRule.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.auditEvent.deleteMany()
  await prisma.sapSyncJob.deleteMany()
  await prisma.documentExtraction.deleteMany()
  await prisma.document.deleteMany()
  await prisma.aiSuggestion.deleteMany()
  await prisma.aiRun.deleteMany()
  await prisma.materialAttributeValue.deleteMany()
  await prisma.duplicateCase.deleteMany()
  await prisma.workflowTransition.deleteMany()
  await prisma.workflowInstance.deleteMany()
  await prisma.materialRequest.deleteMany()
  await prisma.material.deleteMany()
  await prisma.attributeDefinition.deleteMany()
  await prisma.category.deleteMany()
  await prisma.userOrganizationRole.deleteMany()
  await prisma.user.deleteMany()
  await prisma.organization.deleteMany()

  const organization = await prisma.organization.create({
    data: {
      name: 'Forja Industrial Demo',
      slug: 'forja-industrial-demo',
    },
  })

  const roles = [
    ['solicitante@forjadata.demo', 'Lucía Martín', 'requester'],
    ['steward@forjadata.demo', 'Diego Vega', 'reviewer'],
    ['sap@forjadata.demo', 'Elena Santos', 'sap_specialist'],
    ['analista@forjadata.demo', 'Hugo Navarro', 'business_analyst'],
    ['uat@forjadata.demo', 'Marta Gil', 'uat_tester'],
    ['admin@forjadata.demo', 'Álex Robles', 'admin'],
  ] as const

  const users = new Map<string, { id: string }>()
  for (const [email, displayName, role] of roles) {
    const user = await prisma.user.create({
      data: {
        email,
        displayName,
        lastLoginAt: new Date('2026-07-30T16:00:00.000Z'),
        organizations: {
          create: {
            organizationId: organization.id,
            role,
          },
        },
      },
      select: { id: true },
    })
    users.set(role, user)
  }

  const categoryRecords = []
  for (const [index, name] of categories.entries()) {
    const category = await prisma.category.create({
      data: {
        organizationId: organization.id,
        name,
        slug: slugify(name),
        description: `Categoría sintética ${name}.`,
        icon: 'box',
        attributes: {
          create: [
            {
              code: 'MANUFACTURER',
              label: 'Fabricante',
              description: 'Fabricante normalizado.',
              dataType: 'text',
              allowedUnits: [],
              required: true,
              order: 1,
              validationSchema: { minLength: 2 },
              aliases: ['marca', 'fabricante'],
              sapField: 'Manufacturer',
            },
            {
              code: 'MODEL',
              label: 'Modelo',
              description: 'Referencia del fabricante.',
              dataType: 'text',
              allowedUnits: [],
              required: true,
              order: 2,
              validationSchema: { minLength: 2 },
              aliases: ['modelo', 'referencia'],
              sapField: 'ManufacturersProductNumber',
            },
          ],
        },
      },
    })
    categoryRecords.push({ ...category, index })
  }

  const motorCategory = categoryRecords.find((category) => category.name === 'Motores eléctricos')
  if (!motorCategory) throw new Error('Categoría de motores ausente.')
  await prisma.qualityRule.createMany({
    data: [
      {
        organizationId: organization.id,
        code: 'REQUIRED_MANUFACTURER',
        name: 'Fabricante obligatorio',
        description: 'Todo material gobernado debe identificar su fabricante.',
        severity: 'ERROR',
        expressionJson: {
          combinator: 'ALL',
          conditions: [{ field: 'manufacturer', operator: 'required' }],
        },
        message: 'Informa un fabricante antes de aprobar el material.',
      },
      {
        organizationId: organization.id,
        categoryId: motorCategory.id,
        code: 'MOTOR_POWER_RANGE',
        name: 'Potencia de motor plausible',
        description: 'Valida que la potencia normalizada esté entre 0,1 y 1.000 kW.',
        severity: 'WARNING',
        expressionJson: {
          combinator: 'ALL',
          conditions: [
            {
              field: 'attributes.POWER',
              operator: 'between',
              value: 0.1,
              secondValue: 1_000,
            },
          ],
        },
        message: 'La potencia debe estar entre 0,1 y 1.000 kW.',
      },
    ],
  })

  const materialRows = Array.from({ length: materialCount }, (_, index) => {
    const category = categoryRecords[index % categoryRecords.length]
    if (!category) throw new Error('Categoría de seed ausente.')
    const manufacturer = manufacturers[index % manufacturers.length] ?? 'Forja Industrial'
    return {
      organizationId: organization.id,
      internalCode: `FJ-${String(index + 1).padStart(6, '0')}`,
      sapProductId: index % 5 === 0 ? null : `SAP-${String(index + 10_000).padStart(8, '0')}`,
      shortDescription: `${category.name.slice(0, -1)} industrial serie ${index + 1}`,
      longDescription: faker.commerce.productDescription(),
      categoryId: category.id,
      manufacturer,
      manufacturerPartNumber: `DEMO-${category.index + 1}-${index + 1}`,
      gtin: index % 11 === 0 ? faker.commerce.isbn({ variant: 13 }) : null,
      baseUnit: 'UN',
      status:
        index % 17 === 0
          ? ('SYNC_FAILED' as const)
          : index % 5 === 0
            ? ('IN_REVIEW' as const)
            : ('SYNCED' as const),
      completenessScore: ((74 + (index % 26)) / 100).toFixed(4),
      confidenceScore: ((70 + (index % 29)) / 100).toFixed(4),
      source: 'DEMO',
      version: 1,
    }
  })
  for (let index = 0; index < materialRows.length; index += 1_000) {
    await prisma.material.createMany({
      data: materialRows.slice(index, index + 1_000),
    })
  }

  const requester = users.get('requester')
  const reviewer = users.get('reviewer')
  if (!requester || !reviewer) throw new Error('Usuarios base ausentes.')
  const materialIds = await prisma.material.findMany({
    take: requestCount,
    select: { id: true, categoryId: true },
    orderBy: { internalCode: 'asc' },
  })
  const requestRows = materialIds.map((material, index) => ({
    organizationId: organization.id,
    type: 'CREATE' as const,
    title: `Solicitud demo ${String(index + 1).padStart(3, '0')}`,
    description: 'Solicitud sintética para validar el flujo de gobierno de datos.',
    priority: index % 13 === 0 ? ('HIGH' as const) : ('MEDIUM' as const),
    status:
      index % 7 === 0
        ? ('NEEDS_REVIEW' as const)
        : index % 9 === 0
          ? ('READY_FOR_SAP' as const)
          : ('SYNCED' as const),
    requesterId: requester.id,
    assigneeId: reviewer.id,
    categoryId: material.categoryId,
    processingProgress: 100,
    processingStage: 'READY_FOR_REVIEW',
    dueAt: new Date('2026-08-04T16:00:00.000Z'),
    version: 1,
  }))
  await prisma.materialRequest.createMany({ data: requestRows })

  await prisma.featureFlag.createMany({
    data: [
      { key: 'enableUat', enabled: true, environment: 'demo', payload: {} },
      {
        key: 'enableArchitecturePage',
        enabled: true,
        environment: 'demo',
        payload: {},
      },
      { key: 'enableRealAi', enabled: false, environment: 'demo', payload: {} },
      { key: 'enableSapOData', enabled: false, environment: 'demo', payload: {} },
      { key: 'enable3dViewer', enabled: true, environment: 'demo', payload: {} },
      {
        key: 'enableExperimentalRulesBuilder',
        enabled: true,
        environment: 'demo',
        payload: {},
      },
    ],
  })

  await prisma.runtimeState.create({
    data: {
      key: 'portfolio',
      schemaVersion: 2,
      snapshot: JSON.parse(JSON.stringify(createDemoSnapshot())) as Prisma.InputJsonValue,
    },
  })

  console.info(
    `Forjadata seed "${seedSize}" creado: ${materialCount} materiales, ${requestRows.length} solicitudes y ${categories.length} categorías.`,
  )
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

await main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
