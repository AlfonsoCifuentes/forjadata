# ADR-001: Vue SPA con Vite

- Estado: Aceptada
- Fecha: 2026-07-30

## Contexto

El producto exige una aplicación empresarial Vue 3, sin SSR ni complejidad de framework full
stack.

## Decisión

Usar Vue 3 con Composition API, `<script setup lang="ts">`, Vue Router y Vite.

## Consecuencias

Las rutas se cargan de forma diferida y el despliegue necesita fallback a `index.html`. SEO se
limita a la landing estática y metadatos básicos.
