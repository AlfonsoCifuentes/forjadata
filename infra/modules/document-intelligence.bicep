targetScope = 'resourceGroup'

param name string
param location string = resourceGroup().location
param tags object = {}
param functionPrincipalId string

module documentIntelligence 'br/public:avm/res/cognitive-services/account:0.17.0' = {
  name: 'document-intelligence'
  params: {
    name: name
    kind: 'FormRecognizer'
    sku: 'F0'
    location: location
    tags: tags
    customSubDomainName: name
    disableLocalAuth: true
    publicNetworkAccess: 'Enabled'
    roleAssignments: [
      {
        principalId: functionPrincipalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: 'a97b65f3-24c7-4388-baec-2e87135dc908'
      }
    ]
    enableTelemetry: false
  }
}

output name string = documentIntelligence.outputs.name
output resourceId string = documentIntelligence.outputs.resourceId
output endpoint string = documentIntelligence.outputs.endpoint

