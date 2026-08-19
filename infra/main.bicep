targetScope = 'subscription'

@minLength(1)
@maxLength(32)
param environmentName string

@metadata({
  azd: {
    type: 'location'
  }
})
param location string = 'eastus2'

param databaseLocation string = 'northeurope'
param entraTenantId string = tenant().tenantId
param entraApiClientId string
param entraSpaClientId string
param deployerPrincipalId string = deployer().objectId

@secure()
@minLength(16)
param postgresAdministratorPassword string

var resourceToken = take(toLower(uniqueString(subscription().id, environmentName)), 8)
var safeEnvironmentName = take(replace(toLower(environmentName), '-', ''), 12)
var tags = {
  'azd-env-name': environmentName
  environment: environmentName
  project: 'forjadata'
  'cost-profile': 'free-trial-zero-personal-spend'
}
var resourceGroupName = 'rg-forjadata-${environmentName}'
var identityName = 'id-forjadata-${resourceToken}'
var storageName = take('st${safeEnvironmentName}${resourceToken}', 24)
var serviceBusName = take('sb-forjadata-${resourceToken}', 50)
var functionName = take('func-forjadata-${resourceToken}', 60)
var planName = take('plan-forjadata-${resourceToken}', 40)
var staticSiteName = take('swa-forjadata-${resourceToken}', 40)
var postgresName = take('psql-forjadata-${resourceToken}', 63)
var keyVaultName = take('kv-fjd-${resourceToken}', 24)
var appInsightsName = take('appi-forjadata-${resourceToken}', 260)
var workspaceName = take('log-forjadata-${resourceToken}', 63)
var documentIntelligenceName = take('doc-forjadata-${resourceToken}', 64)
var openAiName = take('oai-forjadata-${resourceToken}', 64)
var openAiDeploymentName = 'gpt-5-mini'
var postgresAdministratorLogin = 'forjadataadmin'
var deploymentStorageContainerName = 'app-package-${take(resourceToken, 8)}'

resource resourceGroup 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: resourceGroupName
  location: location
  tags: tags
}

module functionIdentity 'br/public:avm/res/managed-identity/user-assigned-identity:0.4.1' = {
  name: 'function-identity'
  scope: resourceGroup
  params: {
    name: identityName
    location: location
    tags: tags
  }
}

module appServicePlan 'br/public:avm/res/web/serverfarm:0.1.1' = {
  name: 'functions-flex-plan'
  scope: resourceGroup
  params: {
    name: planName
    location: location
    tags: tags
    sku: {
      name: 'FC1'
      tier: 'FlexConsumption'
    }
    reserved: true
  }
}

module storage './modules/storage.bicep' = {
  name: 'storage'
  scope: resourceGroup
  params: {
    name: storageName
    location: location
    tags: tags
    functionPrincipalId: functionIdentity.outputs.principalId
    deployerPrincipalId: deployerPrincipalId
    deploymentContainerName: deploymentStorageContainerName
  }
}

module serviceBus './modules/service-bus.bicep' = {
  name: 'service-bus'
  scope: resourceGroup
  params: {
    name: serviceBusName
    location: location
    tags: tags
    functionPrincipalId: functionIdentity.outputs.principalId
  }
}

module monitoring './modules/app-insights.bicep' = {
  name: 'monitoring'
  scope: resourceGroup
  params: {
    name: appInsightsName
    workspaceName: workspaceName
    location: location
    tags: tags
    functionPrincipalId: functionIdentity.outputs.principalId
  }
}

module postgres './modules/postgres.bicep' = {
  name: 'postgres'
  scope: resourceGroup
  params: {
    name: postgresName
    location: databaseLocation
    tags: tags
    administratorLogin: postgresAdministratorLogin
    administratorLoginPassword: postgresAdministratorPassword
  }
}

module keyVault './modules/key-vault.bicep' = {
  name: 'key-vault'
  scope: resourceGroup
  params: {
    name: keyVaultName
    location: location
    tags: tags
    functionPrincipalId: functionIdentity.outputs.principalId
    databaseUrl: 'postgresql://${postgresAdministratorLogin}:${postgresAdministratorPassword}@${postgres.outputs.fqdn}:5432/forjadata?sslmode=require'
  }
}

module documentIntelligence './modules/document-intelligence.bicep' = {
  name: 'document-intelligence'
  scope: resourceGroup
  params: {
    name: documentIntelligenceName
    location: location
    tags: tags
    functionPrincipalId: functionIdentity.outputs.principalId
  }
}

module openAi './modules/openai.bicep' = {
  name: 'azure-openai'
  scope: resourceGroup
  params: {
    name: openAiName
    deploymentName: openAiDeploymentName
    location: location
    tags: tags
    functionPrincipalId: functionIdentity.outputs.principalId
  }
}

module staticSite './modules/static-web-app.bicep' = {
  name: 'static-web-app'
  scope: resourceGroup
  params: {
    name: staticSiteName
    location: location
    tags: tags
  }
}

