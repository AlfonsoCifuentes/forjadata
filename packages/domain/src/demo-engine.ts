import type {
  AiSuggestion,
  AddUatEvidenceInput,
  AuditEvent,
  CreateUatExecutionInput,
  CreateUatPlanInput,
  CreateUatReleaseInput,
  CreateQualityRuleInput,
  CreateRequestInput,
  DashboardSummary,
  DemoUser,
  DocumentRecord,
  DuplicateCase,
  DuplicateResolution,
  IntegrationHealth,
  MaterialAttribute,
  MaterialDetail,
  MaterialSummary,
  Notification,
  Paginated,
  PaginationQuery,
  RequestDetail,
  RequestStatus,
  Role,
  QualityResult,
  QualityRule,
  SapProductPayload,
  SapSyncJob,
  Session,
  SuggestionDecisionInput,
  SignOffUatExecutionInput,
  UatExecution,
  UatPlan,
  UatRelease,
  UpdateUatExecutionInput,
  UpdateQualityRuleInput,
  WorkflowAction,
  WorkflowEvent,
} from '@forjadata/contracts'

import { permissionsForRole } from './permissions'
import type { AttributeSuggestionResult } from './providers'
import { evaluateQualityRule } from './quality-rules'
import { transitionRequest } from './workflow'

const BASE_TIME = '2026-07-30T16:00:00.000Z'
const ORGANIZATION_ID = 'org-forjadata-demo'

export const demoUsers: Readonly<Record<Role, DemoUser>> = {
  requester: {
    id: 'user-requester',
    email: 'solicitante@forjadata.demo',
    displayName: 'Lucía Martín',
    role: 'requester',
    organizationId: ORGANIZATION_ID,
    organizationName: 'Forja Industrial Demo',
    avatarInitials: 'LM',
  },
  reviewer: {
    id: 'user-reviewer',
    email: 'steward@forjadata.demo',
    displayName: 'Diego Vega',
    role: 'reviewer',
    organizationId: ORGANIZATION_ID,
    organizationName: 'Forja Industrial Demo',
    avatarInitials: 'DV',
  },
  sap_specialist: {
    id: 'user-sap',
    email: 'sap@forjadata.demo',
    displayName: 'Elena Santos',
    role: 'sap_specialist',
    organizationId: ORGANIZATION_ID,
    organizationName: 'Forja Industrial Demo',
    avatarInitials: 'ES',
  },
  business_analyst: {
    id: 'user-analyst',
    email: 'analista@forjadata.demo',
    displayName: 'Hugo Navarro',
    role: 'business_analyst',
    organizationId: ORGANIZATION_ID,
    organizationName: 'Forja Industrial Demo',
    avatarInitials: 'HN',
  },
  uat_tester: {
    id: 'user-uat',
    email: 'uat@forjadata.demo',
    displayName: 'Marta Gil',
    role: 'uat_tester',
    organizationId: ORGANIZATION_ID,
    organizationName: 'Forja Industrial Demo',
    avatarInitials: 'MG',
  },
  admin: {
    id: 'user-admin',
    email: 'admin@forjadata.demo',
    displayName: 'Álex Robles',
    role: 'admin',
    organizationId: ORGANIZATION_ID,
    organizationName: 'Forja Industrial Demo',
    avatarInitials: 'AR',
  },
}

export interface DemoSnapshot {
  schemaVersion: 2
  activeRole: Role
  sequence: number
  requests: RequestDetail[]
  materials: MaterialDetail[]
  duplicateCases: DuplicateCase[]
  sapJobs: SapSyncJob[]
  auditEvents: AuditEvent[]
  notifications: Notification[]
  qualityRules: QualityRule[]
  uatReleases: UatRelease[]
}

