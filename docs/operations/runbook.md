# Runbook

## La API no responde

1. Consultar `/api/v1/health` y guardar el correlation ID.
2. Verificar configuración con nombres, nunca valores secretos.
3. Revisar Functions y Application Insights por correlation ID.
4. Si el fallo es de proveedor, cambiar solo a un modo simulado explícito en desarrollo.

## Trabajo atascado

1. Abrir el detalle de solicitud y comprobar intento/estado.
2. Buscar el mismo correlation ID en logs.
3. Clasificar timeout, validación, autenticación o dependencia.
4. Reintentar solo errores recuperables; la idempotency key debe mantenerse.
5. Tras el máximo, inspeccionar dead-letter lógico y resolver la causa antes de reponer.

## Fallo SAP

Validar mapping y payload redactado, código HTTP/OData y credenciales. No editar el payload
persistido. Corregir datos o configuración y usar la acción de reintento.

## Protección de costes

Comprobar crédito y recursos semanalmente durante la demo. Detener PostgreSQL fuera de uso y
deshabilitar IA real si no se demuestra. No crear entornos adicionales. Si el crédito se acerca
al límite, eliminar el grupo de recursos de desarrollo después de exportar solo evidencias no
sensibles.

## Recuperación demo

Usar `pnpm demo:reset`. Si el backend local no arranca, ejecutar `pnpm verify`, comprobar puertos
5173/7071/7072 y consultar la guía de instalación.
