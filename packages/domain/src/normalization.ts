const manufacturerAliases: Readonly<Record<string, string>> = {
  siemens: 'Siemens',
  'siemens ag': 'Siemens',
  skf: 'SKF',
  'abb ltd': 'ABB',
  abb: 'ABB',
  'forja industrial': 'Forja Industrial',
}

export function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function normalizeManufacturer(value: string): string {
  const normalized = normalizeWhitespace(value).toLocaleLowerCase('es')
  return manufacturerAliases[normalized] ?? toTitleCase(normalized)
}

export function normalizeDecimal(value: string | number): number {
  if (typeof value === 'number') {
    return value
  }

  const compact = value.replace(/\s/g, '').replace(',', '.')
  const parsed = Number.parseFloat(compact)
  if (!Number.isFinite(parsed)) {
    throw new Error(`No se puede normalizar "${value}" como número.`)
  }
  return parsed
}

export function normalizePower(
  value: string | number,
  unit: string,
): {
  value: number
  unit: 'kW'
} {
  const numericValue = normalizeDecimal(value)
  const normalizedUnit = unit.trim().toLocaleLowerCase('es')

  if (normalizedUnit === 'w') {
    return { value: numericValue / 1000, unit: 'kW' }
  }
  if (normalizedUnit === 'mw') {
    return { value: numericValue * 1000, unit: 'kW' }
  }
  if (normalizedUnit === 'kw') {
    return { value: numericValue, unit: 'kW' }
  }

  throw new Error(`Unidad de potencia no soportada: ${unit}.`)
}

export function normalizeCode(value: string): string {
  return normalizeWhitespace(value)
    .toUpperCase()
    .replace(/\s*-\s*/g, '-')
}

function toTitleCase(value: string): string {
  return value.replace(/\p{L}[\p{L}\p{M}]*/gu, (word) => {
    const [first = '', ...rest] = [...word]
    return `${first.toLocaleUpperCase('es')}${rest.join('').toLocaleLowerCase('es')}`
  })
}
