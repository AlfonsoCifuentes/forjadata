import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const webUrl = requireEnvironment('WEB_URL').replace(/\/$/, '')
const spaClientId = requireEnvironment('ENTRA_SPA_CLIENT_ID')
const callback = `${webUrl}/auth/callback`
const webHost = new URL(webUrl)

if (webHost.protocol !== 'https:' || !webHost.hostname.endsWith('.azurestaticapps.net')) {
  throw new Error(`Refusing to register an unexpected production redirect origin: ${webUrl}`)
}

const tokenResult =
  process.platform === 'win32'
    ? await execFileAsync(
        process.env.ComSpec ?? 'C:\\Windows\\System32\\cmd.exe',
        ['/d', '/s', '/c', 'az account get-access-token --resource-type ms-graph --output json'],
        { maxBuffer: 2 * 1024 * 1024 },
      )
    : await execFileAsync(
        'az',
        ['account', 'get-access-token', '--resource-type', 'ms-graph', '--output', 'json'],
        { maxBuffer: 2 * 1024 * 1024 },
      )
const tokenPayload = JSON.parse(tokenResult.stdout) as { accessToken?: string }
if (!tokenPayload.accessToken) throw new Error('Azure CLI did not return a Microsoft Graph token.')

const headers = {
  authorization: `Bearer ${tokenPayload.accessToken}`,
  'content-type': 'application/json',
}
const query = new URL('https://graph.microsoft.com/v1.0/applications')
query.searchParams.set('$filter', `appId eq '${spaClientId}'`)
query.searchParams.set('$select', 'id')
const lookupResponse = await fetch(query, { headers })
if (!lookupResponse.ok) throw await graphError('lookup SPA app registration', lookupResponse)
const lookup = (await lookupResponse.json()) as { value?: Array<{ id?: string }> }
const objectId = lookup.value?.[0]?.id
if (!objectId || lookup.value?.length !== 1) {
  throw new Error(`Expected exactly one SPA app registration for client ID ${spaClientId}.`)
}

const patchResponse = await fetch(`https://graph.microsoft.com/v1.0/applications/${objectId}`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({
    isFallbackPublicClient: false,
    spa: {
      redirectUris: ['http://localhost:5173/auth/callback', callback],
    },
    web: {
      homePageUrl: webUrl,
      implicitGrantSettings: {
        enableAccessTokenIssuance: false,
        enableIdTokenIssuance: false,
      },
      redirectUris: [],
    },
  }),
})
if (!patchResponse.ok) throw await graphError('update SPA redirect URIs', patchResponse)

console.info(`Microsoft Entra SPA redirect registered for ${webHost.hostname}.`)

function requireEnvironment(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required by the Entra post-provision hook.`)
  return value
}

async function graphError(action: string, response: Response): Promise<Error> {
  const detail = (await response.text()).slice(0, 500)
  return new Error(`Microsoft Graph could not ${action}: HTTP ${response.status}; ${detail}`)
}
