using '../main.bicep'

param environmentName = 'forjadata-dev'
param location = 'eastus2'
param databaseLocation = 'northeurope'
param entraApiClientId = readEnvironmentVariable('ENTRA_API_CLIENT_ID')
param entraSpaClientId = readEnvironmentVariable('ENTRA_SPA_CLIENT_ID')
param postgresAdministratorPassword = readEnvironmentVariable('POSTGRES_ADMIN_PASSWORD')