export class DemoNotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} ${id} no existe.`)
    this.name = 'DemoNotFoundError'
  }
}

export class DemoConflictError extends Error {
  constructor(
    message: string,
    readonly currentVersion: number,
  ) {
    super(message)
    this.name = 'DemoConflictError'
  }
}

export class DemoEngine {
  private state: DemoSnapshot

  constructor(snapshot: DemoSnapshot = createDemoSnapshot()) {
    this.state = structuredClone(snapshot)
    this.state.qualityRules ??= buildQualityRuleFixtures()
  }

  reset(): DemoSnapshot {
    this.state = createDemoSnapshot()
    this.recordAudit('demo.reset', 'demo', 'dataset', 'Dataset demo restablecido.')
    return this.getSnapshot()
  }

  getSnapshot(): DemoSnapshot {
    return structuredClone(this.state)
  }

  login(role: Role = 'reviewer'): Session {
    this.state.activeRole = role
    const user = demoUsers[role]
    this.recordAudit('auth.login', 'session', user.id, `Acceso demo como ${role}.`)
    return this.session()
  }

  switchRole(role: Role): Session {
    this.state.activeRole = role
    const user = demoUsers[role]
    this.recordAudit('auth.switch_role', 'session', user.id, `Rol demo cambiado a ${role}.`)
    return this.session()
  }

  session(): Session {
    const user = demoUsers[this.state.activeRole]
    return {
      mode: 'demo',
      user,
      permissions: permissionsForRole(user.role),
      issuedAt: BASE_TIME,
      expiresAt: '2027-07-30T16:00:00.000Z',
    }
  }

  dashboard(): DashboardSummary {
    const counts = new Map<RequestStatus, number>()
    for (const request of this.state.requests) {
      counts.set(request.status, (counts.get(request.status) ?? 0) + 1)
    }

    return {
      mode: 'demo',
      generatedAt: this.timestamp(),
      requestsCreated: 148,
      processed: 132,
      pendingReview: counts.get('NEEDS_REVIEW') ?? 0,
      approved: 96,
      synced: 84,
      failed: counts.get('SYNC_FAILED') ?? 2,
      averageCycleHours: 6.8,
      averageConfidence: 0.87,
      aiAcceptanceRate: 0.82,
      duplicatesPrevented: 23,
      slaAtRisk: 4,
      workflow: [
        { status: 'DRAFT', count: 7 },
        { status: 'PROCESSING', count: 9 },
        { status: 'NEEDS_REVIEW', count: 21 },
        { status: 'READY_FOR_SAP', count: 12 },
        { status: 'SYNCED', count: 84 },
        { status: 'SYNC_FAILED', count: 2 },
      ],
      categoryBreakdown: [
        { category: 'Motores eléctricos', count: 36 },
        { category: 'Rodamientos', count: 28 },
        { category: 'Válvulas', count: 24 },
        { category: 'Sensores', count: 19 },
        { category: 'Cables', count: 17 },
        { category: 'Otros', count: 24 },
      ],
      weeklyTrend: [
        { week: 'S-5', created: 19, completed: 16 },
        { week: 'S-4', created: 23, completed: 21 },
        { week: 'S-3', created: 26, completed: 24 },
        { week: 'S-2', created: 31, completed: 27 },
        { week: 'S-1', created: 28, completed: 26 },
        { week: 'Actual', created: 21, completed: 18 },
      ],
    }
  }

  listRequests(query: PaginationQuery): Paginated<RequestDetail> {
    const search = query.search.toLocaleLowerCase('es')
    let items = this.state.requests.filter((request) => {
      const matchesSearch =
        search.length === 0 ||
        request.title.toLocaleLowerCase('es').includes(search) ||
        request.description.toLocaleLowerCase('es').includes(search) ||
        request.id.toLocaleLowerCase('es').includes(search)
      const matchesStatus = query.status.length === 0 || request.status === query.status
      return matchesSearch && matchesStatus
    })

    items = [...items].sort((left, right) =>
      compareValues(left, right, query.sortBy, query.sortDirection),
    )
    return paginate(items, query, this.correlationId())
  }

  getRequest(id: string): RequestDetail {
    const request = this.state.requests.find((item) => item.id === id)
    if (!request) throw new DemoNotFoundError('Solicitud', id)
    return structuredClone(request)
  }

  createRequest(input: CreateRequestInput): RequestDetail {
    const user = demoUsers[this.state.activeRole]
    const id = this.nextId('req')
    const now = this.timestamp()
    const request: RequestDetail = {
      id,
      type: input.type,
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: 'DRAFT',
      requesterName: user.displayName,
      assigneeName: null,
      category: input.category,
      processingProgress: 0,
      processingStage: null,
      confidenceScore: null,
      materialId: null,
      dueAt: '2026-08-04T16:00:00.000Z',
      createdAt: now,
      updatedAt: now,
      version: 1,
      documents: input.fileName
        ? [
            {
              id: this.nextId('doc'),
              fileName: input.fileName,
              mimeType: mimeTypeFor(input.fileName),
              size: 184_320,
              sha256: `demo-sha256-${id}`,
              storagePath: null,
              status: 'UPLOADED',
              pageCount: input.fileName.toLocaleLowerCase('es').endsWith('.pdf') ? 2 : 1,
              provider: 'mock',
            },
          ]
        : [],
      suggestions: [],
      duplicateCases: [],
      workflow: [this.workflowEvent(null, 'DRAFT', 'Solicitud demo creada.', 'UI', user)],
    }

    this.state.requests.unshift(request)
    this.recordAudit('request.create', 'request', id, `Solicitud "${input.title}" creada.`)
    return structuredClone(request)
  }

  attachDocument(
    requestId: string,
    input: Omit<DocumentRecord, 'id' | 'status' | 'pageCount'>,
  ): RequestDetail {
    const request = this.mutableRequest(requestId)
    if (request.status !== 'DRAFT' && request.status !== 'CHANGES_REQUESTED') {
      throw new Error('Solo se pueden adjuntar documentos a solicitudes editables.')
    }
    const duplicate = request.documents.find((item) => item.sha256 === input.sha256)
    if (duplicate) return structuredClone(request)
    request.documents.push({
      id: this.nextId('doc'),
      ...input,
      status: 'UPLOADED',
      pageCount: 0,
    })
    request.updatedAt = this.timestamp()
    request.version += 1
    this.recordAudit(
      'document.upload',
      'request',
      requestId,
      `Documento "${input.fileName}" almacenado mediante ${input.provider}.`,
    )
    return structuredClone(request)
  }

  submitAndProcessRequest(id: string, expectedVersion: number): RequestDetail {
    this.startRequestProcessing(id, expectedVersion, 'Pipeline mock determinista iniciado.')
    return this.completeRequestProcessing(id, {
      provider: 'mock',
      providerVersion: 'forjadata-mock-1.0',
      reason: 'Extracción, clasificación y reglas mock completadas.',
    })
  }

  startRequestProcessing(
    id: string,
    expectedVersion: number,
    reason = 'Procesamiento asíncrono iniciado.',
  ): RequestDetail {
    const request = this.mutableRequest(id)
    this.assertVersion(request, expectedVersion)
    this.applyTransition(request, 'SUBMIT', 'Solicitud completa enviada a procesamiento.', 'UI')

    request.status = 'PROCESSING'
    request.processingStage = 'EXTRACTING'
    request.processingProgress = 36
    request.updatedAt = this.timestamp()
    request.version += 1
    request.workflow.push(this.workflowEvent('SUBMITTED', 'PROCESSING', reason, 'WORKER'))
    for (const document of request.documents) document.status = 'PROCESSING'
    this.recordAudit('processing.queued', 'request', request.id, reason, 'API')
    return structuredClone(request)
  }

  completeRequestProcessing(
    id: string,
    options: {
      provider: string
      providerVersion: string
      reason: string
      pageCount?: number
      category?: string
      attributes?: AttributeSuggestionResult[]
    },
  ): RequestDetail {
    const request = this.mutableRequest(id)
    if (request.status === 'NEEDS_REVIEW') return structuredClone(request)
    if (request.status !== 'PROCESSING') {
      throw new Error(`La solicitud ${id} no está en procesamiento.`)
    }
    const material = this.createMaterialFromRequest(request, {
      ...(options.category ? { category: options.category } : {}),
      ...(options.attributes ? { attributes: options.attributes } : {}),
      provider: options.provider,
    })
    request.materialId = material.id
    request.category = material.category
    request.suggestions = buildSuggestions(material, options.provider, options.providerVersion)
    request.confidenceScore = material.confidenceScore

    if (looksLikeMotor(request.description)) {
      const candidate = this.state.materials.find((item) => item.id === 'mat-motor-existing')
      if (candidate) {
        const duplicate = buildDuplicateCase(material, candidate, this.nextId('dup'))
        request.duplicateCases.push(duplicate)
        this.state.duplicateCases.unshift(duplicate)
      }
    }

    for (const document of request.documents) {
      document.status = 'PROCESSED'
      document.provider = options.provider
      document.pageCount = options.pageCount ?? Math.max(1, document.pageCount)
    }

    request.processingProgress = 100
    request.processingStage = 'READY_FOR_REVIEW'
    request.assigneeName = demoUsers.reviewer.displayName
    this.applyTransition(request, 'COMPLETE_PROCESSING', options.reason, 'WORKER')
    this.state.notifications.unshift({
      id: this.nextId('notification'),
      userId: demoUsers.reviewer.id,
      type: 'PROCESSING_COMPLETED',
      title: 'Solicitud lista para revisión',
      body: request.title,
      link: `/app/requests/${request.id}`,
      severity: 'SUCCESS',
      readAt: null,
      createdAt: this.timestamp(),
    })
    this.recordAudit('processing.complete', 'request', request.id, options.reason, 'WORKER')
    return structuredClone(request)
  }

  decideSuggestion(
    requestId: string,
    suggestionId: string,
    input: SuggestionDecisionInput,
  ): RequestDetail {
    const request = this.mutableRequest(requestId)
    if (!permissionsForRole(this.state.activeRole).includes('request:review')) {
      throw new Error('El rol actual no puede revisar sugerencias.')
    }
    const suggestion = request.suggestions.find((item) => item.id === suggestionId)
    if (!suggestion) throw new DemoNotFoundError('Sugerencia', suggestionId)

    if (input.decision === 'accept') suggestion.status = 'ACCEPTED'
    if (input.decision === 'reject') suggestion.status = 'REJECTED'
    if (input.decision === 'modify') {
      suggestion.status = 'MODIFIED'
      if (input.value !== undefined) suggestion.normalizedValue = input.value
    }

    const material = request.materialId
      ? this.state.materials.find((item) => item.id === request.materialId)
      : undefined
    const attribute = material?.attributes.find((item) => item.code === suggestion.attributeCode)
    if (attribute) {
      attribute.status =
        input.decision === 'accept'
          ? 'ACCEPTED'
          : input.decision === 'modify'
            ? 'MODIFIED'
            : 'REJECTED'
      if (input.decision !== 'reject') attribute.value = suggestion.normalizedValue
    }
    this.touch(request)
    this.recordAudit(
      `suggestion.${input.decision}`,
      'suggestion',
      suggestionId,
      `${suggestion.label}: ${input.reason}`,
    )
    return structuredClone(request)
  }

  acceptAllSuggestions(requestId: string): RequestDetail {
    const request = this.mutableRequest(requestId)
    for (const suggestion of request.suggestions) {
      if (suggestion.status === 'PENDING') {
        this.decideSuggestion(requestId, suggestion.id, {
          decision: 'accept',
          reason: 'Aceptación masiva demo revisada por una persona.',
        })
      }
    }
    return this.getRequest(requestId)
  }

  resolveDuplicate(
    requestId: string,
    duplicateId: string,
    resolution: Exclude<DuplicateResolution, 'PENDING'>,
    reason: string,
  ): RequestDetail {
    if (!permissionsForRole(this.state.activeRole).includes('duplicate:resolve')) {
      throw new Error('El rol actual no puede resolver duplicados.')
    }
    const request = this.mutableRequest(requestId)
    const duplicate = request.duplicateCases.find((item) => item.id === duplicateId)
    if (!duplicate) throw new DemoNotFoundError('Caso de duplicado', duplicateId)

    duplicate.resolution = resolution
    duplicate.resolvedAt = this.timestamp()
    duplicate.resolvedBy = demoUsers[this.state.activeRole].displayName
    const shared = this.state.duplicateCases.find((item) => item.id === duplicateId)
    if (shared) Object.assign(shared, duplicate)
    this.touch(request)
    this.recordAudit('duplicate.resolve', 'duplicate_case', duplicateId, `${resolution}: ${reason}`)
    return structuredClone(request)
  }

  approveRequest(id: string, expectedVersion: number, reason: string): RequestDetail {
    const request = this.mutableRequest(id)
    this.assertVersion(request, expectedVersion)
    const hasPendingSuggestions = request.suggestions.some(
      (suggestion) => suggestion.status === 'PENDING',
    )
    const duplicateResolved = request.duplicateCases.every(
      (duplicate) => duplicate.resolution !== 'PENDING',
    )
    this.applyTransition(request, 'APPROVE', reason, 'UI', {
      hasBlockingErrors: hasPendingSuggestions,
      duplicateResolved,
    })
    this.applyTransition(
      request,
      'PREPARE_SAP',
      'Payload preparado y pendiente de especialista SAP.',
      'SYSTEM',
    )
    if (request.materialId) {
      const material = this.mutableMaterial(request.materialId)
      material.status = 'APPROVED'
      material.updatedAt = this.timestamp()
    }
    this.recordAudit('request.approve', 'request', request.id, reason)
    return structuredClone(request)
  }

  requestChanges(id: string, expectedVersion: number, reason: string): RequestDetail {
    const request = this.mutableRequest(id)
    this.assertVersion(request, expectedVersion)
    this.applyTransition(request, 'REQUEST_CHANGES', reason, 'UI')
    this.recordAudit('request.request_changes', 'request', id, reason)
    return structuredClone(request)
  }

  listMaterials(query: PaginationQuery): Paginated<MaterialSummary> {
    const search = query.search.toLocaleLowerCase('es')
    let items = this.state.materials.filter((material) => {
      const haystack =
        `${material.internalCode} ${material.shortDescription} ${material.manufacturer} ${material.manufacturerPartNumber ?? ''}`.toLocaleLowerCase(
          'es',
        )
      const matchesSearch = search.length === 0 || haystack.includes(search)
      const matchesStatus = query.status.length === 0 || material.status === query.status
      return matchesSearch && matchesStatus
    })
    items = [...items].sort((left, right) =>
      compareValues(left, right, query.sortBy, query.sortDirection),
    )
    return paginate(items, query, this.correlationId())
  }

  getMaterial(id: string): MaterialDetail {
    const material = this.state.materials.find((item) => item.id === id)
    if (!material) throw new DemoNotFoundError('Material', id)
    return structuredClone(material)
  }

  listDuplicateCases(): DuplicateCase[] {
    return structuredClone(this.state.duplicateCases)
  }

  syncRequest(id: string, expectedVersion: number): SapSyncJob {
    const materialId = this.getRequest(id).materialId
    if (!materialId) throw new Error('La solicitud no tiene material para sincronizar.')
    const material = this.getMaterial(materialId)
    const job = this.queueSapSync(id, expectedVersion, 'simulator')
    const shouldFail = /cable/i.test(material.shortDescription)
    return this.completeSapSync(job.id, {
      success: !shouldFail,
      productId: shouldFail ? null : `SAP-${material.internalCode}`,
      httpStatus: shouldFail ? 503 : 201,
      errorCode: shouldFail ? 'SIMULATED_TEMPORARY_FAILURE' : null,
      errorMessage: shouldFail
        ? 'Fallo temporal inyectado por SAP Simulator para demostrar reintentos.'
        : null,
      durationMs: shouldFail ? 480 : 326,
    })
  }

  queueSapSync(id: string, expectedVersion: number, adapter: SapSyncJob['adapter']): SapSyncJob {
    const request = this.mutableRequest(id)
    this.assertVersion(request, expectedVersion)
    if (!request.materialId) throw new Error('La solicitud no tiene material para sincronizar.')

    const existingSuccess = this.state.sapJobs.find(
      (job) => job.requestId === id && job.status === 'SUCCEEDED',
    )
    if (existingSuccess) return structuredClone(existingSuccess)

    this.applyTransition(request, 'START_SYNC', 'Sincronización solicitada.', 'UI')
    const material = this.mutableMaterial(request.materialId)
    const payload = toSapPayload(material)
    const job: SapSyncJob = {
      id: this.nextId('sap-job'),
      requestId: request.id,
      materialId: material.id,
      operation: material.sapProductId ? 'UPDATE' : 'CREATE',
      adapter,
      status: 'QUEUED',
      attemptCount: 0,
      maxAttempts: 3,
      nextAttemptAt: null,
      sapProductId: material.sapProductId,
      httpStatus: null,
      errorCode: null,
      errorCategory: null,
      errorMessage: null,
      correlationId: this.correlationId(),
      durationMs: 0,
      payload,
      createdAt: this.timestamp(),
      completedAt: null,
    }
    this.state.sapJobs.unshift(job)
    this.recordAudit(
      'sap.sync_queued',
      'sap_sync_job',
      job.id,
      `Trabajo publicado para ${adapter}.`,
      'API',
      'SUCCESS',
      job.correlationId,
    )
    return structuredClone(job)
  }

  completeSapSync(
    jobId: string,
    result: {
      success: boolean
      productId: string | null
      httpStatus: number
      errorCode: string | null
      errorMessage: string | null
      durationMs: number
    },
  ): SapSyncJob {
    const job = this.state.sapJobs.find((item) => item.id === jobId)
    if (!job) throw new DemoNotFoundError('Trabajo SAP', jobId)
    if (job.status === 'SUCCEEDED') return structuredClone(job)
    const request = this.mutableRequest(job.requestId)
    const material = this.mutableMaterial(job.materialId)
    const retryable = !result.success && (result.httpStatus === 429 || result.httpStatus >= 500)

    job.attemptCount += 1
    job.status = result.success ? 'SUCCEEDED' : retryable ? 'FAILED_RETRYABLE' : 'FAILED_PERMANENT'
    job.nextAttemptAt =
      retryable && job.attemptCount < job.maxAttempts ? this.timestamp(5 * 60_000) : null
    job.sapProductId = result.productId
    job.httpStatus = result.httpStatus
    job.errorCode = result.errorCode
    job.errorCategory = result.success ? null : retryable ? 'TECHNICAL' : 'BUSINESS'
    job.errorMessage = result.errorMessage
    job.durationMs = result.durationMs
    job.completedAt = this.timestamp()

    if (!result.success) {
      this.applyTransition(
        request,
        'SYNC_FAILURE',
        `${job.adapter} devolvió un error normalizado.`,
        'WORKER',
      )
      material.status = 'SYNC_FAILED'
    } else {
      this.applyTransition(
        request,
        'SYNC_SUCCESS',
        `${job.adapter} confirmó la operación.`,
        'WORKER',
      )
      material.status = 'SYNCED'
      material.sapProductId = job.sapProductId
    }
    material.updatedAt = this.timestamp()
    this.recordAudit(
      result.success ? 'sap.sync_completed' : 'sap.sync_failed',
      'sap_sync_job',
      job.id,
      result.success ? `Sincronizado ${job.sapProductId}.` : (job.errorMessage ?? 'Error SAP.'),
      'WORKER',
      result.success ? 'SUCCESS' : 'FAILURE',
      job.correlationId,
    )
    return structuredClone(job)
  }

  getSapJob(jobId: string): SapSyncJob {
    const job = this.state.sapJobs.find((item) => item.id === jobId)
    if (!job) throw new DemoNotFoundError('Trabajo SAP', jobId)
    return structuredClone(job)
  }

  retrySapJob(jobId: string): SapSyncJob {
    const job = this.queueSapRetry(jobId)
    return this.completeSapSync(job.id, {
      success: true,
      productId: `SAP-${job.payload.internalCode}`,
      httpStatus: 200,
      errorCode: null,
      errorMessage: null,
      durationMs: 291,
    })
  }

  queueSapRetry(jobId: string): SapSyncJob {
    if (!permissionsForRole(this.state.activeRole).includes('sap:retry')) {
      throw new Error('El rol actual no puede reintentar sincronizaciones.')
    }
    const job = this.state.sapJobs.find((item) => item.id === jobId)
    if (!job) throw new DemoNotFoundError('Trabajo SAP', jobId)
    if (job.status !== 'FAILED_RETRYABLE') return structuredClone(job)

    job.status = 'QUEUED'
    job.nextAttemptAt = null
    job.httpStatus = null
    job.errorCode = null
    job.errorCategory = null
    job.errorMessage = null
    job.durationMs = 0
    job.completedAt = null

    const request = this.mutableRequest(job.requestId)
    this.applyTransition(request, 'RETRY_SYNC', 'Reintento manual autorizado.', 'UI')
    this.recordAudit(
      'sap.retry_queued',
      'sap_sync_job',
      job.id,
      `Reintento ${job.attemptCount + 1} publicado.`,
      'API',
      'SUCCESS',
      job.correlationId,
    )
    return structuredClone(job)
  }

  listSapJobs(): SapSyncJob[] {
    return structuredClone(this.state.sapJobs)
  }

  listAuditEvents(): AuditEvent[] {
    return structuredClone(this.state.auditEvents)
  }

  getAuditEvent(id: string): AuditEvent {
    const event = this.state.auditEvents.find((item) => item.id === id)
    if (!event) throw new DemoNotFoundError('Evento de auditoría', id)
    return structuredClone(event)
  }

  exportAuditEventsCsv(): string {
    this.recordAudit('audit.export', 'audit_event', 'all', 'Auditoría sintética exportada en CSV.')
    const header = [
      'id',
      'timestamp',
      'actor',
      'role',
      'action',
      'entity',
      'entityId',
      'correlationId',
      'source',
      'outcome',
      'summary',
    ]
    const rows = this.state.auditEvents.map((event) =>
      [
        event.id,
        event.timestamp,
        event.actorName,
        event.actorRole,
        event.action,
        event.entity,
        event.entityId,
        event.correlationId,
        event.source,
        event.outcome,
        event.summary,
      ]
        .map(csvCell)
        .join(','),
    )
    return [header.join(','), ...rows].join('\n')
  }

  listUatReleases(): UatRelease[] {
    return structuredClone(this.state.uatReleases)
  }

  getUatRelease(id: string): UatRelease {
    return structuredClone(this.mutableUatRelease(id))
  }

  createUatRelease(input: CreateUatReleaseInput): UatRelease {
    this.assertUatPermission()
    if (this.state.uatReleases.some((release) => release.version === input.version)) {
      throw new DemoConflictError(`La release ${input.version} ya existe.`, 1)
    }
    const release: UatRelease = {
      id: this.nextId('uat-release'),
      version: input.version,
      name: input.name,
      status: 'DRAFT',
      plans: [],
      scenarios: buildUatScenarios(),
      executions: [],
      createdAt: this.timestamp(),
    }
    this.state.uatReleases.unshift(release)
    this.recordAudit('uat.release_created', 'uat_release', release.id, `Release ${input.version}.`)
    return structuredClone(release)
  }

  createUatPlan(releaseId: string, input: CreateUatPlanInput): UatPlan {
    this.assertUatPermission()
    const release = this.mutableUatRelease(releaseId)
    const requestedIds = input.scenarioIds ?? release.scenarios.map((scenario) => scenario.id)
    const validIds = new Set(release.scenarios.map((scenario) => scenario.id))
    if (requestedIds.some((id) => !validIds.has(id))) {
      throw new DemoNotFoundError('Escenario UAT', 'desconocido')
    }
    const plan: UatPlan = {
      id: this.nextId('uat-plan'),
      releaseId,
      name: input.name,
      assignedTesterId: input.assignedTesterId,
      scenarioIds: [...requestedIds],
      createdAt: this.timestamp(),
    }
    release.plans.push(plan)
    release.status = 'IN_EXECUTION'
    this.recordAudit(
      'uat.plan_created',
      'uat_plan',
      plan.id,
      `${plan.name}: ${plan.scenarioIds.length} escenarios.`,
    )
    return structuredClone(plan)
  }

  getUatPlan(id: string): UatPlan {
    for (const release of this.state.uatReleases) {
      const plan = release.plans.find((item) => item.id === id)
      if (plan) return structuredClone(plan)
    }
    throw new DemoNotFoundError('Plan UAT', id)
  }

  createUatExecution(input: CreateUatExecutionInput): UatExecution {
    this.assertUatPermission()
    const release = this.mutableUatRelease(input.releaseId)
    const plan = release.plans.find((item) => item.id === input.planId)
    if (!plan) throw new DemoNotFoundError('Plan UAT', input.planId)
    if (!plan.scenarioIds.includes(input.scenarioId)) {
      throw new Error('El escenario no pertenece al plan UAT.')
    }
    const scenario = release.scenarios.find((item) => item.id === input.scenarioId)
    if (!scenario) throw new DemoNotFoundError('Escenario UAT', input.scenarioId)
    const existing = release.executions.find(
      (item) => item.planId === input.planId && item.scenarioId === input.scenarioId,
    )
    if (existing) return structuredClone(existing)
    const now = this.timestamp()
    const execution: UatExecution = {
      id: this.nextId('uat-execution'),
      ...input,
      testerId: demoUsers[this.state.activeRole].id,
      status: 'NOT_RUN',
      comment: '',
      stepResults: [],
      evidence: [],
      issues: [],
      signOffDecision: null,
      signOffComment: null,
      signedOffAt: null,
      createdAt: now,
      updatedAt: now,
    }
    release.executions.push(execution)
    release.status = 'IN_EXECUTION'
    this.recordAudit(
      'uat.execution_created',
      'uat_execution',
      execution.id,
      `${scenario.code}: ${scenario.title}.`,
    )
    return structuredClone(execution)
  }

  updateUatExecution(id: string, input: UpdateUatExecutionInput): UatExecution {
    this.assertUatPermission()
    const { release, execution } = this.mutableUatExecution(id)
    execution.status = input.status
    execution.comment = input.comment
    execution.stepResults = structuredClone(input.stepResults)
    execution.updatedAt = this.timestamp()
    if (input.issue) {
      execution.issues.push({
        id: this.nextId('uat-issue'),
        title: input.issue.title,
        severity: input.issue.severity,
        status: 'OPEN',
      })
    }
    if (input.status === 'FAILED') release.status = 'BLOCKED'
    this.recordAudit(
      'uat.execution_updated',
      'uat_execution',
      execution.id,
      `Resultado ${input.status}; ${execution.stepResults.length} pasos registrados.`,
    )
    return structuredClone(execution)
  }

  addUatEvidence(
    id: string,
    input: AddUatEvidenceInput,
    storedEvidence?: {
      storagePath: string
      sizeBytes: number
      sha256: string
    },
  ): UatExecution {
    this.assertUatPermission()
    const { execution } = this.mutableUatExecution(id)
    const { contentBase64: _contentBase64, ...metadata } = input
    execution.evidence.push({
      id: this.nextId('uat-evidence'),
      ...metadata,
      storageMode: storedEvidence ? 'blob' : 'demo-metadata',
      storagePath: storedEvidence?.storagePath ?? null,
      sizeBytes: storedEvidence?.sizeBytes ?? 0,
      sha256: storedEvidence?.sha256 ?? null,
      createdAt: this.timestamp(),
    })
    execution.updatedAt = this.timestamp()
    this.recordAudit(
      'uat.evidence_added',
      'uat_execution',
      execution.id,
      storedEvidence
        ? `Evidencia ${input.fileName} almacenada de forma íntegra y verificada.`
        : `Evidencia demo ${input.fileName}; solo se conserva metadata sintética.`,
    )
    return structuredClone(execution)
  }

  signOffUatExecution(id: string, input: SignOffUatExecutionInput): UatExecution {
    this.assertUatPermission()
    const { release, execution } = this.mutableUatExecution(id)
    execution.signOffDecision = input.decision
    execution.signOffComment = input.comment
    execution.signedOffAt = this.timestamp()
    execution.updatedAt = execution.signedOffAt
    release.status = input.decision
    this.recordAudit(
      'uat.sign_off',
      'uat_execution',
      execution.id,
      `${input.decision}: ${input.comment}`,
    )
    return structuredClone(execution)
  }

  listNotifications(): Notification[] {
    return structuredClone(
      this.state.notifications.filter(
        (item) => item.userId === demoUsers[this.state.activeRole].id,
      ),
    )
  }

  markAllNotificationsRead(): Notification[] {
    const now = this.timestamp()
    for (const notification of this.state.notifications) {
      if (notification.userId === demoUsers[this.state.activeRole].id) {
        notification.readAt = now
      }
    }
    return this.listNotifications()
  }

  listQualityRules(): QualityRule[] {
    this.assertAdminPermission()
    return structuredClone(this.state.qualityRules)
  }

  createQualityRule(input: CreateQualityRuleInput): QualityRule {
    this.assertAdminPermission()
    if (this.state.qualityRules.some((rule) => rule.code === input.code)) {
      throw new Error(`La regla ${input.code} ya existe.`)
    }
    const now = this.timestamp()
    const rule: QualityRule = {
      id: this.nextId('quality-rule'),
      organizationId: ORGANIZATION_ID,
      ...input,
      version: 1,
      createdAt: now,
      updatedAt: now,
    }
    this.state.qualityRules.unshift(rule)
    this.recordAudit('quality_rule.create', 'quality_rule', rule.id, `Regla ${rule.code} creada.`)
    return structuredClone(rule)
  }

  updateQualityRule(id: string, input: UpdateQualityRuleInput): QualityRule {
    this.assertAdminPermission()
    const rule = this.state.qualityRules.find((item) => item.id === id)
    if (!rule) throw new DemoNotFoundError('Regla de calidad', id)
    if (rule.version !== input.expectedVersion) {
      throw new DemoConflictError(
        'La regla cambió desde la última lectura. Recarga antes de continuar.',
        rule.version,
      )
    }
    if (this.state.qualityRules.some((item) => item.id !== id && item.code === input.code)) {
      throw new Error(`La regla ${input.code} ya existe.`)
    }
    const { expectedVersion: _expectedVersion, ...changes } = input
    Object.assign(rule, changes, { version: rule.version + 1, updatedAt: this.timestamp() })
    this.recordAudit(
      'quality_rule.update',
      'quality_rule',
      rule.id,
      `Regla ${rule.code} actualizada a v${rule.version}.`,
    )
    return structuredClone(rule)
  }

  testQualityRule(id: string, materialId: string): QualityResult {
    this.assertAdminPermission()
    const rule = this.state.qualityRules.find((item) => item.id === id)
    if (!rule) throw new DemoNotFoundError('Regla de calidad', id)
    const result = evaluateQualityRule(rule, this.mutableMaterial(materialId), this.timestamp())
    this.recordAudit(
      'quality_rule.test',
      'quality_rule',
      rule.id,
      `${result.status} sobre ${materialId}.`,
    )
    return result
  }

  integrationHealth(): IntegrationHealth[] {
    const checkedAt = this.timestamp()
    return [
      {
        name: 'Autenticación',
        mode: 'demo',
        status: 'healthy',
        checkedAt,
        message: 'Sesión sintética; Microsoft Entra no está conectado.',
      },
      {
        name: 'Inteligencia artificial',
        mode: 'mock',
        status: 'healthy',
        checkedAt,
        message: 'Extracción determinista validada con contratos Zod.',
      },
      {
        name: 'SAP',
        mode: 'simulator',
        status: 'healthy',
        checkedAt,
        message: 'SAP Simulator activo; no existe conexión a un sistema SAP real.',
      },
      {
        name: 'Azure Blob Storage',
        mode: 'disabled',
        status: 'unconfigured',
        checkedAt,
        message: 'Almacenamiento local demo; configura credenciales para activar Blob.',
      },
      {
        name: 'Azure Service Bus',
        mode: 'disabled',
        status: 'unconfigured',
        checkedAt,
        message: 'Cola inline demo; configura Service Bus para el worker real.',
      },
    ]
  }

  private mutableRequest(id: string): RequestDetail {
    const request = this.state.requests.find((item) => item.id === id)
    if (!request) throw new DemoNotFoundError('Solicitud', id)
    return request
  }

  private mutableMaterial(id: string): MaterialDetail {
    const material = this.state.materials.find((item) => item.id === id)
    if (!material) throw new DemoNotFoundError('Material', id)
    return material
  }

  private mutableUatRelease(id: string): UatRelease {
    const release = this.state.uatReleases.find((item) => item.id === id)
    if (!release) throw new DemoNotFoundError('Release UAT', id)
    return release
  }

  private mutableUatExecution(id: string): {
    release: UatRelease
    execution: UatExecution
  } {
    for (const release of this.state.uatReleases) {
      const execution = release.executions.find((item) => item.id === id)
      if (execution) return { release, execution }
    }
    throw new DemoNotFoundError('Ejecución UAT', id)
  }

  private assertUatPermission(): void {
    if (!permissionsForRole(this.state.activeRole).includes('uat:execute')) {
      throw new Error('El rol actual no puede ejecutar UAT.')
    }
  }

  private assertAdminPermission(): void {
    if (!permissionsForRole(this.state.activeRole).includes('admin:manage')) {
      throw new Error('El rol actual no puede configurar reglas.')
    }
  }

  private assertVersion(request: RequestDetail, expectedVersion: number): void {
    if (request.version !== expectedVersion) {
      throw new DemoConflictError(
        'La solicitud cambió desde la última lectura. Recarga antes de continuar.',
        request.version,
      )
    }
  }

  private touch(request: RequestDetail): void {
    request.version += 1
    request.updatedAt = this.timestamp()
  }

  private applyTransition(
    request: RequestDetail,
    action: WorkflowAction,
    reason: string,
    source: WorkflowEvent['source'],
    overrides: Partial<{
      hasBlockingErrors: boolean
      duplicateResolved: boolean
    }> = {},
  ): void {
    const user = demoUsers[this.state.activeRole]
    const from = request.status
    const to = transitionRequest(from, action, {
      role: source === 'WORKER' || source === 'SYSTEM' ? 'admin' : user.role,
      isOwner: request.requesterName === user.displayName,
      hasBlockingErrors: overrides.hasBlockingErrors ?? false,
      duplicateResolved: overrides.duplicateResolved ?? true,
      reason,
    })
    request.status = to
    request.workflow.push(this.workflowEvent(from, to, reason, source, user))
    this.touch(request)
  }

  private createMaterialFromRequest(
    request: RequestDetail,
    options: {
      category?: string
      attributes?: AttributeSuggestionResult[]
      provider?: string
    } = {},
  ): MaterialDetail {
    const id = this.nextId('mat')
    const motor = looksLikeMotor(request.description)
    const category =
      options.category ??
      (motor ? 'Motores eléctricos' : (request.category ?? 'Componentes electrónicos'))
    const attributes =
      options.attributes && options.attributes.length > 0
        ? options.attributes.map((item) => ({
            id: `attr-${id}-${item.code.toLocaleLowerCase('en')}`,
            code: item.code,
            label: item.code.replaceAll('_', ' '),
            value: item.value,
            normalizedValue: item.value,
            unit: item.unit,
            required: false,
            status: 'SUGGESTED' as const,
            confidence: item.confidence,
            evidenceText: item.evidenceText,
            evidencePage: item.page,
          }))
        : motor
          ? motorAttributes(id)
          : genericAttributes(id)
    const averageConfidence =
      options.attributes && options.attributes.length > 0
        ? options.attributes.reduce((total, item) => total + item.confidence, 0) /
          options.attributes.length
        : motor
          ? 0.91
          : 0.81
    const material: MaterialDetail = {
      id,
      internalCode: `FJ-${String(this.state.sequence).padStart(6, '0')}`,
      sapProductId: null,
      shortDescription: request.title,
      longDescription: request.description,
      category,
      manufacturer: motor ? 'Siemens' : 'Forja Industrial',
      manufacturerPartNumber: motor ? '1LE1001-1AA23' : null,
      gtin: null,
      baseUnit: 'UN',
      status: 'IN_REVIEW',
      completenessScore: motor ? 0.92 : 0.78,
      confidenceScore: averageConfidence,
      duplicateCount: motor ? 1 : 0,
      ownerName: demoUsers.reviewer.displayName,
      updatedAt: this.timestamp(),
      slaStatus: 'ON_TRACK',
      source:
        options.provider === 'mock'
          ? 'DEMO'
          : options.provider?.startsWith('azure')
            ? 'AI'
            : 'MANUAL',
      attributes,
      requestId: request.id,
    }
    this.state.materials.unshift(material)
    return material
  }

  private workflowEvent(
    fromState: RequestStatus | null,
    toState: RequestStatus,
    reason: string,
    source: WorkflowEvent['source'],
    user: DemoUser = demoUsers.admin,
  ): WorkflowEvent {
    return {
      id: this.nextId('workflow'),
      fromState,
      toState,
      actorName: source === 'WORKER' ? 'Worker demo' : user.displayName,
      actorRole: source === 'WORKER' || source === 'SYSTEM' ? 'admin' : user.role,
      reason,
      source,
      correlationId: this.correlationId(),
      createdAt: this.timestamp(),
    }
  }

  private recordAudit(
    action: string,
    entity: string,
    entityId: string,
    summary: string,
    source: AuditEvent['source'] = 'UI',
    outcome: AuditEvent['outcome'] = 'SUCCESS',
    correlationId = this.correlationId(),
  ): void {
    const user = demoUsers[this.state.activeRole]
    this.state.auditEvents.unshift({
      id: this.nextId('audit'),
      timestamp: this.timestamp(),
      actorName: source === 'WORKER' ? 'Worker demo' : user.displayName,
      actorRole: source === 'WORKER' ? 'admin' : user.role,
      organizationId: ORGANIZATION_ID,
      action,
      entity,
      entityId,
      summary,
      before: null,
      after: null,
      metadata: {},
      ipHash: null,
      userAgent: null,
      correlationId,
      source,
      outcome,
    })
  }

  private nextId(prefix: string): string {
    this.state.sequence += 1
    return `${prefix}-${String(this.state.sequence).padStart(5, '0')}`
  }

  private correlationId(): string {
    return `corr-demo-${String(this.state.sequence).padStart(5, '0')}`
  }

  private timestamp(offsetMs = 0): string {
    const base = new Date(BASE_TIME).getTime()
    return new Date(base + this.state.sequence * 1_000 + offsetMs).toISOString()
  }
}

export function createDemoSnapshot(): DemoSnapshot {
  const materials = buildMaterialFixtures()
  const motor = materials.find((item) => item.id === 'mat-motor-review')
  const existingMotor = materials.find((item) => item.id === 'mat-motor-existing')
  if (!motor || !existingMotor) throw new Error('Fixtures de motor incompletos.')
  const duplicate = buildDuplicateCase(motor, existingMotor, 'dup-motor-001')
  const requests = buildRequestFixtures(motor, duplicate)

  return {
    schemaVersion: 2,
    activeRole: 'reviewer',
    sequence: 100,
    requests,
    materials,
    duplicateCases: [duplicate],
    sapJobs: [],
    auditEvents: [
      {
        id: 'audit-seed-001',
        timestamp: BASE_TIME,
        actorName: 'Sistema demo',
        actorRole: 'admin',
        organizationId: ORGANIZATION_ID,
        action: 'demo.seed',
        entity: 'demo',
        entityId: 'dataset',
        summary: 'Dataset sintético determinista cargado.',
        before: null,
        after: null,
        metadata: { synthetic: true },
        ipHash: null,
        userAgent: null,
        correlationId: 'corr-demo-seed',
        source: 'SYSTEM',
        outcome: 'SUCCESS',
      },
    ],
    notifications: [
      {
        id: 'notification-seed-001',
        userId: demoUsers.reviewer.id,
        type: 'REVIEW_ASSIGNED',
        title: 'Motor listo para revisión',
        body: 'La extracción mock encontró 4 atributos y un posible duplicado.',
        link: '/app/requests/req-motor-001',
        severity: 'INFO',
        readAt: null,
        createdAt: BASE_TIME,
      },
    ],
    qualityRules: buildQualityRuleFixtures(),
    uatReleases: [buildUatReleaseFixture()],
  }
}

function buildQualityRuleFixtures(): QualityRule[] {
  return [
    {
      id: 'quality-rule-required-manufacturer',
      organizationId: ORGANIZATION_ID,
      category: null,
      code: 'REQUIRED_MANUFACTURER',
      name: 'Fabricante obligatorio',
      description: 'Todo material gobernado debe identificar su fabricante.',
      severity: 'ERROR',
      expression: {
        combinator: 'ALL',
        conditions: [{ field: 'manufacturer', operator: 'required' }],
      },
      message: 'Informa un fabricante antes de aprobar el material.',
      status: 'ACTIVE',
      version: 1,
      createdAt: BASE_TIME,
      updatedAt: BASE_TIME,
    },
    {
      id: 'quality-rule-motor-power-range',
      organizationId: ORGANIZATION_ID,
      category: 'Motores eléctricos',
      code: 'MOTOR_POWER_RANGE',
      name: 'Potencia de motor plausible',
      description: 'Valida que la potencia normalizada esté entre 0,1 y 1.000 kW.',
      severity: 'WARNING',
      expression: {
        combinator: 'ALL',
        conditions: [
          {
            field: 'attributes.POWER',
            operator: 'between',
            value: 0.1,
            secondValue: 1_000,
          },
        ],
      },
      message: 'La potencia debe estar entre 0,1 y 1.000 kW.',
      status: 'ACTIVE',
      version: 1,
      createdAt: BASE_TIME,
      updatedAt: BASE_TIME,
    },
  ]
}

function buildUatReleaseFixture(): UatRelease {
  const scenarios = buildUatScenarios()
  const plan: UatPlan = {
    id: 'uat-plan-main',
    releaseId: 'uat-release-0-1-0',
    name: 'Plan de aceptación principal',
    assignedTesterId: demoUsers.uat_tester.id,
    scenarioIds: scenarios.map((scenario) => scenario.id),
    createdAt: BASE_TIME,
  }
  const executions: UatExecution[] = scenarios.slice(0, 6).map((scenario, index) => ({
    id: `uat-execution-${String(index + 1).padStart(3, '0')}`,
    releaseId: plan.releaseId,
    planId: plan.id,
    scenarioId: scenario.id,
    testerId: demoUsers.uat_tester.id,
    status: index < 5 ? 'PASSED' : 'FAILED',
    comment:
      index < 5
        ? 'Resultado sintético conforme a los criterios.'
        : 'Fallo sintético abierto para demostrar la gestión UAT.',
    stepResults: scenario.steps.map((step) => ({
      stepId: step.id,
      result: index < 5 ? 'PASSED' : 'FAILED',
      comment: index < 5 ? 'Paso conforme.' : 'Resultado esperado no observado.',
    })),
    evidence:
      index === 0
        ? [
            {
              id: 'uat-evidence-seed',
              fileName: 'alta-manual-demo.png',
              mimeType: 'image/png',
              kind: 'SCREENSHOT',
              comment: 'Referencia sintética; no contiene una captura binaria real.',
              storageMode: 'demo-metadata',
              storagePath: null,
              sizeBytes: 0,
              sha256: null,
              createdAt: BASE_TIME,
            },
          ]
        : [],
    issues:
      index === 5
        ? [
            {
              id: 'uat-issue-seed',
              title: 'Validar texto de cambios solicitados',
              severity: 'MEDIUM',
              status: 'OPEN',
            },
          ]
        : [],
    signOffDecision: null,
    signOffComment: null,
    signedOffAt: null,
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
  }))
  return {
    id: plan.releaseId,
    version: '0.1.0',
    name: 'Vertical slice demo',
    status: 'IN_EXECUTION',
    plans: [plan],
    scenarios,
    executions,
    createdAt: BASE_TIME,
  }
}

function buildUatScenarios(): UatRelease['scenarios'] {
  const titles = [
    'Crear material manual',
    'Procesar PDF',
    'Aceptar sugerencia',
    'Rechazar sugerencia',
    'Resolver duplicado',
    'Solicitar cambios',
    'Aprobar',
    'Sincronizar',
    'Reintentar error',
    'Ver permisos',
    'Exportar',
    'Cambiar idioma',
    'Navegación por teclado',
    'Error de red',
    'Sesión expirada',
  ]
  return titles.map((title, index) => {
    const code = `UAT-${String(index + 1).padStart(3, '0')}`
    return {
      id: `uat-scenario-${String(index + 1).padStart(3, '0')}`,
      code,
      title,
      description: `Escenario sintético ${code} para validar ${title.toLocaleLowerCase('es')}.`,
      priority: index < 8 ? 'P0' : index < 12 ? 'P1' : 'P2',
      steps: [
        {
          id: `${code}-step-1`,
          order: 1,
          instruction: `Ejecutar: ${title}.`,
          expectedResult: 'El sistema responde de forma controlada y auditable.',
        },
      ],
    }
  })
}

function csvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`
}

