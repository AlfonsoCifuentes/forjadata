targetScope = 'resourceGroup'

param name string
param location string = resourceGroup().location
param tags object = {}
param functionPrincipalId string
param deployerPrincipalId string
param deploymentContainerName string

var blobOwnerRole = 'b7e6dc6d-f1e8-4753-8033-0f276bb0955b'
var queueContributorRole = '974c5e8b-45b9-4653-ba55-5f855dd0fb88'
var tableContributorRole = '0a9a7e1f-b9d0-4cc4-a60d-0319b160aaa3'

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
        {
          principalId: functionPrincipalId
          principalType: 'ServicePrincipal'
          roleDefinitionIdOrName: queueContributorRole
        }
        {
          principalId: functionPrincipalId
          principalType: 'ServicePrincipal'
          roleDefinitionIdOrName: tableContributorRole
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
