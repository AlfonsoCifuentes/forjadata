import { describe, expect, it } from 'vitest'

import { telemetryOptionsFromEnvironment } from './telemetry-bootstrap.js'

describe('bootstrap de Azure Monitor', () => {
  it('limita el muestreo para proteger la cuota gratuita', () => {
    expect(telemetryOptionsFromEnvironment({})).toEqual(
      expect.objectContaining({ samplingRatio: 0.1, tracesPerSecond: 2 }),
    )
    expect(
      telemetryOptionsFromEnvironment({
        APPLICATIONINSIGHTS_SAMPLING_RATIO: '100',
        APPLICATIONINSIGHTS_TRACES_PER_SECOND: '999',
      }),
    ).toEqual(expect.objectContaining({ samplingRatio: 1, tracesPerSecond: 20 }))
  })
})
