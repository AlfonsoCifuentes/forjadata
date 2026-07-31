# Arquitectura backend

La API es un monolito modular TypeScript ejecutado mediante Azure Functions Node v4. El mismo
núcleo se expone localmente para desarrollo y se empaqueta para el host real de Functions.

## Flujo

`HTTP/trigger → validación → autorización → caso de uso → puerto → adaptador → evento/auditoría`

- Los contratos Zod compartidos definen entrada, salida y errores.
- El dominio contiene estados, permisos, reglas e invariantes sin depender de Azure.
- Los puertos aíslan persistencia, blobs, cola, IA, SAP, email y telemetría.
- Los adaptadores seleccionados por configuración son memoria/local, simulador o Azure.
- Prisma/PostgreSQL es la persistencia objetivo; el motor demo es determinista.

## API y trabajos

La API versionada devuelve errores normalizados con correlation ID. Las mutaciones sensibles
aplican RBAC y control de versión optimista. Los mensajes de procesamiento y SAP incluyen
identificador, intento, correlation ID e idempotency key. Retry, timeout y dead-letter lógico
son observables desde la UI.

OpenAPI 3.1 se genera desde las rutas y se valida en `pnpm verify`. Azure Functions Core Tools
arranca el artefacto empaquetado y consulta `/api/v1/health` como parte de la verificación.
