import { z } from 'zod'

export const RoleSchema = z.enum([
  'requester',
  'reviewer',
  'sap_specialist',
  'business_analyst',
  'uat_tester',
  'admin',
])
export type Role = z.infer<typeof RoleSchema>

export const PermissionSchema = z.enum([
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
])
export type Permission = z.infer<typeof PermissionSchema>

export const RequestStatusSchema = z.enum([
  'DRAFT',
  'SUBMITTED',
  'PROCESSING',
  'NEEDS_REVIEW',
  'CHANGES_REQUESTED',
  'APPROVED',
  'REJECTED',
  'READY_FOR_SAP',
  'SYNCING',
  'SYNCED',
  'SYNC_FAILED',
  'ARCHIVED',
  'CANCELLED',
])
export type RequestStatus = z.infer<typeof RequestStatusSchema>

export const ProcessingStageSchema = z.enum([
  'QUEUED',
  'UPLOADING',
  'EXTRACTING',
  'CLASSIFYING',
  'NORMALIZING',
  'CHECKING_RULES',
  'SEARCHING_DUPLICATES',
  'CALCULATING_CONFIDENCE',
  'READY_FOR_REVIEW',
  'FAILED',
])
export type ProcessingStage = z.infer<typeof ProcessingStageSchema>

export const RequestPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
export type RequestPriority = z.infer<typeof RequestPrioritySchema>

export const MaterialStatusSchema = z.enum([
  'DRAFT',
  'IN_REVIEW',
  'APPROVED',
  'SYNCED',
  'SYNC_FAILED',
  'ARCHIVED',
])
export type MaterialStatus = z.infer<typeof MaterialStatusSchema>

export const AttributeReviewStatusSchema = z.enum([
  'EMPTY',
  'SUGGESTED',
  'ACCEPTED',
  'MODIFIED',
  'REJECTED',
  'INVALID',
  'LOCKED',
])
export type AttributeReviewStatus = z.infer<typeof AttributeReviewStatusSchema>

export const SuggestionStatusSchema = z.enum(['PENDING', 'ACCEPTED', 'MODIFIED', 'REJECTED'])
export type SuggestionStatus = z.infer<typeof SuggestionStatusSchema>

export const DuplicateResolutionSchema = z.enum([
  'PENDING',
  'NOT_DUPLICATE',
  'LINKED',
  'MERGED',
  'REPLACED',
  'CANCELLED',
  'ESCALATED',
])
export type DuplicateResolution = z.infer<typeof DuplicateResolutionSchema>

export const SapJobStatusSchema = z.enum([
  'QUEUED',
  'VALIDATING',
  'SYNCING',
  'SUCCEEDED',
  'FAILED_RETRYABLE',
  'FAILED_PERMANENT',
  'DEAD_LETTER',
  'CANCELLED',
])
export type SapJobStatus = z.infer<typeof SapJobStatusSchema>

export const DemoUserSchema = z.object({
  id: z.string(),
  email: z.email(),
  displayName: z.string().min(1),
  role: RoleSchema,
  organizationId: z.string(),
  organizationName: z.string(),
  avatarInitials: z.string().min(1).max(3),
})
export type DemoUser = z.infer<typeof DemoUserSchema>

export const SessionSchema = z.object({
  mode: z.enum(['demo', 'entra']),
  user: DemoUserSchema,
  permissions: z.array(PermissionSchema),
  issuedAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
})
export type Session = z.infer<typeof SessionSchema>

export const DashboardSummarySchema = z.object({
  mode: z.literal('demo'),
  generatedAt: z.iso.datetime(),
  requestsCreated: z.number().int().nonnegative(),
  processed: z.number().int().nonnegative(),
  pendingReview: z.number().int().nonnegative(),
  approved: z.number().int().nonnegative(),
  synced: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  averageCycleHours: z.number().nonnegative(),
  averageConfidence: z.number().min(0).max(1),
  aiAcceptanceRate: z.number().min(0).max(1),
  duplicatesPrevented: z.number().int().nonnegative(),
  slaAtRisk: z.number().int().nonnegative(),
  workflow: z.array(
    z.object({
      status: RequestStatusSchema,
      count: z.number().int().nonnegative(),
    }),
  ),
  categoryBreakdown: z.array(
    z.object({
      category: z.string(),
      count: z.number().int().nonnegative(),
    }),
  ),
  weeklyTrend: z.array(
    z.object({
      week: z.string(),
      created: z.number().int().nonnegative(),
      completed: z.number().int().nonnegative(),
    }),
  ),
})
export type DashboardSummary = z.infer<typeof DashboardSummarySchema>