function buildMaterialFixtures(): MaterialDetail[] {
  const primary: MaterialDetail[] = [
    materialFixture({
      id: 'mat-motor-review',
      code: 'FJ-000241',
      description: 'Motor trifásico 7,5 kW 400 V IP55',
      category: 'Motores eléctricos',
      manufacturer: 'Siemens',
      partNumber: '1LE1001-1AA23',
      status: 'IN_REVIEW',
      confidence: 0.94,
      completeness: 0.92,
      duplicateCount: 1,
      attributes: motorAttributes('mat-motor-review'),
      requestId: 'req-motor-001',
    }),
    materialFixture({
      id: 'mat-motor-existing',
      code: 'FJ-000118',
      description: 'Motor eléctrico trifásico 7.5 kW IE3 IP55',
      category: 'Motores eléctricos',
      manufacturer: 'Siemens',
      partNumber: '1LE1001-1AA23',
      status: 'SYNCED',
      confidence: 0.99,
      completeness: 1,
      duplicateCount: 0,
      sapProductId: 'SAP-100045',
      attributes: motorAttributes('mat-motor-existing'),
      requestId: null,
    }),
    materialFixture({
      id: 'mat-bearing-001',
      code: 'FJ-000242',
      description: 'Rodamiento rígido de bolas 6205-2RS',
      category: 'Rodamientos',
      manufacturer: 'SKF',
      partNumber: '6205-2RS1',
      status: 'IN_REVIEW',
      confidence: 0.78,
      completeness: 0.82,
      duplicateCount: 2,
      requestId: 'req-bearing-001',
    }),
    materialFixture({
      id: 'mat-cable-001',
      code: 'FJ-000243',
      description: 'Cable de potencia libre de halógenos 4x6 mm²',
      category: 'Cables',
      manufacturer: 'Forja Industrial',
      partNumber: 'CABLE-4X6-LSZH',
      status: 'APPROVED',
      confidence: 0.88,
      completeness: 0.95,
      duplicateCount: 0,
      requestId: 'req-cable-001',
    }),
  ]

  const categories = [
    'Bombas',
    'Válvulas',
    'Sensores',
    'Lubricantes',
    'Tornillería',
    'Equipos de protección',
    'Componentes electrónicos',
  ]
  const manufacturers = ['ABB', 'SKF', 'Festo', 'Bosch Rexroth', 'Forja Industrial']
  for (let index = 0; index < 36; index += 1) {
    const category = categories[index % categories.length] ?? 'Componentes electrónicos'
    const manufacturer = manufacturers[index % manufacturers.length] ?? 'Forja Industrial'
    primary.push(
      materialFixture({
        id: `mat-generated-${String(index + 1).padStart(3, '0')}`,
        code: `FJ-${String(300 + index).padStart(6, '0')}`,
        description: `${category.slice(0, -1)} industrial serie ${String(index + 1).padStart(2, '0')}`,
        category,
        manufacturer,
        partNumber: `DEMO-${category.slice(0, 3).toUpperCase()}-${index + 1}`,
        status: index % 5 === 0 ? 'IN_REVIEW' : index % 7 === 0 ? 'SYNC_FAILED' : 'SYNCED',
        confidence: 0.7 + (index % 25) / 100,
        completeness: 0.74 + (index % 22) / 100,
        duplicateCount: index % 9 === 0 ? 1 : 0,
        sapProductId: index % 5 === 0 ? null : `SAP-DEMO-${300 + index}`,
        requestId: null,
      }),
    )
  }
  return primary
}

