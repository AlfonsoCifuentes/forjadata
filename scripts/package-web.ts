import { cp, mkdir, rm } from 'node:fs/promises'
import { resolve } from 'node:path'

const workspaceRoot = resolve(import.meta.dirname, '..')
const webRoot = resolve(workspaceRoot, 'apps/web')
const source = resolve(webRoot, 'dist')
const target = resolve(webRoot, 'azure/dist')

if (!target.startsWith(`${webRoot}\\`) && !target.startsWith(`${webRoot}/`)) {
  throw new Error(`Refusing to replace an artifact path outside apps/web: ${target}`)
}

await rm(target, { recursive: true, force: true })
await mkdir(target, { recursive: true })
await cp(source, target, { recursive: true })

console.info(`Static Web Apps artifact prepared at ${target}`)
