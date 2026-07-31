import { beforeEach, describe, expect, it } from 'vitest'

import { handleApiRequest, resetApiState } from './api.js'

beforeEach(() => {
  resetApiState()
})

describe('Forjadata REST API', () => {
  it('returns health with correlation metadata', async () => {
    const response = await call('/health', { headers: { 'x-correlation-id': 'test-corr' } })
    expect(response.status).toBe(200)
    expect(response.headers.get('x-correlation-id')).toBe('test-corr')
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'healthy', mode: 'demo' }),
        meta: { correlationId: 'test-corr' },
      }),
    )
  })

  it('expone métricas locales agregadas sin datos de negocio', async () => {
    await call('/health')
    await call('/endpoint-inexistente')

    const response = await call('/metrics')
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          totalRequests: 2,
          errorRequests: 1,
          errorRate: 0.5,
          routes: expect.arrayContaining([
            expect.objectContaining({ method: 'GET', path: '/health', status: 200, count: 1 }),
            expect.objectContaining({
              method: 'GET',
              path: '/endpoint-inexistente',
              status: 404,
              count: 1,
            }),
          ]),
        }),
      }),
    )
  })

  it('runs the request vertical slice through HTTP contracts', async () => {
    const createdResponse = await call('/requests', {
      method: 'POST',
      role: 'reviewer',
      body: {
        type: 'CREATE',
        title: 'Motor Siemens desde contrato REST',
        description:
          'Motor Siemens trifásico de 7,5 kW a 400 V con protección IP55 para pruebas REST.',
        priority: 'HIGH',
        category: 'Motores eléctricos',
        fileName: 'motor-rest.pdf',
      },
    })
    expect(createdResponse.status).toBe(201)
    const created = (await createdResponse.json()) as {
      data: { id: string; version: number }
    }

    const submitted = await call(`/requests/${created.data.id}/submit`, {
      method: 'POST',
      role: 'reviewer',
      body: { expectedVersion: created.data.version },
    })
    expect(submitted.status).toBe(200)
    const processed = (await submitted.json()) as {
      data: {
        status: string
        version: number
        suggestions: Array<{ id: string }>
        duplicateCases: Array<{ id: string }>
      }
    }
    expect(processed.data.status).toBe('NEEDS_REVIEW')

    await expect(
      call(`/requests/${created.data.id}/suggestions/bulk-accept`, {
        method: 'POST',
        role: 'reviewer',
      }).then((response) => response.status),
    ).resolves.toBe(200)

    const duplicate = processed.data.duplicateCases[0]
    expect(duplicate).toBeDefined()
    if (!duplicate) throw new Error('Caso de duplicado esperado.')
    await expect(
      call(`/requests/${created.data.id}/duplicates/${duplicate.id}/resolve`, {
        method: 'POST',
        role: 'reviewer',
        body: {
          resolution: 'LINKED',
          reason: 'Coincidencia confirmada por referencia.',
        },
      }).then((response) => response.status),
    ).resolves.toBe(200)

    const currentResponse = await call(`/requests/${created.data.id}`, {
      role: 'reviewer',
    })
    const current = (await currentResponse.json()) as { data: { version: number } }
    const approvedResponse = await call(`/requests/${created.data.id}/approve`, {
      method: 'POST',
      role: 'reviewer',
      body: {
        expectedVersion: current.data.version,
        reason: 'Revisión REST completada.',
      },
    })
    const approved = (await approvedResponse.json()) as {
      data: { status: string; version: number }
    }
    expect(approved.data.status).toBe('READY_FOR_SAP')

    const syncResponse = await call(`/requests/${created.data.id}/sap/sync`, {
      method: 'POST',
      role: 'sap_specialist',
      body: { expectedVersion: approved.data.version },
    })
    expect(syncResponse.status).toBe(200)
    await expect(syncResponse.json()).resolves.toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          adapter: 'simulator',
          status: 'SUCCEEDED',
        }),
      }),
    )
  })

  it('valida y almacena bytes documentales reales antes de adjuntarlos', async () => {
    const createdResponse = await call('/requests', {
      method: 'POST',
      role: 'requester',
      body: {
        type: 'CREATE',
        title: 'Documento contractual',
        description: 'Solicitud con un PDF mínimo para probar bytes, hash y almacenamiento.',
        priority: 'MEDIUM',
        category: 'Motores eléctricos',
        fileName: null,
      },
    })
    const created = (await createdResponse.json()) as {
      data: { id: string }
    }
    const bytes = Buffer.from('%PDF-1.7\nForjadata\n%%EOF')
    const upload = await call(`/requests/${created.data.id}/documents`, {
      method: 'POST',
      role: 'requester',
      body: {
        fileName: 'ficha.pdf',
        mimeType: 'application/pdf',
        contentBase64: bytes.toString('base64'),
      },
    })

    expect(upload.status).toBe(201)
    await expect(upload.json()).resolves.toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          documents: [
            expect.objectContaining({
              fileName: 'ficha.pdf',
              size: bytes.byteLength,
              sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
              storagePath: expect.stringContaining(`${created.data.id}/`),
              provider: 'local-bytes',
            }),
          ],
        }),
      }),
    )

    const rejected = await call(`/requests/${created.data.id}/documents`, {
      method: 'POST',
      role: 'requester',
      body: {
        fileName: 'imagen.pdf',
        mimeType: 'application/pdf',
        contentBase64: Buffer.from('not-a-pdf').toString('base64'),
      },
    })
    expect(rejected.status).toBe(422)
  })

  it('returns Problem Details for validation, permission and version errors', async () => {
    const invalid = await call('/requests', {
      method: 'POST',
      body: { title: 'No', description: 'corta' },
    })
    expect(invalid.status).toBe(422)
    await expect(invalid.json()).resolves.toEqual(
      expect.objectContaining({
        type: expect.stringContaining('/validation-failed'),
        errors: expect.any(Object),
      }),
    )

    const ready = await call('/requests/req-cable-001')
    const readyBody = (await ready.json()) as { data: { version: number } }
    const forbidden = await call('/requests/req-cable-001/sap/sync', {
      method: 'POST',
      role: 'reviewer',
      body: { expectedVersion: readyBody.data.version },
    })
    expect(forbidden.status).toBe(403)
  })

  it('ejecuta UAT mediante contratos HTTP y registra auditoría', async () => {
    const releasesResponse = await call('/uat/releases', { role: 'uat_tester' })
    const releases = (await releasesResponse.json()) as {
      data: Array<{
        id: string
        plans: Array<{ id: string }>
        scenarios: Array<{ id: string; steps: Array<{ id: string }> }>
      }>
    }
    const release = releases.data[0]
    const plan = release?.plans[0]
    const scenario = release?.scenarios[6]
    if (!release || !plan || !scenario) throw new Error('Fixtures UAT incompletos.')

    const createdResponse = await call('/uat/executions', {
      method: 'POST',
      role: 'uat_tester',
      body: { releaseId: release.id, planId: plan.id, scenarioId: scenario.id },
    })
    expect(createdResponse.status).toBe(201)
    const created = (await createdResponse.json()) as { data: { id: string } }

    const updated = await call(`/uat/executions/${created.data.id}`, {
      method: 'PATCH',
      role: 'uat_tester',
      body: {
        status: 'PASSED',
        comment: 'Criterios sintéticos cumplidos.',
        stepResults: [
          {
            stepId: scenario.steps[0]?.id,
            result: 'PASSED',
            comment: 'Paso validado.',
          },
        ],
      },
    })
    expect(updated.status).toBe(200)

    const evidence = await call(`/uat/executions/${created.data.id}/evidence`, {
      method: 'POST',
      role: 'uat_tester',
      body: {
        fileName: 'evidencia.txt',
        mimeType: 'text/plain',
        kind: 'LOG',
        comment: 'Log binario verificable.',
        contentBase64: Buffer.from('resultado UAT verificable').toString('base64'),
      },
    })
    expect(evidence.status).toBe(201)

    const signed = await call(`/uat/executions/${created.data.id}/sign-off`, {
      method: 'POST',
      role: 'uat_tester',
      body: { decision: 'APPROVED', comment: 'Release aceptada para demo.' },
    })
    expect(signed.status).toBe(200)
    await expect(signed.json()).resolves.toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'PASSED',
          signOffDecision: 'APPROVED',
          evidence: [
            expect.objectContaining({
              storageMode: 'blob',
              storagePath: expect.stringMatching(/^uat\//),
              sizeBytes: expect.any(Number),
              sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
            }),
          ],
        }),
      }),
    )

    const exportResponse = await call('/audit-events/export', { role: 'uat_tester' })
    expect(exportResponse.headers.get('content-type')).toContain('text/csv')
    expect(await exportResponse.text()).toContain('uat.sign_off')
  })

  it('protege, versiona y prueba reglas de calidad desde la API', async () => {
    const forbidden = await call('/admin/quality-rules', { role: 'reviewer' })
    expect(forbidden.status).toBe(403)

    const createdResponse = await call('/admin/quality-rules', {
      method: 'POST',
      role: 'admin',
      body: {
        category: 'Motores eléctricos',
        code: 'MOTOR_CONFIDENCE_MIN',
        name: 'Confianza mínima de motor',
        description: 'Valida la puntuación compuesta antes de aprobar.',
        severity: 'WARNING',
        expression: {
          combinator: 'ALL',
          conditions: [{ field: 'confidenceScore', operator: 'gte', value: 0.9 }],
        },
        message: 'La confianza compuesta debe ser al menos 90%.',
        status: 'ACTIVE',
      },
    })
    expect(createdResponse.status).toBe(201)
    const created = (await createdResponse.json()) as {
      data: { id: string; version: number; code: string }
    }
    expect(created.data).toMatchObject({ version: 1, code: 'MOTOR_CONFIDENCE_MIN' })

    const tested = await call(`/admin/quality-rules/${created.data.id}/test`, {
      method: 'POST',
      role: 'admin',
      body: { materialId: 'mat-motor-review' },
    })
    expect(tested.status).toBe(200)
    await expect(tested.json()).resolves.toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          ruleCode: 'MOTOR_CONFIDENCE_MIN',
          status: 'PASS',
        }),
      }),
    )

    const updated = await call(`/admin/quality-rules/${created.data.id}`, {
      method: 'PATCH',
      role: 'admin',
      body: {
        category: 'Motores eléctricos',
        code: 'MOTOR_CONFIDENCE_MIN',
        name: 'Confianza mínima de motor',
        description: 'Valida la puntuación compuesta antes de aprobar.',
        severity: 'ERROR',
        expression: {
          combinator: 'ALL',
          conditions: [{ field: 'confidenceScore', operator: 'gte', value: 0.95 }],
        },
        message: 'La confianza compuesta debe ser al menos 95%.',
        status: 'ACTIVE',
        expectedVersion: created.data.version,
      },
    })
    expect(updated.status).toBe(200)
    await expect(updated.json()).resolves.toEqual(
      expect.objectContaining({
        data: expect.objectContaining({ version: 2, severity: 'ERROR' }),
      }),
    )
  })
})

async function call(
  path: string,
  options: {
    method?: string
    role?: string
    body?: unknown
    headers?: Record<string, string>
  } = {},
): Promise<Response> {
  const headers = new Headers(options.headers)
  if (options.role) headers.set('x-demo-role', options.role)
  if (options.body !== undefined) headers.set('content-type', 'application/json')
  return handleApiRequest(
    new Request(`http://localhost:7071/api/v1${path}`, {
      method: options.method ?? 'GET',
      headers,
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    }),
  )
}
