# Regresión visual

La suite Playwright conserva seis baselines en
`apps/web/e2e/__screenshots__`: dashboard claro y oscuro, catálogo AG Grid, detalle de
material, formulario de solicitud y comparador de duplicados.

## Ejecutar

```bash
pnpm exec playwright install chromium
pnpm test:visual
```

Para actualizar intencionadamente una referencia:

```bash
pnpm --filter @forjadata/web exec playwright test e2e/visual-regression.spec.ts --update-snapshots
```

Cada cambio debe revisarse visualmente antes de aceptar los PNG. La fecha, el tema y los datos
demo son deterministas; se desactivan animaciones y el umbral máximo es 2 % de píxeles. El
canvas WebGL se enmascara porque la rasterización depende de GPU y controlador. La existencia
del visor, su carga GLTF y el fallback 2D accesible se prueban funcionalmente en el E2E, por lo
que el enmascarado no oculta una regresión de comportamiento.

CI instala Chromium, ejecuta todo el recorrido E2E y conserva el informe de Playwright durante
siete días cuando falla.
