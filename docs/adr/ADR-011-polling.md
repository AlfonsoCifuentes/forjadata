# ADR-011: Polling para progreso

- Estado: Aceptada
- Fecha: 2026-07-30

El estado de procesamiento se consulta inicialmente con polling abortable y backoff de 2 a 10
segundos. Es suficiente para el volumen demo y simplifica infraestructura. WebSockets o SSE se
reevaluarán si la latencia o escala justifican una conexión persistente.
