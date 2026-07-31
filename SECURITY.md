# Seguridad

Forjadata es un proyecto de demostración técnica con datos sintéticos. No envíes datos
personales, documentos confidenciales ni credenciales reales al entorno público.

## Reportar una vulnerabilidad

Abre un aviso privado mediante GitHub Security Advisories cuando el repositorio esté publicado.
No publiques secretos o detalles explotables en una incidencia pública.

## Controles

- secretos únicamente en variables de entorno o almacenes gestionados;
- validación Zod en límites de confianza;
- autorización frontend y backend;
- logs estructurados con redacción;
- adaptadores externos desactivados por defecto;
- dependencias y CI automatizados;
- datos demo deterministas y recuperables.

Consulta `docs/security/threat-model.md` para el modelo STRIDE.