module functionApp './modules/function-app.bicep' = {
  name: 'function-app'
  scope: resourceGroup
  params: {
    name: functionName
    location: location
    tags: tags
    appServicePlanId: appServicePlan.outputs.resourceId
    storageAccountName: storage.outputs.name
    deploymentStorageContainerName: deploymentStorageContainerName
    identityResourceId: functionIdentity.outputs.resourceId
    identityClientId: functionIdentity.outputs.clientId
    applicationInsightsConnectionString: monitoring.outputs.connectionString
    allowedOrigins: [
      staticSite.outputs.uri
      'http://localhost:5173'
    ]
    maximumInstanceCount: 3
    instanceMemoryMB: 2048
    appSettings: {
      NODE_ENV: 'production'
      APP_ENV: environmentName
      PUBLIC_APP_URL: staticSite.outputs.uri
      LOG_LEVEL: 'info'
      AUTH_MODE: 'entra'
      DEMO_ENABLED: 'false'
      ENFORCE_REAL_INTEGRATIONS: 'false'
      ENTRA_TENANT_ID: entraTenantId
      ENTRA_API_CLIENT_ID: entraApiClientId
      ENTRA_ALLOWED_AUDIENCES: 'api://${entraApiClientId}'
      ENTRA_REQUIRED_SCOPE: 'access_as_user'
      DATABASE_MODE: 'postgres'
      DATABASE_URL: '@Microsoft.KeyVault(SecretUri=${keyVault.outputs.uri}secrets/postgres-connection-string/)'
      STORAGE_MODE: 'azure'
      AZURE_STORAGE_ACCOUNT_NAME: storage.outputs.name
      BLOB_DOCUMENTS_CONTAINER: 'documents'
      BLOB_EXTRACTIONS_CONTAINER: 'extractions'
      BLOB_SAP_PAYLOADS_CONTAINER: 'sap-payloads'
      BLOB_UAT_EVIDENCE_CONTAINER: 'uat-evidence'
      MAX_DOCUMENT_BYTES: '10000000'
      QUEUE_MODE: 'service-bus'
      SERVICE_BUS_FULLY_QUALIFIED_NAMESPACE: serviceBus.outputs.fullyQualifiedNamespace
      SERVICE_BUS_DOCUMENT_QUEUE: 'document-processing'
      SERVICE_BUS_SAP_QUEUE: 'sap-sync'
      ServiceBusConnection__fullyQualifiedNamespace: serviceBus.outputs.fullyQualifiedNamespace
      ServiceBusConnection__credential: 'managedidentity'
      ServiceBusConnection__clientId: functionIdentity.outputs.clientId
      DOCUMENT_MODE: 'azure'
      AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT: documentIntelligence.outputs.endpoint
      AI_MODE: 'azure'
      AZURE_OPENAI_ENDPOINT: openAi.outputs.endpoint
      AZURE_OPENAI_DEPLOYMENT_NAME: openAiDeploymentName
      AI_MAX_INPUT_CHARS: '30000'
      AI_MAX_OUTPUT_TOKENS: '1500'
      SAP_MODE: 'disabled'
      EMAIL_MODE: 'disabled'
      APPLICATIONINSIGHTS_SAMPLING_RATIO: '0.1'
      APPLICATIONINSIGHTS_TRACES_PER_SECOND: '2'
      CORS_ALLOWED_ORIGINS: '${staticSite.outputs.uri},http://localhost:5173'
      ENABLE_UAT: 'true'
      ENABLE_ARCHITECTURE_PAGE: 'true'
    }
  }
}

output AZURE_RESOURCE_GROUP string = resourceGroup.name
output AZURE_LOCATION string = location
output AZURE_DATABASE_LOCATION string = databaseLocation
output AZURE_TENANT_ID string = entraTenantId
output AZURE_FUNCTION_NAME string = functionApp.outputs.name
output AZURE_STATIC_WEB_APP_NAME string = staticSite.outputs.name
output AZURE_STORAGE_ACCOUNT_NAME string = storage.outputs.name
output AZURE_SERVICE_BUS_NAMESPACE string = serviceBus.outputs.name
output AZURE_KEY_VAULT_NAME string = keyVault.outputs.name
output AZURE_LOG_ANALYTICS_WORKSPACE_ID string = monitoring.outputs.workspaceResourceId
output API_URL string = '${functionApp.outputs.uri}/api/v1'
output WEB_URL string = staticSite.outputs.uri
output VITE_APP_ENV string = environmentName
output VITE_API_MODE string = 'http'
output VITE_API_BASE_URL string = '${functionApp.outputs.uri}/api/v1'
output VITE_AUTH_MODE string = 'entra'
output VITE_ENTRA_TENANT_ID string = entraTenantId
output VITE_ENTRA_CLIENT_ID string = entraSpaClientId
output VITE_ENTRA_REDIRECT_URI string = '${staticSite.outputs.uri}/auth/callback'
output VITE_ENTRA_API_SCOPE string = 'api://${entraApiClientId}/access_as_user'
output VITE_DEMO_ENABLED string = 'false'
output VITE_ENABLE_3D string = 'true'
output VITE_ENABLE_ARCHITECTURE_PAGE string = 'true'
output VITE_TELEMETRY_ENABLED string = 'true'
