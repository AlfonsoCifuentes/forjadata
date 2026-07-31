import type {
  MaterialDetail,
  QualityResult,
  QualityRule,
  QualityRuleCondition,
} from '@forjadata/contracts'

const materialFields = new Set([
  'internalCode',
  'sapProductId',
  'shortDescription',
  'longDescription',
  'category',
  'manufacturer',
  'manufacturerPartNumber',
  'gtin',
  'baseUnit',
  'status',
  'completenessScore',
  'confidenceScore',
  'duplicateCount',
  'source',
])

export function evaluateQualityRule(
  rule: QualityRule,
  material: MaterialDetail,
  evaluatedAt = new Date().toISOString(),
): QualityResult {
  if (
    rule.status === 'INACTIVE' ||
    (rule.category !== null && rule.category !== material.category)
  ) {
    return {
      ruleId: rule.id,
      ruleCode: rule.code,
      status: 'SKIPPED',
      severity: rule.severity,
      message: 'La regla no aplica a este material.',
      details: [],
      evaluatedAt,
    }
  }

  const details = rule.expression.conditions.map((condition) => {
    const actual = resolveField(material, condition.field)
    return {
      field: condition.field,
      operator: condition.operator,
      actual,
      passed: evaluateCondition(condition, actual),
    }
  })
  const passed =
    rule.expression.combinator === 'ALL'
      ? details.every((detail) => detail.passed)
      : details.some((detail) => detail.passed)

  return {
    ruleId: rule.id,
    ruleCode: rule.code,
    status: passed ? 'PASS' : 'FAIL',
    severity: rule.severity,
    message: passed ? 'Regla superada.' : rule.message,
    details,
    evaluatedAt,
  }
}

export function evaluateQualityRules(
  rules: QualityRule[],
  material: MaterialDetail,
  evaluatedAt = new Date().toISOString(),
): QualityResult[] {
  return rules.map((rule) => evaluateQualityRule(rule, material, evaluatedAt))
}

function resolveField(material: MaterialDetail, field: string): string | number | boolean | null {
  if (field.startsWith('attributes.')) {
    const code = field.slice('attributes.'.length)
    const attribute = material.attributes.find((item) => item.code === code)
    return attribute?.normalizedValue ?? null
  }
  if (!materialFields.has(field)) return null
  const value = material[field as keyof MaterialDetail]
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
    ? value
    : null
}

function evaluateCondition(
  condition: QualityRuleCondition,
  actual: string | number | boolean | null,
): boolean {
  switch (condition.operator) {
    case 'required':
      return actual !== null && (typeof actual !== 'string' || actual.trim().length > 0)
    case 'equals':
      return comparable(actual) === comparable(condition.value ?? null)
    case 'notEquals':
      return comparable(actual) !== comparable(condition.value ?? null)
    case 'contains':
      return (
        typeof actual === 'string' &&
        actual
          .toLocaleLowerCase('es')
          .includes(String(condition.value ?? '').toLocaleLowerCase('es'))
      )
    case 'gte':
      return compareNumeric(actual, condition.value, (left, right) => left >= right)
    case 'lte':
      return compareNumeric(actual, condition.value, (left, right) => left <= right)
    case 'between': {
      const value = numeric(actual)
      const minimum = numeric(condition.value)
      const maximum = numeric(condition.secondValue)
      return (
        value !== null &&
        minimum !== null &&
        maximum !== null &&
        value >= minimum &&
        value <= maximum
      )
    }
    case 'matches':
      return matchesSafely(actual, condition.value)
  }
}

function comparable(value: unknown): string | number | boolean | null {
  if (typeof value === 'string') return value.trim().toLocaleLowerCase('es')
  if (typeof value === 'number' || typeof value === 'boolean') return value
  return null
}

function numeric(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string' || value.trim().length === 0) return null
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function compareNumeric(
  actual: unknown,
  expected: unknown,
  comparison: (left: number, right: number) => boolean,
): boolean {
  const left = numeric(actual)
  const right = numeric(expected)
  return left !== null && right !== null && comparison(left, right)
}

function matchesSafely(actual: unknown, pattern: unknown): boolean {
  if (typeof actual !== 'string' || typeof pattern !== 'string' || pattern.length > 120)
    return false
  if (/\\[1-9]|\(\?<[=!]|(?:\([^)]*[+*][^)]*\))[+*{]/u.test(pattern)) return false
  try {
    return new RegExp(pattern, 'iu').test(actual.slice(0, 500))
  } catch {
    return false
  }
}
