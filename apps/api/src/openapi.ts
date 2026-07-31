import {
  AddUatEvidenceInputSchema,
  AiSuggestionSchema,
  AuditEventSchema,
  CreateUatExecutionInputSchema,
  CreateUatPlanInputSchema,
  CreateUatReleaseInputSchema,
  CreateQualityRuleInputSchema,
  CreateRequestInputSchema,
  DashboardSummarySchema,
  DuplicateCaseSchema,
  DuplicateResolutionInputSchema,
  FeatureFlagsSchema,
  IntegrationHealthSchema,
  MaterialDetailSchema,
  MaterialSummarySchema,
  NotificationSchema,
  PaginationQuerySchema,
  ProblemDetailsSchema,
  QualityResultSchema,
  QualityRuleSchema,
  RequestDetailSchema,
  RoleSchema,
  SapSyncJobSchema,
  SessionSchema,
  SuggestionDecisionInputSchema,
  TestQualityRuleInputSchema,
  TransitionInputSchema,
  SignOffUatExecutionInputSchema,
  UatExecutionSchema,
  UatPlanSchema,
  UatReleaseSchema,
  UpdateUatExecutionInputSchema,
  UpdateQualityRuleInputSchema,
  UploadDocumentInputSchema,
} from '@forjadata/contracts'
import { z } from 'zod'

type HttpMethod = 'get' | 'post' | 'patch' | 'delete'
type JsonObject = Record<string, unknown>

export const apiOperationInventory = [
  ['get', '/health', 'getHealth'],
  ['get', '/health/readiness', 'getReadiness'],
  ['get', '/version', 'getVersion'],
  ['get', '/metrics', 'getMetrics'],
  ['get', '/features', 'getFeatures'],
  ['get', '/openapi.json', 'getOpenApi'],
  ['get', '/auth/me', 'getSession'],
  ['post', '/auth/demo/session', 'createDemoSession'],
  ['delete', '/auth/demo/session', 'deleteDemoSession'],
  ['post', '/auth/demo/switch-role', 'switchDemoRole'],
  ['get', '/dashboard/summary', 'getDashboardSummary'],
  ['get', '/requests', 'listRequests'],
  ['post', '/requests', 'createRequest'],
  ['get', '/requests/{id}', 'getRequest'],
  ['post', '/requests/{id}/documents', 'uploadRequestDocument'],
  ['post', '/requests/{id}/submit', 'submitRequest'],
  ['get', '/requests/{id}/processing-status', 'getProcessingStatus'],
  ['post', '/requests/{id}/suggestions/{suggestionId}/decision', 'decideSuggestion'],
  ['post', '/requests/{id}/suggestions/bulk-accept', 'acceptAllSuggestions'],
  ['post', '/requests/{id}/duplicates/{duplicateId}/resolve', 'resolveDuplicate'],
  ['post', '/requests/{id}/approve', 'approveRequest'],
  ['post', '/requests/{id}/request-changes', 'requestChanges'],
  ['get', '/materials', 'listMaterials'],
  ['get', '/materials/{id}', 'getMaterial'],
  ['get', '/duplicate-cases', 'listDuplicateCases'],
  ['get', '/sap/health', 'getSapHealth'],
  ['get', '/sap/jobs', 'listSapJobs'],
  ['post', '/requests/{id}/sap/sync', 'syncRequest'],
  ['post', '/sap/jobs/{jobId}/retry', 'retrySapJob'],
  ['get', '/sap/jobs/{jobId}/payload', 'getSapPayload'],
  ['get', '/audit-events', 'listAuditEvents'],
  ['get', '/audit-events/{id}', 'getAuditEvent'],
  ['get', '/audit-events/export', 'exportAuditEvents'],
  ['get', '/uat/releases', 'listUatReleases'],
  ['post', '/uat/releases', 'createUatRelease'],
  ['get', '/uat/releases/{id}', 'getUatRelease'],
  ['post', '/uat/releases/{id}/plans', 'createUatPlan'],
  ['get', '/uat/plans/{id}', 'getUatPlan'],
  ['post', '/uat/executions', 'createUatExecution'],
  ['patch', '/uat/executions/{id}', 'updateUatExecution'],
  ['post', '/uat/executions/{id}/evidence', 'addUatEvidence'],
  ['post', '/uat/executions/{id}/sign-off', 'signOffUatExecution'],
  ['get', '/notifications', 'listNotifications'],
  ['get', '/notifications/unread-count', 'getUnreadNotificationCount'],
  ['post', '/notifications/read-all', 'markAllNotificationsRead'],
  ['get', '/admin/quality-rules', 'listQualityRules'],
  ['post', '/admin/quality-rules', 'createQualityRule'],
  ['patch', '/admin/quality-rules/{id}', 'updateQualityRule'],
  ['post', '/admin/quality-rules/{id}/test', 'testQualityRule'],
  ['get', '/admin/integrations', 'listIntegrationHealth'],
  ['post', '/admin/demo/reset', 'resetDemo'],
] as const satisfies ReadonlyArray<readonly [HttpMethod, string, string]>

