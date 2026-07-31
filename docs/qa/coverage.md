# Cobertura

La especificación fija 80% para dominio/aplicación y 75% global como objetivo orientativo. El
paquete de dominio aplica umbrales automáticos:

- statements: 80%;
- branches: 70%;
- functions: 80%;
- lines: 80%.

Última medición local antes del cierre final:

| Paquete       | Líneas |
| ------------- | -----: |
| Dominio       | 88,81% |
| API           | 69,13% |
| Web           | 81,06% |
| SAP Simulator | 76,66% |

El agregado ponderado de estos paquetes es 75,18% de statements y 77,17% de líneas. La menor
cifra de API refleja composición e integraciones SDK; los caminos críticos de permisos,
workflow, validación, errores y adapters sí están cubiertos. El reporte reproducible se genera
con `pnpm test:coverage`; `coverage/` no se versiona.
