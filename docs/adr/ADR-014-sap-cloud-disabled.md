# ADR-014: SAP deshabilitado en cloud sin credenciales reales

- Estado: Aceptada
- Fecha: 2026-07-30

Forjadata dispone de adaptadores OData V2/V4, CSRF, ETag, autenticación, timeouts, errores
normalizados y pruebas de contrato. No existe, sin embargo, un sistema SAP ni credenciales
cedidas al proyecto.

El entorno Azure configura `SAP_MODE=disabled`. Salud devuelve `unconfigured` y los intentos
de sincronización reciben HTTP 503; no se ejecuta el simulador en cloud ni se presenta una
respuesta sintética como SAP real. El simulador se conserva únicamente para la demo local,
etiquetado de forma visible. Cuando exista un endpoint autorizado se configurará OData V2 o
V4 y los secretos se guardarán en Key Vault.
