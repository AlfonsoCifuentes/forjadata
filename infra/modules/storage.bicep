targetScope = 'resourceGroup'

param name string
param location string = resourceGroup().location
param tags object = {}
param functionPrincipalId string
param deployerPrincipalId string
param deploymentContainerName string

var blobOwnerRole = 'b7e6dc6d-f1e8-4753-8033-0f276bb0955b'

module storage 'br/public:avm/res/storage/storage-account:0.33.0' = {
  name: 'storage-account'
  params: {
    name: name
    location: location
    tags: tags
    skuName: 'Standard_LRS'
    kind: 'StorageV2'
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: false
    minimumTlsVersion: 'TLS1_2'
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Allow'
    }
    blobServices: {
      containerDeleteRetentionPolicyEnabled: true
      containerDeleteRetentionPolicyDays: 7
      deleteRetentionPolicyEnabled: true
      deleteRetentionPolicyDays: 7
      containers: [
        {
          name: deploymentContainerName
          publicAccess: 'None'
        }
        {
          name: 'documents'
          publicAccess: 'None'
        }
        {
          name: 'extractions'
          publicAccess: 'None'
        }
        {
          name: 'sap-payloads'
          publicAccess: 'None'
        }
        {
          name: 'uat-evidence'
          publicAccess: 'None'
        }
      ]
    }
    roleAssignments: concat(
      [
        {
          principalId: functionPrincipalId
          principalType: 'ServicePrincipal'
          roleDefinitionIdOrName: blobOwnerRole
        }
      ],
      empty(deployerPrincipalId)
        ? []
        : [
            {
              principalId: deployerPrincipalId
              principalType: 'User'
              roleDefinitionIdOrName: blobOwnerRole
            }
          ]
    )
    enableTelemetry: false
  }
}

output name string = storage.outputs.name
output resourceId string = storage.outputs.resourceId
output blobEndpoint string = storage.outputs.primaryBlobEndpoint

