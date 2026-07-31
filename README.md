# Forjadata

**Convierte información bruta en datos maestros fiables.**

Forjadata es una SPA empresarial para recibir documentos y solicitudes, extraer y
normalizar atributos, detectar duplicados, validar decisiones humanas y sincronizar
materiales con sistemas corporativos mediante adaptadores auditables.

> Todos los datos incluidos son sintéticos. La demo pública utiliza proveedores
> deterministas etiquetados como `demo`, `mock` o `simulator`; no representa conexiones
> reales con Microsoft, Azure o SAP.

![Dashboard de Forjadata con datos sintéticos](./apps/web/e2e/__screenshots__/dashboard.png)

## Inicio rápido

Requisitos: Node.js 24 LTS, Corepack/pnpm 11 y Git. Docker es opcional para PostgreSQL y
Azurite; el recorrido demo funciona con persistencia en memoria.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm demo:reset
pnpm dev
```

Abre `http://localhost:5173`, pulsa **Abrir demo** y usa el rol Data Steward. La API local
escucha en `http://localhost:7071` y SAP Simulator en `http://localhost:7072`.

## Scripts

- `pnpm dev`: web, API y SAP Simulator.
- `pnpm verify`: formato, lint, typecheck, tests y build.
- `pnpm demo:reset`: recrea el dataset sintético determinista.
- `pnpm db:up`: inicia PostgreSQL y Azurite opcionales.
- `pnpm test:e2e`: recorrido principal con Playwright.
- `pnpm test:visual`: seis comparaciones visuales deterministas.
- `pnpm test:coverage`: cobertura por paquete y umbrales de dominio.
- `pnpm test:performance`: tres auditorías Lighthouse y umbral 0,90.
- `pnpm security:check`: secretos, licencia y vulnerabilidades de producción.
- `pnpm infra:validate`: valida la estructura Bicep sin desplegar recursos.

## Modos

| Integración    | Modo local predeterminado | Adaptador real                             |
| -------------- | ------------------------- | ------------------------------------------ |
| Autenticación  | `demo`                    | Microsoft Entra mediante MSAL/JWT          |
| IA             | `mock` determinista       | Azure Document Intelligence y Azure OpenAI |
| SAP            | `simulator`               | OData v2/v4                                |
| Cola           | `inline`                  | Azure Service Bus                          |
| Almacenamiento | `local`                   | Azure Blob Storage                         |
| Persistencia   | `memory`                  | PostgreSQL mediante Prisma                 |
| Email          | `log` explícito           | Azure Communication Services               |
| Reglas         | AST determinista          | Mismo motor validado en API/Functions      |
| Modelo 3D      | GLTF propio y lazy        | Three.js con fallback 2D                   |

Los adaptadores reales solo se activan con configuración explícita y credenciales fuera del
repositorio.

## Documentación

- [Estado de implementación](./IMPLEMENTATION_STATUS.md)
- [Arquitectura](./docs/architecture/overview.md)
- [Visión, personas y viajes](./docs/product/vision.md)
- [Estrategia de pruebas](./docs/qa/test-strategy.md)
- [Reglas de calidad](./docs/guides/quality-rules.md)
- [Email](./docs/guides/email-notifications.md)
- [Regresión visual](./docs/qa/visual-regression.md)
- [Caso de estudio](./docs/portfolio/case-study-es.md)
- [Guion de demo](./docs/portfolio/demo-script.md)
- [Guía de entrevista](./docs/portfolio/interview-guide.md)
- [Operación local](./docs/operations/local-setup.md)
- [Seguridad](./SECURITY.md)
- [Especificación de origen](./docs/product/master-spec-source.md)

Consulta `README.es.md` para la guía completa en español. La traducción inglesa se amplía en
paralelo a las funcionalidades.
