import { beforeEach, describe, expect, it } from 'vitest'

import { DemoForjadataApi } from '@/services/forjadata-api'

const pagination = {
  page: 1,
  pageSize: 25,
  search: '',
  status: '',
  sortBy: 'updatedAt',
  sortDirection: 'desc',
} as const

describe('adaptador de API demo', () => {
  beforeEach(() => localStorage.clear())

  it('ejecuta el contrato completo y persiste una vertical slice en el navegador', async () => {
    const api = new DemoForjadataApi()
    await api.login('reviewer')

    expect(await api.getSession()).toMatchObject({
      mode: 'demo',
      user: { role: 'reviewer' },
    })
    expect((await api.dashboard()).requestsCreated).toBeGreaterThan(0)
    expect((await api.listRequests(pagination)).data).not.toHaveLength(0)
    expect((await api.listMaterials(pagination)).data).not.toHaveLength(0)
    expect(await api.integrationHealth()).toEqual(
      expect.arrayContaining([expect.objectContaining({ mode: 'simulator' })]),
    )
    expect(await api.features()).toMatchObject({ enable3dViewer: true, enableUat: true })

    const draft = await api.createRequest({
      type: 'CREATE',
      title: 'Motor Siemens para prueba del adaptador',
      description:
        'Motor trifásico sintético de 7,5 kW con documentación para el contrato de navegador.',
      priority: 'HIGH',
      category: 'Motores eléctricos',
      fileName: null,
    })
    const attached = await api.uploadDocument(draft.id, {
      fileName: 'motor-demo.pdf',
      mimeType: 'application/pdf',
      contentBase64: btoa('%PDF-1.4 synthetic'),
    })
    const processed = await api.submitRequest(attached.id, attached.version)
    const suggestion = processed.suggestions[0]
    const duplicate = processed.duplicateCases[0]
    if (!suggestion || !duplicate) throw new Error('Fixtures de revisión incompletos.')

    await api.decideSuggestion(processed.id, suggestion.id, {
      decision: 'modify',
      value: 'Siemens revisado',
      reason: 'Confirmado contra evidencia sintética.',
    })
    await api.acceptAllSuggestions(processed.id)
    await api.resolveDuplicate(
      processed.id,
      duplicate.id,
      'LINKED',
      'Mismo producto, se conserva enlace.',
    )
    const ready = await api.getRequest(processed.id)
    const approved = await api.approveRequest(
      ready.id,
      ready.version,
      'Atributos revisados por contrato.',
    )

    await api.switchRole('sap_specialist')
    expect(await api.syncRequest(approved.id, approved.version)).toMatchObject({
      status: 'SUCCEEDED',
    })
    expect(await api.listSapJobs()).not.toHaveLength(0)

    const cable = await api.getRequest('req-cable-001')
    const failed = await api.syncRequest(cable.id, cable.version)
    expect(await api.retrySapJob(failed.id)).toMatchObject({ status: 'SUCCEEDED' })

    await api.switchRole('uat_tester')
    const release = (await api.listUatReleases())[0]
    const plan = release?.plans[0]
    const scenario = release?.scenarios[0]
    if (!release || !plan || !scenario) throw new Error('Fixture UAT incompleto.')
    const execution = await api.createUatExecution({
      releaseId: release.id,
      planId: plan.id,
      scenarioId: scenario.id,
    })
    await api.updateUatExecution(execution.id, {
      status: 'PASSED',
      comment: 'Contrato conforme.',
      stepResults: [],
    })
    await api.addUatEvidence(execution.id, {
      fileName: 'evidencia.txt',
      mimeType: 'text/plain',
      kind: 'LOG',
      comment: 'Evidencia sintética.',
    })
    expect(
      await api.signOffUatExecution(execution.id, {
        decision: 'APPROVED',
        comment: 'Escenario conforme para la demo.',
      }),
    ).toMatchObject({ signOffDecision: 'APPROVED' })

    await api.switchRole('admin')
    const rules = await api.listQualityRules()
    const materials = await api.listMaterials(pagination)
    const firstRule = rules[0]
    const firstMaterial = materials.data[0]
    if (!firstRule || !firstMaterial) throw new Error('Fixtures de reglas incompletos.')
    expect(await api.testQualityRule(firstRule.id, firstMaterial.id)).toHaveProperty('status')

    const createdRule = await api.createQualityRule({
      category: null,
      code: 'ADAPTER_REQUIRED',
      name: 'Fabricante requerido en adaptador',
      description: 'Regla sintética para verificar persistencia.',
      severity: 'WARNING',
      expression: {
        combinator: 'ALL',
        conditions: [{ field: 'manufacturer', operator: 'required' }],
      },
      message: 'El fabricante es obligatorio.',
      status: 'ACTIVE',
    })
    expect(
      await api.updateQualityRule(createdRule.id, {
        category: null,
        code: createdRule.code,
        name: 'Fabricante requerido y versionado',
        description: createdRule.description,
        severity: createdRule.severity,
        expression: createdRule.expression,
        message: createdRule.message,
        status: createdRule.status,
        expectedVersion: createdRule.version,
      }),
    ).toMatchObject({ version: 2 })

    const audits = await api.listAuditEvents()
    expect(await api.getAuditEvent(audits[0]?.id ?? '')).toBeDefined()
    expect(await api.exportAuditEvents()).toMatchObject({
      fileName: 'forjadata-audit-demo.csv',
    })
    expect(await api.listDuplicateCases()).not.toHaveLength(0)
    expect(await api.getMaterial(firstMaterial.id)).toMatchObject({ id: firstMaterial.id })
    expect(await api.listNotifications()).toBeDefined()
    expect(await api.markAllNotificationsRead()).toBeDefined()
    expect(localStorage.getItem('forjadata-demo-snapshot-v2')).toContain('"schemaVersion":2')

    await api.resetDemo()
    expect((await api.listRequests(pagination)).pagination.total).toBe(8)
  })

  it('descarta snapshots incompatibles o corruptos y permite solicitar cambios', async () => {
    localStorage.setItem('forjadata-demo-snapshot-v2', '{"schemaVersion":1}')
    expect(await new DemoForjadataApi().getSession()).toMatchObject({ mode: 'demo' })

    localStorage.setItem('forjadata-demo-snapshot-v2', '{invalid')
    const api = new DemoForjadataApi()
    expect(localStorage.getItem('forjadata-demo-snapshot-v2')).toBeNull()

    await api.login('reviewer')
    const request = await api.getRequest('req-motor-001')
    expect(
      await api.requestChanges(request.id, request.version, 'Falta confirmar un atributo.'),
    ).toMatchObject({ status: 'CHANGES_REQUESTED' })
  })
})
