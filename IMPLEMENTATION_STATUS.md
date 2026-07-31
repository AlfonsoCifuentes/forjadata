# Forjadata — Estado de implementación

> Fuente principal de requisitos: `F:\Descargas\FORJADATA_MASTER_SPEC (1).md`, versión 1.0, 30 de julio de 2026.  
> Última actualización: 30 de julio de 2026.  
> Estado global: **P0, P1, P2 y QA/portfolio completos localmente; publicación y Azure en curso**.

## Resumen

La especificación maestra se ha leído íntegramente antes de generar código. La carpeta de trabajo estaba vacía y no contenía un repositorio Git, código previo ni cambios de usuario que preservar.

La entrega se ejecutará en orden estricto P0 → P1 → P2. Cada integración sin credenciales se representará con una interfaz estable, un adaptador explícitamente etiquetado como simulador o mock, pruebas de contrato, documentación de configuración y una indicación visible de modo. Ningún simulador se presentará como conexión real.

## Fases

| Fase               | Alcance                                                                                                   | Estado           | Criterio de cierre                                                       |
| ------------------ | --------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------ |
| A — Inspección     | Auditoría del repo, lectura completa, plan y decisiones iniciales                                         | Completada       | Estado inicial registrado                                                |
| B — Bootstrap      | Monorepo pnpm, web, API, SAP simulator, contratos, calidad, DB, CI                                        | Completada       | `pnpm verify` superado                                                   |
| C — Vertical slice | Login demo → dashboard → solicitud → mock processing → review → approve → SAP simulator                   | Completada       | E2E principal y `pnpm verify` superados                                  |
| D — P0 completo    | Shell, auth demo, dashboard, solicitudes, upload, form, AG Grid, workflow, duplicados, SAP, tests, README | Completada       | Matriz P0 cubierta y `pnpm verify` superado                              |
| E — P1 completo    | Entra, Blob, Functions, Service Bus, OpenAPI, audit, UAT, i18n, observabilidad, Bicep                     | En curso         | Local completo; falta preview, despliegue y smoke Azure                  |
| F — P2 completo    | Document Intelligence, modelo Azure, OData, 3D, visual regression, reglas avanzadas, email                | Completada local | Implementaciones configurables, contratos, E2E y `pnpm verify` superados |
| G — QA y portfolio | A11y, seguridad, rendimiento, case study, guía de entrevista, demo y trazabilidad                         | En curso         | Local completo; falta fresh install desde GitHub                         |
| H — Publicación    | Repositorio GitHub, CI, despliegue Vercel y smoke de producción                                           | Pendiente        | URLs públicas verificadas                                                |

## Backlog activo

### Fase A — Inspección

- [x] Confirmar el estado inicial de la carpeta.
- [x] Confirmar ausencia de repositorio Git.
- [x] Leer las 4.165 líneas de la especificación maestra.
- [x] Identificar P0, P1, P2 y fases A–H.
- [x] Registrar huella SHA-256 y ficha canónica de la especificación en `docs/product`.
- [x] Comprobar versiones y autenticación de Node, pnpm, Docker, GitHub CLI y Vercel CLI.
- [x] Crear los ADR iniciales requeridos.

### Fase B — Bootstrap

- [x] Inicializar Git y el workspace pnpm.
- [x] Crear `apps/web` con Vue 3, Composition API, TypeScript estricto, Vite, Router, Pinia, Vitest y Playwright.
- [x] Crear `apps/api` con Azure Functions v4 y composición local.
- [x] Crear `apps/sap-simulator` con Fastify.
- [x] Crear paquetes `contracts`, `domain`, `config`, `test-utils`, `ai-prompts` y `eslint-config`.
- [x] Añadir Prisma, migración inicial y seed determinista.
- [x] Añadir Docker Compose, variables de entorno de ejemplo y scripts raíz.
- [x] Añadir ESLint, Prettier, typecheck, tests, build y `pnpm verify`.
- [x] Añadir CI inicial y plantillas de contribución.

