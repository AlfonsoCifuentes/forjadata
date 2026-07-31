# ADR-012: Bicep para infraestructura Azure

- Estado: Aceptada
- Fecha: 2026-07-30

Bicep expresa los recursos Azure objetivo, parámetros por entorno, identidades y salidas. La
composición parte de las plantillas oficiales TypeScript + AZD + Bicep de Azure Functions para
HTTP y Service Bus. Se conservan Flex Consumption, User Assigned Managed Identity, RBAC,
almacenamiento de deployment sin shared keys y los tres ajustes de identidad de cada binding.

Los servicios se encapsulan en módulos y se prefieren Azure Verified Modules con versión
fijada. `main.parameters.json` es el archivo ARM que consume AZD; los `.bicepparam` son ejemplos
para Bicep CLI y nunca contienen secretos. `pnpm infra:validate` compila el grafo y comprueba
guardas de identidad y coste.

Terraform no se añade porque el alcance es exclusivamente Azure y Bicep reduce dependencias y
distancia con la plataforma.
