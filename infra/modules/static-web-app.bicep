targetScope = 'resourceGroup'

param name string
param location string = resourceGroup().location
param tags object = {}

module staticSite 'br/public:avm/res/web/static-site:0.9.5' = {
  name: 'static-site'
  params: {
    name: name
    location: location
    sku: 'Free'
    tags: union(tags, {
      'azd-service-name': 'web'
    })
    publicNetworkAccess: 'Enabled'
    enableTelemetry: false
  }
}

output name string = staticSite.outputs.name
output resourceId string = staticSite.outputs.resourceId
output defaultHostname string = staticSite.outputs.defaultHostname
output uri string = 'https://${staticSite.outputs.defaultHostname}'