const componentSchemas = {
  Role: jsonSchema(RoleSchema),
  Session: jsonSchema(SessionSchema),
  DashboardSummary: jsonSchema(DashboardSummarySchema),
  RequestDetail: jsonSchema(RequestDetailSchema),
  MaterialSummary: jsonSchema(MaterialSummarySchema),
  MaterialDetail: jsonSchema(MaterialDetailSchema),
  AiSuggestion: jsonSchema(AiSuggestionSchema),
  DuplicateCase: jsonSchema(DuplicateCaseSchema),
  SapSyncJob: jsonSchema(SapSyncJobSchema),
  AuditEvent: jsonSchema(AuditEventSchema),
  UatRelease: jsonSchema(UatReleaseSchema),
  UatPlan: jsonSchema(UatPlanSchema),
  UatExecution: jsonSchema(UatExecutionSchema),
  Notification: jsonSchema(NotificationSchema),
  QualityRule: jsonSchema(QualityRuleSchema),
  QualityResult: jsonSchema(QualityResultSchema),
  IntegrationHealth: jsonSchema(IntegrationHealthSchema),
  FeatureFlags: jsonSchema(FeatureFlagsSchema),
  CreateRequestInput: jsonSchema(CreateRequestInputSchema),
  UploadDocumentInput: jsonSchema(UploadDocumentInputSchema),
  SuggestionDecisionInput: jsonSchema(SuggestionDecisionInputSchema),
  DuplicateResolutionInput: jsonSchema(DuplicateResolutionInputSchema),
  TransitionInput: jsonSchema(TransitionInputSchema),
  CreateUatReleaseInput: jsonSchema(CreateUatReleaseInputSchema),
  CreateUatPlanInput: jsonSchema(CreateUatPlanInputSchema),
  CreateUatExecutionInput: jsonSchema(CreateUatExecutionInputSchema),
  UpdateUatExecutionInput: jsonSchema(UpdateUatExecutionInputSchema),
  AddUatEvidenceInput: jsonSchema(AddUatEvidenceInputSchema),
  SignOffUatExecutionInput: jsonSchema(SignOffUatExecutionInputSchema),
  CreateQualityRuleInput: jsonSchema(CreateQualityRuleInputSchema),
  UpdateQualityRuleInput: jsonSchema(UpdateQualityRuleInputSchema),
  TestQualityRuleInput: jsonSchema(TestQualityRuleInputSchema),
  PaginationQuery: jsonSchema(PaginationQuerySchema),
  ProblemDetails: jsonSchema(ProblemDetailsSchema),
}

const idParameter = pathParameter('id', 'Identificador de solicitud o material')
const suggestionIdParameter = pathParameter('suggestionId', 'Identificador de sugerencia')
const duplicateIdParameter = pathParameter('duplicateId', 'Identificador de coincidencia')
const jobIdParameter = pathParameter('jobId', 'Identificador del trabajo SAP')
const uatIdParameter = pathParameter('id', 'Identificador del recurso UAT')
const qualityRuleIdParameter = pathParameter('id', 'Identificador de regla de calidad')

