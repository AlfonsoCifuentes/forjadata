# Integraciones Azure

Forjadata selecciona cada proveedor mediante configuración validada. El modo local puede usar
adaptadores explícitos de demo; el entorno Azure usa servicios reales para identidad,
persistencia, documentos, colas, análisis y telemetría.

## Flujo cloud

1. La SPA obtiene un token Entra por PKCE.
2. La Function HTTP valida el JWT y guarda la solicitud en PostgreSQL.
3. Los bytes del documento se escriben en Blob con SHA-256.
4. La API publica un mensaje versionado en Service Bus.
5. El trigger lee Blob, ejecuta Document Intelligence y `gpt-5-mini`.
6. El worker valida el JSON estructurado y persiste el resultado de forma idempotente.
7. Application Insights conserva trazas correlacionadas y muestreadas.

## Identidad administrada

La Function utiliza una User Assigned Managed Identity. Bicep define:

- `AzureWebJobsStorage__blobServiceUri`, `__credential=managedidentity` y `__clientId`;
- `ServiceBusConnection__fullyQualifiedNamespace`, `__credential=managedidentity` y
  `__clientId`;
- `AZURE_CLIENT_ID` para los SDK de Blob, Service Bus, Document Intelligence y Azure OpenAI.

Storage y Service Bus tienen autenticación local deshabilitada. Document Intelligence y Azure
OpenAI no admiten API keys en el despliegue. PostgreSQL usa un secreto generado durante
provisioning y referenciado desde Key Vault.

## Modos

| Integración | Local                     | Azure                           |
| ----------- | ------------------------- | ------------------------------- |
| Auth        | `demo` o Entra            | Entra                           |
| Estado      | memoria/PostgreSQL Docker | PostgreSQL B1ms                 |
| Objetos     | memoria/Azurite           | Blob                            |
| Cola        | inline                    | Service Bus                     |
| Documentos  | mock determinista         | Document Intelligence           |
| Material    | reglas deterministas      | Azure OpenAI                    |
| SAP         | simulador visible         | deshabilitado sin endpoint real |
| Telemetría  | logs/métricas locales     | OpenTelemetry + App Insights    |

`SAP_MODE=disabled` es deliberado: devuelve salud `unconfigured` y HTTP 503 al sincronizar. Los
adaptadores OData V2/V4 están implementados y probados, pero solo se activarán con un sistema
SAP autorizado.

## Límites de consumo

- documento: 10 MB;
- evidencia UAT: 5 MB;
- entrada IA: 30.000 caracteres;
- salida IA: 1.500 tokens;
- deployment Azure OpenAI: 1K TPM;
- Functions: máximo 3 instancias;
- Log Analytics: 0,1 GB/día.

Los fallos de Azure AI dejan el trabajo trazable; no se etiquetan como una extracción real
cuando se usa el fallback de reglas. Los mensajes incluyen `schemaVersion`, UUID,
`correlationId` y timestamp, y los workers son idempotentes.

## Salud

`GET /api/v1/integrations` comprueba Blob, Service Bus, Entra y, cuando están activos,
Document Intelligence, Azure OpenAI y SAP. `GET /api/v1/health` sirve para liveness;
Application Insights recibe dependencias, errores y correlation IDs sin documentos, tokens ni
secretos.