export const MaterialAttributeSchema = z.object({
  id: z.string(),
  code: z.string(),
  label: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  normalizedValue: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  unit: z.string().nullable(),
  required: z.boolean(),
  status: AttributeReviewStatusSchema,
  confidence: z.number().min(0).max(1).nullable(),
  evidenceText: z.string().nullable(),
  evidencePage: z.number().int().positive().nullable(),
})
export type MaterialAttribute = z.infer<typeof MaterialAttributeSchema>

export const MaterialSummarySchema = z.object({
  id: z.string(),
  internalCode: z.string(),
  sapProductId: z.string().nullable(),
  shortDescription: z.string(),
  category: z.string(),
  manufacturer: z.string(),
  manufacturerPartNumber: z.string().nullable(),
  baseUnit: z.string(),
  status: MaterialStatusSchema,
  completenessScore: z.number().min(0).max(1),
  confidenceScore: z.number().min(0).max(1),
  duplicateCount: z.number().int().nonnegative(),
  ownerName: z.string(),
  updatedAt: z.iso.datetime(),
  slaStatus: z.enum(['ON_TRACK', 'AT_RISK', 'OVERDUE']),
})
export type MaterialSummary = z.infer<typeof MaterialSummarySchema>

export const MaterialDetailSchema = MaterialSummarySchema.extend({
  longDescription: z.string(),
  gtin: z.string().nullable(),
  source: z.enum(['DEMO', 'MANUAL', 'AI', 'SAP']),
  attributes: z.array(MaterialAttributeSchema),
  requestId: z.string().nullable(),
})
export type MaterialDetail = z.infer<typeof MaterialDetailSchema>

export const DocumentSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  size: z.number().int().nonnegative(),
  sha256: z.string(),
  storagePath: z.string().nullable(),
  status: z.enum(['UPLOADED', 'PROCESSING', 'PROCESSED', 'FAILED']),
  pageCount: z.number().int().nonnegative(),
  provider: z.string(),
})
export type DocumentRecord = z.infer<typeof DocumentSchema>

export const AiSuggestionSchema = z.object({
  id: z.string(),
  attributeCode: z.string(),
  label: z.string(),
  originalValue: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  suggestedValue: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  normalizedValue: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  unit: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  reasoningSummary: z.string(),
  evidenceText: z.string(),
  evidencePage: z.number().int().positive(),
  status: SuggestionStatusSchema,
  provider: z.string().trim().min(1),
  providerVersion: z.string(),
})
export type AiSuggestion = z.infer<typeof AiSuggestionSchema>

export const DuplicateCaseSchema = z.object({
  id: z.string(),
  sourceMaterialId: z.string(),
  candidateMaterialId: z.string(),
  sourceDescription: z.string(),
  candidateDescription: z.string(),
  score: z.number().min(0).max(1),
  scoreBreakdown: z.object({
    manufacturer: z.number().min(0).max(1),
    model: z.number().min(0).max(1),
    description: z.number().min(0).max(1),
    attributes: z.number().min(0).max(1),
  }),
  resolution: DuplicateResolutionSchema,
  explanation: z.string(),
  resolvedAt: z.iso.datetime().nullable(),
  resolvedBy: z.string().nullable(),
})
export type DuplicateCase = z.infer<typeof DuplicateCaseSchema>