export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Forjadata API',
    version: '0.1.0',
    description:
      'API REST para solicitudes, materiales, workflow, auditoría y sincronización. Admite modo demo local y adaptadores Azure/SAP reales configurables.',
    license: { name: 'MIT', identifier: 'MIT' },
  },
  servers: [{ url: 'http://localhost:7071/api/v1', description: 'Local demo' }],
  tags: [
    { name: 'System' },
    { name: 'Auth' },
    { name: 'Dashboard' },
    { name: 'Requests' },
    { name: 'Materials' },
    { name: 'Duplicates' },
    { name: 'Workflow' },
    { name: 'SAP' },
    { name: 'Audit' },
    { name: 'UAT' },
    { name: 'Notifications' },
    { name: 'Admin' },
  ],
  paths: {
    '/health': {
      get: operation('getHealth', 'System', 'Comprobar liveness', {
        '200': jsonResponse('API disponible', {
          type: 'object',
          required: ['data', 'meta'],
          properties: {
            data: {
              type: 'object',
              required: ['status', 'service', 'mode', 'timestamp'],
              properties: {
                status: { const: 'healthy' },
                service: { const: 'forjadata-api' },
                mode: { enum: ['demo', 'entra', 'real'] },
                timestamp: { type: 'string', format: 'date-time' },
              },
            },
            meta: metaSchema(),
          },
        }),
      }),
    },
    '/health/readiness': {
      get: operation('getReadiness', 'System', 'Comprobar dependencias', {
        '200': jsonResponse('Estado de dependencias', {
          type: 'object',
          required: ['data', 'meta'],
          properties: {
            data: {
              type: 'object',
              required: ['status', 'dependencies'],
              properties: {
                status: { const: 'ready' },
                dependencies: arrayOf('IntegrationHealth'),
              },
            },
            meta: metaSchema(),
          },
        }),
      }),
    },
    '/version': {
      get: operation('getVersion', 'System', 'Leer versión desplegada', {
        '200': jsonResponse(
          'Versión',
          envelopeSchema({
            type: 'object',
            required: ['version', 'commit'],
            properties: { version: { type: 'string' }, commit: { type: 'string' } },
          }),
        ),
      }),
    },
    '/metrics': {
      get: operation('getMetrics', 'System', 'Leer métricas locales agregadas', {
        '200': jsonResponse(
          'Métricas de proceso en modo local o demo',
          envelopeSchema({
            type: 'object',
            required: ['generatedAt', 'totalRequests', 'errorRequests', 'errorRate', 'routes'],
            properties: {
              generatedAt: { type: 'string', format: 'date-time' },
              totalRequests: { type: 'integer', minimum: 0 },
              errorRequests: { type: 'integer', minimum: 0 },
              errorRate: { type: 'number', minimum: 0, maximum: 1 },
              routes: {
                type: 'array',
                items: {
                  type: 'object',
                  required: [
                    'method',
                    'path',
                    'status',
                    'count',
                    'averageDurationMs',
                    'maxDurationMs',
                  ],
                  properties: {
                    method: { type: 'string' },
                    path: { type: 'string' },
                    status: { type: 'integer' },
                    count: { type: 'integer', minimum: 1 },
                    averageDurationMs: { type: 'number', minimum: 0 },
                    maxDurationMs: { type: 'number', minimum: 0 },
                  },
                },
              },
            },
          }),
        ),
      }),
    },
    '/features': {
      get: operation('getFeatures', 'System', 'Leer feature flags', {
        '200': jsonResponse('Feature flags', envelopeRef('FeatureFlags')),
      }),
    },
    '/openapi.json': {
      get: operation('getOpenApi', 'System', 'Descargar OpenAPI 3.1', {
        '200': jsonResponse('Documento OpenAPI', { type: 'object' }),
      }),
    },
    '/auth/me': {
      get: operation('getSession', 'Auth', 'Leer sesión actual', {
        '200': jsonResponse('Sesión', envelopeRef('Session')),
      }),
    },
    '/auth/demo/session': {
      post: {
        ...operation('createDemoSession', 'Auth', 'Crear sesión demo', {
          '200': jsonResponse('Sesión creada', envelopeRef('Session')),
          '422': problemResponse('Rol no válido'),
        }),
        requestBody: bodyRef('RoleSelection'),
      },
      delete: operation('deleteDemoSession', 'Auth', 'Cerrar sesión demo', {
        '204': { description: 'Sesión cerrada' },
      }),
    },
    '/auth/demo/switch-role': {
      post: {
        ...operation('switchDemoRole', 'Auth', 'Cambiar rol sintético', {
          '200': jsonResponse('Sesión actualizada', envelopeRef('Session')),
          '422': problemResponse('Rol no válido'),
        }),
        requestBody: bodyRef('RoleSelection'),
      },
    },
    '/dashboard/summary': {
      get: operation('getDashboardSummary', 'Dashboard', 'Leer KPIs demo', {
        '200': jsonResponse('Resumen', envelopeRef('DashboardSummary')),
      }),
    },
    '/requests': {
      get: {
        ...operation('listRequests', 'Requests', 'Listar solicitudes', {
          '200': jsonResponse('Página de solicitudes', pageRef('RequestDetail')),
          '422': problemResponse('Consulta no válida'),
        }),
        parameters: paginationParameters(),
      },
      post: {
        ...operation('createRequest', 'Requests', 'Crear borrador', {
          '201': jsonResponse('Solicitud creada', envelopeRef('RequestDetail')),
          '422': problemResponse('Formulario no válido'),
        }),
        requestBody: bodyRef('CreateRequestInput'),
      },
    },
    '/requests/{id}': {
      get: {
        ...operation('getRequest', 'Requests', 'Leer solicitud', {
          '200': jsonResponse('Detalle', envelopeRef('RequestDetail')),
          '404': problemResponse('Solicitud no encontrada'),
        }),
        parameters: [idParameter],
      },
    },
    '/requests/{id}/documents': {
      post: {
        ...operation('uploadRequestDocument', 'Requests', 'Validar y almacenar documento', {
          '201': jsonResponse('Documento adjuntado', envelopeRef('RequestDetail')),
          '404': problemResponse('Solicitud no encontrada'),
          '422': problemResponse('Documento no válido'),
        }),
        parameters: [idParameter],
        requestBody: bodyRef('UploadDocumentInput'),
      },
    },
    '/requests/{id}/submit': {
      post: {
        ...operation('submitRequest', 'Workflow', 'Enviar y procesar', {
          '200': jsonResponse('Solicitud procesada', envelopeRef('RequestDetail')),
          '202': jsonResponse('Procesamiento encolado', envelopeRef('RequestDetail')),
          '403': problemResponse('Rol sin permiso'),
          '409': problemResponse('Versión o transición no válida'),
        }),
        parameters: [idParameter],
        requestBody: bodyRef('ExpectedVersion'),
      },
    },
    '/requests/{id}/processing-status': {
      get: {
        ...operation('getProcessingStatus', 'Requests', 'Leer progreso', {
          '200': jsonResponse(
            'Progreso',
            envelopeSchema({
              type: 'object',
              required: ['status', 'progress', 'stage'],
              properties: {
                status: { type: 'string' },
                progress: { type: 'number', minimum: 0, maximum: 100 },
                stage: { type: ['string', 'null'] },
              },
            }),
          ),
          '404': problemResponse('Solicitud no encontrada'),
        }),
        parameters: [idParameter],
      },
    },
    '/requests/{id}/suggestions/{suggestionId}/decision': {
      post: {
        ...operation('decideSuggestion', 'Workflow', 'Decidir sugerencia', {
          '200': jsonResponse('Sugerencia revisada', envelopeRef('RequestDetail')),
          '403': problemResponse('Rol sin permiso'),
          '404': problemResponse('Sugerencia no encontrada'),
          '422': problemResponse('Decisión no válida'),
        }),
        parameters: [idParameter, suggestionIdParameter],
        requestBody: bodyRef('SuggestionDecisionInput'),
      },
    },
    '/requests/{id}/suggestions/bulk-accept': {
      post: {
        ...operation('acceptAllSuggestions', 'Workflow', 'Aceptar sugerencias pendientes', {
          '200': jsonResponse('Sugerencias aceptadas', envelopeRef('RequestDetail')),
          '403': problemResponse('Rol sin permiso'),
        }),
        parameters: [idParameter],
      },
    },
    '/requests/{id}/duplicates/{duplicateId}/resolve': {
      post: {
        ...operation('resolveDuplicate', 'Duplicates', 'Resolver coincidencia', {
          '200': jsonResponse('Coincidencia resuelta', envelopeRef('RequestDetail')),
          '403': problemResponse('Rol sin permiso'),
          '404': problemResponse('Coincidencia no encontrada'),
          '422': problemResponse('Resolución no válida'),
        }),
        parameters: [idParameter, duplicateIdParameter],
        requestBody: bodyRef('DuplicateResolutionInput'),
      },
    },
    '/requests/{id}/approve': {
      post: {
        ...operation('approveRequest', 'Workflow', 'Aprobar solicitud', {
          '200': jsonResponse('Solicitud aprobada', envelopeRef('RequestDetail')),
          '403': problemResponse('Rol sin permiso'),
          '409': problemResponse('Versión o transición no válida'),
        }),
        parameters: [idParameter],
        requestBody: bodyRef('WorkflowDecision'),
      },
    },
    '/requests/{id}/request-changes': {
      post: {
        ...operation('requestChanges', 'Workflow', 'Solicitar cambios', {
          '200': jsonResponse('Cambios solicitados', envelopeRef('RequestDetail')),
          '403': problemResponse('Rol sin permiso'),
          '409': problemResponse('Versión o transición no válida'),
        }),
        parameters: [idParameter],
        requestBody: bodyRef('WorkflowDecision'),
      },
    },
    '/materials': {
      get: {
        ...operation('listMaterials', 'Materials', 'Listar materiales', {
          '200': jsonResponse('Página de materiales', pageRef('MaterialSummary')),
          '422': problemResponse('Consulta no válida'),
        }),
        parameters: paginationParameters(),
      },
    },
    '/materials/{id}': {
      get: {
        ...operation('getMaterial', 'Materials', 'Leer material', {
          '200': jsonResponse('Detalle', envelopeRef('MaterialDetail')),
          '404': problemResponse('Material no encontrado'),
        }),
        parameters: [idParameter],
      },
    },
    '/duplicate-cases': {
      get: operation('listDuplicateCases', 'Duplicates', 'Listar coincidencias', {
        '200': jsonResponse('Coincidencias', envelopeSchema(arrayOf('DuplicateCase'))),
      }),
    },
    '/sap/health': {
      get: operation('getSapHealth', 'SAP', 'Comprobar adaptador SAP', {
        '200': jsonResponse(
          'Salud SAP',
          envelopeSchema({
            oneOf: [ref('IntegrationHealth'), { type: 'null' }],
          }),
        ),
      }),
    },
    '/sap/jobs': {
      get: operation('listSapJobs', 'SAP', 'Listar trabajos SAP', {
        '200': jsonResponse('Trabajos', envelopeSchema(arrayOf('SapSyncJob'))),
      }),
    },
    '/requests/{id}/sap/sync': {
      post: {
        ...operation('syncRequest', 'SAP', 'Sincronizar mediante el adaptador configurado', {
          '200': jsonResponse('Resultado de sincronización', envelopeRef('SapSyncJob')),
          '202': jsonResponse('Sincronización encolada', envelopeRef('SapSyncJob')),
          '403': problemResponse('Rol sin permiso'),
          '409': problemResponse('Transición no válida'),
        }),
        parameters: [idParameter],
        requestBody: bodyRef('ExpectedVersion'),
      },
    },
    '/sap/jobs/{jobId}/retry': {
      post: {
        ...operation('retrySapJob', 'SAP', 'Reintentar trabajo SAP', {
          '200': jsonResponse('Trabajo reintentado', envelopeRef('SapSyncJob')),
          '202': jsonResponse('Reintento encolado', envelopeRef('SapSyncJob')),
          '404': problemResponse('Trabajo no encontrado'),
        }),
        parameters: [jobIdParameter],
      },
    },
    '/sap/jobs/{jobId}/payload': {
      get: {
        ...operation('getSapPayload', 'SAP', 'Leer payload normalizado', {
          '200': jsonResponse('Payload', envelopeSchema({ type: 'object' })),
          '404': problemResponse('Trabajo no encontrado'),
        }),
        parameters: [jobIdParameter],
      },
    },
    '/audit-events': {
      get: operation('listAuditEvents', 'Audit', 'Listar eventos auditables', {
        '200': jsonResponse('Eventos', envelopeSchema(arrayOf('AuditEvent'))),
      }),
    },
    '/audit-events/{id}': {
      get: {
        ...operation('getAuditEvent', 'Audit', 'Leer evento auditable', {
          '200': jsonResponse('Evento', envelopeRef('AuditEvent')),
          '404': problemResponse('Evento no encontrado'),
        }),
        parameters: [pathParameter('id', 'Identificador del evento')],
      },
    },
    '/audit-events/export': {
      get: operation('exportAuditEvents', 'Audit', 'Exportar eventos en CSV', {
        '200': {
          description: 'CSV sintético sin secretos ni documentos completos',
          headers: {
            'x-correlation-id': {
              description: 'Identificador de correlación',
              schema: { type: 'string' },
            },
            'content-disposition': {
              description: 'Nombre de archivo sugerido',
              schema: { type: 'string' },
            },
          },
          content: { 'text/csv': { schema: { type: 'string' } } },
        },
      }),
    },
    '/uat/releases': {
      get: operation('listUatReleases', 'UAT', 'Listar releases de aceptación', {
        '200': jsonResponse('Releases', envelopeSchema(arrayOf('UatRelease'))),
      }),
      post: {
        ...operation('createUatRelease', 'UAT', 'Crear release de aceptación', {
          '201': jsonResponse('Release creada', envelopeRef('UatRelease')),
          '403': problemResponse('Rol sin permiso'),
          '409': problemResponse('Versión duplicada'),
          '422': problemResponse('Entrada no válida'),
        }),
        requestBody: bodyRef('CreateUatReleaseInput'),
      },
    },
    '/uat/releases/{id}': {
      get: {
        ...operation('getUatRelease', 'UAT', 'Leer release de aceptación', {
          '200': jsonResponse('Release', envelopeRef('UatRelease')),
          '404': problemResponse('Release no encontrada'),
        }),
        parameters: [uatIdParameter],
      },
    },
    '/uat/releases/{id}/plans': {
      post: {
        ...operation('createUatPlan', 'UAT', 'Crear plan para una release', {
          '201': jsonResponse('Plan creado', envelopeRef('UatPlan')),
          '403': problemResponse('Rol sin permiso'),
          '404': problemResponse('Release o escenario no encontrado'),
          '422': problemResponse('Entrada no válida'),
        }),
        parameters: [uatIdParameter],
        requestBody: bodyRef('CreateUatPlanInput'),
      },
    },
    '/uat/plans/{id}': {
      get: {
        ...operation('getUatPlan', 'UAT', 'Leer plan de aceptación', {
          '200': jsonResponse('Plan', envelopeRef('UatPlan')),
          '404': problemResponse('Plan no encontrado'),
        }),
        parameters: [uatIdParameter],
      },
    },
    '/uat/executions': {
      post: {
        ...operation('createUatExecution', 'UAT', 'Iniciar ejecución de escenario', {
          '201': jsonResponse('Ejecución creada', envelopeRef('UatExecution')),
          '403': problemResponse('Rol sin permiso'),
          '404': problemResponse('Recurso UAT no encontrado'),
          '422': problemResponse('Entrada no válida'),
        }),
        requestBody: bodyRef('CreateUatExecutionInput'),
      },
    },
    '/uat/executions/{id}': {
      patch: {
        ...operation('updateUatExecution', 'UAT', 'Registrar resultado y pasos', {
          '200': jsonResponse('Ejecución actualizada', envelopeRef('UatExecution')),
          '403': problemResponse('Rol sin permiso'),
          '404': problemResponse('Ejecución no encontrada'),
          '422': problemResponse('Entrada no válida'),
        }),
        parameters: [uatIdParameter],
        requestBody: bodyRef('UpdateUatExecutionInput'),
      },
    },
    '/uat/executions/{id}/evidence': {
      post: {
        ...operation('addUatEvidence', 'UAT', 'Añadir evidencia UAT verificable', {
          '201': jsonResponse('Evidencia registrada', envelopeRef('UatExecution')),
          '403': problemResponse('Rol sin permiso'),
          '404': problemResponse('Ejecución no encontrada'),
          '422': problemResponse('Entrada no válida'),
        }),
        parameters: [uatIdParameter],
        requestBody: bodyRef('AddUatEvidenceInput'),
      },
    },
    '/uat/executions/{id}/sign-off': {
      post: {
        ...operation('signOffUatExecution', 'UAT', 'Firmar una ejecución', {
          '200': jsonResponse('Ejecución firmada', envelopeRef('UatExecution')),
          '403': problemResponse('Rol sin permiso'),
          '404': problemResponse('Ejecución no encontrada'),
          '422': problemResponse('Entrada no válida'),
        }),
        parameters: [uatIdParameter],
        requestBody: bodyRef('SignOffUatExecutionInput'),
      },
    },
    '/notifications': {
      get: operation('listNotifications', 'Notifications', 'Listar notificaciones', {
        '200': jsonResponse('Notificaciones', envelopeSchema(arrayOf('Notification'))),
      }),
    },
    '/notifications/unread-count': {
      get: operation(
        'getUnreadNotificationCount',
        'Notifications',
        'Contar notificaciones pendientes',
        {
          '200': jsonResponse(
            'Contador',
            envelopeSchema({
              type: 'object',
              required: ['count'],
              properties: { count: { type: 'integer', minimum: 0 } },
            }),
          ),
        },
      ),
    },
    '/notifications/read-all': {
      post: operation('markAllNotificationsRead', 'Notifications', 'Marcar todas como leídas', {
        '200': jsonResponse('Notificaciones actualizadas', envelopeSchema(arrayOf('Notification'))),
      }),
    },
    '/admin/quality-rules': {
      get: operation('listQualityRules', 'Admin', 'Listar reglas de calidad versionadas', {
        '200': jsonResponse('Reglas de calidad', envelopeSchema(arrayOf('QualityRule'))),
        '403': problemResponse('Rol sin permiso'),
      }),
      post: {
        ...operation('createQualityRule', 'Admin', 'Crear una regla de calidad', {
          '201': jsonResponse('Regla creada', envelopeRef('QualityRule')),
          '403': problemResponse('Rol sin permiso'),
          '422': problemResponse('Entrada no válida'),
        }),
        requestBody: bodyRef('CreateQualityRuleInput'),
      },
    },
    '/admin/quality-rules/{id}': {
      patch: {
        ...operation('updateQualityRule', 'Admin', 'Versionar una regla de calidad', {
          '200': jsonResponse('Regla actualizada', envelopeRef('QualityRule')),
          '403': problemResponse('Rol sin permiso'),
          '404': problemResponse('Regla no encontrada'),
          '409': problemResponse('Conflicto de versión'),
          '422': problemResponse('Entrada no válida'),
        }),
        parameters: [qualityRuleIdParameter],
        requestBody: bodyRef('UpdateQualityRuleInput'),
      },
    },
    '/admin/quality-rules/{id}/test': {
      post: {
        ...operation('testQualityRule', 'Admin', 'Probar una regla contra un material', {
          '200': jsonResponse('Resultado de la regla', envelopeRef('QualityResult')),
          '403': problemResponse('Rol sin permiso'),
          '404': problemResponse('Regla o material no encontrado'),
          '422': problemResponse('Entrada no válida'),
        }),
        parameters: [qualityRuleIdParameter],
        requestBody: bodyRef('TestQualityRuleInput'),
      },
    },
    '/admin/integrations': {
      get: operation('listIntegrationHealth', 'Admin', 'Listar modos y salud de integraciones', {
        '200': jsonResponse('Integraciones', envelopeSchema(arrayOf('IntegrationHealth'))),
      }),
    },
    '/admin/demo/reset': {
      post: operation('resetDemo', 'Admin', 'Restablecer dataset sintético', {
        '200': jsonResponse('Dataset restablecido', envelopeSchema({ type: 'object' })),
      }),
    },
  },
  components: {
    securitySchemes: {
      demoRole: {
        type: 'apiKey',
        in: 'header',
        name: 'x-demo-role',
        description:
          'Selector de rol sintético. No es un mecanismo de autenticación de producción.',
      },
    },
    schemas: {
      ...componentSchemas,
      RoleSelection: {
        type: 'object',
        required: ['role'],
        properties: { role: ref('Role') },
        additionalProperties: false,
      },
      ExpectedVersion: {
        type: 'object',
        required: ['expectedVersion'],
        properties: { expectedVersion: { type: 'integer', minimum: 1 } },
        additionalProperties: false,
      },
      WorkflowDecision: {
        type: 'object',
        required: ['expectedVersion', 'reason'],
        properties: {
          expectedVersion: { type: 'integer', minimum: 1 },
          reason: { type: 'string', maxLength: 500 },
        },
        additionalProperties: false,
      },
    },
  },
} as const

