import { describe, expect, it } from 'vitest'

import { calculateConfidence } from './confidence'

describe('calculateConfidence', () => {
  it('uses the documented weighted product score', () => {
    expect(
      calculateConfidence({
        model: 0.9,
        evidence: 1,
        rules: 0.8,
        sourceConsistency: 0.7,
        duplicateSafety: 1,
      }),
    ).toBe(0.88)
  })

  it('clamps invalid and out-of-range inputs', () => {
    expect(
      calculateConfidence({
        model: 2,
        evidence: -1,
        rules: Number.NaN,
        sourceConsistency: 1,
        duplicateSafety: 1,
      }),
    ).toBe(0.6)
  })
})
