# Guía de entrevista técnica

## 1. ¿Por qué Composition API?

Permite agrupar comportamiento por capacidad y extraer composables tipados sin mezclarlo por
opciones (`data`, `methods`, `computed`). Encaja con TypeScript y mantiene juntas dependencias,
estado derivado y efectos.

## 2. ¿Qué estado colocaste en Pinia?

Solo sesión/rol, preferencias persistentes y coordinación transversal como el tour. Formularios
y estado efímero viven en la vista; los datos remotos se obtienen tras el cliente API.

## 3. ¿Cómo evitas stores gigantes?

Stores por responsabilidad, acciones pequeñas y estado derivado en getters/composables. Los
casos de uso de negocio permanecen en dominio/backend, no se duplican en Pinia.

## 4. ¿Cómo manejas formularios dinámicos?

Un esquema de categoría describe campos, tipo, obligatoriedad y opciones. La UI renderiza el
control correspondiente y los contratos Zod vuelven a validar en backend. Las reglas avanzadas
usan un AST cerrado, no código evaluado.

## 5. ¿Cómo tipas props y emits?

`defineProps<T>()` y `defineEmits<T>()` en `script setup`, tipos de contratos compartidos y
uniones discriminadas para eventos/estados. No se usa `any` para atravesar límites.

## 6. ¿Cómo gestionas 50.000 filas?

AG Grid Community virtualiza DOM y soporta ordenación/filtros. En producción, paginación,
ordenación y filtros pasarían al servidor con índices PostgreSQL; la demo usa 250 filas para
ser determinista y rápida.

## 7. ¿Cómo manejas errores REST?

Un envelope normalizado incluye código estable, mensaje seguro, detalles validables y
correlation ID. El cliente distingue auth, permiso, validación, conflicto, not found y fallo
temporal para mostrar acciones distintas.

## 8. ¿Cómo proteges rutas?

Vue Router aplica guards para experiencia y navegación, pero cada endpoint sensible vuelve a
validar token y RBAC. La seguridad no depende de ocultar botones.

## 9. ¿Cómo funciona PKCE?

La SPA crea un verifier aleatorio y envía su challenge al authorization endpoint. En el canje,
presenta el verifier; un código interceptado sin él no sirve. MSAL gestiona OAuth 2.0/OIDC,
nonce, state y caché sin client secret en el navegador.

## 10. ¿Cómo validas tokens?

La API comprueba firma con JWKS, issuer, audience, expiración y scope. Después mapea claims a
roles propios y aplica permisos al recurso. Las claves se cachean y rotan según el proveedor.

## 11. ¿Cómo pruebas stores?

Se crea una Pinia aislada por prueba, se inicializa estado explícito, se ejecutan acciones y se
comprueban estado derivado y persistencia. Los adapters externos se sustituyen por dobles
controlados.

## 12. ¿Cómo pruebas componentes?

Vue Test Utils verifica render, interacción y eventos; MSW prueba el cliente en el límite HTTP.
Playwright reserva recorridos reales, teclado, traducción y regresión visual.

## 13. ¿Cómo simulas SAP?

Un servicio Fastify implementa el contrato esperado, genera identificadores deterministas y
permite provocar éxito, rechazo o timeout. La UI siempre lo identifica como SAP Simulator.

## 14. ¿Cómo sustituirías el simulador?

Configuro `SAP_MODE=odata`, endpoint y secreto seguro. El contenedor de dependencias elige el
adaptador OData v2/v4; casos de uso, mapping y pruebas de contrato permanecen iguales.

## 15. ¿Cómo haces idempotente un sync?

La operación deriva/conserva una idempotency key por solicitud y versión. Reintentos reutilizan
la clave, el repositorio registra el resultado y una respuesta ya completada se devuelve sin
crear otro material.

## 16. ¿Cómo manejas retries?

Solo se reintentan fallos transitorios con backoff y máximo acotado. Validación y permisos no se
reintentan. Cada intento es observable y el agotamiento termina en dead-letter lógico.

## 17. ¿Cómo trazas un procesamiento?

El correlation ID nace o se acepta en HTTP, viaja por mensajes y adapters y aparece en logs,
auditoría, trabajos y UI. Application Insights/OpenTelemetry correlaciona spans y métricas sin
registrar secretos.

## 18. ¿Cómo evitas secretos?

`.env` y estado de herramientas están ignorados; el repositorio contiene solo ejemplos vacíos.
Azure usa managed identity y RBAC. CI ejecuta detección de patrones, audit y CodeQL. Los valores
reales se configuran en el proveedor y nunca se imprimen.

## 19. ¿Cómo calculas confianza?

Combino señales acotadas —calidad de extracción, coincidencia de evidencia, validez de formato
y consistencia de reglas— en 0–1. Se conserva el desglose y el umbral no convierte la
estimación en aprobación.

## 20. ¿Cómo reduces alucinaciones?

Entrada limitada, prompts versionados, JSON Schema estricto, validación Zod, evidencia
obligatoria, reglas deterministas, catálogo controlado y revisión humana. Una salida inválida
falla cerrada.

## 21. ¿Cómo haces UAT?

Release → plan → escenarios → pasos → ejecución → evidencia → sign-off. Los estados y la
cobertura se calculan, el binario se conserva detrás de un puerto y una firma incompleta se
rechaza.

## 22. ¿Qué cambiarías en producción?

Red privada, WAF/políticas, backups y restauración ensayada, pruebas de carga, SLO/alertas,
retención formal, rotación de secretos externos y evaluación continua de modelos. También
revisaría si el volumen justifica streaming o separar módulos.

## 23. ¿Qué has priorizado y por qué?

Primero un recorrido vertical demostrable; después P0, P1 y P2. Priorizo contratos, permisos,
trazabilidad y modo demo antes de integraciones costosas porque reducen riesgo y permiten
verificar valor sin credenciales ni deuda operativa.
