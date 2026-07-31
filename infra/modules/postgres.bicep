targetScope = 'resourceGroup'

param name string
param location string
param tags object = {}
param administratorLogin string
@secure()
param administratorLoginPassword string

module postgres 'br/public:avm/res/db-for-postgre-sql/flexible-server:0.16.0' = {
  name: 'postgres-flexible-server'
  params: {
    name: name
    location: location
    tags: tags
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorLoginPassword
    authConfig: {
      activeDirectoryAuth: 'Disabled'
      passwordAuth: 'Enabled'
    }
    skuName: 'Standard_B1ms'
    tier: 'Burstable'
    availabilityZone: -1
    version: '18'
    storageSizeGB: 32
    autoGrow: 'Disabled'
    backupRetentionDays: 7
    geoRedundantBackup: 'Disabled'
    highAvailability: 'Disabled'
    publicNetworkAccess: 'Enabled'
    firewallRules: [
      {
        name: 'AllowAzureServices'
        startIpAddress: '0.0.0.0'
        endIpAddress: '0.0.0.0'
      }
    ]
    databases: [
      {
        name: 'forjadata'
        charset: 'UTF8'
        collation: 'en_US.utf8'
      }
    ]
    enableTelemetry: false
  }
}

output name string = postgres.outputs.name
output resourceId string = postgres.outputs.resourceId
output fqdn string = postgres.outputs.?fqdn ?? ''
