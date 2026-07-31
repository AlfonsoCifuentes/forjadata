import type { Permission, Role } from '@forjadata/contracts'
import { describe, expect, it } from 'vitest'

import { hasPermission, permissionsForRole } from './permissions'

const roles: Role[] = [
  'requester',
  'reviewer',
  'sap_specialist',
  'business_analyst',
  'uat_tester',
  'admin',
]

describe('permissions', () => {
  it.each([
    ['requester', 'request:create', true],
    ['requester', 'request:approve', false],
    ['reviewer', 'request:approve', true],
    ['reviewer', 'sap:sync', false],
    ['sap_specialist', 'sap:retry', true],
    ['business_analyst', 'audit:read', true],
    ['uat_tester', 'uat:execute', true],
    ['admin', 'admin:manage', true],
  ] as Array<[Role, Permission, boolean]>)('%s / %s = %s', (role, permission, expected) => {
    expect(hasPermission(role, permission)).toBe(expected)
  })

  it('returns defensive copies for every role', () => {
    for (const role of roles) {
      const first = permissionsForRole(role)
      const expected = [...first]
      first.splice(0)
      expect(permissionsForRole(role)).toEqual(expected)
    }
  })
})
