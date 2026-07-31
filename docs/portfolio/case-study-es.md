# Forjadata — caso de estudio

## Contexto y problema

Crear un material empresarial suele mezclar documentos heterogéneos, formularios, criterio
humano y un sistema de destino estricto. El riesgo no es solo tardar: es crear duplicados,
perder el origen de un valor o sincronizar datos inválidos.

## Usuarios

El producto separa solicitante, Data Steward, especialista SAP, analista, tester UAT y
administrador. El flujo visible y los permisos cambian por rol, pero la autorización siempre se
repite en backend.

## Solución

Forjadata guía una solicitud desde un documento hasta un material aprobado. Extrae y normaliza
datos, propone atributos con confianza y evidencia, detecta duplicados, exige revisión humana,
aplica una máquina de estados y sincroniza un payload validado con SAP Simulator u OData.

## Decisiones

- Vue SPA con Composition API y rutas lazy para una experiencia empresarial rápida.
- Monolito modular en Azure Functions para mantener cohesión y coste operativo bajo.
- REST/OpenAPI y contratos Zod compartidos.
- Pinia solo para estado transversal; estado de servidor detrás del cliente API.
- AG Grid Community para volumen sin dependencia comercial.
- Puertos y adaptadores para que demo, local y Azure compartan casos de uso.
- Mocks deterministas con etiqueta visible; nunca se presentan como servicios reales.
- Polling inicial, suficiente para trabajos cortos y más simple de operar.

## Arquitectura

La SPA llama a una API v1. Los casos de uso dependen de puertos para PostgreSQL, Blob, Service
Bus, Document Intelligence, Azure OpenAI, SAP, email y telemetría. Bicep/AZD despliega identidad
administrada y RBAC. Vercel publica una demo autónoma y sin credenciales.

## Diseño y Vue

Un App Shell responsive, tema claro/oscuro, ES/EN y estados de carga/error hacen visible el
estado del sistema. Formularios y reglas se construyen desde esquemas tipados. El catálogo usa
renderers y filtros de AG Grid. ECharts y Three.js se cargan bajo demanda; el visor tiene
fallback 2D accesible.

## API, Azure, IA y SAP

Cada request tiene correlation ID y errores normalizados. Los trabajos son idempotentes,
acotados por timeout y reintentables. La salida de IA debe cumplir JSON Schema y Zod, conservar
evidencia y pasar por reglas y revisión humana. SAP usa el mismo contrato para simulador y
OData v2/v4.

## Calidad

Vitest, pruebas de contrato, MSW, Playwright, axe, snapshots visuales, Lighthouse, Core Tools,
OpenAPI, Bicep validation, auditoría de dependencias y CodeQL forman la cadena de verificación.
El dominio supera 80% de líneas y el recorrido principal automatizado tarda segundos.

## Resultados sintéticos

En un escenario sintético, el motor demo opera sobre 40 materiales y 8 solicitudes; el seed
PostgreSQL ampliado contiene 250 materiales. La demo completa creación, revisión, duplicado,
aprobación y SAP Simulator sin servicios externos. Estos datos demuestran comportamiento, no
ahorro ni impacto empresarial real.

## Seguridad y accesibilidad

RBAC backend, control optimista, redacción de logs, secretos fuera de Git, managed identity,
HTML escapado, límites de archivo y audit append-only reducen riesgo. La navegación por teclado,
foco, contraste y semántica se comprueban automáticamente.

## Limitaciones y aprendizajes

No existe endpoint SAP real ni se afirma haberlo probado. Email cloud queda deshabilitado. La
demo pública usa persistencia local por navegador. En producción ampliaría pruebas de carga,
backup/restore, red privada, políticas de retención, SLOs y evaluación de modelos con datos
representativos autorizados.

El aprendizaje principal es que IA y cloud aportan valor cuando están subordinados a contratos,
evidencia, permisos y operación observable.
