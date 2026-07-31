import { createHash } from 'node:crypto'

import {
  AddUatEvidenceInputSchema,
  CreateUatExecutionInputSchema,
  CreateUatPlanInputSchema,
  CreateUatReleaseInputSchema,
  CreateQualityRuleInputSchema,
  CreateRequestInputSchema,
  DuplicateResolutionInputSchema,
  PaginationQuerySchema,
  RoleSchema,
  SuggestionDecisionInputSchema,
  SignOffUatExecutionInputSchema,
  TestQualityRuleInputSchema,
  TransitionInputSchema,
  UpdateQualityRuleInputSchema,
  UpdateUatExecutionInputSchema,
  UploadDocumentInputSchema,
  type IntegrationMessage,
  type SapSyncJob,
} from '@forjadata/contracts'
import {
  DemoConflictError,
  DemoEngine,
  DemoNotFoundError,
  WorkflowTransitionError,
} from '@forjadata/domain'
import { z, ZodError } from 'zod'

import { AuthenticationError, type AuthenticatedPrincipal } from './auth/entra-token-verifier.js'
import {
  entraTokenVerifier,
  externalIntegrationHealth,
  messagePublisher,
  notificationEmail,
  objectStorage,
  runtimeConfig,
  runtimeStateStore,
  sapGateway,
} from './integrations/runtime-integrations.js'
import { logger } from './logger.js'
import { openApiDocument } from './openapi.js'
import { RuntimeStateConflictError } from './persistence/runtime-state-store.js'
import { localMetrics } from './telemetry.js'

class DocumentValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DocumentValidationError'
  }
}

class IntegrationUnavailableError extends Error {
  constructor(
    readonly integration: string,
    message: string,
  ) {
    super(message)
    this.name = 'IntegrationUnavailableError'
  }
}

export function resetApiState(): void {
  runtimeStateStore.resetSync?.()
  localMetrics.reset()
}

