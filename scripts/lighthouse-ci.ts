import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { extname, join, resolve, sep } from 'node:path'
import { once } from 'node:events'
import { spawnSync } from 'node:child_process'
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'
import { ReportGenerator } from 'lighthouse/report/generator/report-generator.js'
import * as chromeLauncher from 'chrome-launcher'

const reportDirectory = resolve(process.cwd(), '.lighthouseci')
const staticDirectory = resolve(process.cwd(), 'apps/web/dist')
const isWindows = process.platform === 'win32'
const contentTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
}

function resolveStaticPath(requestUrl = '/') {
  const pathname = decodeURIComponent(new URL(requestUrl, 'http://localhost').pathname)
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '')
  const candidate = resolve(staticDirectory, relativePath)

  if (candidate !== staticDirectory && !candidate.startsWith(`${staticDirectory}${sep}`)) {
    return null
  }

  if (existsSync(candidate) && statSync(candidate).isFile()) {
    return candidate
  }

  return resolve(staticDirectory, 'index.html')
}

function runAssertions() {
  const result = spawnSync(
    'pnpm',
    ['exec', 'lhci', 'assert', '--lhr', '.lighthouseci', '--includePassedAssertions'],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: process.env,
      shell: isWindows,
      stdio: 'inherit',
    },
  )

  return result.status ?? 1
}

if (!existsSync(resolve(staticDirectory, 'index.html'))) {
  console.error('No existe apps/web/dist/index.html. Ejecuta el build antes de Lighthouse.')
  process.exit(1)
}

rmSync(reportDirectory, { force: true, recursive: true })
mkdirSync(reportDirectory, { recursive: true })

const server = createServer((request, response) => {
  try {
    const filePath = resolveStaticPath(request.url)

    if (!filePath) {
      response.writeHead(403).end('Forbidden')
      return
    }

    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': contentTypes[extname(filePath)] ?? 'application/octet-stream',
    })
    response.end(readFileSync(filePath))
  } catch {
    response.writeHead(500).end('Internal Server Error')
  }
})

server.listen(0, '127.0.0.1')
await once(server, 'listening')

const address = server.address()

if (!address || typeof address === 'string') {
  server.close()
  throw new Error('No se pudo obtener el puerto del servidor de Lighthouse.')
}

const browserProfile = await mkdtemp(join(tmpdir(), 'forjadata-lighthouse-'))
let chrome: chromeLauncher.LaunchedChrome | undefined

try {
  chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage'],
    userDataDir: browserProfile,
  })

  const url = `http://127.0.0.1:${address.port}/`
  const reportTimestamp = Date.now()
  console.log(`Ejecutando tres auditorías Lighthouse sobre ${url}`)

  for (let run = 1; run <= 3; run += 1) {
    const result = await lighthouse(
      url,
      {
        logLevel: 'error',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        output: 'json',
        port: chrome.port,
      },
      desktopConfig,
    )

    if (!result) {
      throw new Error(`Lighthouse no produjo resultado en la ejecución ${run}.`)
    }

    const reportBase = resolve(reportDirectory, `lhr-${reportTimestamp + run}`)
    writeFileSync(`${reportBase}.json`, JSON.stringify(result.lhr))
    writeFileSync(`${reportBase}.html`, ReportGenerator.generateReport(result.lhr, 'html'))
    console.log(`Auditoría ${run}/3 completada.`)
  }
} finally {
  await chrome?.kill()
  server.close()

  try {
    rmSync(browserProfile, { force: true, maxRetries: 10, recursive: true, retryDelay: 100 })
  } catch (error) {
    if (!isWindows) {
      throw error
    }

    console.warn(`Windows mantiene bloqueado el perfil temporal ${browserProfile}.`)
  }
}

process.exit(runAssertions())