function buildRequestFixtures(motor: MaterialDetail, duplicate: DuplicateCase): RequestDetail[] {
  const base = (
    id: string,
    title: string,
    status: RequestStatus,
    category: string,
    materialId: string | null,
  ): RequestDetail => ({
    id,
    type: 'CREATE',
    title,
    description: `${title}. Solicitud sintética creada para la demostración de Forjadata.`,
    priority: status === 'SYNC_FAILED' ? 'HIGH' : 'MEDIUM',
    status,
    requesterName: demoUsers.requester.displayName,
    assigneeName: status === 'DRAFT' ? null : demoUsers.reviewer.displayName,
    category,
    processingProgress: status === 'PROCESSING' ? 58 : status === 'DRAFT' ? 0 : 100,
    processingStage:
      status === 'PROCESSING' ? 'NORMALIZING' : status === 'DRAFT' ? null : 'READY_FOR_REVIEW',
    confidenceScore: status === 'DRAFT' ? null : 0.86,
    materialId,
    dueAt: '2026-08-04T16:00:00.000Z',
    createdAt: '2026-07-29T09:00:00.000Z',
    updatedAt: BASE_TIME,
    version: 1,
    documents: [],
    suggestions: [],
    duplicateCases: [],
    workflow: [
      {
        id: `workflow-${id}`,
        fromState: null,
        toState: status,
        actorName: 'Sistema demo',
        actorRole: 'admin',
        reason: 'Estado sintético inicial.',
        source: 'SYSTEM',
        correlationId: `corr-${id}`,
        createdAt: BASE_TIME,
      },
    ],
  })

  const motorRequest = base(
    'req-motor-001',
    'Alta motor trifásico línea de envasado',
    'NEEDS_REVIEW',
    'Motores eléctricos',
    motor.id,
  )
  motorRequest.description =
    'Motor Siemens trifásico de 7,5 kW, 400 V, eficiencia IE3 y protección IP55 para la línea de envasado.'
  motorRequest.confidenceScore = 0.94
  motorRequest.priority = 'HIGH'
  motorRequest.documents = [
    {
      id: 'doc-motor-001',
      fileName: 'ficha-motor-demo.pdf',
      mimeType: 'application/pdf',
      size: 245_760,
      sha256: 'demo-motor-sha256',
      storagePath: null,
      status: 'PROCESSED',
      pageCount: 2,
      provider: 'mock',
    },
  ]
  motorRequest.suggestions = buildSuggestions(motor)
  motorRequest.duplicateCases = [duplicate]

  return [
    motorRequest,
    base(
      'req-bearing-001',
      'Alta rodamiento SKF 6205',
      'NEEDS_REVIEW',
      'Rodamientos',
      'mat-bearing-001',
    ),
    base(
      'req-cable-001',
      'Cable de potencia libre de halógenos',
      'READY_FOR_SAP',
      'Cables',
      'mat-cable-001',
    ),
    base('req-pump-001', 'Bomba centrífuga de proceso', 'PROCESSING', 'Bombas', null),
    base('req-sensor-001', 'Sensor inductivo M18', 'DRAFT', 'Sensores', null),
    base('req-valve-001', 'Válvula mariposa DN80', 'CHANGES_REQUESTED', 'Válvulas', null),
    base('req-lube-001', 'Lubricante sintético ISO VG 68', 'SYNCED', 'Lubricantes', null),
    base(
      'req-ppe-001',
      'Guantes de protección mecánica',
      'REJECTED',
      'Equipos de protección',
      null,
    ),
  ]
}

