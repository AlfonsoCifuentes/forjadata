import { describe, expect, it } from 'vitest'

import { materialExtractionSystemPrompt, MaterialExtractionResultSchema } from './index'

describe('contrato de prompts', () => {
  it('rechaza una confianza fuera de rango', () => {
    const result = MaterialExtractionResultSchema.safeParse({
      shortDescription: 'Motor trifásico',
      category: 'Motores',
      attributes: [
        {
          code: 'POWER',
          value: 7.5,
          unit: 'kW',
          confidence: 1.2,
          evidence: { text: 'Potencia 7,5 kW', page: 1 },
        },
      ],
      warnings: [],
    })

    expect(result.success).toBe(false)
    expect(materialExtractionSystemPrompt()).toContain('sin inventar')
  })
})
