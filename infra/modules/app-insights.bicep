targetScope = 'resourceGroup'

param name string
param workspaceName string
param location string = resourceGroup().location
param tags object = {}
param functionPrincipalId string

module workspace 'br/public:avm/res/operational-insights/workspace:0.16.0' = {
  name: 'log-analytics'
  params: {
    name: workspaceName
    location: location
    tags: tags
    skuName: 'PerGB2018'
    dataRetention: 30
    dailyQuotaGb: '0.1'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
    enableTelemetry: false
  }
}

module insights 'br/public:avm/res/insights/component:0.8.0' = {
  name: 'application-insights'
  params: {
    name: name
    location: location
    tags: tags
    workspaceResourceId: workspace.outputs.resourceId
    applicationType: 'web'
    disableIpMasking: false
    disableLocalAuth: true
    roleAssignments: [
      {
        principalId: functionPrincipalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: '3913510d-42f4-4e42-8a64-420c390055eb'
      }
    ]
    enableTelemetry: false
  }
}

output name string = insights.outputs.name
output resourceId string = insights.outputs.resourceId
output connectionString string = insights.outputs.connectionString
output workspaceResourceId string = workspace.outputs.resourceId

