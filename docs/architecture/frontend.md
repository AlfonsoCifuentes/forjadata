# Arquitectura frontend

La SPA usa Vue 3, Composition API, TypeScript estricto, Vite, Vue Router y Pinia. Las rutas
funcionales se cargan de forma diferida y los proveedores pesados —AG Grid, ECharts y
Three.js— quedan fuera del bundle inicial.

## Capas

1. `views`: composición por ruta y estados de pantalla.
2. `components`: sistema visual, feedback, tablas, gráficos y visor industrial.
3. `stores`: sesión, preferencias, tour y estado compartido de duración controlada.
4. `services`: contrato REST, cliente HTTP y motor demo intercambiable.
5. `router`: lazy loading, metadatos y guards de autenticación/permisos.
6. `i18n`: catálogos ES/EN con comprobación de paridad.

El estado derivable o local permanece en componentes/composables. Pinia conserva únicamente
sesión, preferencias y coordinación transversal, evitando stores monolíticos.

## Modos y resiliencia

`VITE_API_MODE=auto` intenta la API configurada y mantiene una experiencia demo explícita
cuando no existe. `http` obliga a usar el backend. Carga, vacío, error, éxito y permiso denegado
se representan como estados visibles. El tour se puede cerrar, saltar y reiniciar y persiste la
preferencia local.

## Calidad

Vitest cubre stores, componentes y cliente REST con MSW. Playwright cubre el recorrido,
accesibilidad, idiomas, UAT, reglas, 3D/fallback y regresión visual. Lighthouse aplica un
umbral de 0,90 en cuatro categorías.
