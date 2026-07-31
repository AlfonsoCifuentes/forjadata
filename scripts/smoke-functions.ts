import { spawn } from 'node:child_process'
import { rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const apiDirectory = new URL('../apps/api/', import.meta.url)
const localSettingsPath = fileURLToPath(new URL('../apps/api/local.settings.json', import.meta.url))
const port = 7071
const baseUrl = `http://127.0.0.1:${port}`
const output: string[] = []
let spawnError: Error | null = null
const funcCommand =
  process.platform === 'win32' && process.env.APPDATA
    ? join(
        process.env.APPDATA,
        'npm',
        'node_modules',
        'azure-functions-core-tools',
        'bin',
        'func.exe',
      )
    : 'func'

await writeFile(
  localSettingsPath,
  `${JSON.stringify(
    {
      IsEncrypted: false,
      Values: {
        AzureWebJobsStorage: 'UseDevelopmentStorage=true',
        FUNCTIONS_WORKER_RUNTIME: 'node',
        FUNCTIONS_NODE_BLOCK_ON_ENTRY_POINT_ERROR: 'true',
        AUTH_MODE: 'demo',
        DATABASE_MODE: 'memory',
        AI_MODE: 'mock',
        SAP_MODE: 'simulator',
        QUEUE_MODE: 'inline',
        STORAGE_MODE: 'local',
      },
    },
    null,
    2,
  )}\n`,
)

const child = spawn(funcCommand, ['start', '--port', String(port)], {
  cwd: apiDirectory,
  env: {
    ...process.env,
    AzureWebJobsStorage: 'UseDevelopmentStorage=true',
    FUNCTIONS_WORKER_RUNTIME: 'node',
    FUNCTIONS_NODE_BLOCK_ON_ENTRY_POINT_ERROR: 'true',
  },
  detached: process.platform !== 'win32',
  windowsHide: true,
  stdio: ['ignore', 'pipe', 'pipe'],
})

child.stdout.on('data', (chunk: Buffer) => output.push(chunk.toString()))
child.stderr.on('data', (chunk: Buffer) => output.push(chunk.toString()))
child.on('error', (error) => {
  spawnError = error
  output.push(error.stack ?? error.message)
})

try {
  const response = await waitForHealth()
  const payload = (await response.json()) as {
    data?: { status?: string; service?: string }
  }
  if (payload.data?.status !== 'healthy') {
    throw new Error(`Respuesta inesperada: ${JSON.stringify(payload)}`)
  }
  console.log(`Azure Functions Core Tools smoke correcto: ${payload.data.service} está healthy.`)
} catch (error) {
  console.error(output.join('').slice(-20_000))
  throw error
} finally {
  await terminateFunctionHost()
  await rm(localSettingsPath, { force: true })
}

async function waitForHealth(): Promise<Response> {
  const deadline = Date.now() + 40_000
  let notFoundCount = 0
  while (Date.now() < deadline) {
    if (spawnError) throw spawnError
    if (child.exitCode !== null) {
      throw new Error(`Azure Functions terminó con código ${child.exitCode}.`)
    }
    const response = await fetch(`${baseUrl}/api/v1/health`).catch(() => null)
    if (response) {
      if (response.ok) return response
      if (response.status === 404) {
        notFoundCount += 1
        if (notFoundCount >= 5) {
          throw new Error('El host arrancó, pero no registró la ruta /api/v1/health.')
        }
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error('Azure Functions no respondió en 40 segundos.')
}

async function terminateFunctionHost(): Promise<void> {
  if (child.exitCode === null) signalFunctionHost('SIGTERM')

  const exited = await Promise.race([
    new Promise<true>((resolve) => child.once('exit', () => resolve(true))),
    new Promise<false>((resolve) => setTimeout(() => resolve(false), 2_000)),
  ])

  if (!exited && child.exitCode === null) {
    signalFunctionHost('SIGKILL')
    await Promise.race([
      new Promise<void>((resolve) => child.once('exit', () => resolve())),
      new Promise<void>((resolve) => setTimeout(resolve, 2_000)),
    ])
  }

  child.stdout.destroy()
  child.stderr.destroy()
  child.unref()
}

function signalFunctionHost(signal: NodeJS.Signals): void {
  if (!child.pid) return
  try {
    if (process.platform === 'win32') {
      child.kill(signal)
    } else {
      process.kill(-child.pid, signal)
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error
  }
}
