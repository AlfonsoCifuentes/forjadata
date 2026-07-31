import { z } from 'zod'

export const ProviderModeSchema = z.enum(['mock', 'simulator', 'disabled', 'real'])
export type ProviderMode = z.infer<typeof ProviderModeSchema>

const optionalString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().min(1).optional(),
)

const optionalUrl = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.url().optional(),
)

const optionalUuid = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.uuid().optional(),
)

const optionalEmail = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.email().optional(),
)

const booleanFromEnvironment = (defaultValue: boolean) =>
  z
    .enum(['true', 'false'])
    .default(defaultValue ? 'true' : 'false')
    .transform((value) => value === 'true')

const csvFromEnvironment = (defaultValue: string) =>
  z
    .string()
    .default(defaultValue)
    .transform((value) =>
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    )

export const AppConfigSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    APP_ENV: z.string().trim().min(1).default('local'),
    PORT: z.coerce.number().int().min(1).max(65_535).default(7071),
    PUBLIC_APP_URL: z.url().default('http://localhost:5173'),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),

    AUTH_MODE: z.enum(['demo', 'entra']).default('demo'),
    DEMO_ENABLED: booleanFromEnvironment(true),
    ENFORCE_REAL_INTEGRATIONS: booleanFromEnvironment(false),
    ENTRA_TENANT_ID: optionalUuid,
    ENTRA_API_CLIENT_ID: optionalUuid,
    ENTRA_ALLOWED_AUDIENCES: csvFromEnvironment(''),
    ENTRA_REQUIRED_SCOPE: z.string().trim().min(1).default('access_as_user'),
    ENTRA_JWKS_URI: optionalUrl,
    ENTRA_ISSUER: optionalUrl,

    DATABASE_MODE: z.enum(['memory', 'postgres']).default('memory'),
    DATABASE_URL: z
      .string()
      .min(1)
      .default('postgresql://forjadata:forjadata@localhost:5432/forjadata'),

    STORAGE_MODE: z.enum(['local', 'azurite', 'azure']).default('local'),
    AZURE_STORAGE_CONNECTION_STRING: optionalString,
    AZURE_STORAGE_ACCOUNT_NAME: optionalString,
    BLOB_DOCUMENTS_CONTAINER: z.string().trim().min(3).default('documents'),
    BLOB_EXTRACTIONS_CONTAINER: z.string().trim().min(3).default('extractions'),
    BLOB_SAP_PAYLOADS_CONTAINER: z.string().trim().min(3).default('sap-payloads'),
    BLOB_UAT_EVIDENCE_CONTAINER: z.string().trim().min(3).default('uat-evidence'),
    MAX_DOCUMENT_BYTES: z.coerce.number().int().positive().max(50_000_000).default(10_000_000),

    QUEUE_MODE: z.enum(['inline', 'service-bus']).default('inline'),
    AZURE_SERVICE_BUS_CONNECTION_STRING: optionalString,
    SERVICE_BUS_FULLY_QUALIFIED_NAMESPACE: optionalString,
    SERVICE_BUS_DOCUMENT_QUEUE: z.string().trim().min(1).default('document-processing'),
    SERVICE_BUS_SAP_QUEUE: z.string().trim().min(1).default('sap-sync'),

    AI_MODE: z.enum(['mock', 'azure', 'hybrid', 'disabled']).default('mock'),
    DOCUMENT_MODE: z.enum(['mock', 'azure', 'disabled']).default('mock'),
    AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT: optionalUrl,
    AZURE_DOCUMENT_INTELLIGENCE_KEY: optionalString,
    AZURE_OPENAI_ENDPOINT: optionalUrl,
    AZURE_OPENAI_API_KEY: optionalString,
    AZURE_OPENAI_DEPLOYMENT_NAME: optionalString,
    AI_MAX_INPUT_CHARS: z.coerce.number().int().min(1_000).max(200_000).default(30_000),
    AI_MAX_OUTPUT_TOKENS: z.coerce.number().int().min(100).max(8_000).default(1_500),

    SAP_MODE: z.enum(['disabled', 'simulator', 'odata-v2', 'odata-v4']).default('simulator'),
    SAP_BASE_URL: z.url().default('http://localhost:7072'),
    SAP_CLIENT: optionalString,
    SAP_USERNAME: optionalString,
    SAP_PASSWORD: optionalString,
    SAP_API_KEY: optionalString,
    SAP_API_KEY_HEADER: z.string().trim().min(1).default('APIKey'),
    SAP_ODATA_V2_PRODUCT_PATH: z
      .string()
      .trim()
      .min(1)
      .default('/sap/opu/odata/SAP/API_PRODUCT_SRV/A_Product'),
    SAP_ODATA_V4_PRODUCT_PATH: z
      .string()
      .trim()
      .min(1)
      .default('/sap/opu/odata4/sap/api_product/srvd_a2x/sap/product/0002/Product'),
    SAP_PRODUCT_TYPE: z.string().trim().min(1).max(4).default('ROH'),
    SAP_INDUSTRY_SECTOR: z.string().trim().min(1).max(1).default('M'),
    SAP_LANGUAGE: z.string().trim().min(2).max(2).default('EN'),
    SAP_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(60_000).default(10_000),

    EMAIL_MODE: z.enum(['disabled', 'log', 'azure-communication-services']).default('log'),
    AZURE_COMMUNICATION_EMAIL_ENDPOINT: optionalUrl,
    AZURE_COMMUNICATION_EMAIL_SENDER: optionalEmail,
    NOTIFICATION_EMAIL_RECIPIENT: optionalEmail,
    EMAIL_TIMEOUT_MS: z.coerce.number().int().min(5_000).max(60_000).default(15_000),

    APPLICATIONINSIGHTS_CONNECTION_STRING: optionalString,
    APPLICATIONINSIGHTS_SAMPLING_RATIO: z.coerce.number().min(0.01).max(1).default(0.1),
    APPLICATIONINSIGHTS_TRACES_PER_SECOND: z.coerce.number().int().min(1).max(20).default(2),
    CORS_ALLOWED_ORIGINS: csvFromEnvironment('http://localhost:5173'),
    ENABLE_UAT: booleanFromEnvironment(true),
    ENABLE_ARCHITECTURE_PAGE: booleanFromEnvironment(true),
  })
  .superRefine((config, context) => {
    if (config.AUTH_MODE === 'entra') {
      requireConfigured(config.ENTRA_TENANT_ID, 'ENTRA_TENANT_ID', 'Entra', context)
      requireConfigured(config.ENTRA_API_CLIENT_ID, 'ENTRA_API_CLIENT_ID', 'Entra', context)
    }

    if (config.STORAGE_MODE === 'azurite') {
      requireConfigured(
        config.AZURE_STORAGE_CONNECTION_STRING,
        'AZURE_STORAGE_CONNECTION_STRING',
        'Azurite',
        context,
      )
    }

    if (config.STORAGE_MODE === 'azure') {
      requireConfigured(
        config.AZURE_STORAGE_ACCOUNT_NAME,
        'AZURE_STORAGE_ACCOUNT_NAME',
        'Azure Blob Storage',
        context,
      )
    }

    if (
      config.QUEUE_MODE === 'service-bus' &&
      !config.AZURE_SERVICE_BUS_CONNECTION_STRING &&
      !config.SERVICE_BUS_FULLY_QUALIFIED_NAMESPACE
    ) {
      context.addIssue({
        code: 'custom',
        path: ['SERVICE_BUS_FULLY_QUALIFIED_NAMESPACE'],
        message:
          'Service Bus requiere namespace para managed identity o una connection string explícita.',
      })
    }

    if (config.DOCUMENT_MODE === 'azure') {
      requireConfigured(
        config.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT,
        'AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT',
        'Document Intelligence',
        context,
      )
    }

    if (config.AI_MODE === 'azure') {
      requireConfigured(
        config.AZURE_OPENAI_ENDPOINT,
        'AZURE_OPENAI_ENDPOINT',
        'Azure OpenAI',
        context,
      )
      requireConfigured(
        config.AZURE_OPENAI_DEPLOYMENT_NAME,
        'AZURE_OPENAI_DEPLOYMENT_NAME',
        'Azure OpenAI',
        context,
      )
    }

    if (config.SAP_MODE === 'odata-v2' || config.SAP_MODE === 'odata-v4') {
      const hasBasicCredentials = Boolean(config.SAP_USERNAME && config.SAP_PASSWORD)
      if (!hasBasicCredentials && !config.SAP_API_KEY) {
        context.addIssue({
          code: 'custom',
          path: ['SAP_MODE'],
          message: 'SAP OData requiere usuario/contraseña o una API key configurada.',
        })
      }
    }

    if (config.EMAIL_MODE === 'azure-communication-services') {
      requireConfigured(
        config.AZURE_COMMUNICATION_EMAIL_ENDPOINT,
        'AZURE_COMMUNICATION_EMAIL_ENDPOINT',
        'Azure Communication Services Email',
        context,
      )
      requireConfigured(
        config.AZURE_COMMUNICATION_EMAIL_SENDER,
        'AZURE_COMMUNICATION_EMAIL_SENDER',
        'Azure Communication Services Email',
        context,
      )
      requireConfigured(
        config.NOTIFICATION_EMAIL_RECIPIENT,
        'NOTIFICATION_EMAIL_RECIPIENT',
        'Azure Communication Services Email',
        context,
      )
    }

    if (config.ENFORCE_REAL_INTEGRATIONS) {
      const realModes: Array<[boolean, string, string]> = [
        [config.AUTH_MODE === 'entra', 'AUTH_MODE', 'entra'],
        [config.DATABASE_MODE === 'postgres', 'DATABASE_MODE', 'postgres'],
        [config.STORAGE_MODE === 'azure', 'STORAGE_MODE', 'azure'],
        [config.QUEUE_MODE === 'service-bus', 'QUEUE_MODE', 'service-bus'],
        [config.DOCUMENT_MODE === 'azure', 'DOCUMENT_MODE', 'azure'],
        [config.AI_MODE === 'azure', 'AI_MODE', 'azure'],
        [
          config.SAP_MODE === 'odata-v2' || config.SAP_MODE === 'odata-v4',
          'SAP_MODE',
          'odata-v2 u odata-v4',
        ],
      ]
      for (const [valid, path, expected] of realModes) {
        if (!valid) {
          context.addIssue({
            code: 'custom',
            path: [path],
            message: `${path} debe usar ${expected} cuando ENFORCE_REAL_INTEGRATIONS=true.`,
          })
        }
      }
      if (config.DEMO_ENABLED) {
        context.addIssue({
          code: 'custom',
          path: ['DEMO_ENABLED'],
          message: 'DEMO_ENABLED debe ser false cuando ENFORCE_REAL_INTEGRATIONS=true.',
        })
      }
    }
  })

export type AppConfig = z.infer<typeof AppConfigSchema>

export function loadConfig(environment: Record<string, string | undefined>): AppConfig {
  return AppConfigSchema.parse(environment)
}

function requireConfigured(
  value: unknown,
  path: string,
  integration: string,
  context: z.RefinementCtx,
): void {
  if (value === undefined || value === null || value === '') {
    context.addIssue({
      code: 'custom',
      path: [path],
      message: `${integration} requiere ${path}.`,
    })
  }
}
