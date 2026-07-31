import { readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, relative, resolve } from 'node:path'

const workspace = process.cwd()
const ignoredDirectories = new Set([
  '.azure',
  '.forjadata',
  '.git',
  '.lighthouseci',
  '.turbo',
  '.vercel',
  'coverage',
  'dist',
  'node_modules',
  'playwright-report',
  'test-results',
])
const textExtensions = new Set([
  '.bicep',
  '.css',
  '.html',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.prisma',
  '.ts',
  '.tsx',
  '.vue',
  '.yaml',
  '.yml',
])
const secretPatterns = [
  {
    label: 'private key',
    pattern: /-----BEGIN (?:EC |OPENSSH |RSA )?PRIVATE KEY-----/,
  },
  {
    label: 'Azure Storage account key',
    pattern: /AccountKey=[A-Za-z0-9+/=]{20,}/,
  },
  {
    label: 'GitHub token',
    pattern: /gh[pousr]_[A-Za-z0-9]{20,}/,
  },
  {
    label: 'Vercel token',
    pattern: /vercel_[A-Za-z0-9]{20,}/,
  },
  {
    label: 'configured secret environment value',
    pattern:
      /(?:APPLICATIONINSIGHTS_CONNECTION_STRING|AZURE_DOCUMENT_INTELLIGENCE_KEY|AZURE_OPENAI_API_KEY|AZURE_SERVICE_BUS_CONNECTION_STRING|SAP_PASSWORD)[ \t]*=[ \t]*(?![ \t]*(?:$|<|changeme|example))[^ \t\r\n#]+/m,
  },
]

function filesIn(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
      return []
    }

    const absolutePath = resolve(directory, entry.name)

    if (entry.isDirectory()) {
      return filesIn(absolutePath)
    }

    return entry.isFile() ? [absolutePath] : []
  })
}

const files = filesIn(workspace)
const violations: string[] = []
const unexpectedEnvironmentFiles = files.filter((file) => {
  const name = relative(workspace, file).replaceAll('\\', '/')
  return /(^|\/)\.env(?:\.|$)/.test(name) && name !== '.env.example'
})

for (const file of unexpectedEnvironmentFiles) {
  violations.push(`environment file must not be committed: ${relative(workspace, file)}`)
}

for (const file of files) {
  const relativePath = relative(workspace, file).replaceAll('\\', '/')

  if (
    !textExtensions.has(extname(file)) &&
    !['.editorconfig', '.env.example', '.gitignore', '.npmrc'].includes(relativePath)
  ) {
    continue
  }

  if (statSync(file).size > 1_000_000) {
    continue
  }

  const content = readFileSync(file, 'utf8')

  for (const { label, pattern } of secretPatterns) {
    if (pattern.test(content)) {
      violations.push(`${label}: ${relativePath}`)
    }
  }
}

for (const manifest of ['package.json', 'pnpm-lock.yaml']) {
  if (readFileSync(resolve(workspace, manifest), 'utf8').includes('ag-grid-enterprise')) {
    violations.push(`forbidden AG Grid Enterprise dependency: ${manifest}`)
  }
}

if (violations.length > 0) {
  console.error(`Repository safety check failed:\n- ${violations.join('\n- ')}`)
  process.exit(1)
}

console.log(
  `Repository safety check passed (${files.length} files; no secrets or forbidden enterprise dependency).`,
)
