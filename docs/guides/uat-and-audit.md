# UAT y auditoría en modo demo

## UAT ejecutable

El seed incluye una release `0.1.0`, un plan, 15 escenarios, pasos, seis ejecuciones, una
evidencia de metadata y una incidencia abierta. Los roles `uat_tester` y `admin` pueden:

- iniciar una ejecución;
- registrar `PASSED`, `FAILED`, `BLOCKED` o devolverla a `NOT_RUN`;
- guardar resultados por paso y comentarios;
- crear una incidencia al registrar un fallo;
- adjuntar metadata de evidencia sintética;
- firmar como `APPROVED`, `REJECTED` o `BLOCKED`.

La vista `/app/uat` consume la misma interfaz en modo embebido y HTTP. Una evidencia con
`storageMode: demo-metadata` no afirma que exista un blob ni conserva contenido binario. El
adaptador Blob para evidencias permanece no configurado.

Los endpoints están documentados en OpenAPI bajo el tag `UAT` y cubren releases, planes,
ejecuciones, evidencia y sign-off.

## Auditoría

Cada mutación UAT crea un evento append-only con actor, rol, organización, acción, entidad,
timestamp UTC, correlation ID, source y outcome. El contrato reserva además `before`,
`after`, `metadata`, `ipHash` y `userAgent`; la demo usa valores nulos o metadata sintética.

La auditoría se consulta, lee por ID y exporta como CSV:

```text
GET /api/v1/audit-events
GET /api/v1/audit-events/{id}
GET /api/v1/audit-events/export
```

La exportación también queda auditada. El CSV contiene identificadores, resumen y metadata
operativa, pero no tokens, secretos, documentos completos ni binarios. En la SPA, el botón
**Exportar** crea una descarga local y actualiza la lista para mostrar el evento de
exportación.

## Prueba rápida

1. Entra en la demo y cambia a **Tester UAT**.
2. Abre **UAT**, añade un comentario y pulsa **Ejecutar**.
3. Añade **Evidencia** y pulsa **Firmar**.
4. Abre **Auditoría**, busca `uat.` y exporta el CSV.
5. Ejecuta `pnpm test:integration` para validar el mismo flujo por HTTP.
