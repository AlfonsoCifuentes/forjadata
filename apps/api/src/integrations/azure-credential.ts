import { DefaultAzureCredential, ManagedIdentityCredential } from '@azure/identity'

export function createAzureCredential(
  environment: Record<string, string | undefined> = process.env,
): DefaultAzureCredential | ManagedIdentityCredential {
  const runningWithManagedIdentity = Boolean(
    environment.IDENTITY_ENDPOINT ||
    environment.MSI_ENDPOINT ||
    environment.WEBSITE_INSTANCE_ID ||
    environment.CONTAINER_APP_NAME,
  )
  if (runningWithManagedIdentity) {
    return environment.AZURE_CLIENT_ID
      ? new ManagedIdentityCredential(environment.AZURE_CLIENT_ID)
      : new ManagedIdentityCredential()
  }
  return new DefaultAzureCredential()
}
