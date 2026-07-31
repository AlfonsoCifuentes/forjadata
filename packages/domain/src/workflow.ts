import type { Permission, RequestStatus, Role, WorkflowAction } from '@forjadata/contracts'

import { hasPermission } from './permissions'

export interface WorkflowContext {
  role: Role
  isOwner: boolean
  hasBlockingErrors: boolean
  duplicateResolved: boolean
  reason: string
}

interface WorkflowRule {
  from: readonly RequestStatus[]
  to: RequestStatus
  permission?: Permission
  ownerOnly?: boolean
  reasonRequired?: boolean
}

const rules: Readonly<Record<WorkflowAction, WorkflowRule>> = {
  SUBMIT: {
    from: ['DRAFT', 'CHANGES_REQUESTED'],
    to: 'SUBMITTED',
    permission: 'request:submit',
    ownerOnly: true,
  },
  COMPLETE_PROCESSING: {
    from: ['SUBMITTED', 'PROCESSING'],
    to: 'NEEDS_REVIEW',
  },
  REQUEST_CHANGES: {
    from: ['NEEDS_REVIEW'],
    to: 'CHANGES_REQUESTED',
    permission: 'request:reject',
    reasonRequired: true,
  },
  APPROVE: {
    from: ['NEEDS_REVIEW'],
    to: 'APPROVED',
    permission: 'request:approve',
  },
  REJECT: {
    from: ['NEEDS_REVIEW'],
    to: 'REJECTED',
    permission: 'request:reject',
    reasonRequired: true,
  },
  PREPARE_SAP: {
    from: ['APPROVED'],
    to: 'READY_FOR_SAP',
  },
  START_SYNC: {
    from: ['READY_FOR_SAP', 'SYNC_FAILED'],
    to: 'SYNCING',
    permission: 'sap:sync',
  },
  SYNC_SUCCESS: {
    from: ['SYNCING'],
    to: 'SYNCED',
  },
  SYNC_FAILURE: {
    from: ['SYNCING'],
    to: 'SYNC_FAILED',
  },
  RETRY_SYNC: {
    from: ['SYNC_FAILED'],
    to: 'SYNCING',
    permission: 'sap:retry',
  },
  CANCEL: {
    from: ['DRAFT', 'SUBMITTED', 'CHANGES_REQUESTED'],
    to: 'CANCELLED',
    permission: 'request:update',
    reasonRequired: true,
  },
  ARCHIVE: {
    from: ['SYNCED', 'REJECTED', 'CANCELLED'],
    to: 'ARCHIVED',
    permission: 'admin:manage',
  },
}

export class WorkflowTransitionError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'INVALID_STATE'
      | 'FORBIDDEN'
      | 'REASON_REQUIRED'
      | 'BLOCKING_ERRORS'
      | 'DUPLICATE_UNRESOLVED',
  ) {
    super(message)
    this.name = 'WorkflowTransitionError'
  }
}

export function transitionRequest(
  current: RequestStatus,
  action: WorkflowAction,
  context: WorkflowContext,
): RequestStatus {
  const rule = rules[action]

  if (!rule.from.includes(current)) {
    throw new WorkflowTransitionError(
      `La acción ${action} no está disponible desde ${current}.`,
      'INVALID_STATE',
    )
  }

  if (rule.permission && !hasPermission(context.role, rule.permission)) {
    throw new WorkflowTransitionError(
      `El rol ${context.role} no puede ejecutar ${action}.`,
      'FORBIDDEN',
    )
  }

  if (rule.ownerOnly && !context.isOwner && context.role !== 'admin') {
    throw new WorkflowTransitionError(
      'Solo el propietario o un administrador puede enviar la solicitud.',
      'FORBIDDEN',
    )
  }

  if (rule.reasonRequired && context.reason.trim().length < 3) {
    throw new WorkflowTransitionError('La transición requiere un motivo.', 'REASON_REQUIRED')
  }

  if (action === 'APPROVE' && context.hasBlockingErrors) {
    throw new WorkflowTransitionError(
      'No se puede aprobar mientras existan errores bloqueantes.',
      'BLOCKING_ERRORS',
    )
  }

  if (action === 'APPROVE' && !context.duplicateResolved) {
    throw new WorkflowTransitionError(
      'Resuelve los posibles duplicados antes de aprobar.',
      'DUPLICATE_UNRESOLVED',
    )
  }

  return rule.to
}

export function availableWorkflowActions(
  status: RequestStatus,
  context: WorkflowContext,
): WorkflowAction[] {
  return (Object.keys(rules) as WorkflowAction[]).filter((action) => {
    try {
      transitionRequest(status, action, {
        ...context,
        reason: context.reason || 'Vista previa',
      })
      return true
    } catch {
      return false
    }
  })
}
