# Estrategia de pruebas

La pirámide prioriza lógica rápida y reserva el navegador para recorridos y contratos visuales.

| Nivel                | Herramienta             | Responsabilidad                                         |
| -------------------- | ----------------------- | ------------------------------------------------------- |
| Dominio              | Vitest                  | estados, permisos, reglas, confianza, idempotencia      |
| Aplicación/API       | Vitest + inject         | auth, validación, errores, correlación, casos de uso    |
| Adaptadores          | pruebas de contrato     | Blob, cola, IA, SAP, email y persistencia               |
| Frontend             | Vitest + Vue Test Utils | stores, componentes y cliente HTTP con MSW              |
| Recorrido            | Playwright              | vertical slice, ES/EN, UAT, a11y, reglas, 3D y permisos |
| Visual               | Playwright snapshots    | seis baselines deterministas claro/oscuro               |
| Host                 | Functions Core Tools    | arranque del paquete Azure y smoke de health            |
| Rendimiento          | Lighthouse CI           | performance, accessibility, best practices y SEO        |
| Seguridad/suministro | script, audit, CodeQL   | secretos, licencia Enterprise, CVE y análisis estático  |

## Política

- Toda corrección funcional incluye una prueba en el nivel más barato que reproduzca el riesgo.
- Workflow, autorización e idempotencia se prueban en dominio y API.
- Los simuladores obedecen el mismo contrato que los adaptadores reales.
- Un E2E no sustituye una aserción de dominio.
- No se actualizan snapshots visuales sin revisar el cambio.
- `pnpm verify` es obligatorio antes de cerrar una fase.
