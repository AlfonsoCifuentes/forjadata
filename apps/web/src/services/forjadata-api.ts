import type {
  AddUatEvidenceInput,
  AuditEvent,
  CreateQualityRuleInput,
  CreateUatExecutionInput,
  CreateRequestInput,
  DashboardSummary,
  DuplicateCase,
  DuplicateResolution,
  FeatureFlags,
  IntegrationHealth,
  MaterialDetail,
  MaterialSummary,
  Notification,
  Paginated,
  PaginationQuery,
  QualityResult,
  QualityRule,
  RequestDetail,
  Role,
  SapSyncJob,
  Session,
  SuggestionDecisionInput,
  SignOffUatExecutionInput,
  UatExecution,
  UatRelease,
  UpdateUatExecutionInput,
  UpdateQualityRuleInput,
  UploadDocumentInput,
} from '@forjadata/contracts'
import { DemoEngine, type DemoSnapshot } from '@forjadata/domain'

import { entraAuth, isEntraMode } from '@/services/entra-auth'

export interface ForjadataApi {
  getSession(): Promise<Session>
  login(role: Role): Promise<Session>
  switchRole(role: Role): Promise<Session>
  dashboard(): Promise<DashboardSummary>
  listRequests(query: PaginationQuery): Promise<Paginated<RequestDetail>>
  getRequest(id: string): Promise<RequestDetail>
  createRequest(input: CreateRequestInput): Promise<RequestDetail>
  uploadDocument(requestId: string, input: UploadDocumentInput): Promise<RequestDetail>
  submitRequest(id: string, expectedVersion: number): Promise<RequestDetail>
  decideSuggestion(
    requestId: string,
    suggestionId: string,
    input: SuggestionDecisionInput,
  ): Promise<RequestDetail>
  acceptAllSuggestions(requestId: string): Promise<RequestDetail>
  resolveDuplicate(
    requestId: string,
    duplicateId: string,
    resolution: Exclude<DuplicateResolution, 'PENDING'>,
    reason: string,
  ): Promise<RequestDetail>
  approveRequest(id: string, expectedVersion: number, reason: string): Promise<RequestDetail>
  requestChanges(id: string, expectedVersion: number, reason: string): Promise<RequestDetail>
  listMaterials(query: PaginationQuery): Promise<Paginated<MaterialSummary>>
  getMaterial(id: string): Promise<MaterialDetail>
  listDuplicateCases(): Promise<DuplicateCase[]>
  listSapJobs(): Promise<SapSyncJob[]>
  syncRequest(id: string, expectedVersion: number): Promise<SapSyncJob>
  retrySapJob(jobId: string): Promise<SapSyncJob>
  listAuditEvents(): Promise<AuditEvent[]>
  getAuditEvent(id: string): Promise<AuditEvent>
  exportAuditEvents(): Promise<{ fileName: string; content: string }>
  listUatReleases(): Promise<UatRelease[]>
  createUatExecution(input: CreateUatExecutionInput): Promise<UatExecution>
  updateUatExecution(id: string, input: UpdateUatExecutionInput): Promise<UatExecution>
  addUatEvidence(id: string, input: AddUatEvidenceInput): Promise<UatExecution>
  signOffUatExecution(id: string, input: SignOffUatExecutionInput): Promise<UatExecution>
  listNotifications(): Promise<Notification[]>
  markAllNotificationsRead(): Promise<Notification[]>
  integrationHealth(): Promise<IntegrationHealth[]>
  features(): Promise<FeatureFlags>
  listQualityRules(): Promise<QualityRule[]>
  createQualityRule(input: CreateQualityRuleInput): Promise<QualityRule>
  updateQualityRule(id: string, input: UpdateQualityRuleInput): Promise<QualityRule>
  testQualityRule(id: string, materialId: string): Promise<QualityResult>
  resetDemo(): Promise<void>
}

const storageKey = 'forjadata-demo-snapshot-v2'

export class DemoForjadataApi implements ForjadataApi {
  private engine: DemoEngine

  constructor() {
    this.engine = new DemoEngine(readStoredSnapshot())
  }

