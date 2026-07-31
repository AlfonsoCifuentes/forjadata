import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { format, resolveConfig } from 'prettier'

import {
  apiOperationInventory,
  openApiDocument,
  validateOpenApiDocument,
} from '../apps/api/src/openapi.js'

const outputPath = fileURLToPath(new URL('../docs/api/openapi.json', import.meta.url))
const prettierConfig = (await resolveConfig(outputPath)) ?? {}
const serialized = await format(JSON.stringify(openApiDocument), {
  ...prettierConfig,
  filepath: outputPath,
})
const errors = validateOpenApiDocument(openApiDocument)

if (errors.length > 0) {
  throw new Error(`OpenAPI no válido:\n- ${errors.join('\n- ')}`)
}

if (process.argv.includes('--check')) {
  const current = await readFile(outputPath, 'utf8').catch(() => '')
  if (current !== serialized) {
    throw new Error('docs/api/openapi.json no está actualizado. Ejecuta pnpm openapi:generate.')
  }
  console.log(`OpenAPI 3.1 válido y sincronizado: ${apiOperationInventory.length} operaciones.`)
} else {
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, serialized)
  console.log(`OpenAPI 3.1 generado en ${outputPath}.`)
}
