# Forjadata — Guía en español

Forjadata transforma descripciones, hojas de cálculo, imágenes y documentos sintéticos en
registros de materiales limpios, revisables y preparados para sincronización.

**Demo pública: <https://forjadata.vercel.app>**

## Arquitectura resumida

El repositorio es un monorepo pnpm con una SPA Vue 3, una API modular registrada como Azure
Functions v4, un SAP Simulator Fastify y paquetes compartidos de contratos y dominio. El modo
demo usa los mismos contratos que las integraciones HTTP.

## Desarrollo

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm demo:reset
pnpm dev
pnpm verify
pnpm test:e2e
```

Para ejecutar solo la interfaz con el adaptador embebido, crea `.env.local` en `apps/web` con
`VITE_API_MODE=demo`. Para ejercitar la API REST local usa `VITE_API_MODE=http`. El dataset se
restablece con `pnpm demo:reset`.

P2 incorpora un visor GLTF lazy con fallback 2D, reglas de calidad versionadas, seis baselines
visuales y email intercambiable. El email local usa `EMAIL_MODE=log`; el canal real permanece
deshabilitado hasta configurar Azure Communication Services, un remitente verificado y un
destinatario deliberado.

El estado real, los bloqueos y las evidencias se mantienen en `IMPLEMENTATION_STATUS.md`.
Consulta también el [caso de estudio](./docs/portfolio/case-study-es.md), el
[guion de 90 segundos](./docs/portfolio/demo-script.md), la
[guía de entrevista](./docs/portfolio/interview-guide.md), la
[estrategia de pruebas](./docs/qa/test-strategy.md) y las guías de
[reglas](./docs/guides/quality-rules.md), [email](./docs/guides/email-notifications.md) y
[regresión visual](./docs/qa/visual-regression.md).
