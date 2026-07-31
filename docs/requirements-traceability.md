# Trazabilidad de requisitos

Esta matriz enlaza la priorización de la especificación maestra con código y pruebas
observables. `IMPLEMENTATION_STATUS.md` conserva el estado temporal; este documento conserva
la evidencia técnica.

## P0

| Capacidad         | Implementación                                                         | Evidencia                               |
| ----------------- | ---------------------------------------------------------------------- | --------------------------------------- |
| Shell y demo auth | `apps/web/src/app/layouts/AppShell.vue`, stores y guards               | E2E `vertical-slice.spec.ts`            |
| Dashboard         | `/app/dashboard`, ECharts lazy y KPIs sintéticos                       | Build web + API `/v1/dashboard/summary` |
| Solicitudes       | Lista, alta validada, detalle y estados vacíos/error                   | E2E solicitud → SAP                     |
| Upload mock       | Selector local; solo persiste metadato sintético, proveedor `mock`     | Test dominio `demo-engine.test.ts`      |
| Processing        | Pipeline determinista con etapas, progreso y correlation ID            | Tests dominio e integración API         |
| Smart form        | VeeValidate + Zod, atributos, sugerencias, evidencia y revisión humana | Unit e integración API                  |
| AG Grid Community | Catálogo con renderers, filtros, orden y paginación                    | Typecheck/build web                     |
| Workflow          | Máquina de estados, RBAC, versión optimista y razones                  | `workflow.test.ts`                      |
| Duplicados        | Score desglosado, comparación y resolución obligatoria                 | `confidence.test.ts` + E2E              |
| SAP Simulator     | Fastify, validación, CRUD, fallos normalizados y retry                 | Tests de contrato HTTP y dominio        |
| Tests             | Unit, component, integration, contract, E2E y axe                      | `pnpm verify`, Playwright               |
| Deploy            | SPA autocontenida en modo demo y `vercel.json`                         | Publicación y smoke en fase H           |
| README            | Inicio rápido, modos honestos y comandos                               | `README.md`, `README.es.md`             |

## P1

| Capacidad     | Implementación                                                    | Evidencia de cierre            |
| ------------- | ----------------------------------------------------------------- | ------------------------------ |
| Entra         | Validador JWT + adaptador de sesión configurable                  | Contrato, configuración y guía |
| Blob          | Puerto de documentos + Azurite/Azure Blob                         | Contrato y prueba Azurite      |
| Functions     | Azure Functions v4 con build desplegable                          | `pnpm test:functions`          |
| Service Bus   | Puerto de cola + inline/Service Bus                               | Contrato de mensajes           |
| OpenAPI       | 51 operaciones, esquemas Zod, inventario y snapshot               | `openapi.test.ts` + check      |
| Audit         | Eventos append-only, lectura, filtro y CSV auditado               | Integración API + guía         |
| UAT           | Release, plan, escenarios, pasos, ejecución, evidencia y sign-off | Dominio/API/UI + guía          |
| i18n          | ES/EN persistido, fechas localizadas y paridad de claves          | Unit + E2E bilingüe            |
| Observability | Correlation ID, logs, redacción y métricas locales                | Tests + guía; Azure pendiente  |
| Bicep         | Módulos, parámetros, outputs y presupuesto                        | Validación estática/CLI        |

## P2

| Capacidad             | Estrategia honesta sin credenciales                                | Evidencia de cierre                |
| --------------------- | ------------------------------------------------------------------ | ---------------------------------- |
| Document Intelligence | Adaptador `disabled/mock/azure` con esquema común                  | `ai-providers.contract.test.ts`    |
| Azure model           | Responses API, timeout, retry, schema estricto y mock determinista | Contrato + configuración           |
| SAP OData             | Adaptadores reales v2/v4 y simulador explícito                     | Mapping y contrato HTTP            |
| 3D                    | Three.js/GLTF lazy, hotspots, atributos y fallback 2D              | E2E de carga y fallo               |
| Visual regression     | Seis capturas deterministas claro/oscuro                           | Baselines PNG + CI                 |
| Advanced rules        | AST seguro, CRUD/versionado, builder, RBAC, auditoría y test       | 12 unit + API + E2E                |
| Email                 | Puerto no bloqueante `disabled/log/azure-communication-services`   | Contrato con cliente ACS inyectado |

## QA y portfolio

| Capacidad    | Implementación                                                   | Evidencia                         |
| ------------ | ---------------------------------------------------------------- | --------------------------------- |
| Tour guiado  | Ocho pasos, cerrar/saltar/reiniciar y preferencia persistida     | `GuidedTour.vue` + E2E            |
| Cliente REST | `HttpForjadataApi` inyectable y respuestas simuladas en frontera | MSW unit tests                    |
| Cobertura    | Umbrales del dominio y reportes por paquete                      | `pnpm test:coverage`              |
| Rendimiento  | Tres auditorías desktop, cuatro categorías ≥ 0,90                | `pnpm test:performance`           |
| Seguridad    | secret scan, audit, CodeQL y dependency review                   | `pnpm security:check` + workflows |
| Portfolio    | Caso ES/EN, guion 90 s y 3 min, 23 respuestas técnicas           | `docs/portfolio`                  |
| Operación    | instalación, reset, despliegue y runbook                         | `docs/operations`                 |
| Producto     | visión, personas, viajes y glosario                              | `docs/product`                    |

## Convenciones

- Una interfaz real no implica una conexión activa.
- Los modos `mock`, `simulator`, `disabled` y `real` aparecen en configuración y UI.
- Ninguna capacidad pasa a completada sin prueba o documento ejecutable.
