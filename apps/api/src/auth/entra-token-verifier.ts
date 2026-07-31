import { createRemoteJWKSet, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from 'jose'
import {
  IntegrationHealthSchema,
  RoleSchema,
  SessionSchema,
  type IntegrationHealth,
  type Role,
  type Session,
} from '@forjadata/contracts'
import { permissionsForRole } from '@forjadata/domain'

import type { AppConfig } from '../config.js'

export interface AuthenticatedPrincipal {
  subject: string
  objectId: string
  tenantId: string
  displayName: string
  email: string
  role: Role
  expiresAt: string
  claims: Readonly<JWTPayload>
}

export class AuthenticationError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 403,
    readonly code: string,
  ) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class EntraTokenVerifier {
  readonly #tenantId: string
  readonly #clientId: string
  readonly #issuer: string
  readonly #jwksUri: string
  readonly #audiences: string[]
  readonly #requiredScope: string
  readonly #getKey: JWTVerifyGetKey

  constructor(
    config: AppConfig,
    options: {
      getKey?: JWTVerifyGetKey
    } = {},
  ) {
    if (!config.ENTRA_TENANT_ID || !config.ENTRA_API_CLIENT_ID) {
      throw new Error('La configuración de Microsoft Entra está incompleta.')
    }
    this.#tenantId = config.ENTRA_TENANT_ID
    this.#clientId = config.ENTRA_API_CLIENT_ID
    this.#issuer =
      config.ENTRA_ISSUER ?? `https://login.microsoftonline.com/${config.ENTRA_TENANT_ID}/v2.0`
    this.#jwksUri =
      config.ENTRA_JWKS_URI ??
      `https://login.microsoftonline.com/${config.ENTRA_TENANT_ID}/discovery/v2.0/keys`
    this.#audiences = [
      ...new Set([
        config.ENTRA_API_CLIENT_ID,
        `api://${config.ENTRA_API_CLIENT_ID}`,
        ...config.ENTRA_ALLOWED_AUDIENCES,
      ]),
    ]
    this.#requiredScope = config.ENTRA_REQUIRED_SCOPE
    this.#getKey = options.getKey ?? createRemoteJWKSet(new URL(this.#jwksUri))
  }

  async verifyAuthorizationHeader(header: string | null): Promise<AuthenticatedPrincipal> {
    const token = bearerToken(header)
    let payload: JWTPayload
    try {
      const result = await jwtVerify(token, this.#getKey, {
        algorithms: ['RS256'],
        audience: this.#audiences,
        issuer: this.#issuer,
        clockTolerance: 5,
      })
      payload = result.payload
    } catch {
      throw new AuthenticationError(
        'El access token no es válido, ha expirado o no pertenece a esta API.',
        401,
        'invalid_token',
      )
    }

    if (payload.tid !== this.#tenantId) {
      throw new AuthenticationError('El token pertenece a otro tenant.', 401, 'invalid_tenant')
    }
    const scopes = typeof payload.scp === 'string' ? payload.scp.split(' ') : []
    if (!scopes.includes(this.#requiredScope)) {
      throw new AuthenticationError(
        `El token no contiene el scope ${this.#requiredScope}.`,
        403,
        'insufficient_scope',
      )
    }
    const role = resolveRole(payload)
    const subject = requireClaim(payload.sub, 'sub')
    const objectId = stringClaim(payload.oid) ?? subject
    const email =
      stringClaim(payload.email) ??
      stringClaim(payload.preferred_username) ??
      `${objectId}@entra.invalid`
    const displayName = stringClaim(payload.name) ?? email
    const expiration = payload.exp
    if (!expiration) {
      throw new AuthenticationError('El access token no declara expiración.', 401, 'invalid_token')
    }
    return {
      subject,
      objectId,
      tenantId: this.#tenantId,
      displayName,
      email,
      role,
      expiresAt: new Date(expiration * 1_000).toISOString(),
      claims: payload,
    }
  }

  sessionFor(principal: AuthenticatedPrincipal): Session {
    const issuedAt =
      typeof principal.claims.iat === 'number'
        ? new Date(principal.claims.iat * 1_000).toISOString()
        : new Date().toISOString()
    return SessionSchema.parse({
      mode: 'entra',
      user: {
        id: principal.objectId,
        email: principal.email,
        displayName: principal.displayName,
        role: principal.role,
        organizationId: principal.tenantId,
        organizationName: 'Forjadata',
        avatarInitials: initials(principal.displayName),
      },
      permissions: permissionsForRole(principal.role),
      issuedAt,
      expiresAt: principal.expiresAt,
    })
  }

  async healthCheck(): Promise<IntegrationHealth> {
    const checkedAt = new Date().toISOString()
    const discoveryUrl = `https://login.microsoftonline.com/${this.#tenantId}/v2.0/.well-known/openid-configuration`
    try {
      const response = await fetch(discoveryUrl, { signal: AbortSignal.timeout(3_000) })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const metadata = (await response.json()) as { issuer?: string; jwks_uri?: string }
      const valid = metadata.issuer === this.#issuer && metadata.jwks_uri === this.#jwksUri
      return IntegrationHealthSchema.parse({
        name: 'Microsoft Entra',
        mode: 'real',
        status: valid ? 'healthy' : 'degraded',
        checkedAt,
        message: valid
          ? 'Metadata OIDC single-tenant y JWKS accesibles.'
          : 'La metadata OIDC no coincide con issuer/JWKS configurados.',
      })
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'error desconocido'
      return {
        name: 'Microsoft Entra',
        mode: 'real',
        status: 'degraded',
        checkedAt,
        message: `No se pudo validar la metadata OIDC: ${reason.slice(0, 180)}`,
      }
    }
  }
}

function bearerToken(header: string | null): string {
  const match = /^Bearer\s+(.+)$/i.exec(header ?? '')
  if (!match?.[1]) {
    throw new AuthenticationError('Se requiere un access token Bearer.', 401, 'missing_token')
  }
  return match[1]
}

function resolveRole(payload: JWTPayload): Role {
  const claimRoles = Array.isArray(payload.roles)
    ? payload.roles.filter((item): item is string => typeof item === 'string')
    : []
  const directRole = stringClaim(payload.forjadata_role)
  const candidates = [...claimRoles, ...(directRole ? [directRole] : [])]
    .map(normalizeRole)
    .filter((item): item is Role => RoleSchema.safeParse(item).success)
  const priority: Role[] = [
    'admin',
    'uat_tester',
    'sap_specialist',
    'reviewer',
    'business_analyst',
    'requester',
  ]
  const role = priority.find((item) => candidates.includes(item))
  if (!role) {
    throw new AuthenticationError(
      'El usuario no tiene un app role de Forjadata asignado.',
      403,
      'missing_role',
    )
  }
  return role
}

function normalizeRole(value: string): string {
  const segment = value.toLocaleLowerCase('en').split(/[.:/]/).at(-1) ?? value
  return segment.replaceAll('-', '_')
}

function stringClaim(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function requireClaim(value: unknown, name: string): string {
  const claim = stringClaim(value)
  if (!claim) {
    throw new AuthenticationError(
      `El access token no contiene el claim ${name}.`,
      401,
      'invalid_token',
    )
  }
  return claim
}

function initials(name: string): string {
  const value = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase('es') ?? '')
    .join('')
  return value || 'FD'
}
