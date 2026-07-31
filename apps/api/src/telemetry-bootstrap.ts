import {
  useAzureMonitor,
  type AzureMonitorOpenTelemetryOptions,
} from '@azure/monitor-opentelemetry'

let initialized = false

export function initializeAzureMonitor(
  environment: Record<string, string | undefined> = process.env,
): boolean {
  if (initialized || !environment.APPLICATIONINSIGHTS_CONNECTION_STRING) return initialized
  useAzureMonitor(telemetryOptionsFromEnvironment(environment))
  initialized = true
  return true
}

export function telemetryOptionsFromEnvironment(
  environment: Record<string, string | undefined>,
): AzureMonitorOpenTelemetryOptions {
  return {
    samplingRatio: boundedNumber(environment.APPLICATIONINSIGHTS_SAMPLING_RATIO, 0.1, 0.01, 1),
    tracesPerSecond: boundedNumber(environment.APPLICATIONINSIGHTS_TRACES_PER_SECOND, 2, 1, 20),
    enableLiveMetrics: false,
    enableStandardMetrics: true,
    enablePerformanceCounters: false,
    instrumentationOptions: {
      azureSdk: { enabled: true },
      http: { enabled: true },
      postgreSql: { enabled: true },
    },
  }
}

function boundedNumber(
  value: string | undefined,
  defaultValue: number,
  minimum: number,
  maximum: number,
): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return defaultValue
  return Math.min(maximum, Math.max(minimum, parsed))
}

initializeAzureMonitor()