export function validateOpenApiDocument(document: unknown): string[] {
  const errors: string[] = []
  if (!isObject(document)) return ['El documento OpenAPI debe ser un objeto.']
  if (document.openapi !== '3.1.0') errors.push('openapi debe ser 3.1.0.')
  if (!isObject(document.info) || typeof document.info.title !== 'string') {
    errors.push('info.title es obligatorio.')
  }
  if (!isObject(document.paths)) {
    errors.push('paths es obligatorio.')
    return errors
  }

  const operationIds = new Set<string>()
  for (const [method, path, expectedOperationId] of apiOperationInventory) {
    const pathItem = document.paths[path]
    if (!isObject(pathItem) || !isObject(pathItem[method])) {
      errors.push(`Falta ${method.toUpperCase()} ${path}.`)
      continue
    }
    const operation = pathItem[method]
    if (operation.operationId !== expectedOperationId) {
      errors.push(`${method.toUpperCase()} ${path} debe usar operationId ${expectedOperationId}.`)
    }
    if (typeof operation.operationId === 'string') {
      if (operationIds.has(operation.operationId)) {
        errors.push(`operationId duplicado: ${operation.operationId}.`)
      }
      operationIds.add(operation.operationId)
    }
    if (!isObject(operation.responses) || Object.keys(operation.responses).length === 0) {
      errors.push(`${method.toUpperCase()} ${path} no declara responses.`)
    }
    for (const parameterName of path.matchAll(/\{([^}]+)\}/g)) {
      const name = parameterName[1]
      const parameters = Array.isArray(operation.parameters) ? operation.parameters : []
      const declared = parameters.some(
        (parameter) =>
          isObject(parameter) &&
          parameter.in === 'path' &&
          parameter.name === name &&
          parameter.required === true,
      )
      if (!declared) {
        errors.push(`${method.toUpperCase()} ${path} no declara el parámetro ${name}.`)
      }
    }
  }

  const serialized = JSON.stringify(document)
  for (const match of serialized.matchAll(/"#\/components\/schemas\/([^"]+)"/g)) {
    const name = match[1]
    const schemas =
      isObject(document.components) && isObject(document.components.schemas)
        ? document.components.schemas
        : {}
    if (!name || !(name in schemas)) errors.push(`$ref no resuelto: ${name ?? ''}.`)
  }
  return errors
}