  async getSession() {
    return this.engine.session()
  }
  async login(role: Role) {
    const result = this.engine.login(role)
    this.persist()
    return result
  }
  async switchRole(role: Role) {
    const result = this.engine.switchRole(role)
    this.persist()
    return result
  }
  async dashboard() {
    return this.engine.dashboard()
  }
  async listRequests(query: PaginationQuery) {
    return this.engine.listRequests(query)
  }
  async getRequest(id: string) {
    return this.engine.getRequest(id)
  }
  async createRequest(input: CreateRequestInput) {
    const result = this.engine.createRequest(input)
    this.persist()
    return result
  }
  async uploadDocument(requestId: string, input: UploadDocumentInput) {
    const bytes = Uint8Array.from(atob(input.contentBase64), (character) => character.charCodeAt(0))
    const digest = await crypto.subtle.digest('SHA-256', bytes)
    const sha256 = [...new Uint8Array(digest)]
      .map((value) => value.toString(16).padStart(2, '0'))
      .join('')
    const result = this.engine.attachDocument(requestId, {
      fileName: input.fileName,
      mimeType: input.mimeType,
      size: bytes.byteLength,
      sha256,
      storagePath: null,
      provider: 'browser-local',
    })
    this.persist()
    return result
  }
  async submitRequest(id: string, expectedVersion: number) {
    await delay(180)
    const result = this.engine.submitAndProcessRequest(id, expectedVersion)
    this.persist()
    return result
  }
  async decideSuggestion(requestId: string, suggestionId: string, input: SuggestionDecisionInput) {
    const result = this.engine.decideSuggestion(requestId, suggestionId, input)
    this.persist()
    return result
  }
  async acceptAllSuggestions(requestId: string) {
    const result = this.engine.acceptAllSuggestions(requestId)
    this.persist()
    return result
  }
  async resolveDuplicate(
    requestId: string,
    duplicateId: string,
    resolution: Exclude<DuplicateResolution, 'PENDING'>,
    reason: string,
  ) {
    const result = this.engine.resolveDuplicate(requestId, duplicateId, resolution, reason)
    this.persist()
    return result
  }
  async approveRequest(id: string, expectedVersion: number, reason: string) {
    const result = this.engine.approveRequest(id, expectedVersion, reason)
    this.persist()
    return result
  }
  async requestChanges(id: string, expectedVersion: number, reason: string) {
    const result = this.engine.requestChanges(id, expectedVersion, reason)
    this.persist()
    return result
  }
  async listMaterials(query: PaginationQuery) {
    return this.engine.listMaterials(query)
  }
  async getMaterial(id: string) {
    return this.engine.getMaterial(id)
  }
  async listDuplicateCases() {
    return this.engine.listDuplicateCases()
  }
  async listSapJobs() {
    return this.engine.listSapJobs()
  }
  async syncRequest(id: string, expectedVersion: number) {
    await delay(180)
    const result = this.engine.syncRequest(id, expectedVersion)
    this.persist()
    return result
  }
  async retrySapJob(jobId: string) {
    const result = this.engine.retrySapJob(jobId)
    this.persist()
    return result
  }
  async listAuditEvents() {
    return this.engine.listAuditEvents()
  }
  async getAuditEvent(id: string) {
    return this.engine.getAuditEvent(id)
  }
  async exportAuditEvents() {
    const content = this.engine.exportAuditEventsCsv()
    this.persist()
    return { fileName: 'forjadata-audit-demo.csv', content }
  }
  async listUatReleases() {
    return this.engine.listUatReleases()
  }
  async createUatExecution(input: CreateUatExecutionInput) {
    const result = this.engine.createUatExecution(input)
    this.persist()
    return result
  }
  async updateUatExecution(id: string, input: UpdateUatExecutionInput) {
    const result = this.engine.updateUatExecution(id, input)
    this.persist()
    return result
  }
  async addUatEvidence(id: string, input: AddUatEvidenceInput) {
    const result = this.engine.addUatEvidence(id, input)
    this.persist()
    return result
  }
  async signOffUatExecution(id: string, input: SignOffUatExecutionInput) {
    const result = this.engine.signOffUatExecution(id, input)
    this.persist()
    return result
  }
  async listNotifications() {
    return this.engine.listNotifications()
  }
  async markAllNotificationsRead() {
    const result = this.engine.markAllNotificationsRead()
    this.persist()
    return result
  }
  async integrationHealth() {
    return this.engine.integrationHealth()
  }
  async features(): Promise<FeatureFlags> {
    return {
      enableRealAi: false,
      enableDocumentIntelligence: false,
      enableSapOData: false,
      enable3dViewer: true,
      enableUat: true,
      enableArchitecturePage: true,
      enableBulkActions: true,
      enableExperimentalRulesBuilder: true,
    }
  }
  async listQualityRules() {
    return this.engine.listQualityRules()
  }
  async createQualityRule(input: CreateQualityRuleInput) {
    const result = this.engine.createQualityRule(input)
    this.persist()
    return result
  }
  async updateQualityRule(id: string, input: UpdateQualityRuleInput) {
    const result = this.engine.updateQualityRule(id, input)
    this.persist()
    return result
  }
  async testQualityRule(id: string, materialId: string) {
    const result = this.engine.testQualityRule(id, materialId)
    this.persist()
    return result
  }
  async resetDemo() {
    this.engine = new DemoEngine()
    this.engine.reset()
    this.persist()
  }

