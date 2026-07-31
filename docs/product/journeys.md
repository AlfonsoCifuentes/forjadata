# Viajes principales

## Crear y procesar una solicitud

El solicitante crea un borrador, aporta una descripción y un documento sintético, envía el
trabajo y observa el pipeline. El backend conserva evidencia, ejecuta extracción, clasificación,
normalización, reglas y búsqueda de duplicados. La solicitud termina en `NEEDS_REVIEW`.

## Revisar y aprobar

El Data Steward abre la cola, compara valor original, sugerencia, confianza y evidencia,
resuelve campos y duplicados y decide la transición. Cada mutación lleva versión, actor,
correlation ID y evento de auditoría.

## Sincronizar con SAP

Una solicitud aprobada genera un payload validado. El puerto SAP usa el simulador local o el
adaptador OData v2/v4 según configuración. Registra request, respuesta, duración e idempotency
key; los fallos recuperables se reintentan y el agotamiento termina en dead-letter lógico.

## Ejecutar UAT

El tester selecciona release, plan y escenario, registra resultados y evidencia binaria y firma
el resultado. La cobertura y los bloqueos quedan visibles en la aplicación.

## Evaluar la demo

El evaluador entra con un clic, sigue o salta el tour, recorre dashboard, solicitud, sugerencias,
duplicado, workflow, SAP Simulator, auditoría y arquitectura. El guion reproducible está en
[`docs/portfolio/demo-script.md`](../portfolio/demo-script.md).