export const RequestSummarySchema = z.object({
  id: z.string(),
  type: z.enum(['CREATE', 'UPDATE', 'EXTEND']),
  title: z.string(),
  description: z.string(),
  priority: RequestPrioritySchema,
  status: RequestStatusSchema,
  requesterName: z.string(),
  assigneeName: z.string().nullable(),
  category: z.string().nullable(),
  processingProgress: z.number().min(0).max(100),
  processingStage: ProcessingStageSchema.nullable(),
  confidenceScore: z.number().min(0).max(1).nullable(),
  materialId: z.string().nullable(),
  dueAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  version: z.number().int().positive(),
})
export type RequestSummary = z.infer<typeof RequestSummarySchema>

export const WorkflowEventSchema = z.object({
  id: z.string(),
  fromState: RequestStatusSchema.nullable(),
  toState: RequestStatusSchema,
  actorName: z.string(),
  actorRole: RoleSchema,
  reason: z.string(),
  source: z.enum(['UI', 'API', 'WORKER', 'SYSTEM']),
  correlationId: z.string(),
  createdAt: z.iso.datetime(),
})
export type WorkflowEvent = z.infer<typeof WorkflowEventSchema>

export const RequestDetailSchema = RequestSummarySchema.extend({
  documents: z.array(DocumentSchema),
  suggestions: z.array(AiSuggestionSchema),
  duplicateCases: z.array(DuplicateCaseSchema),
  workflow: z.array(WorkflowEventSchema),
})
export type RequestDetail = z.infer<typeof RequestDetailSchema>

export const SapProductPayloadSchema = z.object({
  internalCode: z.string(),
  description: z.string().min(1).max(120),
  category: z.string(),
  manufacturer: z.string(),
  manufacturerPartNumber: z.string().nullable(),
  baseUnit: z.string(),
  attributes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
})
export type SapProductPayload = z.infer<typeof SapProductPayloadSchema>

export const SapSyncJobSchema = z.object({
  id: z.string(),
  requestId: z.string(),
  materialId: z.string(),
  operation: z.enum(['CREATE', 'UPDATE']),
  adapter: z.enum(['simulator', 'odata-v2', 'odata-v4']),
  status: SapJobStatusSchema,
  attemptCount: z.number().int().nonnegative(),
  maxAttempts: z.number().int().positive(),
  nextAttemptAt: z.iso.datetime().nullable(),
  sapProductId: z.string().nullable(),
  httpStatus: z.number().int().nullable(),
  errorCode: z.string().nullable(),
  errorCategory: z.enum(['BUSINESS', 'TECHNICAL', 'AUTH', 'TIMEOUT']).nullable(),
  errorMessage: z.string().nullable(),
  correlationId: z.string(),
  durationMs: z.number().int().nonnegative(),
  payload: SapProductPayloadSchema,
  createdAt: z.iso.datetime(),
  completedAt: z.iso.datetime().nullable(),
})
export type SapSyncJob = z.infer<typeof SapSyncJobSchema>

export const AuditEventSchema = z.object({
  id: z.string(),
  timestamp: z.iso.datetime(),
  actorName: z.string(),
  actorRole: RoleSchema,
  organizationId: z.string(),
  action: z.string(),
  entity: z.string(),
  entityId: z.string(),
  summary: z.string(),
  before: z.record(z.string(), z.unknown()).nullable(),
  after: z.record(z.string(), z.unknown()).nullable(),
  metadata: z.record(z.string(), z.unknown()),
  ipHash: z.string().nullable(),
  userAgent: z.string().nullable(),
  correlationId: z.string(),
  source: z.enum(['UI', 'API', 'WORKER', 'SYSTEM']),
  outcome: z.enum(['SUCCESS', 'FAILURE', 'DENIED']),
})
export type AuditEvent = z.infer<typeof AuditEventSchema>

export const UatResultSchema = z.enum(['NOT_RUN', 'PASSED', 'FAILED', 'BLOCKED'])
export type UatResult = z.infer<typeof UatResultSchema>

export const UatReleaseStatusSchema = z.enum([
  'DRAFT',
  'IN_EXECUTION',
  'APPROVED',
  'REJECTED',
  'BLOCKED',
])
export type UatReleaseStatus = z.infer<typeof UatReleaseStatusSchema>

export const UatStepSchema = z.object({
  id: z.string(),
  order: z.number().int().positive(),
  instruction: z.string(),
  expectedResult: z.string(),
})
export type UatStep = z.infer<typeof UatStepSchema>

