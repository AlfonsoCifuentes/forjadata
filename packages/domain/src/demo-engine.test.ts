import { describe, expect, it } from 'vitest'

import { DemoEngine } from './demo-engine'

describe('DemoEngine vertical slice', () => {
  it('runs create, mock processing, human review, duplicate resolution, approval and SAP sync', () => {
    const engine = new DemoEngine()
    engine.login('reviewer')
    const draft = engine.createRequest({
      type: 'CREATE',
      title: 'Motor Siemens para línea de prueba',
      description:
        'Motor Siemens trifásico de 7,5 kW a 400 V con protección IP55 para la línea demo.',
      priority: 'HIGH',
      category: 'Motores eléctricos',
      fileName: 'motor-demo.pdf',
    })

    const processed = engine.submitAndProcessRequest(draft.id, draft.version)
    expect(processed.status).toBe('NEEDS_REVIEW')
    expect(processed.processingStage).toBe('READY_FOR_REVIEW')
    expect(processed.suggestions).toHaveLength(4)
    expect(processed.duplicateCases).toHaveLength(1)

    engine.acceptAllSuggestions(processed.id)
    const afterAcceptance = engine.getRequest(processed.id)
    const duplicate = afterAcceptance.duplicateCases[0]
    expect(duplicate).toBeDefined()
    if (!duplicate) throw new Error('Fixture de duplicado ausente.')
    engine.resolveDuplicate(
      processed.id,
      duplicate.id,
      'LINKED',
      'Mismo producto; se enlaza sin fusionar.',
    )
    const readyToApprove = engine.getRequest(processed.id)
    const approved = engine.approveRequest(
      processed.id,
      readyToApprove.version,
      'Atributos y evidencia revisados.',
    )
    expect(approved.status).toBe('READY_FOR_SAP')

    engine.switchRole('sap_specialist')
    const job = engine.syncRequest(approved.id, approved.version)
    expect(job.status).toBe('SUCCEEDED')
    expect(engine.getRequest(approved.id).status).toBe('SYNCED')
    expect(engine.listAuditEvents().map((event) => event.action)).toEqual(
      expect.arrayContaining([
        'request.create',
        'processing.complete',
        'duplicate.resolve',
        'request.approve',
        'sap.sync_completed',
      ]),
    )
  })

  it('resets deterministic demo state', () => {
    const engine = new DemoEngine()
    const originalCount = engine.listMaterials({
      page: 1,
      pageSize: 100,
      search: '',
      status: '',
      sortBy: 'updatedAt',
      sortDirection: 'desc',
    }).pagination.total
    engine.createRequest({
      type: 'CREATE',
      title: 'Solicitud temporal para reset',
      description: 'Esta solicitud sintética se elimina al restablecer los datos de demostración.',
      priority: 'LOW',
      category: null,
      fileName: null,
    })
    engine.reset()
    expect(
      engine.listMaterials({
        page: 1,
        pageSize: 100,
        search: '',
        status: '',
        sortBy: 'updatedAt',
        sortDirection: 'desc',
      }).pagination.total,
    ).toBe(originalCount)
    expect(
      engine.listRequests({
        page: 1,
        pageSize: 100,
        search: 'Solicitud temporal',
        status: '',
        sortBy: 'updatedAt',
        sortDirection: 'desc',
      }).data,
    ).toHaveLength(0)
  })

  it('registra ejecución, evidencia, incidencia y sign-off UAT sin contenido binario', () => {
    const engine = new DemoEngine()
    engine.switchRole('uat_tester')
    const release = engine.listUatReleases()[0]
    const plan = release?.plans[0]
    const scenario = release?.scenarios[6]
    if (!release || !plan || !scenario) throw new Error('Fixtures UAT incompletos.')

    const execution = engine.createUatExecution({
      releaseId: release.id,
      planId: plan.id,
      scenarioId: scenario.id,
    })
    const failed = engine.updateUatExecution(execution.id, {
      status: 'FAILED',
      comment: 'Resultado esperado no observado.',
      stepResults: [
        {
          stepId: scenario.steps[0]?.id ?? '',
          result: 'FAILED',
          comment: 'Fallo reproducible con datos sintéticos.',
        },
      ],
      issue: { title: 'Incidencia UAT sintética', severity: 'MEDIUM' },
    })
    expect(failed.issues).toHaveLength(1)

    const withEvidence = engine.addUatEvidence(execution.id, {
      fileName: 'evidencia-demo.png',
      mimeType: 'image/png',
      kind: 'SCREENSHOT',
      comment: 'Solo metadata.',
    })
    expect(withEvidence.evidence[0]).toMatchObject({ storageMode: 'demo-metadata' })

    const signed = engine.signOffUatExecution(execution.id, {
      decision: 'REJECTED',
      comment: 'Pendiente de resolver la incidencia.',
    })
    expect(signed.signOffDecision).toBe('REJECTED')
    expect(engine.getUatRelease(release.id).status).toBe('REJECTED')
    expect(engine.exportAuditEventsCsv()).toContain('uat.sign_off')
    expect(engine.getAuditEvent(engine.listAuditEvents()[0]?.id ?? '').metadata).toEqual({})
  })

  it('consulta, filtra y protege las vistas operativas del dataset', () => {
    const engine = new DemoEngine()

    expect(engine.dashboard()).toMatchObject({
      requestsCreated: 148,
      processed: 132,
    })
    expect(
      engine.listRequests({
        page: 1,
        pageSize: 10,
        search: 'motor',
        status: 'NEEDS_REVIEW',
        sortBy: 'priority',
        sortDirection: 'asc',
      }).data,
    ).not.toHaveLength(0)
    expect(
      engine.listMaterials({
        page: 1,
        pageSize: 10,
        search: 'siemens',
        status: 'IN_REVIEW',
        sortBy: 'internalCode',
        sortDirection: 'asc',
      }).data[0]?.manufacturer,
    ).toBe('Siemens')
    expect(engine.listDuplicateCases()).not.toHaveLength(0)
    expect(engine.integrationHealth()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'SAP', mode: 'simulator', status: 'healthy' }),
      ]),
    )
    expect(() => engine.getRequest('missing-request')).toThrow('Solicitud missing-request')
    expect(() => engine.getMaterial('missing-material')).toThrow('Material missing-material')
    expect(() => engine.getAuditEvent('missing-event')).toThrow('Evento de auditoría missing-event')
  })

  it('adjunta una única copia, modifica sugerencias y solicita cambios', () => {
    const engine = new DemoEngine()
    engine.login('requester')
    const draft = engine.createRequest({
      type: 'CREATE',
      title: 'Bomba centrífuga de proceso',
      description:
        'Bomba centrífuga sintética para verificar documentos y el ciclo de revisión controlado.',
      priority: 'MEDIUM',
      category: 'Bombas',
      fileName: null,
    })
    const document = {
      fileName: 'bomba.pdf',
      mimeType: 'application/pdf',
      size: 256,
      sha256: 'a'.repeat(64),
      storagePath: 'documents/bomba.pdf',
      provider: 'memory',
    }
    const attached = engine.attachDocument(draft.id, document)
    expect(attached.documents).toHaveLength(1)
    expect(engine.attachDocument(draft.id, document).documents).toHaveLength(1)

    const processed = engine.submitAndProcessRequest(draft.id, attached.version)
    const firstSuggestion = processed.suggestions[0]
    if (!firstSuggestion) throw new Error('Fixture sin sugerencias.')
    engine.switchRole('reviewer')
    const modified = engine.decideSuggestion(processed.id, firstSuggestion.id, {
      decision: 'modify',
      value: 'Fabricante revisado',
      reason: 'Corregido contra la evidencia sintética.',
    })
    expect(modified.suggestions[0]?.status).toBe('MODIFIED')
    const changed = engine.requestChanges(
      processed.id,
      modified.version,
      'Falta confirmar la curva de rendimiento.',
    )
    expect(changed.status).toBe('CHANGES_REQUESTED')
    expect(() => engine.attachDocument('req-motor-001', document)).toThrow(
      'Solo se pueden adjuntar documentos',
    )
  })

  it('normaliza un fallo SAP reintentable y conserva idempotencia tras el éxito', () => {
    const engine = new DemoEngine()
    engine.switchRole('sap_specialist')
    const cable = engine.getRequest('req-cable-001')
    const failed = engine.syncRequest(cable.id, cable.version)

    expect(failed).toMatchObject({
      status: 'FAILED_RETRYABLE',
      errorCategory: 'TECHNICAL',
      attemptCount: 1,
    })
    expect(engine.getRequest(cable.id).status).toBe('SYNC_FAILED')
    expect(engine.getSapJob(failed.id).nextAttemptAt).not.toBeNull()

    const succeeded = engine.retrySapJob(failed.id)
    expect(succeeded).toMatchObject({ status: 'SUCCEEDED', attemptCount: 2 })
    expect(engine.getRequest(cable.id).status).toBe('SYNCED')
    expect(engine.queueSapRetry(succeeded.id)).toEqual(succeeded)
    expect(engine.queueSapSync(cable.id, engine.getRequest(cable.id).version, 'odata-v4').id).toBe(
      succeeded.id,
    )

    engine.switchRole('reviewer')
    expect(() => engine.queueSapRetry(succeeded.id)).toThrow(
      'El rol actual no puede reintentar sincronizaciones.',
    )
    expect(() => engine.getSapJob('missing-job')).toThrow('Trabajo SAP missing-job')
  })

  it('crea una release UAT completa y evita planes o ejecuciones inválidas', () => {
    const engine = new DemoEngine()
    engine.switchRole('uat_tester')
    const release = engine.createUatRelease({
      version: '0.2.0',
      name: 'Release sintética de cobertura operativa',
    })
    expect(() => engine.createUatRelease({ version: '0.2.0', name: 'Release repetida' })).toThrow(
      'ya existe',
    )
    expect(() =>
      engine.createUatPlan(release.id, {
        name: 'Plan inválido',
        assignedTesterId: 'user-uat',
        scenarioIds: ['missing-scenario'],
      }),
    ).toThrow('Escenario UAT desconocido')

    const plan = engine.createUatPlan(release.id, {
      name: 'Plan de regresión completo',
      assignedTesterId: 'user-uat',
    })
    expect(engine.getUatPlan(plan.id)).toEqual(plan)
    const scenarioId = plan.scenarioIds[0]
    if (!scenarioId) throw new Error('Plan UAT sin escenarios.')
    const execution = engine.createUatExecution({
      releaseId: release.id,
      planId: plan.id,
      scenarioId,
    })
    expect(
      engine.createUatExecution({
        releaseId: release.id,
        planId: plan.id,
        scenarioId,
      }).id,
    ).toBe(execution.id)

    const stored = engine.addUatEvidence(
      execution.id,
      {
        fileName: 'smoke.txt',
        mimeType: 'text/plain',
        kind: 'LOG',
        comment: 'Evidencia almacenada por contrato.',
      },
      {
        storagePath: 'uat-evidence/smoke.txt',
        sizeBytes: 24,
        sha256: 'b'.repeat(64),
      },
    )
    expect(stored.evidence[0]).toMatchObject({ storageMode: 'blob', sizeBytes: 24 })
    const passed = engine.updateUatExecution(execution.id, {
      status: 'PASSED',
      comment: 'Escenario conforme.',
      stepResults: [],
    })
    expect(passed.status).toBe('PASSED')
    expect(
      engine.signOffUatExecution(execution.id, {
        decision: 'APPROVED',
        comment: 'Release apta para demo.',
      }).signOffDecision,
    ).toBe('APPROVED')
    expect(() => engine.getUatPlan('missing-plan')).toThrow('Plan UAT missing-plan')
  })

  it('marca solo las notificaciones del rol activo como leídas', () => {
    const engine = new DemoEngine()
    engine.switchRole('reviewer')
    const notifications = engine.listNotifications()
    expect(notifications).not.toHaveLength(0)
    expect(engine.markAllNotificationsRead().every((item) => item.readAt !== null)).toBe(true)
    engine.switchRole('requester')
    expect(engine.listNotifications().every((item) => item.userId === 'user-requester')).toBe(true)
  })
})
