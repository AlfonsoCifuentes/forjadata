# ADR-007: Servicios externos mock-first

- Estado: Aceptada
- Fecha: 2026-07-30

La configuración predeterminada usa proveedores deterministas llamados `mock`, `demo` o
`simulator`. Ningún proveedor real se activa por la mera presencia parcial de variables. La UI
muestra el modo activo y la documentación enumera los pasos para conectar cada servicio.