export const UatScenarioSchema = z.object({
  id: z.string(),
  code: z.string(),
  title: z.string(),
  description: z.string(),
  priority: z.enum(['P0', 'P1', 'P2']),
  steps: z.array(UatStepSchema).min(1),
})
export type UatScenario = z.infer<typeof UatScenarioSchema>

export const UatPlanSchema = z.object({
  id: z.string(),
  releaseId: z.string(),
  name: z.string(),
  assignedTesterId: z.string(),
  scenarioIds: z.array(z.string()),
  createdAt: z.iso.datetime(),
})
export type UatPlan = z.infer<typeof UatPlanSchema>

export const UatEvidenceSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  kind: z.enum(['SCREENSHOT', 'NOTE', 'LOG']),
  comment: z.string(),
  storageMode: z.enum(['demo-metadata', 'blob']),
  storagePath: z.string().nullable(),
  sizeBytes: z.number().int().nonnegative(),
  sha256: z.string().length(64).nullable(),
  createdAt: z.iso.datetime(),
})
export type UatEvidence = z.infer<typeof UatEvidenceSchema>

export const UatIssueSchema = z.object({
  id: z.string(),
  title: z.string(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  status: z.enum(['OPEN', 'RESOLVED']),
})
export type UatIssue = z.infer<typeof UatIssueSchema>

export const UatStepResultSchema = z.object({
  stepId: z.string(),
  result: UatResultSchema.exclude(['NOT_RUN']),
  comment: z.string(),
})
export type UatStepResult = z.infer<typeof UatStepResultSchema>

export const UatExecutionSchema = z.object({
  id: z.string(),
  releaseId: z.string(),
  planId: z.string(),
  scenarioId: z.string(),
  testerId: z.string(),
  status: UatResultSchema,
  comment: z.string(),
  stepResults: z.array(UatStepResultSchema),
  evidence: z.array(UatEvidenceSchema),
  issues: z.array(UatIssueSchema),
  signOffDecision: z.enum(['APPROVED', 'REJECTED', 'BLOCKED']).nullable(),
  signOffComment: z.string().nullable(),
  signedOffAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})
export type UatExecution = z.infer<typeof UatExecutionSchema>

export const UatReleaseSchema = z.object({
  id: z.string(),
  version: z.string(),
  name: z.string(),
  status: UatReleaseStatusSchema,
  plans: z.array(UatPlanSchema),
  scenarios: z.array(UatScenarioSchema),
  executions: z.array(UatExecutionSchema),
  createdAt: z.iso.datetime(),
})
export type UatRelease = z.infer<typeof UatReleaseSchema>

const IntegrationMessageMetadataSchema = z.object({
  schemaVersion: z.literal(1),
  messageId: z.uuid(),
  correlationId: z.uuid(),
  occurredAt: z.iso.datetime(),
})

export const DocumentProcessingMessageSchema = IntegrationMessageMetadataSchema.extend({
  type: z.literal('document.process'),
  payload: z.object({
    requestId: z.string().trim().min(1),
    documentId: z.string().trim().min(1),
    blobPath: z.string().trim().min(1),
  }),
})
export type DocumentProcessingMessage = z.infer<typeof DocumentProcessingMessageSchema>

export const SapSyncMessageSchema = IntegrationMessageMetadataSchema.extend({
  type: z.literal('sap.sync'),
  payload: z.object({
    requestId: z.string().trim().min(1),
    jobId: z.string().trim().min(1),
  }),
})
export type SapSyncMessage = z.infer<typeof SapSyncMessageSchema>

export const IntegrationMessageSchema = z.discriminatedUnion('type', [
  DocumentProcessingMessageSchema,
  SapSyncMessageSchema,
])
export type IntegrationMessage = z.infer<typeof IntegrationMessageSchema>

export const CreateUatReleaseInputSchema = z.object({
  version: z.string().trim().min(1).max(40),
  name: z.string().trim().min(3).max(120),
})
export type CreateUatReleaseInput = z.infer<typeof CreateUatReleaseInputSchema>

export const CreateUatPlanInputSchema = z.object({
  name: z.string().trim().min(3).max(120),
  assignedTesterId: z.string().trim().min(1).default('user-uat'),
  scenarioIds: z.array(z.string()).optional(),
})
export type CreateUatPlanInput = z.infer<typeof CreateUatPlanInputSchema>

export const CreateUatExecutionInputSchema = z.object({
  releaseId: z.string().trim().min(1),
  planId: z.string().trim().min(1),
  scenarioId: z.string().trim().min(1),
})
export type CreateUatExecutionInput = z.infer<typeof CreateUatExecutionInputSchema>

export const UpdateUatExecutionInputSchema = z.object({
  status: UatResultSchema,
  comment: z.string().trim().max(1000).default(''),
  stepResults: z.array(UatStepResultSchema).default([]),
  issue: z
    .object({
      title: z.string().trim().min(3).max(200),
      severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    })
    .optional(),
})
export type UpdateUatExecutionInput = z.infer<typeof UpdateUatExecutionInputSchema>

export const AddUatEvidenceInputSchema = z.object({
  fileName: z.string().trim().min(1).max(180),
  mimeType: z.string().trim().min(1).max(100),
  kind: z.enum(['SCREENSHOT', 'NOTE', 'LOG']),
  comment: z.string().trim().max(500).default(''),
  contentBase64: z.string().max(7_000_000).optional(),
})
export type AddUatEvidenceInput = z.infer<typeof AddUatEvidenceInputSchema>

export const SignOffUatExecutionInputSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED', 'BLOCKED']),
  comment: z.string().trim().min(3).max(1000),
})
export type SignOffUatExecutionInput = z.infer<typeof SignOffUatExecutionInputSchema>

