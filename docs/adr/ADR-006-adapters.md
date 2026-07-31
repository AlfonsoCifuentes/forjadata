# ADR-006: Puertos y adaptadores

- Estado: Aceptada
- Fecha: 2026-07-30

Auth, documentos, IA, colas, persistencia, telemetría y SAP se consumen mediante interfaces del
dominio. La selección se hace por configuración validada al arranque. El coste es código de
composición adicional; el beneficio es sustituibilidad y pruebas de contrato honestas.