### Fase C — Vertical slice

- [x] Acceso demo en un clic con selector de rol y banner visible.
- [x] App Shell responsive con rutas lazy y guards.
- [x] Dashboard con datos sintéticos identificados como demo.
- [x] Listar y crear solicitudes.
- [x] Adjuntar documento sintético y procesarlo con pipeline mock determinista.
- [x] Revisar sugerencias, evidencia y duplicado.
- [x] Aprobar mediante máquina de estados y RBAC backend/frontend.
- [x] Validar y sincronizar mediante SAP Simulator.
- [x] Registrar auditoría, notificaciones y correlation ID.
- [x] Restablecer el dataset demo.
- [x] Cubrir el recorrido con tests de dominio, contrato, integración, componente y E2E.

### Fase D — P0

- [x] Landing pública, acceso demo y pantalla de arquitectura.
- [x] App Shell, navegación adaptable, cambio de tema, idioma y rol.
- [x] Dashboard, solicitudes, formulario validado y documento sintético.
- [x] Catálogo AG Grid Community con renderers, filtros, ordenación y paginación.
- [x] Detalle de material, revisión humana, evidencia y confianza.
- [x] Máquina de estados, permisos, control de versión y errores normalizados.
- [x] Duplicados con desglose de score y resolución humana.
- [x] SAP Simulator, reintento y trazabilidad visible.
- [x] Auditoría, notificaciones, salud de integraciones y reset demo.
- [x] Cerrar brechas de P0 detectadas en la matriz de trazabilidad.
- [x] Verificar el host real de Azure Functions con Core Tools 4.12.1.
- [x] Ejecutar `pnpm verify` de cierre de P0.

### Fase E — P1

- [x] Entra: JWT/JWKS, roles, scope, MSAL PKCE, registros dev, contrato y guía.
- [x] Blob: puerto, adaptadores memoria/Azurite/Azure con identidad administrada y contrato.
- [x] Functions: host v4 y build ESM desplegable validados con Core Tools.
- [x] Service Bus: puerto, adaptadores inline/Azure, triggers y contrato de mensajes.
- [x] OpenAPI 3.1 generado y validado (51 operaciones tras ampliar P2).
- [x] Auditoría append-only, detalle y CSV; UAT ejecutable con evidencia binaria y sign-off.
- [x] Cobertura ES/EN de la navegación y recorrido principal, con paridad de claves.
- [x] Observabilidad: redacción, correlation ID, métricas, OTel/App Insights y guía.
- [x] Bicep modular/AZD con UAMI, RBAC, guardrails de coste y validación automatizada.
- [x] Estado PostgreSQL serverless compartido con bootstrap idempotente y concurrencia optimista.
- [x] Ejecutar `pnpm verify` de cierre local de P1.
- [ ] Completar `azd provision --preview`, desplegar y ejecutar smoke de P1 en Azure.

### Fase F — P2

- [x] Document Intelligence real con identidad/clave opcional, mock determinista, timeout,
      validación y contrato.
- [x] Azure OpenAI Responses API con JSON Schema estricto, límites, retry, timeout y contrato.
- [x] SAP OData v2/v4 real con mapping, autenticación configurable, simulador y contrato.
- [x] Visor Three.js/GLTF lazy con modelo propio CC0, orbit controls, hotspots, resaltado de
      atributos, liberación de recursos y fallback 2D accesible.
- [x] Seis baselines Playwright deterministas con tema claro/oscuro y CI.
- [x] Reglas avanzadas: AST seguro, `ALL`/`ANY`, ocho operadores, categorías, severidad,
      estado, versionado optimista, RBAC, auditoría, Prisma, API y constructor visual.
- [x] Email in-app obligatorio más puerto `disabled/log/azure-communication-services`,
      identidad administrada, escape HTML, timeout, health honesto y contrato.
- [x] Documentar reglas, email, regresión visual, licencia 3D y ADR P2.
- [x] Ejecutar `pnpm verify` de cierre local de P2.

