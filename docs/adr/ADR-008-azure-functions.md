# ADR-008: Azure Functions v4

- Estado: Aceptada
- Fecha: 2026-07-30

Los handlers HTTP y asíncronos se registran con el modelo Node.js v4 y TypeScript. Un host HTTP
local fino reutiliza la misma función de aplicación para que el recorrido no dependa de Core
Tools. El despliegue Azure requiere runtime 4.25+ y Node 24 de 64 bits.
