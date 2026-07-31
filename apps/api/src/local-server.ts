import './telemetry-bootstrap.js'

import { createServer } from 'node:http'

import { handleApiRequest } from './api.js'
import { readConfig } from './config.js'
import { logger } from './logger.js'

const config = readConfig()

const server = createServer(async (incoming, outgoing) => {
  const chunks: Buffer[] = []
  for await (const chunk of incoming) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const body = Buffer.concat(chunks)
  const headers = new Headers()
  for (const [key, value] of Object.entries(incoming.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item)
    } else if (value !== undefined) {
      headers.set(key, value)
    }
  }
  const url = `http://${incoming.headers.host ?? `localhost:${config.PORT}`}${incoming.url ?? '/'}`
  const request = new Request(url, {
    method: incoming.method ?? 'GET',
    headers,
    ...(body.length > 0 ? { body } : {}),
  })
  const response = await handleApiRequest(request)
  outgoing.statusCode = response.status
  response.headers.forEach((value, key) => outgoing.setHeader(key, value))
  outgoing.end(Buffer.from(await response.arrayBuffer()))
})

server.listen(config.PORT, '0.0.0.0', () => {
  logger.info({
    message: 'Forjadata API local host listening',
    port: config.PORT,
    mode: 'demo',
  })
})

function shutdown(signal: string): void {
  logger.info({ message: 'Stopping Forjadata API local host', signal })
  server.close(() => process.exit(0))
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
