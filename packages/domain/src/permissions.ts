import type { Permission, Role } from '@forjadata/contracts'

const permissionsByRole: Readonly<Record<Role, readonly Permission[]>> = {
  requester: ['request:create', 'request:read', 'request:update', 'request:submit'],
  reviewer: [
    'request:create',
    'request:read',
    'request:update',
    'request:submit',
    'request:review',
    'request:approve',
    'request:reject',
    'duplicate:resolve',
    'dashboard:global',
    'audit:read',
  ],
  sap_specialist: ['request:read', 'sap:sync', 'sap:retry', 'dashboard:global', 'audit:read'],
  business_analyst: ['request:read', 'dashboard:global', 'audit:read'],
  uat_tester: [
    'request:create',
    'request:read',
    'request:review',
    'request:approve',
    'request:reject',
    'duplicate:resolve',
    'sap:sync',
    'sap:retry',
    'dashboard:global',
    'audit:read',
    'uat:execute',
  ],
  admin: [
    'request:create',
    'request:read',
    'request:update',
    'request:submit',
    'request:review',
    'request:approve',
    'request:reject',
    'duplicate:resolve',
    'sap:sync',
    'sap:retry',
    'dashboard:global',
    'audit:read',
    'uat:execute',
    'admin:manage',
  ],
}

export function permissionsForRole(role: Role): Permission[] {
  return [...permissionsByRole[role]]
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return permissionsByRole[role].includes(permission)
}
