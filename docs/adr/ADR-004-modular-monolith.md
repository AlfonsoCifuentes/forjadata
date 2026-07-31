# ADR-004: Monolito modular

- Estado: Aceptada
- Fecha: 2026-07-30

Dominio, aplicación e infraestructura conservan límites por módulo, pero se despliegan como una
API y workers coordinados. Esto permite transacciones y operación sencilla. Si una carga futura
lo justifica, los puertos de procesamiento y sincronización permiten extraer workers.