function materialFixture(input: {
  id: string
  code: string
  description: string
  category: string
  manufacturer: string
  partNumber: string
  status: MaterialDetail['status']
  confidence: number
  completeness: number
  duplicateCount: number
  sapProductId?: string | null
  attributes?: MaterialAttribute[]
  requestId: string | null
}): MaterialDetail {
  return {
    id: input.id,
    internalCode: input.code,
    sapProductId: input.sapProductId ?? null,
    shortDescription: input.description,
    longDescription: `${input.description}. Registro sintético sin datos comerciales reales.`,
    category: input.category,
    manufacturer: input.manufacturer,
    manufacturerPartNumber: input.partNumber,
    gtin: null,
    baseUnit: 'UN',
    status: input.status,
    completenessScore: Math.min(1, input.completeness),
    confidenceScore: Math.min(1, input.confidence),
    duplicateCount: input.duplicateCount,
    ownerName: demoUsers.reviewer.displayName,
    updatedAt: BASE_TIME,
    slaStatus: input.status === 'SYNC_FAILED' ? 'AT_RISK' : 'ON_TRACK',
    source: 'DEMO',
    attributes: input.attributes ?? genericAttributes(input.id),
    requestId: input.requestId,
  }
}

function motorAttributes(materialId: string): MaterialAttribute[] {
  return [
    attribute(materialId, 'POWER', 'Potencia', 7.5, 7.5, 'kW', true, 0.97, '7,5 kW'),
    attribute(materialId, 'VOLTAGE', 'Tensión', 400, 400, 'V', true, 0.95, '400 V'),
    attribute(materialId, 'IP_RATING', 'Protección IP', 'IP55', 'IP55', null, true, 0.96, 'IP55'),
    attribute(materialId, 'EFFICIENCY', 'Eficiencia', 'IE3', 'IE3', null, false, 0.9, 'IE3'),
  ]
}

