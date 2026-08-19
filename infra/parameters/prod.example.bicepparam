using '../main.bicep'

// Reference only. Do not deploy a second environment from the Free Trial subscription.
param environmentName = 'forjadata-prod'
param location = 'eastus2'
param databaseLocation = 'northeurope'
param entraApiClientId = readEnvironmentVariable('ENTRA_API_CLIENT_ID')
param entraSpaClientId = readEnvironmentVariable('ENTRA_SPA_CLIENT_ID')
param postgresAdministratorPassword = readEnvironmentVariable('POSTGRES_ADMIN_PASSWORD')
