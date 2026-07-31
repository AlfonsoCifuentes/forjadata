targetScope = 'resourceGroup'

param name string
param location string = resourceGroup().location
param tags object = {}
param functionPrincipalId string
@secure()
param databaseUrl string

module vault 'br/public:avm/res/key-vault/vault:0.14.0' = {
  name: 'key-vault'
  params: {
    name: name
    location: location
    tags: tags
    sku: 'standard'
    enableRbacAuthorization: true
    enablePurgeProtection: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Allow'
    }
    roleAssignments: [
      {
        principalId: functionPrincipalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: '4633458b-17de-408a-b874-0445c86b69e6'
      }
    ]
    secrets: [
      {
        name: 'postgres-connection-string'
        value: databaseUrl
      }
    ]
    enableTelemetry: false
  }
}

output name string = vault.outputs.name
output resourceId string = vault.outputs.resourceId
output uri string = vault.outputs.uri