### Fase G — QA y portfolio

- [x] Añadir tour guiado de ocho pasos, con cerrar, saltar, reiniciar y preferencia persistida.
- [x] Cubrir el cliente REST completo con MSW y el adaptador demo con pruebas de contrato.
- [x] Superar 80% de líneas en dominio (88,81%) y 75% global ponderado (77,17%).
- [x] Ejecutar 13/13 E2E, axe WCAG A/AA y seis baselines visuales.
- [x] Ejecutar tres Lighthouse con 1,00 en rendimiento, accesibilidad, buenas prácticas y SEO.
- [x] Añadir secret scan, exclusión AG Grid Enterprise, audit sin CVE, CodeQL y dependency review.
- [x] Completar documentación de producto, arquitectura, QA, UAT, operaciones y portfolio ES/EN.
- [x] Documentar y probar reset determinista, guion de 90 segundos y recorrido < 3 minutos.
- [ ] Repetir instalación y verificación desde un clon limpio del repositorio publicado.

## Decisiones iniciales

1. **La especificación manda.** Si una optimización de entrega entra en conflicto con un requisito explícito, se documentará la desviación antes de aplicarla.
2. **Demo local sin cloud.** El camino por defecto funcionará con auth demo, IA mock determinista, cola inline, almacenamiento local y SAP Simulator.
3. **Integraciones intercambiables.** Entra, Blob, Service Bus, Document Intelligence, Azure OpenAI y SAP OData se aislarán tras puertos comunes.
4. **Persistencia progresiva.** Prisma/PostgreSQL será el adaptador objetivo; una implementación demo determinista permitirá ejecutar y desplegar el recorrido público sin credenciales ni costes.
5. **Vercel publica la SPA demo.** El frontend tendrá un adaptador demo seguro para la experiencia pública; la API Azure Functions y la infraestructura Azure se entregarán y documentarán por separado.
6. **AG Grid Community solamente.** No se habilitarán capacidades Enterprise.
7. **Código en inglés, producto en español con traducción inglesa.**
8. **No se cierra una fase sin `pnpm verify`.**

Estas decisiones se formalizarán en `docs/adr`.

## Bloqueos y riesgos

| Elemento                   | Estado                        | Tratamiento                                                                     |
| -------------------------- | ----------------------------- | ------------------------------------------------------------------------------- |
| Objetivo Azure             | Autorizado con coste cero     | Free Trial únicamente; nunca retirar spending limit ni migrar a pago por uso    |
| Sesión Azure CLI           | Verificada                    | CLI 2.88.0; suscripción vacía; usuario Owner; sin políticas restrictivas        |
| Sesión Azure Developer CLI | Requiere interacción          | Completar el login abierto para ejecutar el preview obligatorio de AZD          |
| Protección financiera      | Verificada                    | USD 200 disponibles, USD 0 pendientes y `spendingLimit = On`                    |
| Cuota Azure OpenAI         | Verificada                    | 500K en East US 2; despliegue `gpt-5-mini` limitado a 1K TPM                    |
| Entorno SAP real           | No disponible                 | SAP Simulator + adaptadores OData + contrato                                    |
| Base de datos cloud        | Validada, no aprovisionada    | PostgreSQL 18 B1ms/32 GiB en North Europe; bootstrap idempotente                |
| Repositorio GitHub         | Aún no creado                 | Publicar el cierre local ya verificado                                          |
| Proyecto Vercel            | CLI local con sesión caducada | Probar conector Vercel tras build; si tampoco está autenticado, requerirá login |
| Azure Functions Core Tools | Validado (`func` 4.12.1)      | `pnpm test:functions` arranca el host, consulta health y lo detiene             |
| Alcance elevado            | Riesgo alto                   | Vertical slice primero, automatización, trazabilidad y prioridad estricta       |