function genericAttributes(materialId: string): MaterialAttribute[] {
  return [
    attribute(
      materialId,
      'MANUFACTURER',
      'Fabricante',
      'Forja Industrial',
      'Forja Industrial',
      null,
      true,
      0.82,
      'Fabricante: Forja Industrial',
    ),
    attribute(
      materialId,
      'MODEL',
      'Modelo',
      'DEMO-01',
      'DEMO-01',
      null,
      true,
      0.79,
      'Modelo DEMO-01',
    ),
  ]
}

function attribute(
  materialId: string,
  code: string,
  label: string,
  value: string | number | boolean,
  normalizedValue: string | number | boolean,
  unit: string | null,
  required: boolean,
  confidence: number,
  evidenceText: string,
): MaterialAttribute {
  return {
    id: `attr-${materialId}-${code.toLocaleLowerCase('es')}`,
    code,
    label,
    value,
    normalizedValue,
    unit,
    required,
    status: 'SUGGESTED',
    confidence,
    evidenceText,
    evidencePage: 1,
  }
}

function buildSuggestions(
  material: MaterialDetail,
  provider = 'mock',
  providerVersion = 'forjadata-mock-1.0',
): AiSuggestion[] {
  return material.attributes.map((attributeValue) => ({
    id: `suggestion-${material.id}-${attributeValue.code.toLocaleLowerCase('es')}`,
    attributeCode: attributeValue.code,
    label: attributeValue.label,
    originalValue: attributeValue.value,
    suggestedValue: attributeValue.value,
    normalizedValue: attributeValue.normalizedValue,
    unit: attributeValue.unit,
    confidence: attributeValue.confidence ?? 0.75,
    reasoningSummary: `Valor localizado y normalizado mediante reglas de la categoría ${material.category}.`,
    evidenceText: attributeValue.evidenceText ?? String(attributeValue.value),
    evidencePage: attributeValue.evidencePage ?? 1,
    status: 'PENDING',
    provider,
    providerVersion,
  }))
}