  private persist(): void {
    localStorage.setItem(storageKey, JSON.stringify(this.engine.getSnapshot()))
  }
}

export class HttpForjadataApi implements ForjadataApi {
  private role: Role = 'reviewer'

  constructor(
    private readonly baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:7071/api/v1',
  ) {}

  async getSession() {
    return this.call<Session>('/auth/me')
  }
  async login(role: Role) {
    this.role = role
    return this.call<Session>('/auth/demo/session', { method: 'POST', body: { role } })
  }
  async switchRole(role: Role) {
    this.role = role
    return this.call<Session>('/auth/demo/switch-role', {
      method: 'POST',
      body: { role },
    })
  }
  async dashboard() {
    return this.call<DashboardSummary>('/dashboard/summary')
  }
  async listRequests(query: PaginationQuery) {
    return this.callPage<RequestDetail>('/requests', query)
  }
  async getRequest(id: string) {
    return this.call<RequestDetail>(`/requests/${encodeURIComponent(id)}`)
  }
  async createRequest(input: CreateRequestInput) {
    return this.call<RequestDetail>('/requests', { method: 'POST', body: input })
  }
  async uploadDocument(requestId: string, input: UploadDocumentInput) {
    return this.call<RequestDetail>(`/requests/${encodeURIComponent(requestId)}/documents`, {
      method: 'POST',
      body: input,
    })
  }
  async submitRequest(id: string, expectedVersion: number) {
    return this.call<RequestDetail>(`/requests/${encodeURIComponent(id)}/submit`, {
      method: 'POST',
      body: { expectedVersion },
    })
  }
  async decideSuggestion(requestId: string, suggestionId: string, input: SuggestionDecisionInput) {
    return this.call<RequestDetail>(
      `/requests/${encodeURIComponent(requestId)}/suggestions/${encodeURIComponent(suggestionId)}/decision`,
      { method: 'POST', body: input },
    )
  }
  async acceptAllSuggestions(requestId: string) {
    return this.call<RequestDetail>(
      `/requests/${encodeURIComponent(requestId)}/suggestions/bulk-accept`,
      { method: 'POST' },
    )
  }
  async resolveDuplicate(
    requestId: string,
    duplicateId: string,
    resolution: Exclude<DuplicateResolution, 'PENDING'>,
    reason: string,
  ) {
    return this.call<RequestDetail>(
      `/requests/${encodeURIComponent(requestId)}/duplicates/${encodeURIComponent(duplicateId)}/resolve`,
      { method: 'POST', body: { resolution, reason } },
    )
  }
  async approveRequest(id: string, expectedVersion: number, reason: string) {
    return this.call<RequestDetail>(`/requests/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
      body: { expectedVersion, reason },
    })
  }
  async requestChanges(id: string, expectedVersion: number, reason: string) {
    return this.call<RequestDetail>(`/requests/${encodeURIComponent(id)}/request-changes`, {
      method: 'POST',
      body: { expectedVersion, reason },
    })
  }
  async listMaterials(query: PaginationQuery) {
    return this.callPage<MaterialSummary>('/materials', query)
  }
  async getMaterial(id: string) {
    return this.call<MaterialDetail>(`/materials/${encodeURIComponent(id)}`)
  }
  async listDuplicateCases() {
    return this.call<DuplicateCase[]>('/duplicate-cases')
  }
  async listSapJobs() {
    return this.call<SapSyncJob[]>('/sap/jobs')
  }
  async syncRequest(id: string, expectedVersion: number) {
    return this.call<SapSyncJob>(`/requests/${encodeURIComponent(id)}/sap/sync`, {
      method: 'POST',
      body: { expectedVersion },
    })
  }
  async retrySapJob(jobId: string) {
    return this.call<SapSyncJob>(`/sap/jobs/${encodeURIComponent(jobId)}/retry`, {
      method: 'POST',
    })
  }
  async listAuditEvents() {
    return this.call<AuditEvent[]>('/audit-events')
  }
  async getAuditEvent(id: string) {
    return this.call<AuditEvent>(`/audit-events/${encodeURIComponent(id)}`)
  }
  async exportAuditEvents() {
    const response = await this.raw('/audit-events/export')
    const disposition = response.headers.get('content-disposition') ?? ''
    const match = /filename="([^"]+)"/.exec(disposition)
    return {
      fileName: match?.[1] ?? 'forjadata-audit-demo.csv',
      content: await response.text(),
    }
  }
  async listUatReleases() {
    return this.call<UatRelease[]>('/uat/releases')
  }
  async createUatExecution(input: CreateUatExecutionInput) {
    return this.call<UatExecution>('/uat/executions', { method: 'POST', body: input })
  }
  async updateUatExecution(id: string, input: UpdateUatExecutionInput) {
    return this.call<UatExecution>(`/uat/executions/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: input,
    })
  }
  async addUatEvidence(id: string, input: AddUatEvidenceInput) {
    return this.call<UatExecution>(`/uat/executions/${encodeURIComponent(id)}/evidence`, {
      method: 'POST',
      body: input,
    })
  }
  async signOffUatExecution(id: string, input: SignOffUatExecutionInput) {
    return this.call<UatExecution>(`/uat/executions/${encodeURIComponent(id)}/sign-off`, {
      method: 'POST',
      body: input,
    })
  }
  async listNotifications() {
    return this.call<Notification[]>('/notifications')
  }
  async markAllNotificationsRead() {
    return this.call<Notification[]>('/notifications/read-all', { method: 'POST' })
  }
  async integrationHealth() {
    return this.call<IntegrationHealth[]>('/admin/integrations')
  }
  async features() {
    return this.call<FeatureFlags>('/features')
  }
  async listQualityRules() {
    return this.call<QualityRule[]>('/admin/quality-rules')
  }
  async createQualityRule(input: CreateQualityRuleInput) {
    return this.call<QualityRule>('/admin/quality-rules', { method: 'POST', body: input })
  }
  async updateQualityRule(id: string, input: UpdateQualityRuleInput) {
    return this.call<QualityRule>(`/admin/quality-rules/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: input,
    })
  }
  async testQualityRule(id: string, materialId: string) {
    return this.call<QualityResult>(`/admin/quality-rules/${encodeURIComponent(id)}/test`, {
      method: 'POST',
      body: { materialId },
    })
  }
  async resetDemo() {
    await this.call<unknown>('/admin/demo/reset', { method: 'POST' })
  }

  private async callPage<T>(path: string, query: PaginationQuery): Promise<Paginated<T>> {
    const search = new URLSearchParams({
      page: String(query.page),
      pageSize: String(query.pageSize),
      search: query.search,
      status: query.status,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
    })
    const response = await this.raw(`${path}?${search.toString()}`)
    return (await response.json()) as Paginated<T>
  }

  private async call<T>(
    path: string,
    options: { method?: string; body?: unknown } = {},
  ): Promise<T> {
    const response = await this.raw(path, options)
    if (response.status === 204) return undefined as T
    const envelope = (await response.json()) as { data: T }
    return envelope.data
  }

  private async raw(
    path: string,
    options: { method?: string; body?: unknown } = {},
  ): Promise<Response> {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 10_000)
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: options.method ?? 'GET',
        headers: {
          'content-type': 'application/json',
          'x-correlation-id': crypto.randomUUID(),
          ...(isEntraMode
            ? { authorization: `Bearer ${await entraAuth.getAccessToken()}` }
            : { 'x-demo-role': this.role }),
        },
        signal: controller.signal,
        ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
      })
      if (!response.ok) {
        const problem = (await response.json()) as {
          title?: string
          detail?: string
          correlationId?: string
        }
        throw new ApiRequestError(
          problem.detail ?? problem.title ?? `HTTP ${response.status}`,
          response.status,
          problem.correlationId ?? 'unknown',
        )
      }
      return response
    } finally {
      window.clearTimeout(timeout)
    }
  }
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly correlationId: string,
  ) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

function readStoredSnapshot(): DemoSnapshot | undefined {
  const raw = localStorage.getItem(storageKey)
  if (!raw) return undefined
  try {
    const parsed = JSON.parse(raw) as Partial<DemoSnapshot>
    return parsed.schemaVersion === 2 ? (parsed as DemoSnapshot) : undefined
  } catch {
    localStorage.removeItem(storageKey)
    return undefined
  }
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

function createApi(): ForjadataApi {
  const mode = import.meta.env.VITE_API_MODE ?? 'auto'
  if (isEntraMode) return new HttpForjadataApi()
  if (mode === 'demo' || (mode === 'auto' && import.meta.env.PROD)) {
    return new DemoForjadataApi()
  }
  return new HttpForjadataApi()
}

export const forjadataApi = createApi()
export const activeApiMode = isEntraMode
  ? 'http'
  : import.meta.env.VITE_API_MODE === 'demo' ||
      ((import.meta.env.VITE_API_MODE ?? 'auto') === 'auto' && import.meta.env.PROD)
    ? 'demo'
    : 'http'
