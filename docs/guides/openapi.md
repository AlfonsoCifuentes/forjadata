# OpenAPI 3.1

Forjadata genera su contrato HTTP desde los esquemas Zod de `@forjadata/contracts` y el
inventario explícito de operaciones de la API. El artefacto versionado es
`docs/api/openapi.json`.

## Comandos

```bash
pnpm openapi:generate
pnpm openapi:validate
```

`openapi:validate` falla si:

- una de las 46 operaciones públicas no existe en el documento;
- falta un `operationId`, está duplicado o no coincide con el inventario;
- una ruta parametrizada no declara su parámetro;
- una operación no declara respuestas;
- un `$ref` local no puede resolverse;
- el JSON generado no coincide con el artefacto versionado.

Los errores siguen Problem Details (`application/problem+json`) y todas las respuestas
exponen `x-correlation-id`. El esquema `demoRole` describe el selector sintético
`x-demo-role`; no debe interpretarse como autenticación de producción.

## Uso local

Con la API iniciada, el contrato también está disponible en:

```text
GET http://localhost:7071/api/v1/openapi.json
```

Las modificaciones de rutas deben actualizar a la vez el router, el inventario OpenAPI, las
pruebas de integración y el documento generado.