function buildDuplicateCase(
  source: MaterialDetail,
  candidate: MaterialDetail,
  id: string,
): DuplicateCase {
  return {
    id,
    sourceMaterialId: source.id,
    candidateMaterialId: candidate.id,
    sourceDescription: source.shortDescription,
    candidateDescription: candidate.shortDescription,
    score: 0.96,
    scoreBreakdown: {
      manufacturer: 1,
      model: 1,
      description: 0.91,
      attributes: 0.94,
    },
    resolution: 'PENDING',
    explanation:
      'Fabricante y referencia coinciden; potencia, tensión y protección IP son equivalentes.',
    resolvedAt: null,
    resolvedBy: null,
  }
}

function toSapPayload(material: MaterialDetail): SapProductPayload {
  return {
    internalCode: material.internalCode,
    description: material.shortDescription,
    category: material.category,
    manufacturer: material.manufacturer,
    manufacturerPartNumber: material.manufacturerPartNumber,
    baseUnit: material.baseUnit,
    attributes: Object.fromEntries(
      material.attributes.map((attributeValue) => [
        attributeValue.code,
        attributeValue.normalizedValue,
      ]),
    ),
  }
}

function paginate<T>(items: T[], query: PaginationQuery, correlationId: string): Paginated<T> {
  const start = (query.page - 1) * query.pageSize
  const data = items.slice(start, start + query.pageSize)
  return {
    data: structuredClone(data),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / query.pageSize)),
    },
    meta: { correlationId },
  }
}

function compareValues<T extends object>(
  left: T,
  right: T,
  key: string,
  direction: 'asc' | 'desc',
): number {
  const leftValue = key in left ? String(left[key as keyof T] ?? '') : ''
  const rightValue = key in right ? String(right[key as keyof T] ?? '') : ''
  const compared = leftValue.localeCompare(rightValue, 'es', {
    numeric: true,
    sensitivity: 'base',
  })
  return direction === 'asc' ? compared : -compared
}

function looksLikeMotor(value: string): boolean {
  return /\bmotor\b/i.test(value)
}

function mimeTypeFor(fileName: string): string {
  const lower = fileName.toLocaleLowerCase('es')
  if (lower.endsWith('.pdf')) return 'application/pdf'
  if (lower.endsWith('.csv')) return 'text/csv'
  if (lower.endsWith('.xlsx')) {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  return 'application/octet-stream'
}
