# Reglas de calidad avanzadas

Forjadata incluye un constructor visual P2 para que un administrador configure reglas
deterministas sin introducir ni ejecutar código arbitrario. La ruta canónica es
`/app/admin/rules`; `/app/admin/quality-rules` se conserva como alias compatible.

## Modelo y permisos

`QualityRule` conserva organización, categoría opcional, código estable, severidad,
expresión, mensaje, estado, versión y fechas. Cada ejecución produce un `QualityResult` con
el material, la regla, el resultado, el detalle observado y la fecha de evaluación. Los
modelos normalizados y su migración están en `prisma/schema.prisma` y
`prisma/migrations/20260731010000_quality_rules`.

Solo el rol `admin` con permiso `admin:manage` puede listar, crear, editar o probar reglas.
La API vuelve a comprobar el permiso; ocultar la pantalla en el frontend no se usa como
control de autorización.

## Expresiones soportadas

Una expresión combina de 1 a 20 condiciones mediante `ALL` o `ANY`. Los campos admitidos se
limitan a propiedades conocidas del material y a `attributes.CODIGO`. Los operadores son:

- `required`, `equals`, `notEquals` y `contains`;
- `gte`, `lte` y `between` para comparaciones numéricas;
- `matches` para patrones con longitud y construcciones limitadas.

El evaluador de `packages/domain/src/quality-rules.ts` interpreta el AST validado por Zod. No
usa `eval`, `Function`, plantillas ejecutables ni acceso dinámico a propiedades arbitrarias.
Las reglas inactivas y las reglas de otra categoría se devuelven como omitidas.

## Versionado y auditoría

Cada actualización exige `expectedVersion`. Si otra edición ya incrementó la versión, la API
devuelve conflicto y obliga a recargar. Crear, editar y probar registra eventos append-only:
`quality_rule.create`, `quality_rule.update` y `quality_rule.test`.

Endpoints:

- `GET /api/v1/admin/quality-rules`
- `POST /api/v1/admin/quality-rules`
- `PATCH /api/v1/admin/quality-rules/{id}`
- `POST /api/v1/admin/quality-rules/{id}/test`

## Verificación

```bash
pnpm --filter @forjadata/domain test:run
pnpm --filter @forjadata/api test:run
pnpm test:e2e
```

Las pruebas cubren operadores, `ALL`/`ANY`, categorías, estado, protección de patrones,
permisos, conflicto de versión, contrato HTTP y el recorrido visual guardar-v2-probar-PASS.
