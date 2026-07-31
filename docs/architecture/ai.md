# Arquitectura de inteligencia artificial

La IA es opcional y está detrás de puertos. El recorrido demo usa un pipeline determinista; el
modo Azure compone Document Intelligence y Azure OpenAI.

## Proceso

1. Validar tipo, tamaño y contenido del documento.
2. Extraer texto/estructura con mock o Document Intelligence.
3. Limitar y normalizar la entrada.
4. Solicitar una salida con JSON Schema estricto.
5. Validar la respuesta con Zod.
6. Calcular confianza por campo y adjuntar evidencia.
7. Aplicar reglas deterministas y búsqueda de duplicados.
8. Exigir revisión humana antes de aprobar.

Timeouts, retry, límites de caracteres/tokens y errores normalizados reducen fallos y coste. Los
prompts están versionados y las respuestas no válidas nunca atraviesan el contrato. El health
indica `mock`, `disabled`, `configured` o `healthy`; configurar una variable no equivale a
probar una integración.