function jsonSchema(schema: z.ZodType): JsonObject {
  const converted = z.toJSONSchema(schema, {
    target: 'draft-2020-12',
    unrepresentable: 'any',
  }) as JsonObject
  const { $schema: _schema, ...result } = converted
  return result
}

function ref(name: string): JsonObject {
  return { $ref: `#/components/schemas/${name}` }
}

function arrayOf(name: string): JsonObject {
  return { type: 'array', items: ref(name) }
}

function metaSchema(): JsonObject {
  return {
    type: 'object',
    required: ['correlationId'],
    properties: { correlationId: { type: 'string' } },
  }
}

function envelopeSchema(data: JsonObject): JsonObject {
  return {
    type: 'object',
    required: ['data', 'meta'],
    properties: { data, meta: metaSchema() },
  }
}

function envelopeRef(name: string): JsonObject {
  return envelopeSchema(ref(name))
}

function pageRef(name: string): JsonObject {
  return {
    type: 'object',
    required: ['data', 'pagination', 'meta'],
    properties: {
      data: arrayOf(name),
      pagination: {
        type: 'object',
        required: ['page', 'pageSize', 'total', 'totalPages'],
        properties: {
          page: { type: 'integer', minimum: 1 },
          pageSize: { type: 'integer', minimum: 1 },
          total: { type: 'integer', minimum: 0 },
          totalPages: { type: 'integer', minimum: 1 },
        },
      },
      meta: metaSchema(),
    },
  }
}

