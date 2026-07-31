import { describe, expect, it } from 'vitest'

import { availableWorkflowActions, transitionRequest, WorkflowTransitionError } from './workflow'

const reviewerContext = {
  role: 'reviewer' as const,
  isOwner: false,
  hasBlockingErrors: false,
  duplicateResolved: true,
  reason: 'Revisión completa y conforme.',
}

describe('workflow', () => {
  it('allows a reviewer to approve a complete request', () => {
    expect(transitionRequest('NEEDS_REVIEW', 'APPROVE', reviewerContext)).toBe('APPROVED')
  })

  it('blocks approval while a duplicate remains unresolved', () => {
    expect(() =>
      transitionRequest('NEEDS_REVIEW', 'APPROVE', {
        ...reviewerContext,
        duplicateResolved: false,
      }),
    ).toThrowError(
      expect.objectContaining<Partial<WorkflowTransitionError>>({
        code: 'DUPLICATE_UNRESOLVED',
      }),
    )
  })

  it('blocks approval while required suggestions remain pending', () => {
    expect(() =>
      transitionRequest('NEEDS_REVIEW', 'APPROVE', {
        ...reviewerContext,
        hasBlockingErrors: true,
      }),
    ).toThrowError(
      expect.objectContaining<Partial<WorkflowTransitionError>>({
        code: 'BLOCKING_ERRORS',
      }),
    )
  })

  it('requires a reason for request changes', () => {
    expect(() =>
      transitionRequest('NEEDS_REVIEW', 'REQUEST_CHANGES', {
        ...reviewerContext,
        reason: '',
      }),
    ).toThrowError(
      expect.objectContaining<Partial<WorkflowTransitionError>>({
        code: 'REASON_REQUIRED',
      }),
    )
  })

  it('denies SAP synchronization to a reviewer', () => {
    expect(() => transitionRequest('READY_FOR_SAP', 'START_SYNC', reviewerContext)).toThrowError(
      expect.objectContaining<Partial<WorkflowTransitionError>>({
        code: 'FORBIDDEN',
      }),
    )
  })

  it('exposes only actions valid for the current state and role', () => {
    expect(availableWorkflowActions('NEEDS_REVIEW', reviewerContext)).toEqual(
      expect.arrayContaining(['APPROVE', 'REJECT', 'REQUEST_CHANGES']),
    )
    expect(availableWorkflowActions('NEEDS_REVIEW', reviewerContext)).not.toContain('START_SYNC')
  })
})
