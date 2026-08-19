targetScope = 'resourceGroup'

param name string
param location string = resourceGroup().location
param tags object = {}
param functionPrincipalId string

var senderRole = '69a216fc-b8fb-44d8-bc22-1f3c2cd27a39'
var receiverRole = '4f6d3b9b-027b-4f4c-9142-0e5a2a2247e0'

module serviceBus 'br/public:avm/res/service-bus/namespace:0.17.0' = {
  name: 'service-bus-namespace'
  params: {
    name: name
    location: location
    tags: tags
    skuObject: {
      name: 'Basic'
    }
    minimumTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
    disableLocalAuth: true
    queues: [
      {
        name: 'document-processing'
        deadLetteringOnMessageExpiration: true
        defaultMessageTimeToLive: 'P7D'
        lockDuration: 'PT1M'
        maxDeliveryCount: 5
      }
      {
        name: 'sap-sync'
        deadLetteringOnMessageExpiration: true
        defaultMessageTimeToLive: 'P7D'
        lockDuration: 'PT1M'
        maxDeliveryCount: 5
      }
    ]
    roleAssignments: [
      {
        principalId: functionPrincipalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: senderRole
      }
      {
        principalId: functionPrincipalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: receiverRole
      }
    ]
    enableTelemetry: false
  }
}

output name string = serviceBus.outputs.name
output resourceId string = serviceBus.outputs.resourceId
output fullyQualifiedNamespace string = '${serviceBus.outputs.name}.servicebus.windows.net'

