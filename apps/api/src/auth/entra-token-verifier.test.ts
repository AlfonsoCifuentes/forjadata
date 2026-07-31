import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JSONWebKeySet } from 'jose'
import { beforeAll, describe, expect, it } from 'vitest'

import { readConfig } from '../config.js'
import { AuthenticationError, EntraTokenVerifier } from './entra-token-verifier.js'

const tenantId = '7480b2da-d055-4ab0-8f0e-22ba8316c329'
const clientId = '11111111-1111-4111-8111-111111111111'
const issuer = `https://login.microsoftonline.com/${tenantId}/v2.0`

let verifier: EntraTokenVerifier
let privateKey: CryptoKey

beforeAll(async () => {
  const pair = await generateKeyPair('RS256', { extractable: true })
  privateKey = pair.privateKey
  const publicJwk = await exportJWK(pair.publicKey)
  const jwks: JSONWebKeySet = {
    keys: [{ ...publicJwk, kid: 'test-key', alg: 'RS256', use: 'sig' }],
  }
  verifier = new EntraTokenVerifier(
    readConfig({
      AUTH_MODE: 'entra',
      ENTRA_TENANT_ID: tenantId,
      ENTRA_API_CLIENT_ID: clientId,
    }),
    { getKey: createLocalJWKSet(jwks) },
  )
})

describe('EntraTokenVerifier', () => {
  it('valida firma, issuer, audience, tenant, scope y app role', async () => {
    const token = await tokenFor()
    const principal = await verifier.verifyAuthorizationHeader(`Bearer ${token}`)

    expect(principal).toEqual(
      expect.objectContaining({
        tenantId,
        role: 'reviewer',
        displayName: 'Ada Lovelace',
        email: 'ada@example.com',
      }),
    )
    expect(verifier.sessionFor(principal)).toEqual(
      expect.objectContaining({
        mode: 'entra',
        user: expect.objectContaining({ role: 'reviewer', avatarInitials: 'AL' }),
        permissions: expect.arrayContaining(['request:review', 'request:approve']),
      }),
    )
  })

  it('rechaza tokens ausentes o destinados a otra API', async () => {
    await expect(verifier.verifyAuthorizationHeader(null)).rejects.toMatchObject({
      status: 401,
      code: 'missing_token',
    })
    await expect(
      tokenFor({ audience: 'api://otra-api' }).then((token) =>
        verifier.verifyAuthorizationHeader(`Bearer ${token}`),
      ),
    ).rejects.toMatchObject({ status: 401, code: 'invalid_token' })
  })

  it('rechaza tokens sin scope o app role', async () => {
    await expect(
      tokenFor({ scope: 'otro_scope' }).then((token) =>
        verifier.verifyAuthorizationHeader(`Bearer ${token}`),
      ),
    ).rejects.toMatchObject({ status: 403, code: 'insufficient_scope' })
    await expect(
      tokenFor({ roles: [] }).then((token) =>
        verifier.verifyAuthorizationHeader(`Bearer ${token}`),
      ),
    ).rejects.toBeInstanceOf(AuthenticationError)
  })
})

async function tokenFor(
  options: {
    audience?: string
    scope?: string
    roles?: string[]
  } = {},
): Promise<string> {
  const now = Math.floor(Date.now() / 1_000)
  return new SignJWT({
    tid: tenantId,
    oid: '22222222-2222-4222-8222-222222222222',
    name: 'Ada Lovelace',
    preferred_username: 'ada@example.com',
    scp: options.scope ?? 'access_as_user',
    roles: options.roles ?? ['Forjadata.Reviewer'],
  })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
    .setIssuer(issuer)
    .setAudience(options.audience ?? `api://${clientId}`)
    .setSubject('33333333-3333-4333-8333-333333333333')
    .setIssuedAt(now)
    .setExpirationTime(now + 3_600)
    .sign(privateKey)
}
