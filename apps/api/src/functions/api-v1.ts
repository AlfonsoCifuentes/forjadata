import '../telemetry-bootstrap.js'

import {
  app,
  type HttpRequest,
  type HttpResponseInit,
  type InvocationContext,
} from '@azure/functions'
import { SpanStatusCode, trace } from '@opentelemetry/api'

import { handleApiRequest } from '../api.js'

export async function apiV1Handler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const tracer = trace.getTracer('forjadata-api')
  return tracer.startActiveSpan(`${request.method} ${request.url}`, async (span) => {
    try {
      const body =
        request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text()
      const webRequest = new Request(request.url, {
        method: request.method,
        headers: request.headers,
        ...(body && body.length > 0 ? { body } : {}),
      })
      const response = await handleApiRequest(webRequest)
      const headers: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        headers[key] = value
      })
      span.setAttributes({
        'http.request.method': request.method,
        'http.response.status_code': response.status,
        'forjadata.correlation_id': response.headers.get('x-correlation-id') ?? 'unknown',
      })
      span.setStatus({
        code: response.status >= 500 ? SpanStatusCode.ERROR : SpanStatusCode.OK,
      })
      context.log('Forjadata API request completed', {
        method: request.method,
        url: request.url,
        status: response.status,
      })
      return {
        status: response.status,
        headers,
        body: await response.text(),
      }
    } catch (error) {
      span.recordException(error instanceof Error ? error : new Error('Unknown error'))
      span.setStatus({ code: SpanStatusCode.ERROR })
      throw error
    } finally {
      span.end()
    }
  })
}

app.http('forjadataApiV1', {
  route: 'v1/{*path}',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: apiV1Handler,
})