export async function handleApiRequest(request: Request): Promise<Response> {
  const startedAt = performance.now()
  const url = new URL(request.url)
  const path = normalizePath(url.pathname)
  const correlationId = request.headers.get('x-correlation-id') ?? crypto.randomUUID()
  const roleHeader = request.headers.get('x-demo-role')

  try {
    const state = await runtimeStateStore.load()
    const engine = new DemoEngine(state.snapshot)
    const pendingMessages: IntegrationMessage[] = []
    const principal = await authenticateRequest(request, path)
    if (runtimeConfig.AUTH_MODE === 'demo' && roleHeader) {
      engine.switchRole(RoleSchema.parse(roleHeader))
    }
    if (runtimeConfig.AUTH_MODE === 'entra' && principal) {
      engine.switchRole(principal.role)
    }
    const result =
      request.method === 'OPTIONS'
        ? corsResponse(null, 204)
        : await route(request, url, path, correlationId, principal, engine, pendingMessages)
    if (isStateMutation(request, result)) {
      await runtimeStateStore.save(engine.getSnapshot(), state.version)
    }
    for (const message of pendingMessages) await messagePublisher.publish(message)
    const durationMs = performance.now() - startedAt
    applyResponseHeaders(result, request, correlationId)
    localMetrics.record({
      method: request.method,
      path,
      status: result.status,
      durationMs,
    })
    logger.info({
      message: 'HTTP request completed',
      method: request.method,
      path,
      status: result.status,
      correlationId,
      durationMs: Math.round(durationMs),
    })
    return result
  } catch (error) {
    const response = errorResponse(error, path, correlationId)
    const durationMs = performance.now() - startedAt
    applyResponseHeaders(response, request, correlationId)
    localMetrics.record({
      method: request.method,
      path,
      status: response.status,
      durationMs,
    })
    logger[response.status >= 500 ? 'error' : 'warn']({
      message: 'HTTP request failed',
      method: request.method,
      path,
      status: response.status,
      correlationId,
      durationMs: Math.round(durationMs),
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return response
  }
}

async function route(
  request: Request,
  url: URL,
  path: string,
  correlationId: string,
  principal: AuthenticatedPrincipal | null,
  engine: DemoEngine,
  pendingMessages: IntegrationMessage[],
): Promise<Response> {
  const method = request.method.toUpperCase()
  const segments = path.split('/').filter(Boolean)

  if (method === 'GET' && path === '/health') {
    return json(
      {
        data: {
          status: 'healthy',
          service: 'forjadata-api',
          mode: runtimeConfig.ENFORCE_REAL_INTEGRATIONS ? 'real' : runtimeConfig.AUTH_MODE,
          timestamp: new Date().toISOString(),
        },
        meta: { correlationId },
      },
      200,
    )
  }
  if (method === 'GET' && path === '/health/readiness') {
    return json(
      {
        data: {
          status: 'ready',
          dependencies: await integrationHealth(engine),
        },
        meta: { correlationId },
      },
      200,
    )
  }
  if (method === 'GET' && path === '/version') {
    return envelope(
      { version: '0.1.0', commit: process.env.VERCEL_GIT_COMMIT_SHA ?? 'local' },
      correlationId,
    )
  }
  if (method === 'GET' && path === '/metrics') {
    return envelope(localMetrics.snapshot(), correlationId)
  }
  if (method === 'GET' && path === '/features') {
    return envelope(
      {
        enableRealAi: runtimeConfig.AI_MODE === 'azure',
        enableDocumentIntelligence: runtimeConfig.DOCUMENT_MODE === 'azure',
        enableSapOData:
          runtimeConfig.SAP_MODE === 'odata-v2' || runtimeConfig.SAP_MODE === 'odata-v4',
        enable3dViewer: true,
        enableUat: true,
        enableArchitecturePage: true,
        enableBulkActions: true,
        enableExperimentalRulesBuilder: true,
      },
      correlationId,
    )
  }
  if (method === 'GET' && path === '/openapi.json') {
    return json(openApiDocument)
  }
  if (method === 'GET' && path === '/auth/me') {
    if (runtimeConfig.AUTH_MODE === 'entra') {
      if (!principal || !entraTokenVerifier) {
        throw new AuthenticationError('Sesión corporativa ausente.', 401, 'missing_token')
      }
      return envelope(entraTokenVerifier.sessionFor(principal), correlationId)
    }
    return envelope(engine.session(), correlationId)
  }
  if (method === 'POST' && path === '/auth/demo/session') {
    requireDemoEnabled()
    const body = z.object({ role: RoleSchema.default('reviewer') }).parse(await bodyJson(request))
    return envelope(engine.login(body.role), correlationId)
  }
  if (method === 'DELETE' && path === '/auth/demo/session') {
    requireDemoEnabled()
    return corsResponse(null, 204)
  }
  if (method === 'POST' && path === '/auth/demo/switch-role') {
    requireDemoEnabled()
    const body = z.object({ role: RoleSchema }).parse(await bodyJson(request))
    return envelope(engine.switchRole(body.role), correlationId)
  }
  if (method === 'GET' && path === '/dashboard/summary') {
    return envelope(engine.dashboard(), correlationId)
  }
  if (method === 'GET' && path === '/requests') {
    const query = PaginationQuerySchema.parse(Object.fromEntries(url.searchParams))
    const result = engine.listRequests(query)
    result.meta.correlationId = correlationId
    return json(result)
  }
  if (method === 'POST' && path === '/requests') {
    const input = CreateRequestInputSchema.parse(await bodyJson(request))
    return envelope(engine.createRequest(input), correlationId, 201)
  }
  if (
    method === 'POST' &&
    segments[0] === 'requests' &&
    segments[2] === 'documents' &&
    segments.length === 3
  ) {
    const requestId = requireSegment(segments, 1)
    const input = UploadDocumentInputSchema.parse(await bodyJson(request))
    const bytes = decodeDocument(input.contentBase64, runtimeConfig.MAX_DOCUMENT_BYTES)
    validateDocumentContent(input.fileName, input.mimeType, bytes)
    const fileName = sanitizeFileName(input.fileName)
    const sha256 = createHash('sha256').update(bytes).digest('hex')
    const storagePath = `${requestId}/${crypto.randomUUID()}-${fileName}`
    await objectStorage.put({
      container: runtimeConfig.BLOB_DOCUMENTS_CONTAINER,
      path: storagePath,
      bytes,
      contentType: input.mimeType,
      metadata: { requestId, sha256, correlationId },
    })
    const updated = engine.attachDocument(requestId, {
      fileName,
      mimeType: input.mimeType,
      size: bytes.byteLength,
      sha256,
      storagePath,
      provider: objectStorage.adapter === 'memory' ? 'local-bytes' : objectStorage.adapter,
    })
    return envelope(updated, correlationId, 201)
  }
  if (method === 'GET' && segments[0] === 'requests' && segments.length === 2) {
    return envelope(engine.getRequest(requireSegment(segments, 1)), correlationId)
  }
  if (
    method === 'POST' &&
    segments[0] === 'requests' &&
    segments[2] === 'submit' &&
    segments.length === 3
  ) {
    const body = z
      .object({ expectedVersion: z.number().int().positive() })
      .parse(await bodyJson(request))
    const requestId = requireSegment(segments, 1)
    if (runtimeConfig.QUEUE_MODE === 'service-bus') {
      const queued = engine.startRequestProcessing(
        requestId,
        body.expectedVersion,
        'Solicitud publicada en Azure Service Bus.',
      )
      const document = queued.documents[0]
      pendingMessages.push({
        schemaVersion: 1,
        type: 'document.process',
        messageId: crypto.randomUUID(),
        correlationId: asUuid(correlationId),
        occurredAt: new Date().toISOString(),
        payload: {
          requestId,
          documentId: document?.id ?? 'no-document',
          blobPath: document?.storagePath ?? 'no-document',
        },
      })
      return envelope(queued, correlationId, 202)
    }
    const completed = engine.submitAndProcessRequest(requestId, body.expectedVersion)
    await notificationEmail.send({
      template: 'PROCESSING_COMPLETED',
      subject: `Solicitud ${completed.id} lista para revisión`,
      text: 'El procesamiento terminó y la solicitud requiere revisión humana.',
      link: `${runtimeConfig.PUBLIC_APP_URL}/app/requests/${encodeURIComponent(completed.id)}`,
      correlationId,
    })
    return envelope(completed, correlationId)
  }
  if (method === 'GET' && segments[0] === 'requests' && segments[2] === 'processing-status') {
    const detail = engine.getRequest(requireSegment(segments, 1))
    return envelope(
      {
        status: detail.status,
        progress: detail.processingProgress,
        stage: detail.processingStage,
      },
      correlationId,
    )
  }
  if (
    method === 'POST' &&
    segments[0] === 'requests' &&
    segments[2] === 'suggestions' &&
    segments[4] === 'decision'
  ) {
    const input = SuggestionDecisionInputSchema.parse(await bodyJson(request))
    return envelope(
      engine.decideSuggestion(requireSegment(segments, 1), requireSegment(segments, 3), input),
      correlationId,
    )
  }
  if (
    method === 'POST' &&
    segments[0] === 'requests' &&
    segments[2] === 'suggestions' &&
    segments[3] === 'bulk-accept'
  ) {
    return envelope(engine.acceptAllSuggestions(requireSegment(segments, 1)), correlationId)
  }
  if (
    method === 'POST' &&
    segments[0] === 'requests' &&
    segments[2] === 'duplicates' &&
    segments[4] === 'resolve'
  ) {
    const input = DuplicateResolutionInputSchema.parse(await bodyJson(request))
    return envelope(
      engine.resolveDuplicate(
        requireSegment(segments, 1),
        requireSegment(segments, 3),
        input.resolution,
        input.reason,
      ),
      correlationId,
    )
  }
  if (method === 'POST' && segments[0] === 'requests' && segments[2] === 'approve') {
    const input = TransitionInputSchema.pick({
      expectedVersion: true,
      reason: true,
    }).parse(await bodyJson(request))
    return envelope(
      engine.approveRequest(requireSegment(segments, 1), input.expectedVersion, input.reason),
      correlationId,
    )
  }
  if (method === 'POST' && segments[0] === 'requests' && segments[2] === 'request-changes') {
    const input = TransitionInputSchema.pick({
      expectedVersion: true,
      reason: true,
    }).parse(await bodyJson(request))
    return envelope(
      engine.requestChanges(requireSegment(segments, 1), input.expectedVersion, input.reason),
      correlationId,
    )
  }
  if (method === 'GET' && path === '/materials') {
    const query = PaginationQuerySchema.parse(Object.fromEntries(url.searchParams))
    const result = engine.listMaterials(query)
    result.meta.correlationId = correlationId
    return json(result)
  }
  if (method === 'GET' && segments[0] === 'materials' && segments.length === 2) {
    return envelope(engine.getMaterial(requireSegment(segments, 1)), correlationId)
  }
  if (method === 'GET' && path === '/duplicate-cases') {
    return envelope(engine.listDuplicateCases(), correlationId)
  }
  if (method === 'GET' && path === '/sap/health') {
    const health =
      runtimeConfig.SAP_MODE === 'simulator'
        ? engine.integrationHealth().find((item) => item.name === 'SAP')
        : await sapGateway.healthCheck()
    return envelope(health ?? null, correlationId)
  }
  if (method === 'GET' && path === '/sap/jobs') {
    return envelope(engine.listSapJobs(), correlationId)
  }
  if (
    method === 'POST' &&
    segments[0] === 'requests' &&
    segments[2] === 'sap' &&
    segments[3] === 'sync'
  ) {
    const body = z
      .object({ expectedVersion: z.number().int().positive() })
      .parse(await bodyJson(request))
    const requestId = requireSegment(segments, 1)
    if (runtimeConfig.SAP_MODE === 'disabled') {
      throw new IntegrationUnavailableError(
        'SAP',
        'SAP OData está deshabilitado hasta configurar un endpoint y credenciales reales.',
      )
    }
    if (runtimeConfig.SAP_MODE === 'simulator') {
      const completed = engine.syncRequest(requestId, body.expectedVersion)
      await notificationEmail.send({
        template: completed.status === 'SUCCEEDED' ? 'SAP_SYNC_COMPLETED' : 'SAP_SYNC_FAILED',
        subject:
          completed.status === 'SUCCEEDED'
            ? `Sincronización ${completed.id} completada`
            : `Sincronización ${completed.id} con error`,
        text:
          completed.status === 'SUCCEEDED'
            ? 'El material se sincronizó correctamente con SAP Simulator.'
            : 'La sincronización requiere revisión o reintento.',
        link: `${runtimeConfig.PUBLIC_APP_URL}/app/sap`,
        correlationId,
      })
      return envelope(completed, correlationId)
    }
    const job = engine.queueSapSync(requestId, body.expectedVersion, runtimeConfig.SAP_MODE)
    if (runtimeConfig.QUEUE_MODE === 'service-bus') {
      await storeSapPayload(job, correlationId)
      pendingMessages.push(sapSyncMessage(job, correlationId))
      return envelope(job, correlationId, 202)
    }
    const completed = await executeSapJob(engine, job)
    await notificationEmail.send({
      template: completed.status === 'SUCCEEDED' ? 'SAP_SYNC_COMPLETED' : 'SAP_SYNC_FAILED',
      subject:
        completed.status === 'SUCCEEDED'
          ? `Sincronización ${completed.id} completada`
          : `Sincronización ${completed.id} con error`,
      text:
        completed.status === 'SUCCEEDED'
          ? 'El material se sincronizó correctamente con SAP OData.'
          : 'La sincronización SAP requiere revisión o reintento.',
      link: `${runtimeConfig.PUBLIC_APP_URL}/app/sap`,
      correlationId,
    })
    return envelope(completed, correlationId)
  }
  if (
    method === 'POST' &&
    segments[0] === 'sap' &&
    segments[1] === 'jobs' &&
    segments[3] === 'retry'
  ) {
    const jobId = requireSegment(segments, 2)
    if (runtimeConfig.SAP_MODE === 'disabled') {
      throw new IntegrationUnavailableError(
        'SAP',
        'SAP OData está deshabilitado hasta configurar un endpoint y credenciales reales.',
      )
    }
    if (runtimeConfig.SAP_MODE === 'simulator') {
      return envelope(engine.retrySapJob(jobId), correlationId)
    }
    const job = engine.queueSapRetry(jobId)
    if (runtimeConfig.QUEUE_MODE === 'service-bus') {
      await storeSapPayload(job, correlationId)
      pendingMessages.push(sapSyncMessage(job, correlationId))
      return envelope(job, correlationId, 202)
    }
    return envelope(await executeSapJob(engine, job), correlationId)
  }
  if (
    method === 'GET' &&
    segments[0] === 'sap' &&
    segments[1] === 'jobs' &&
    segments[3] === 'payload'
  ) {
    const job = engine.listSapJobs().find((item) => item.id === requireSegment(segments, 2))
    if (!job) throw new DemoNotFoundError('Trabajo SAP', requireSegment(segments, 2))
    return envelope(job.payload, correlationId)
  }
  if (method === 'GET' && path === '/audit-events') {
    return envelope(engine.listAuditEvents(), correlationId)
  }
  if (method === 'GET' && path === '/audit-events/export') {
    return corsResponse(engine.exportAuditEventsCsv(), 200, {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="forjadata-audit-demo.csv"',
    })
  }
  if (method === 'GET' && segments[0] === 'audit-events' && segments.length === 2) {
    return envelope(engine.getAuditEvent(requireSegment(segments, 1)), correlationId)
  }
  if (method === 'GET' && path === '/uat/releases') {
    return envelope(engine.listUatReleases(), correlationId)
  }
  if (method === 'POST' && path === '/uat/releases') {
    const body = CreateUatReleaseInputSchema.parse(await bodyJson(request))
    return envelope(engine.createUatRelease(body), correlationId, 201)
  }
  if (
    method === 'GET' &&
    segments[0] === 'uat' &&
    segments[1] === 'releases' &&
    segments.length === 3
  ) {
    return envelope(engine.getUatRelease(requireSegment(segments, 2)), correlationId)
  }
  if (
    method === 'POST' &&
    segments[0] === 'uat' &&
    segments[1] === 'releases' &&
    segments[3] === 'plans' &&
    segments.length === 4
  ) {
    const body = CreateUatPlanInputSchema.parse(await bodyJson(request))
    return envelope(engine.createUatPlan(requireSegment(segments, 2), body), correlationId, 201)
  }
  if (
    method === 'GET' &&
    segments[0] === 'uat' &&
    segments[1] === 'plans' &&
    segments.length === 3
  ) {
    return envelope(engine.getUatPlan(requireSegment(segments, 2)), correlationId)
  }
  if (method === 'POST' && path === '/uat/executions') {
    const body = CreateUatExecutionInputSchema.parse(await bodyJson(request))
    return envelope(engine.createUatExecution(body), correlationId, 201)
  }
  if (
    method === 'PATCH' &&
    segments[0] === 'uat' &&
    segments[1] === 'executions' &&
    segments.length === 3
  ) {
    const body = UpdateUatExecutionInputSchema.parse(await bodyJson(request))
    return envelope(engine.updateUatExecution(requireSegment(segments, 2), body), correlationId)
  }
  if (
    method === 'POST' &&
    segments[0] === 'uat' &&
    segments[1] === 'executions' &&
    segments[3] === 'evidence' &&
    segments.length === 4
  ) {
    const body = AddUatEvidenceInputSchema.parse(await bodyJson(request))
    const executionId = requireSegment(segments, 2)
    if (!body.contentBase64) {
      return envelope(engine.addUatEvidence(executionId, body), correlationId, 201)
    }
    const bytes = decodeDocument(body.contentBase64, 5_000_000)
    const fileName = sanitizeFileName(body.fileName)
    const sha256 = createHash('sha256').update(bytes).digest('hex')
    const storagePath = `uat/${executionId}/${crypto.randomUUID()}-${fileName}`
    await objectStorage.put({
      container: runtimeConfig.BLOB_UAT_EVIDENCE_CONTAINER,
      path: storagePath,
      bytes,
      contentType: body.mimeType,
      metadata: {
        executionId,
        correlationId,
        sha256,
        kind: body.kind,
      },
    })
    const { contentBase64: _contentBase64, ...metadata } = body
    return envelope(
      engine.addUatEvidence(executionId, metadata, {
        storagePath,
        sizeBytes: bytes.byteLength,
        sha256,
      }),
      correlationId,
      201,
    )
  }
  if (
    method === 'POST' &&
    segments[0] === 'uat' &&
    segments[1] === 'executions' &&
    segments[3] === 'sign-off' &&
    segments.length === 4
  ) {
    const body = SignOffUatExecutionInputSchema.parse(await bodyJson(request))
    return envelope(engine.signOffUatExecution(requireSegment(segments, 2), body), correlationId)
  }
  if (method === 'GET' && path === '/notifications') {
    return envelope(engine.listNotifications(), correlationId)
  }
  if (method === 'GET' && path === '/notifications/unread-count') {
    return envelope(
      { count: engine.listNotifications().filter((item) => item.readAt === null).length },
      correlationId,
    )
  }
  if (method === 'POST' && path === '/notifications/read-all') {
    return envelope(engine.markAllNotificationsRead(), correlationId)
  }
  if (method === 'GET' && path === '/admin/quality-rules') {
    return envelope(engine.listQualityRules(), correlationId)
  }
  if (method === 'POST' && path === '/admin/quality-rules') {
    const body = CreateQualityRuleInputSchema.parse(await bodyJson(request))
    return envelope(engine.createQualityRule(body), correlationId, 201)
  }
  if (
    method === 'PATCH' &&
    segments[0] === 'admin' &&
    segments[1] === 'quality-rules' &&
    segments.length === 3
  ) {
    const body = UpdateQualityRuleInputSchema.parse(await bodyJson(request))
    return envelope(engine.updateQualityRule(requireSegment(segments, 2), body), correlationId)
  }
  if (
    method === 'POST' &&
    segments[0] === 'admin' &&
    segments[1] === 'quality-rules' &&
    segments[3] === 'test' &&
    segments.length === 4
  ) {
    const body = TestQualityRuleInputSchema.parse(await bodyJson(request))
    return envelope(
      engine.testQualityRule(requireSegment(segments, 2), body.materialId),
      correlationId,
    )
  }
  if (method === 'GET' && path === '/admin/integrations') {
    return envelope(await integrationHealth(engine), correlationId)
  }
  if (method === 'POST' && path === '/admin/demo/reset') {
    requireDemoEnabled()
    return envelope(engine.reset(), correlationId)
  }

  return problem(404, 'Endpoint not found', `No existe ${method} ${path}.`, path, correlationId)
}

async function bodyJson(request: Request): Promise<unknown> {
  const text = await request.text()
  return text.length === 0 ? {} : JSON.parse(text)
}

function normalizePath(pathname: string): string {
  const marker = '/api/v1'
  const index = pathname.indexOf(marker)
  if (index >= 0) {
    const value = pathname.slice(index + marker.length)
    return value.length > 0 ? value.replace(/\/+$/, '') || '/' : '/'
  }
  const v1Marker = '/v1'
  if (pathname.startsWith(v1Marker)) {
    const value = pathname.slice(v1Marker.length)
    return value.length > 0 ? value.replace(/\/+$/, '') || '/' : '/'
  }
  return pathname.replace(/\/+$/, '') || '/'
}

function requireSegment(segments: string[], index: number): string {
  const segment = segments[index]
  if (!segment) throw new Error('Identificador de ruta ausente.')
  return decodeURIComponent(segment)
}

function envelope<T>(data: T, correlationId: string, status = 200): Response {
  return json({ data, meta: { correlationId } }, status)
}

function json(value: unknown, status = 200): Response {
  return corsResponse(JSON.stringify(value), status, {
    'content-type': 'application/json; charset=utf-8',
  })
}

function problem(
  status: number,
  title: string,
  detail: string,
  instance: string,
  correlationId: string,
  errors?: Record<string, string[]>,
): Response {
  return corsResponse(
    JSON.stringify({
      type: `https://forjadata.dev/problems/${title.toLocaleLowerCase('en').replaceAll(' ', '-')}`,
      title,
      status,
      detail,
      instance,
      correlationId,
      ...(errors ? { errors } : {}),
    }),
    status,
    {
      'content-type': 'application/problem+json; charset=utf-8',
    },
  )
}

function errorResponse(error: unknown, path: string, correlationId: string): Response {
  if (error instanceof AuthenticationError) {
    const response = problem(
      error.status,
      error.status === 401 ? 'Unauthorized' : 'Forbidden',
      error.message,
      path,
      correlationId,
      { authentication: [error.code] },
    )
    if (error.status === 401) {
      response.headers.set('www-authenticate', `Bearer error="${error.code}"`)
    }
    return response
  }
  if (error instanceof ZodError) {
    const errors: Record<string, string[]> = {}
    for (const issue of error.issues) {
      const field = issue.path.join('.') || 'request'
      errors[field] = [...(errors[field] ?? []), issue.message]
    }
    return problem(
      422,
      'Validation failed',
      'Uno o más campos no son válidos.',
      path,
      correlationId,
      errors,
    )
  }
  if (error instanceof DocumentValidationError) {
    return problem(422, 'Document validation failed', error.message, path, correlationId)
  }
  if (error instanceof IntegrationUnavailableError) {
    return problem(503, 'Integration unavailable', error.message, path, correlationId, {
      integration: [error.integration],
    })
  }
  if (error instanceof DemoNotFoundError) {
    return problem(404, 'Not found', error.message, path, correlationId)
  }
  if (error instanceof DemoConflictError) {
    return problem(
      409,
      'Version conflict',
      `${error.message} Versión actual: ${error.currentVersion}.`,
      path,
      correlationId,
    )
  }
  if (error instanceof RuntimeStateConflictError) {
    return problem(409, 'State conflict', error.message, path, correlationId)
  }
  if (error instanceof WorkflowTransitionError) {
    const status = error.code === 'FORBIDDEN' ? 403 : 409
    return problem(status, 'Workflow transition rejected', error.message, path, correlationId)
  }
  if (error instanceof SyntaxError) {
    return problem(400, 'Invalid JSON', 'El cuerpo JSON no es válido.', path, correlationId)
  }
  if (
    error instanceof Error &&
    (error.message.includes('rol actual') || error.message.includes('no puede'))
  ) {
    return problem(403, 'Forbidden', error.message, path, correlationId)
  }
  return problem(
    500,
    'Internal server error',
    'Se produjo un error inesperado. Usa el correlation ID para localizarlo.',
    path,
    correlationId,
  )
}

function corsResponse(body: BodyInit | null, status: number, headers: HeadersInit = {}): Response {
  return new Response(body, {
    status,
    headers: {
      'access-control-allow-headers': 'content-type, authorization, x-correlation-id, x-demo-role',
      'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'access-control-expose-headers': 'x-correlation-id, content-disposition',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...headers,
    },
  })
}

async function authenticateRequest(
  request: Request,
  path: string,
): Promise<AuthenticatedPrincipal | null> {
  if (request.method === 'OPTIONS' || runtimeConfig.AUTH_MODE === 'demo') return null
  if (isPublicEndpoint(request.method, path)) return null
  if (!entraTokenVerifier) {
    throw new AuthenticationError('Microsoft Entra no está inicializado.', 401, 'auth_unconfigured')
  }
  if (request.headers.has('x-demo-role')) {
    throw new AuthenticationError(
      'x-demo-role no está permitido en modo Entra.',
      403,
      'demo_header_forbidden',
    )
  }
  return entraTokenVerifier.verifyAuthorizationHeader(request.headers.get('authorization'))
}

function isPublicEndpoint(method: string, path: string): boolean {
  if (method !== 'GET') return false
  return new Set(['/health', '/health/readiness', '/version', '/features', '/openapi.json']).has(
    path,
  )
}

function requireDemoEnabled(): void {
  if (runtimeConfig.AUTH_MODE !== 'demo' || !runtimeConfig.DEMO_ENABLED) {
    throw new AuthenticationError('Los endpoints demo están deshabilitados.', 403, 'demo_disabled')
  }
}

async function integrationHealth(engine: DemoEngine) {
  const current = engine.integrationHealth()
  const external = await externalIntegrationHealth()
  const names = new Set(external.map((item) => item.name))
  return [...current.filter((item) => !names.has(item.name)), ...external]
}

async function executeSapJob(engine: DemoEngine, job: SapSyncJob): Promise<SapSyncJob> {
  const result =
    job.operation === 'CREATE'
      ? await sapGateway.createProduct(job.payload)
      : await sapGateway.updateProduct(job.sapProductId ?? job.payload.internalCode, job.payload)
  return engine.completeSapSync(job.id, result)
}

async function storeSapPayload(job: SapSyncJob, correlationId: string): Promise<void> {
  await objectStorage.put({
    container: runtimeConfig.BLOB_SAP_PAYLOADS_CONTAINER,
    path: `${job.requestId}/${job.id}.json`,
    bytes: new TextEncoder().encode(JSON.stringify(job.payload)),
    contentType: 'application/json',
    metadata: { requestId: job.requestId, jobId: job.id, correlationId },
  })
}

function sapSyncMessage(job: SapSyncJob, correlationId: string): IntegrationMessage {
  return {
    schemaVersion: 1,
    type: 'sap.sync',
    messageId: crypto.randomUUID(),
    correlationId: asUuid(correlationId),
    occurredAt: new Date().toISOString(),
    payload: { requestId: job.requestId, jobId: job.id },
  }
}

function isStateMutation(request: Request, response: Response): boolean {
  return !['GET', 'HEAD', 'OPTIONS'].includes(request.method.toUpperCase()) && response.status < 400
}

function decodeDocument(contentBase64: string, maximumBytes: number): Uint8Array {
  const normalized = contentBase64.replaceAll(/\s/g, '')
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(normalized) || normalized.length % 4 !== 0) {
    throw new DocumentValidationError('El contenido del documento no es Base64 válido.')
  }
  const bytes = Buffer.from(normalized, 'base64')
  if (bytes.byteLength === 0 || bytes.byteLength > maximumBytes) {
    throw new DocumentValidationError(`El documento debe ocupar entre 1 y ${maximumBytes} bytes.`)
  }
  return Uint8Array.from(bytes)
}

function sanitizeFileName(value: string): string {
  const normalized = value
    .normalize('NFKC')
    .replaceAll(/[/\\\u0000-\u001f\u007f]/g, '-')
    .replaceAll(/\s+/g, '-')
    .replaceAll(/[^A-Za-z0-9._-]/g, '')
    .replaceAll(/-+/g, '-')
    .replace(/^\.+/, '')
    .slice(0, 120)
  if (!normalized) throw new DocumentValidationError('El nombre del documento no es válido.')
  return normalized
}

function validateDocumentContent(fileName: string, mimeType: string, bytes: Uint8Array): void {
  const extension = fileName.split('.').pop()?.toLocaleLowerCase('en')
  const extensionsByMime: Record<string, string[]> = {
    'application/pdf': ['pdf'],
    'image/png': ['png'],
    'image/jpeg': ['jpg', 'jpeg'],
    'text/csv': ['csv'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
  }
  if (!extension || !extensionsByMime[mimeType]?.includes(extension)) {
    throw new DocumentValidationError('La extensión y el tipo MIME del documento no coinciden.')
  }
  const signatures: Record<string, number[]> = {
    'application/pdf': [0x25, 0x50, 0x44, 0x46],
    'image/png': [0x89, 0x50, 0x4e, 0x47],
    'image/jpeg': [0xff, 0xd8, 0xff],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [0x50, 0x4b, 0x03, 0x04],
  }
  const signature = signatures[mimeType]
  if (signature && !signature.every((value, index) => bytes[index] === value)) {
    throw new DocumentValidationError(
      'La firma binaria del documento no coincide con su tipo declarado.',
    )
  }
}

function asUuid(value: string): `${string}-${string}-${string}-${string}-${string}` {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? (value as `${string}-${string}-${string}-${string}-${string}`)
    : crypto.randomUUID()
}

function applyResponseHeaders(response: Response, request: Request, correlationId: string): void {
  response.headers.set('x-correlation-id', correlationId)
  const requestOrigin = request.headers.get('origin')
  const allowedOrigin =
    requestOrigin && runtimeConfig.CORS_ALLOWED_ORIGINS.includes(requestOrigin)
      ? requestOrigin
      : runtimeConfig.CORS_ALLOWED_ORIGINS[0]
  if (allowedOrigin) {
    response.headers.set('access-control-allow-origin', allowedOrigin)
    response.headers.set('vary', 'Origin')
  }
}
