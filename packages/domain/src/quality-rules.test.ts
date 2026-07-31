import type { QualityRule, QualityRuleCondition } from '@forjadata/contracts'
import { describe, expect, it } from 'vitest'

import { createDemoSnapshot } from './demo-engine'
import { evaluateQualityRule } from './quality-rules'

const evaluatedAt = '2026-07-30T17:00:00.000Z'

describe('quality rules', () => {
  const material = createDemoSnapshot().materials.find((item) => item.id === 'mat-motor-review')
  if (!material) throw new Error('Fixture de motor ausente.')

  it.each([
    [{ field: 'manufacturer', operator: 'required' }, 'PASS'],
    [{ field: 'manufacturer', operator: 'equals', value: 'siemens' }, 'PASS'],
    [{ field: 'manufacturer', operator: 'notEquals', value: 'ABB' }, 'PASS'],
    [{ field: 'shortDescription', operator: 'contains', value: '7,5 kW' }, 'PASS'],
    [{ field: 'attributes.POWER', operator: 'gte', value: 7.5 }, 'PASS'],
    [{ field: 'attributes.POWER', operator: 'lte', value: 7.5 }, 'PASS'],
    [
      {
        field: 'attributes.POWER',
        operator: 'between',
        value: 5,
        secondValue: 10,
      },
      'PASS',
    ],
    [{ field: 'manufacturerPartNumber', operator: 'matches', value: '^1LE\\d{4}-' }, 'PASS'],
    [{ field: 'attributes.UNKNOWN', operator: 'required' }, 'FAIL'],
  ] satisfies Array<[QualityRuleCondition, 'PASS' | 'FAIL']>)(
    'evalúa $operator sobre $field',
    (condition, expected) => {
      expect(evaluateQualityRule(rule(condition), material, evaluatedAt).status).toBe(expected)
    },
  )

  it('combina condiciones ALL/ANY y registra el valor observado', () => {
    const candidate = rule(
      { field: 'manufacturer', operator: 'equals', value: 'ABB' },
      {
        expression: {
          combinator: 'ANY',
          conditions: [
            { field: 'manufacturer', operator: 'equals', value: 'ABB' },
            { field: 'attributes.POWER', operator: 'gte', value: 7 },
          ],
        },
      },
    )

    const result = evaluateQualityRule(candidate, material, evaluatedAt)

    expect(result.status).toBe('PASS')
    expect(result.details[1]).toMatchObject({ actual: 7.5, passed: true })
  })

  it('omite reglas inactivas o de otra categoría', () => {
    expect(
      evaluateQualityRule(
        rule({ field: 'manufacturer', operator: 'required' }, { status: 'INACTIVE' }),
        material,
      ).status,
    ).toBe('SKIPPED')
    expect(
      evaluateQualityRule(
        rule({ field: 'manufacturer', operator: 'required' }, { category: 'Bombas' }),
        material,
      ).status,
    ).toBe('SKIPPED')
  })

  it('rechaza expresiones regulares inválidas o con cuantificadores anidados', () => {
    expect(
      evaluateQualityRule(
        rule({ field: 'manufacturer', operator: 'matches', value: '(a+)+$' }),
        material,
      ).status,
    ).toBe('FAIL')
    expect(
      evaluateQualityRule(
        rule({ field: 'manufacturer', operator: 'matches', value: '[' }),
        material,
      ).status,
    ).toBe('FAIL')
  })
})

function rule(condition: QualityRuleCondition, overrides: Partial<QualityRule> = {}): QualityRule {
  return {
    id: 'quality-rule-test',
    organizationId: 'org-forjadata-demo',
    category: null,
    code: 'TEST_RULE',
    name: 'Regla de prueba',
    description: 'Regla sintética para pruebas unitarias.',
    severity: 'ERROR',
    expression: { combinator: 'ALL', conditions: [condition] },
    message: 'La condición no se cumple.',
    status: 'ACTIVE',
    version: 1,
    createdAt: evaluatedAt,
    updatedAt: evaluatedAt,
    ...overrides,
  }
}
