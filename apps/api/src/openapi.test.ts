import { describe, expect, it } from 'vitest'

import { apiOperationInventory, openApiDocument, validateOpenApiDocument } from './openapi.js'

describe('OpenAPI 3.1', () => {
  it('documenta todas las operaciones públicas con IDs únicos', () => {
    expect(apiOperationInventory).toHaveLength(51)
    expect(validateOpenApiDocument(openApiDocument)).toEqual([])
  })

  it('expone esquemas derivados de los contratos Zod', () => {
    expect(openApiDocument.components.schemas.RequestDetail).toMatchObject({
      type: 'object',
    })
    expect(openApiDocument.components.schemas.ProblemDetails).toMatchObject({
      type: 'object',
    })
    expect(openApiDocument.components.schemas.UatRelease).toMatchObject({
      type: 'object',
    })
  })
})
