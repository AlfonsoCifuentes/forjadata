# ADR-003: API REST versionada

- Estado: Aceptada
- Fecha: 2026-07-30

La integración usa JSON sobre `/api/v1`, contratos Zod, Problem Details, paginación y correlation
ID. REST ofrece un contrato visible y compatible con Azure Functions y SAP; no se introduce
GraphQL porque el dominio no necesita selección arbitraria ni un runtime adicional.
