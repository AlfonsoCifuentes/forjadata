import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const workspaceRoot = resolve(import.meta.dirname, '..')
const sourceRoot = resolve(workspaceRoot, 'apps/api')
const artifactRoot = resolve(sourceRoot, 'azure/dist')

if (!artifactRoot.startsWith(`${sourceRoot}\\`) && !artifactRoot.startsWith(`${sourceRoot}/`)) {
  throw new Error(`Refusing to replace an artifact path outside apps/api: ${artifactRoot}`)
}

await rm(artifactRoot, { recursive: true, force: true })
await mkdir(resolve(artifactRoot, 'functions'), { recursive: true })
await cp(
  resolve(sourceRoot, 'dist/functions/api-v1.js'),
  resolve(artifactRoot, 'functions/api-v1.js'),
)
await cp(
  resolve(sourceRoot, 'dist/functions/workers.js'),
  resolve(artifactRoot, 'functions/workers.js'),
)
await cp(resolve(sourceRoot, 'host.json'), resolve(artifactRoot, 'host.json'))

const packageManifest = {
  name: 'forjadata-functions',
  version: '0.1.0',
  private: true,
  type: 'module',
  main: 'functions/*.js',
  engines: {
    node: '>=22',
  },
  dependencies: {
    '@azure/functions': '4.16.2',
    pino: '10.3.1',
  },
}

await writeFile(
  resolve(artifactRoot, 'package.json'),
  `${JSON.stringify(packageManifest, null, 2)}\n`,
  'utf8',
)

console.info(`Azure Functions artifact prepared at ${artifactRoot}`)
