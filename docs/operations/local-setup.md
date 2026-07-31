# Instalación local

## Requisitos

- Node.js 24 LTS o compatible con `engines`;
- Corepack y pnpm 11.9;
- Azure Functions Core Tools 4;
- Docker Desktop solo si se desea PostgreSQL/Azurite.

## Demo sin cloud

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm demo:reset
pnpm dev
```

Abrir `http://localhost:5173`, pulsar **Entrar en modo demo** y usar reviewer. El frontend, API
y SAP Simulator se ejecutan en 5173, 7071 y 7072. Ninguna credencial Azure es necesaria.

## Verificación

```bash
pnpm verify
pnpm test:e2e
pnpm test:coverage
pnpm test:performance
pnpm security:check
```

Para persistencia real local: `pnpm db:up`, `pnpm db:migrate` y `pnpm db:seed`. Copiar
`.env.example` a `.env` únicamente en local; `.env` está ignorado por Git.
