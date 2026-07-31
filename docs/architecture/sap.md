# Integración SAP

El núcleo depende de un `SapGateway`, no de un producto SAP concreto. Existen dos
implementaciones:

- `simulator`: Fastify local con respuestas deterministas y fallos controlables;
- `odata`: cliente HTTP real configurable para Product Master OData v2 o v4.

El mapping transforma el modelo canónico en payload SAP, valida campos obligatorios y no envía
si las reglas fallan. Cada intento conserva payload redactado, respuesta, duración,
correlation ID e idempotency key. Los reintentos usan backoff acotado y los intentos agotados
terminan en dead-letter lógico con acción visible.

Cambiar de simulador a real requiere `SAP_MODE=odata`, endpoint y credenciales entregadas por
un canal seguro. Las pruebas de contrato ejecutan las mismas expectativas contra el simulador
y el adaptador; no se afirma una conexión SAP real sin un smoke exitoso.
