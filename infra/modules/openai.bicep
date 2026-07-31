targetScope = 'resourceGroup'

param name string
param deploymentName string
param location string = resourceGroup().location
param tags object = {}
param functionPrincipalId string

module openAi 'br/public:avm/res/cognitive-services/account:0.17.0' = {
  name: 'azure-openai'
  params: {
    name: name
    kind: 'OpenAI'
    sku: 'S0'
    location: location
    tags: tags
    customSubDomainName: name
    disableLocalAuth: true
    publicNetworkAccess: 'Enabled'
    deployments: [
      {
        name: deploymentName
        model: {
          format: 'OpenAI'
          name: 'gpt-5-mini'
          version: '2025-08-07'
        }
        sku: {
          name: 'GlobalStandard'
          capacity: 1
        }
      }
    ]
    roleAssignments: [
      {
        principalId: functionPrincipalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: '5e0bd9bd-7b93-4f28-af87-19fc36ad61bd'
      }
    ]
    enableTelemetry: false
  }
}

output name string = openAi.outputs.name
output resourceId string = openAi.outputs.resourceId
output endpoint string = openAi.outputs.endpoint

