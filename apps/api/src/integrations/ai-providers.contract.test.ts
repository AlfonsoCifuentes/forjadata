import type { OpenAI } from 'openai'
import { describe, expect, it, vi } from 'vitest'

import {
  AzureMaterialIntelligenceProvider,
  MockDocumentExtractionProvider,
  RuleBasedMaterialProvider,
} from './ai-providers.js'

describe('AI provider contracts', () => {
  it('el proveedor documental mock se etiqueta sin ambigüedad', async () => {
    const provider = new MockDocumentExtractionProvider()
    await expect(
      provider.analyze({
        documentId: 'doc-1',
        fileName: 'material.csv',
        mimeType: 'text/csv',
        bytes: new TextEncoder().encode('power;7.5 kW'),
      }),
    ).resolves.toEqual(expect.objectContaining({ provider: 'mock', text: 'power;7.5 kW' }))
  })

  it('las reglas transparentes extraen unidades sin presentarse como IA real', async () => {
    const provider = new RuleBasedMaterialProvider('disabled')
    await expect(provider.classify({ text: 'Motor industrial 7,5 kW' })).resolves.toEqual([
      expect.objectContaining({ code: 'Motores eléctricos' }),
    ])
    await expect(
      provider.extract({ text: 'Motor industrial 7,5 kW', categoryCode: 'Motores eléctricos' }),
    ).resolves.toEqual([expect.objectContaining({ code: 'POWER', value: 7.5, unit: 'kW' })])
  })

  it('Azure OpenAI valida salida estructurada y reutiliza una única inferencia', async () => {
    const create = vi.fn().mockResolvedValue({
      output_text: JSON.stringify({
        shortDescription: 'Motor industrial',
        category: 'Motores eléctricos',
        attributes: [
          {
            code: 'POWER',
            value: 7.5,
            unit: 'kW',
            confidence: 0.96,
            evidence: { text: '7,5 kW', page: 1 },
          },
        ],
        warnings: [],
      }),
    })
    const client = {
      responses: { create },
      models: { list: vi.fn() },
    } as unknown as OpenAI
    const provider = new AzureMaterialIntelligenceProvider(client, 'gpt-low-cost', 30_000, 800)

    await expect(provider.classify({ text: 'Motor 7,5 kW' })).resolves.toEqual([
      { code: 'Motores eléctricos', confidence: 0.96 },
    ])
    await expect(
      provider.extract({ text: 'Motor 7,5 kW', categoryCode: 'Motores eléctricos' }),
    ).resolves.toEqual([
      expect.objectContaining({ code: 'POWER', value: 7.5, evidenceText: '7,5 kW' }),
    ])
    expect(create).toHaveBeenCalledTimes(1)
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        store: false,
        model: 'gpt-low-cost',
        text: { format: expect.objectContaining({ type: 'json_schema', strict: true }) },
      }),
    )
  })
})
