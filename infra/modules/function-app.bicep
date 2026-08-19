targetScope = 'resourceGroup'

param name string
param location string = resourceGroup().location
param tags object = {}
param appServicePlanId string
param storageAccountName string
param deploymentStorageContainerName string
param identityResourceId string
param identityClientId string
param applicationInsightsConnectionString string
param appSettings object = {}
param allowedOrigins array = []
param instanceMemoryMB int = 2048
param maximumInstanceCount int = 3

var baseAppSettings = {
  AzureWebJobsStorage__accountName: storageAccountName
  AzureWebJobsStorage__credential: 'managedidentity'
  AzureWebJobsStorage__clientId: identityClientId
  APPLICATIONINSIGHTS_AUTHENTICATION_STRING: 'ClientId=${identityClientId};Authorization=AAD'
  APPLICATIONINSIGHTS_CONNECTION_STRING: applicationInsightsConnectionString
  AZURE_CLIENT_ID: identityClientId
}

resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' existing = {
  name: storageAccountName
}

resource functionApp 'Microsoft.Web/sites@2023-12-01' = {
  name: name
  location: location
  tags: union(tags, {
    'azd-service-name': 'api'
  })
  kind: 'functionapp,linux'
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${identityResourceId}': {}
    }
  }
  properties: {
    serverFarmId: appServicePlanId
    keyVaultReferenceIdentity: identityResourceId
    httpsOnly: true
    publicNetworkAccess: 'Enabled'
    functionAppConfig: {
      deployment: {
        storage: {
          type: 'blobContainer'
          value: '${storage.properties.primaryEndpoints.blob}${deploymentStorageContainerName}'
          authentication: {
            type: 'UserAssignedIdentity'
            userAssignedIdentityResourceId: identityResourceId
          }
        }
      }
      scaleAndConcurrency: {
        instanceMemoryMB: instanceMemoryMB
        maximumInstanceCount: maximumInstanceCount
      }
      runtime: {
        name: 'node'
        version: '24'
      }
    }
    siteConfig: {
      alwaysOn: false
      ftpsState: 'Disabled'
      http20Enabled: true
      minTlsVersion: '1.2'
      cors: {
        allowedOrigins: allowedOrigins
        supportCredentials: false
      }
    }
  }

  resource appSettingsConfig 'config' = {
    name: 'appsettings'
    properties: union(appSettings, baseAppSettings)
  }
}

output name string = functionApp.name
output resourceId string = functionApp.id
output uri string = 'https://${functionApp.properties.defaultHostName}'
