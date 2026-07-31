# ADR-015 — Extensiones P2 aisladas y seguras

## Estado

Aceptado.

## Contexto

P2 añade procesamiento real de documentos y lenguaje, SAP OData, visualización 3D, reglas
configurables, regresión visual y email. Estas capacidades tienen perfiles de riesgo distintos:
coste cloud variable, credenciales externas, ejecución de expresiones administrables,
dependencia de WebGL y diferencias de renderizado entre equipos.

## Decisión

1. Document Intelligence, Azure OpenAI, SAP y email continúan detrás de puertos con modos
   `disabled`, `mock`/`log`, `simulator` y real explícitos.
2. Ningún modo real se marca sano hasta una operación real satisfactoria.
3. El constructor de reglas persiste un AST Zod versionado y lo interpreta con una lista
   cerrada de campos y operadores; nunca ejecuta texto como código.
4. Three.js y el GLTF se cargan solo al abrir una ficha compatible. WebGL puede fallar sin
   impedir consultar los atributos gracias al fallback 2D.
5. Playwright compara superficies deterministas y enmascara únicamente el canvas dependiente
   de GPU; el comportamiento 3D/fallback se verifica por separado.
6. El email real permanece deshabilitado en infraestructura hasta disponer de remitente,
   destinatario y permiso administrado deliberados. El canal in-app no depende de él.

## Consecuencias

- La demo pública es completa, restablecible y no requiere secretos.
- Las integraciones reales se pueden activar sin cambiar los casos de uso.
- Existe algo más de código de composición y pruebas de contrato, a cambio de límites de fallo
  claros y afirmaciones verificables.
- La prueba gratuita puede agotarse o expirar; el proyecto nunca retira el spending limit ni
  migra automáticamente a pago por uso.
