using '../main.bicep'

param environmentName = 'forjadata-staging'
param location = 'eastus2'
param databaseLocation = 'northeurope'
param entraApiClientId = readEnvironmentVariable('ENTRA_API_CLIENT_ID')
param entraSpaClientId = readEnvironmentVariable('ENTRA_SPA_CLIENT_ID')
