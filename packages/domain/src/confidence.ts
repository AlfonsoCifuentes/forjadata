export interface ConfidenceFactors {
  model: number
  evidence: number
  rules: number
  sourceConsistency: number
  duplicateSafety: number
}

const weights: Readonly<Record<keyof ConfidenceFactors, number>> = {
  model: 0.35,
  evidence: 0.2,
  rules: 0.2,
  sourceConsistency: 0.15,
  duplicateSafety: 0.1,
}

export function calculateConfidence(factors: ConfidenceFactors): number {
  const score = (Object.keys(weights) as (keyof ConfidenceFactors)[]).reduce(
    (total, key) => total + clamp(factors[key]) * weights[key],
    0,
  )
  return Math.round(score * 100) / 100
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}
