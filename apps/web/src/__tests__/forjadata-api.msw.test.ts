import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { ApiRequestError, HttpForjadataApi } from '@/services/forjadata-api'
import type {
  AddUatEvidenceInput,
  CreateQualityRuleInput,
  CreateRequestInput,
  CreateUatExecutionInput,
  SignOffUatExecutionInput,
  UpdateQualityRuleInput,
  UpdateUatExecutionInput,
  UploadDocumentInput,
} from '@forjadata/contracts'

const baseUrl = 'https://api.forjadata.test/api/v1'
const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('cliente REST con MSW', () => {
  it('desenvuelve envelopes y envía rol demo más correlation ID', async () => {
    let observedRole: string | null = null
    let observedCorrelation: string | null = null
    server.use(
      http.post(`${baseUrl}/auth/demo/session`, ({ request }) => {
        observedRole = request.headers.get('x-demo-role')
        observedCorrelation = request.headers.get('x-correlation-id')
        return HttpResponse.json({ data: null })
      }),
    )

    const api = new HttpForjadataApi(baseUrl)
    await api.login('admin')

    expect(observedRole).toBe('admin')
    expect(observedCorrelation).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
  })

  it('normaliza Problem Details con status y correlation ID', async () => {
    server.use(
      http.get(`${baseUrl}/features`, () =>
        HttpResponse.json(
          {
            title: 'Dependencia no disponible',
            detail: 'La configuración todavía no está lista.',
            correlationId: 'corr-msw-503',
          },
          { status: 503 },
        ),
      ),
    )

    const api = new HttpForjadataApi(baseUrl)
    await expect(api.features()).rejects.toEqual(
      expect.objectContaining<Partial<ApiRequestError>>({
        message: 'La configuración todavía no está lista.',
        status: 503,
        correlationId: 'corr-msw-503',
      }),
    )
  })

  it('mantiene el contrato de rutas, métodos, query y cuerpos para toda la API', async () => {
    const observed: Array<{ method: string; path: string; body: unknown }> = []
    server.use(
      http.all(`${baseUrl}/*`, async ({ request }) => {
        const url = new URL(request.url)
        const body =
          request.method === 'GET' || request.method === 'HEAD'
            ? null
            : await request.json().catch(() => null)
        observed.push({ method: request.method, path: `${url.pathname}${url.search}`, body })

        if (url.pathname.endsWith('/audit-events/export')) {
          return new HttpResponse('id,action\n1,created', {
            headers: { 'content-disposition': 'attachment; filename="audit.csv"' },
          })
        }

        if (url.pathname.endsWith('/admin/demo/reset')) {
          return new HttpResponse(null, { status: 204 })
        }

        if (url.pathname === '/api/v1/requests' || url.pathname === '/api/v1/materials') {
          return HttpResponse.json({
            items: [],
            page: Number(url.searchParams.get('page')),
            pageSize: Number(url.searchParams.get('pageSize')),
            total: 0,
          })
        }

        return HttpResponse.json({ data: {} })
      }),
    )

    const api = new HttpForjadataApi(baseUrl)
    const pagination = {
      page: 2,
      pageSize: 25,
      search: 'válvula',
      status: 'APPROVED',
      sortBy: 'updatedAt',
      sortDirection: 'desc',
    } as const

    await api.getSession()
    await api.switchRole('reviewer')
    await api.dashboard()
    await api.listRequests(pagination)
    await api.getRequest('request/with space')
    await api.createRequest({ title: 'Solicitud' } as CreateRequestInput)
    await api.uploadDocument('request/1', {
      fileName: 'evidence.pdf',
    } as UploadDocumentInput)
    await api.submitRequest('request/1', 2)
    await api.decideSuggestion('request/1', 'suggestion/1', {
      decision: 'accept',
      reason: 'Revisión de contrato.',
    })
    await api.acceptAllSuggestions('request/1')
    await api.resolveDuplicate('request/1', 'duplicate/1', 'NOT_DUPLICATE', 'No coincide')
    await api.approveRequest('request/1', 3, 'Revisado')
    await api.requestChanges('request/1', 3, 'Falta evidencia')
    await api.listMaterials(pagination)
    await api.getMaterial('material/1')
    await api.listDuplicateCases()
    await api.listSapJobs()
    await api.syncRequest('request/1', 4)
    await api.retrySapJob('job/1')
    await api.listAuditEvents()
    await api.getAuditEvent('audit/1')
    await expect(api.exportAuditEvents()).resolves.toEqual({
      fileName: 'audit.csv',
      content: 'id,action\n1,created',
    })
    await api.listUatReleases()
    await api.createUatExecution({ releaseId: 'release-1' } as CreateUatExecutionInput)
    await api.updateUatExecution('execution/1', {
      status: 'PASSED',
    } as UpdateUatExecutionInput)
    await api.addUatEvidence('execution/1', {
      fileName: 'uat.png',
    } as AddUatEvidenceInput)
    await api.signOffUatExecution('execution/1', {
      decision: 'APPROVED',
    } as SignOffUatExecutionInput)
    await api.listNotifications()
    await api.markAllNotificationsRead()
    await api.integrationHealth()
    await api.features()
    await api.listQualityRules()
    await api.createQualityRule({ name: 'Regla' } as CreateQualityRuleInput)
    await api.updateQualityRule('rule/1', { name: 'Regla 2' } as UpdateQualityRuleInput)
    await api.testQualityRule('rule/1', 'material/1')
    await api.resetDemo()

    expect(observed.length).toBe(36)
    expect(observed).toContainEqual(
      expect.objectContaining({
        method: 'GET',
        path: expect.stringContaining(
          '/api/v1/requests?page=2&pageSize=25&search=v%C3%A1lvula&status=APPROVED',
        ),
      }),
    )
    expect(observed).toContainEqual({
      method: 'POST',
      path: '/api/v1/requests/request%2F1/approve',
      body: { expectedVersion: 3, reason: 'Revisado' },
    })
    expect(observed.at(-1)).toEqual({
      method: 'POST',
      path: '/api/v1/admin/demo/reset',
      body: null,
    })
  })
})