export const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.string(),
  title: z.string(),
  body: z.string(),
  link: z.string(),
  severity: z.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR']),
  readAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
})
export type Notification = z.infer<typeof NotificationSchema>

export const QualityRuleOperatorSchema = z.enum([
  'required',
  'equals',
  'notEquals',
  'contains',
  'gte',
  'lte',
  'between',
  'matches',
])
export type QualityRuleOperator = z.infer<typeof QualityRuleOperatorSchema>

export const QualityRuleConditionSchema = z.object({
  field: z.string().trim().min(1).max(80),
  operator: QualityRuleOperatorSchema,
  value: z.union([z.string().max(120), z.number(), z.boolean(), z.null()]).optional(),
  secondValue: z.number().optional(),
})
export type QualityRuleCondition = z.infer<typeof QualityRuleConditionSchema>

export const QualityRuleExpressionSchema = z.object({
  combinator: z.enum(['ALL', 'ANY']),
  conditions: z.array(QualityRuleConditionSchema).min(1).max(10),
})
export type QualityRuleExpression = z.infer<typeof QualityRuleExpressionSchema>

export const QualityRuleSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  category: z.string().nullable(),
  code: z.string().regex(/^[A-Z][A-Z0-9_]{2,39}$/),
  name: z.string().trim().min(3).max(100),
  description: z.string().trim().max(500),
  severity: z.enum(['INFO', 'WARNING', 'ERROR']),
  expression: QualityRuleExpressionSchema,
  message: z.string().trim().min(3).max(240),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  version: z.number().int().positive(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})
export type QualityRule = z.infer<typeof QualityRuleSchema>

export const QualityResultSchema = z.object({
  ruleId: z.string(),
  ruleCode: z.string(),
  status: z.enum(['PASS', 'FAIL', 'SKIPPED']),
  severity: z.enum(['INFO', 'WARNING', 'ERROR']),
  message: z.string(),
  details: z.array(
    z.object({
      field: z.string(),
      operator: QualityRuleOperatorSchema,
      actual: z.union([z.string(), z.number(), z.boolean(), z.null()]),
      passed: z.boolean(),
    }),
  ),
  evaluatedAt: z.iso.datetime(),
})
export type QualityResult = z.infer<typeof QualityResultSchema>

export const CreateQualityRuleInputSchema = QualityRuleSchema.pick({
  category: true,
  code: true,
  name: true,
  description: true,
  severity: true,
  expression: true,
  message: true,
  status: true,
})
export type CreateQualityRuleInput = z.infer<typeof CreateQualityRuleInputSchema>

