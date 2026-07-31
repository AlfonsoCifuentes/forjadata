# Observabilidad local y demo

El modo local ofrece evidencia operativa sin depender de servicios cloud:

- logs JSON mediante Pino;
- `x-correlation-id` aceptado desde el cliente o generado en API;
- propagación del identificador en envelopes, Problem Details y headers;
- métricas agregadas de volumen, errores y latencia en `GET /api/v1/metrics`;
- redacción recursiva de claves sensibles cubierta por tests;
- ausencia deliberada de cuerpos de documentos, tokens y secretos en métricas.

## Semántica de `/metrics`

Las métricas viven en el proceso y se reinician con el dataset demo o al reiniciar la API.
No son un almacén de series temporales. Cada fila agrupa método, ruta y código HTTP:

```json
{
  "method": "GET",
  "path": "/health",
  "status": 200,
  "count": 2,
  "averageDurationMs": 4.5,
  "maxDurationMs": 7
}
```

El endpoint devuelve también `totalRequests`, `errorRequests` y `errorRate`. La propia
lectura de `/metrics` se contabiliza después de construir la respuesta, por lo que aparecerá
en la siguiente lectura.

## Privacidad

`redactTelemetryAttributes` sustituye por `[REDACTED]` claves como authorization, cookie,
password, token, client secret, API key y connection string, incluso anidadas. Esta defensa
no autoriza a enviar información sensible a logs: los callers deben registrar IDs,
duraciones, estados y resultados, nunca documentos completos.

## Application Insights

En local, Application Insights permanece desconectado salvo que se configure una connection
string explícita. En Azure, Bicep crea un workspace con 30 días de retención y un límite de
0,1 GB/día, Application Insights con autenticación Entra y el role Monitoring Metrics
Publisher para la identidad de la Function.

`@azure/monitor-opentelemetry` se inicializa antes de registrar las funciones, con ratio de
muestreo `0.1` y dos trazas por segundo. La ausencia de connection string deja el bootstrap en
no-op y mantiene la instalación local sin cloud.
