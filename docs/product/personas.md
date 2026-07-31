# Personas y roles

| Persona                   | Objetivo principal                                      | Rol técnico        |
| ------------------------- | ------------------------------------------------------- | ------------------ |
| Solicitante               | Crear o actualizar un material con un proceso guiado    | `requester`        |
| Data Steward              | Revisar calidad, sugerencias, reglas y duplicados       | `reviewer`         |
| Especialista SAP          | Validar payloads y resolver sincronizaciones            | `sap_specialist`   |
| Responsable de negocio    | Analizar KPIs, calidad y cuellos de botella             | `business_analyst` |
| Tester UAT                | Ejecutar escenarios, adjuntar evidencia y firmar        | `uat_tester`       |
| Administrador             | Gestionar permisos, reglas e integraciones              | `admin`            |
| Recruiter o entrevistador | Evaluar producto, código y decisiones sin configuración | modo demo          |

## Principios de autorización

- El backend comprueba los permisos; ocultar un botón no autoriza una acción.
- Un solicitante edita sus borradores, pero no aprueba.
- Un reviewer decide sugerencias y duplicados.
- Un especialista SAP sincroniza y reintenta.
- UAT y administración tienen capacidades separadas.
- El selector de rol solo existe en modo demo y aparece identificado visualmente.

La matriz ejecutable se encuentra en
[`packages/domain/src/permissions.ts`](../../packages/domain/src/permissions.ts) y sus pruebas
evitan divergencias entre producto y código.