function operation(
  operationId: string,
  tag: string,
  summary: string,
  responses: JsonObject,
): JsonObject {
  return {
    operationId,
    tags: [tag],
    summary,
    security: [{ demoRole: [] }],
    responses,
  }
}

function jsonResponse(description: string, schema: JsonObject): JsonObject {
  return {
    description,
    headers: {
      'x-correlation-id': {
        description: 'Identificador para correlacionar logs y operaciones',
        schema: { type: 'string' },
      },
    },
    content: { 'application/json': { schema } },
  }
}

function problemResponse(description: string): JsonObject {
  return {
    description,
    content: { 'application/problem+json': { schema: ref('ProblemDetails') } },
  }
}

function bodyRef(name: string): JsonObject {
  return {
    required: true,
    content: { 'application/json': { schema: ref(name) } },
  }
}

function pathParameter(name: string, description: string): JsonObject {
  return {
    name,
    in: 'path',
    required: true,
    description,
    schema: { type: 'string', minLength: 1 },
  }
}

function paginationParameters(): JsonObject[] {
  return [
    {
      name: 'page',
      in: 'query',
      schema: { type: 'integer', minimum: 1, default: 1 },
    },
    {
      name: 'pageSize',
      in: 'query',
      schema: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
    },
    { name: 'search', in: 'query', schema: { type: 'string', maxLength: 120 } },
    { name: 'status', in: 'query', schema: { type: 'string' } },
    { name: 'sortBy', in: 'query', schema: { type: 'string' } },
    {
      name: 'sortDirection',
      in: 'query',
      schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
    },
  ]
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
