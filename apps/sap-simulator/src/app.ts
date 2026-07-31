import cors from '@fastify/cors'
import { SapProductPayloadSchema } from '@forjadata/contracts'
import { SapSimulatorGateway } from '@forjadata/domain'
import Fastify from 'fastify'

export async function buildSapSimulator() {
  const app = Fastify({
    logger: {
      name: 'forjadata-sap-simulator',
      level: process.env.LOG_LEVEL ?? 'info',
      redact: ['req.headers.authorization'],
    },
    requestIdHeader: 'x-correlation-id',
  })
  const gateway = new SapSimulatorGateway()

  await app.register(cors, {
    origin: ['http://localhost:5173', 'http://localhost:7071'],
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  })

  app.get('/health', async () => gateway.healthCheck())

  app.post('/odata/v4/products/validate', async (request, reply) => {
    const parsed = SapProductPayloadSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(422).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'El payload no cumple el contrato SAP Simulator.',
          details: parsed.error.issues,
        },
      })
    }
    const result = await gateway.validateProduct(parsed.data)
    return reply.status(result.valid ? 200 : 422).send(result)
  })

  app.get<{ Params: { productId: string } }>(
    '/odata/v4/products/:productId',
    async (request, reply) => {
      const product = await gateway.findProduct(request.params.productId)
      if (!product) {
        return reply.status(404).send({
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: `Producto ${request.params.productId} no encontrado.`,
          },
        })
      }
      return product
    },
  )

  app.post('/odata/v4/products', async (request, reply) => {
    const parsed = SapProductPayloadSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(422).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'El payload no cumple el contrato SAP Simulator.',
          details: parsed.error.issues,
        },
      })
    }
    if (request.headers['x-forjadata-simulate-error'] === 'transient') {
      return reply.status(503).send({
        error: {
          code: 'SIMULATED_TEMPORARY_FAILURE',
          category: 'TECHNICAL',
          message: 'Fallo temporal solicitado explícitamente al simulador.',
          retryable: true,
        },
      })
    }
    const result = await gateway.createProduct(parsed.data)
    return reply.status(result.httpStatus).send(result)
  })

  app.patch<{ Params: { productId: string } }>(
    '/odata/v4/products/:productId',
    async (request, reply) => {
      const parsed = SapProductPayloadSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(422).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El payload no cumple el contrato SAP Simulator.',
            details: parsed.error.issues,
          },
        })
      }
      const result = await gateway.updateProduct(request.params.productId, parsed.data)
      return reply.status(result.httpStatus).send(result)
    },
  )

  return app
}