export const UpdateQualityRuleInputSchema = CreateQualityRuleInputSchema.extend({
  expectedVersion: z.number().int().positive(),
})
export type UpdateQualityRuleInput = z.infer<typeof UpdateQualityRuleInputSchema>

export const TestQualityRuleInputSchema = z.object({
  materialId: z.string().trim().min(1),
})
export type TestQualityRuleInput = z.infer<typeof TestQualityRuleInputSchema>

export const IntegrationHealthSchema = z.object({
  name: z.string(),
  mode: z.enum(['demo', 'mock', 'simulator', 'disabled', 'real']),
  status: z.enum(['healthy', 'degraded', 'unconfigured']),
  checkedAt: z.iso.datetime(),
  message: z.string(),
})
export type IntegrationHealth = z.infer<typeof IntegrationHealthSchema>

export const CreateRequestInputSchema = z.object({
  type: z.enum(['CREATE', 'UPDATE', 'EXTEND']).default('CREATE'),
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(20).max(2000),
  priority: RequestPrioritySchema.default('MEDIUM'),
  category: z.string().trim().min(1).nullable().default(null),
  fileName: z.string().trim().min(1).max(180).nullable().default(null),
})
export type CreateRequestInput = z.infer<typeof CreateRequestInputSchema>

export const UploadDocumentInputSchema = z.object({
  fileName: z.string().trim().min(1).max(180),
  mimeType: z.enum([
    'application/pdf',
    'image/png',
    'image/jpeg',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]),
  contentBase64: z.string().min(1),
})
export type UploadDocumentInput = z.infer<typeof UploadDocumentInputSchema>

export const SuggestionDecisionInputSchema = z.object({
  decision: z.enum(['accept', 'reject', 'modify']),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
  reason: z.string().trim().max(500).default('Revisión humana'),
})
export type SuggestionDecisionInput = z.infer<typeof SuggestionDecisionInputSchema>

export const DuplicateResolutionInputSchema = z.object({
  resolution: DuplicateResolutionSchema.exclude(['PENDING']),
  reason: z.string().trim().min(3).max(500),
})
export type DuplicateResolutionInput = z.infer<typeof DuplicateResolutionInputSchema>

export const WorkflowActionSchema = z.enum([
  'SUBMIT',
  'COMPLETE_PROCESSING',
  'REQUEST_CHANGES',
  'APPROVE',
  'REJECT',
  'PREPARE_SAP',
  'START_SYNC',
  'SYNC_SUCCESS',
  'SYNC_FAILURE',
  'RETRY_SYNC',
  'CANCEL',
  'ARCHIVE',
])
export type WorkflowAction = z.infer<typeof WorkflowActionSchema>

export const TransitionInputSchema = z.object({
  action: WorkflowActionSchema,
  reason: z.string().trim().max(500).default(''),
  expectedVersion: z.number().int().positive(),
})
export type TransitionInput = z.infer<typeof TransitionInputSchema>

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(120).default(''),
  status: z.string().trim().default(''),
  sortBy: z.string().trim().default('updatedAt'),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
})
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>

export interface Paginated<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  meta: {
    correlationId: string
  }
}

export interface ApiEnvelope<T> {
  data: T
  meta: {
    correlationId: string
  }
}

export const ProblemDetailsSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string(),
  instance: z.string(),
  correlationId: z.string(),
  errors: z.record(z.string(), z.array(z.string())).optional(),
})
export type ProblemDetails = z.infer<typeof ProblemDetailsSchema>

export const FeatureFlagsSchema = z.object({
  enableRealAi: z.boolean(),
  enableDocumentIntelligence: z.boolean(),
  enableSapOData: z.boolean(),
  enable3dViewer: z.boolean(),
  enableUat: z.boolean(),
  enableArchitecturePage: z.boolean(),
  enableBulkActions: z.boolean(),
  enableExperimentalRulesBuilder: z.boolean(),
})
export type FeatureFlags = z.infer<typeof FeatureFlagsSchema>