La preparación y el uso de la prueba gratuita están autorizados con un límite personal de
EUR 0. El despliegue debe permanecer dentro de las cuotas gratuitas o del crédito promocional,
sin retirar nunca el spending limit. El endpoint y las credenciales de un sistema SAP OData
real siguen siendo una dependencia externa para cerrar P2 sin simulador.

## Verificaciones

| Fecha      | Fase | Comando           | Resultado                                                               |
| ---------- | ---- | ----------------- | ----------------------------------------------------------------------- |
| 2026-07-30 | A    | Inspección manual | Carpeta vacía; especificación leída completa                            |
| 2026-07-30 | A    | SHA-256           | `ECDB1B2…C35E7`, 79.347 bytes                                           |
| 2026-07-30 | A    | Toolchain         | Node 24.14, pnpm 11.9, Docker 28.5, gh 2.89 autenticado                 |
| 2026-07-30 | B    | PostgreSQL/Prisma | PostgreSQL 18 healthy; migración inicial y seed de 250 materiales       |
| 2026-07-30 | B–C  | `pnpm verify`     | Correcto en 9 proyectos; formato, lint, tipos, 29 tests y builds        |
| 2026-07-30 | C    | Playwright        | Vertical slice completa en 4,1 s                                        |
| 2026-07-30 | C    | axe-core          | 0 violaciones WCAG A/AA en acceso demo                                  |
| 2026-07-30 | D    | Core Tools 4.12.1 | Function ESM empaquetada; `/api/v1/health` responde `healthy`           |
| 2026-07-30 | D    | `pnpm verify`     | Cierre P0 correcto en los 9 proyectos                                   |
| 2026-07-30 | E    | `pnpm verify`     | P1 local: OpenAPI 47 ops, 63 tests ejecutados, builds y smoke correctos |
| 2026-07-30 | E    | Playwright        | 4 E2E: vertical slice, axe, ES/EN y UAT/auditoría                       |
| 2026-07-30 | E    | Core Tools 4.12.1 | Smoke repetido tras ampliar API; `/health` responde `healthy`           |
| 2026-07-30 | E    | Azure discovery   | Owner, suscripción vacía, sin policies; `eastus2` + DB `northeurope`    |
| 2026-07-30 | E    | ARM validate      | Plantilla completa válida; 29 creates, 0 modifies, 0 deletes            |
| 2026-07-30 | E    | `azd package`     | Artefactos API y SPA generados desde límites monorepo limpios           |
| 2026-07-30 | E    | PostgreSQL        | Bootstrap de `RuntimeState` idempotente y con reintento probado         |
| 2026-07-30 | E    | Azure Retail API  | Estimación low-traffic USD 20–25/mes documentada                        |
| 2026-07-30 | E    | Azure Billing API | Free Trial: USD 200, pendientes USD 0, spending limit activado          |
| 2026-07-30 | F–G  | `pnpm verify`     | 51 operaciones, 99 tests correctos, 1 cloud omitido y Functions smoke   |
| 2026-07-30 | G    | Playwright        | 13/13: recorrido, a11y, i18n, UAT, reglas, 3D/fallback, tour y visuales |
| 2026-07-30 | G    | Coverage          | Dominio 88,81%; global 75,18% statements y 77,17% líneas                |
| 2026-07-30 | G    | Lighthouse        | 3/3: 1,00 en performance, accessibility, best practices y SEO           |
| 2026-07-30 | G    | Security          | Secret/licencia check correcto; `pnpm audit --prod` sin CVE             |
| 2026-07-30 | G    | Demo reset        | Seed demo determinista: 40 materiales y 8 solicitudes                   |

## Próximos pasos

1. Completar el login interactivo de AZD y ejecutar `azd provision --preview --no-prompt`.
2. Cerrar `azure-validate`, desplegar P1 y verificar cada integración real en Azure.
3. Publicar en GitHub, verificar un clon limpio y desplegar la SPA demo en Vercel.
4. Obtener un endpoint SAP OData y secretos mediante un canal seguro para la prueba real.
5. Registrar URLs, smokes públicos, costes observados y cierre final.
