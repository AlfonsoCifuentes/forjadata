import {
  BrowserCacheLocation,
  InteractionRequiredAuthError,
  PublicClientApplication,
  type AccountInfo,
  type AuthenticationResult,
  type Configuration,
} from '@azure/msal-browser'

const authMode = import.meta.env.VITE_AUTH_MODE ?? 'demo'
const clientId = import.meta.env.VITE_ENTRA_CLIENT_ID?.trim()
const tenantId = import.meta.env.VITE_ENTRA_TENANT_ID?.trim()
const apiScope = import.meta.env.VITE_ENTRA_API_SCOPE?.trim()
const redirectUri =
  import.meta.env.VITE_ENTRA_REDIRECT_URI?.trim() ?? `${window.location.origin}/auth/callback`

export const isEntraMode = authMode === 'entra'
export const isEntraConfigured = Boolean(
  isEntraMode && clientId && tenantId && apiScope && redirectUri,
)

const returnToKey = 'forjadata-entra-return-to'
let clientPromise: Promise<PublicClientApplication> | null = null
let redirectResultPromise: Promise<AuthenticationResult | null> | null = null

export class EntraConfigurationError extends Error {
  constructor(message = 'La configuración de Microsoft Entra está incompleta.') {
    super(message)
    this.name = 'EntraConfigurationError'
  }
}

export class InteractiveAuthenticationRequiredError extends Error {
  constructor() {
    super('La sesión corporativa necesita interacción.')
    this.name = 'InteractiveAuthenticationRequiredError'
  }
}

export const entraAuth = {
  async initialize(): Promise<AccountInfo | null> {
    if (!isEntraMode) return null
    const client = await getClient()
    const result = await handleRedirect(client)
    const account =
      result?.account ?? client.getActiveAccount() ?? client.getAllAccounts()[0] ?? null
    if (account) client.setActiveAccount(account)
    return account
  },

  async login(returnTo = '/app/dashboard'): Promise<void> {
    const client = await getClient()
    sessionStorage.setItem(returnToKey, safeReturnTo(returnTo))
    await client.loginRedirect({
      scopes: [requireScope()],
      redirectUri,
      prompt: 'select_account',
    })
  },

  async completeLogin(): Promise<{ account: AccountInfo; returnTo: string }> {
    const account = await this.initialize()
    if (!account) throw new InteractiveAuthenticationRequiredError()
    const returnTo = safeReturnTo(sessionStorage.getItem(returnToKey) ?? '/app/dashboard')
    sessionStorage.removeItem(returnToKey)
    return { account, returnTo }
  },

  async getAccessToken(): Promise<string> {
    const client = await getClient()
    const account = (await this.initialize()) ?? client.getActiveAccount()
    if (!account) throw new InteractiveAuthenticationRequiredError()
    try {
      const result = await client.acquireTokenSilent({
        account,
        scopes: [requireScope()],
      })
      return result.accessToken
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        throw new InteractiveAuthenticationRequiredError()
      }
      throw error
    }
  },

  async logout(): Promise<void> {
    const client = await getClient()
    const account = client.getActiveAccount()
    await client.logoutRedirect({
      ...(account ? { account } : {}),
      postLogoutRedirectUri: window.location.origin,
    })
  },
}

async function getClient(): Promise<PublicClientApplication> {
  if (!isEntraConfigured || !clientId || !tenantId) throw new EntraConfigurationError()
  if (!clientPromise) {
    const configuration: Configuration = {
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        redirectUri,
        postLogoutRedirectUri: window.location.origin,
      },
      cache: {
        cacheLocation: BrowserCacheLocation.SessionStorage,
      },
      system: {
        allowPlatformBroker: false,
      },
    }
    clientPromise = (async () => {
      const client = new PublicClientApplication(configuration)
      await client.initialize()
      return client
    })()
  }
  return clientPromise
}

function handleRedirect(client: PublicClientApplication): Promise<AuthenticationResult | null> {
  redirectResultPromise ??= client.handleRedirectPromise({
    navigateToLoginRequestUrl: false,
  })
  return redirectResultPromise
}

function requireScope(): string {
  if (!apiScope) throw new EntraConfigurationError('VITE_ENTRA_API_SCOPE no está configurado.')
  return apiScope
}

function safeReturnTo(value: string): string {
  return value.startsWith('/') && !value.startsWith('//') ? value : '/app/dashboard'
}
