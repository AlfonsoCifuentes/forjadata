import pino from 'pino'

import { readConfig } from './config.js'

const config = readConfig()

export const logger = pino({
  name: 'forjadata-api',
  level: config.LOG_LEVEL,
  base: {
    service: 'forjadata-api',
    environment: config.APP_ENV,
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'authorization',
      '*.token',
      '*.password',
      '*.secret',
      '*.key',
    ],
    censor: '[REDACTED]',
  },
})
