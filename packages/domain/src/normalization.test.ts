import { describe, expect, it } from 'vitest'

import {
  normalizeCode,
  normalizeDecimal,
  normalizeManufacturer,
  normalizePower,
  normalizeWhitespace,
} from './normalization'

describe('normalization', () => {
  it('normalizes Spanish decimal separators and SI power', () => {
    expect(normalizeDecimal('7,5')).toBe(7.5)
    expect(normalizePower('7500', 'W')).toEqual({ value: 7.5, unit: 'kW' })
  })

  it('normalizes aliases, spaces and codes', () => {
    expect(normalizeManufacturer('  SIEMENS AG ')).toBe('Siemens')
    expect(normalizeWhitespace(' Motor   trifásico ')).toBe('Motor trifásico')
    expect(normalizeCode(' ab - 12 ')).toBe('AB-12')
  })

  it('rejects invalid numeric values and unsupported units', () => {
    expect(() => normalizeDecimal('sin dato')).toThrow()
    expect(() => normalizePower(2, 'CV')).toThrow()
  })
})
