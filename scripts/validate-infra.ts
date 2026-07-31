import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import { resolve } from 'node:path'

const execFileAsync = promisify(execFile)
const root = resolve(import.meta.dirname, '..')
const requiredFiles = [
  'azure.yaml',
  'infra/main.bicep',
  'infra/main.parameters.json',
  'infra/modules/app-insights.bicep',
  'infra/modules/document-intelligence.bicep',
  'infra/modules/function-app.bicep',
  'infra/modules/key-vault.bicep',
  'infra/modules/openai.bicep',
  'infra/modules/postgres.bicep',
  'infra/modules/service-bus.bicep',
  'infra/modules/static-web-app.bicep',
  'infra/modules/storage.bicep',
] as const

const contents = new Map<string, string>()
for (const file of requiredFiles) {
  contents.set(file, await readFile(resolve(root, file), 'utf8'))
}

const allBicep = [...contents.entries()]
  .filter(([file]) => file.endsWith('.bicep'))
  .map(([, content]) => content)
  .join('\n')
const main = required('infra/main.bicep')
const functions = required('infra/modules/function-app.bicep')
const storage = required('infra/modules/storage.bicep')
const serviceBus = required('infra/modules/service-bus.bicep')
const postgres = required('infra/modules/postgres.bicep')
const staticWebApp = required('infra/modules/static-web-app.bicep')
const parameters = JSON.parse(required('infra/main.parameters.json')) as {
  parameters?: Record<string, { value?: string }>
}

assertIncludes(main, "targetScope = 'subscription'", 'subscription-scoped entry point')
assertIncludes(main, "name: 'FC1'", 'Flex Consumption FC1')
assertIncludes(main, 'maximumInstanceCount: 3', 'bounded Functions scale')
assertIncludes(main, "SAP_MODE: 'disabled'", 'honest disabled SAP cloud mode')
assertIncludes(
  functions,
  'keyVaultReferenceIdentity: identityResourceId',
  'Key Vault UAMI reference identity',
)
assertIncludes(functions, 'AzureWebJobsStorage__accountName:', 'storage account identity prefix')
assertIncludes(functions, "AzureWebJobsStorage__credential: 'managedidentity'", 'storage UAMI')
assertIncludes(functions, 'AzureWebJobsStorage__clientId:', 'storage UAMI client ID')
assertIncludes(
  main,
  'ServiceBusConnection__fullyQualifiedNamespace:',
  'Service Bus namespace setting',
)
assertIncludes(main, "ServiceBusConnection__credential: 'managedidentity'", 'Service Bus UAMI')
assertIncludes(main, 'ServiceBusConnection__clientId:', 'Service Bus UAMI client ID')
assertIncludes(storage, "skuName: 'Standard_LRS'", 'LRS storage')
assertIncludes(storage, 'allowSharedKeyAccess: false', 'RBAC-only storage')
assertIncludes(
  storage,
  "'974c5e8b-45b9-4653-ba55-5f855dd0fb88'",
  'Storage Queue Data Contributor role',
)
assertIncludes(
  storage,
  "'0a9a7e1f-b9d0-4cc4-a60d-0319b160aaa3'",
  'Storage Table Data Contributor role',
)
assertIncludes(serviceBus, "name: 'Basic'", 'Service Bus Basic')
assertIncludes(serviceBus, 'disableLocalAuth: true', 'RBAC-only Service Bus')
assertIncludes(postgres, "skuName: 'Standard_B1ms'", 'PostgreSQL free-benefit-compatible SKU')
assertIncludes(postgres, 'storageSizeGB: 32', 'PostgreSQL 32 GiB free-benefit limit')
assertIncludes(postgres, "highAvailability: 'Disabled'", 'no paid high availability')
assertIncludes(staticWebApp, "sku: 'Free'", 'Static Web Apps Free')

for (const forbidden of [
  'allowSharedKeyAccess: true',
  "name: 'Premium'",
  "name: 'Standard_S1'",
  "name: 'Y1'",
  '0dd0da04-dfdb-4ade-9582-f21dae544aea',
  '7480b2da-d055-4ab0-8f0e-22ba8316c329',
]) {
  if (allBicep.includes(forbidden)) {
    throw new Error(`Forbidden infrastructure value found: ${forbidden}`)
  }
}

for (const parameterName of [
  'environmentName',
  'location',
  'databaseLocation',
  'entraTenantId',
  'entraApiClientId',
  'entraSpaClientId',
  'deployerPrincipalId',
]) {
  const value = parameters.parameters?.[parameterName]?.value
  if (!value?.startsWith('${') || !value.endsWith('}')) {
    throw new Error(`AZD parameter ${parameterName} must come from an environment placeholder.`)
  }
}

const bicepFile = resolve(root, 'infra/main.bicep')
if (process.platform === 'win32') {
  await execFileAsync(
    process.env.ComSpec ?? 'C:\\Windows\\System32\\cmd.exe',
    ['/d', '/s', '/c', 'az bicep build --file infra/main.bicep --stdout'],
    {
      cwd: root,
      maxBuffer: 20 * 1024 * 1024,
    },
  )
} else {
  await execFileAsync('az', ['bicep', 'build', '--file', bicepFile, '--stdout'], {
    cwd: root,
    maxBuffer: 20 * 1024 * 1024,
  })
}

console.info(
  `Infrastructure valid: ${requiredFiles.length} files, Bicep compiled, UAMI and zero-personal-cost guardrails present.`,
)

function required(file: string): string {
  const value = contents.get(file)
  if (value === undefined) throw new Error(`Required infrastructure file missing: ${file}`)
  return value
}

function assertIncludes(content: string, expected: string, description: string): void {
  if (!content.includes(expected)) {
    throw new Error(`Infrastructure is missing ${description}: ${expected}`)
  }
}
