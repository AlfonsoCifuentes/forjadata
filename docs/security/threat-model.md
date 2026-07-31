# Modelo de amenazas STRIDE

## Activos y límites de confianza

Activos: identidad, roles, materiales, documentos, sugerencias, auditoría, payloads SAP y
configuración. Los límites principales separan navegador, API, persistencia, proveedores Azure
y endpoint SAP.

| Categoría              | Amenaza                                             | Mitigación principal                                                         |
| ---------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------- |
| Spoofing               | Usuario o proveedor falso                           | PKCE/JWT en modo Entra, sesión demo limitada y validación de issuer/audience |
| Tampering              | Modificación de material o transición               | Zod, RBAC backend, versión optimista, idempotencia y auditoría               |
| Repudiation            | Negar aprobación o sincronización                   | Evento UTC con actor, razón, outcome y correlation ID                        |
| Information disclosure | Filtrar documentos, tokens o payloads               | Datos sintéticos, redacción de logs, secretos backend y mínimo privilegio    |
| Denial of service      | Archivos, polling o dependencias saturan el sistema | Límites, timeouts, backoff, cuotas, circuit breaker y cancelación            |
| Elevation of privilege | Ocultar UI sin autorizar servidor                   | Permisos de dominio compartidos y denegación por defecto en API              |

Las expresiones de reglas P2 se validan como un AST cerrado y nunca se ejecutan con `eval`. Los
patrones tienen límites defensivos. El HTML de email escapa asunto, texto y enlace; no se
registra el destinatario. WebGL y el modelo GLTF son contenido propio sin entrada de usuario.

## Riesgos residuales del modo demo

El adaptador embebido almacena estado sintético en el navegador. No es una frontera de seguridad
y nunca debe usarse para datos reales. Los proveedores reales permanecen desactivados hasta que
su configuración completa y health check sean válidos.
