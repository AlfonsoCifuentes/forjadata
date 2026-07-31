export interface HttpMetric {
  method: string
  path: string
  status: number
  durationMs: number
}

export interface RouteMetric {
  method: string
  path: string
  status: number
  count: number
  averageDurationMs: number
  maxDurationMs: number
}

export interface MetricsSnapshot {
  generatedAt: string
  totalRequests: number
  errorRequests: number
  errorRate: number
  routes: RouteMetric[]
}

interface Aggregate {
  method: string
  path: string
  status: number
  count: number
  totalDurationMs: number
  maxDurationMs: number
}

const sensitiveKeys = new Set([
  'authorization',
  'cookie',
  'password',
  'token',
  'accesstoken',
  'refreshtoken',
  'clientsecret',
  'secret',
  'apikey',
  'connectionstring',
])

export class LocalMetrics {
  readonly #aggregates = new Map<string, Aggregate>()

  record(metric: HttpMetric): void {
    const key = `${metric.method.toUpperCase()} ${metric.path} ${metric.status}`
    const current = this.#aggregates.get(key)
    if (current) {
      current.count += 1
      current.totalDurationMs += metric.durationMs
      current.maxDurationMs = Math.max(current.maxDurationMs, metric.durationMs)
      return
    }
    this.#aggregates.set(key, {
      method: metric.method.toUpperCase(),
      path: metric.path,
      status: metric.status,
      count: 1,
      totalDurationMs: metric.durationMs,
      maxDurationMs: metric.durationMs,
    })
  }

  snapshot(now = new Date()): MetricsSnapshot {
    const aggregates = [...this.#aggregates.values()]
    const totalRequests = aggregates.reduce((total, metric) => total + metric.count, 0)
    const errorRequests = aggregates
      .filter((metric) => metric.status >= 400)
      .reduce((total, metric) => total + metric.count, 0)
    return {
      generatedAt: now.toISOString(),
      totalRequests,
      errorRequests,
      errorRate: totalRequests === 0 ? 0 : Number((errorRequests / totalRequests).toFixed(4)),
      routes: aggregates
        .map((metric) => ({
          method: metric.method,
          path: metric.path,
          status: metric.status,
          count: metric.count,
          averageDurationMs: Number((metric.totalDurationMs / metric.count).toFixed(2)),
          maxDurationMs: Number(metric.maxDurationMs.toFixed(2)),
        }))
        .sort(
          (left, right) =>
            left.path.localeCompare(right.path) ||
            left.method.localeCompare(right.method) ||
            left.status - right.status,
        ),
    }
  }

  reset(): void {
    this.#aggregates.clear()
  }
}

export function redactTelemetryAttributes(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => redactTelemetryAttributes(item))
  if (!isRecord(value)) return value
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      sensitiveKeys.has(normalizeKey(key)) ? '[REDACTED]' : redactTelemetryAttributes(item),
    ]),
  )
}

function normalizeKey(key: string): string {
  return key.toLocaleLowerCase('en').replaceAll(/[^a-z0-9]/g, '')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export const localMetrics = new LocalMetrics()
