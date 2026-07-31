<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import FjButton from '@/components/base/FjButton.vue'

const props = defineProps<{ page: 'privacy' | 'licenses' }>()
const title = computed(() =>
  props.page === 'privacy' ? 'Privacidad y datos demo' : 'Licencias y atribuciones',
)
</script>

<template>
  <main id="main-content" class="legal-page">
    <article>
      <p class="legal-page__eyebrow">FORJADATA</p>
      <h1>{{ title }}</h1>
      <template v-if="page === 'privacy'">
        <p>
          La demo utiliza identidades, materiales, documentos y métricas sintéticas. No introduzcas
          datos personales ni documentos confidenciales.
        </p>
        <h2>Almacenamiento</h2>
        <p>
          El despliegue público conserva el estado demo únicamente en el almacenamiento local del
          navegador. “Restablecer datos demo” elimina ese estado y recrea el seed determinista.
        </p>
        <h2>Integraciones</h2>
        <p>
          No se envían datos a Microsoft Entra, Azure AI o SAP mientras sus adaptadores permanezcan
          en modo demo, mock, simulator o disabled.
        </p>
      </template>
      <template v-else>
        <p>
          El código propio se distribuye bajo licencia MIT. Vue, Vite, Pinia, AG Grid Community,
          ECharts, Zod, Vitest, Playwright y el resto de dependencias conservan sus licencias.
        </p>
        <p>
          Forjadata no incorpora logos de SAP o Microsoft, fichas técnicas propietarias ni datos
          comerciales reales. Las marcas citadas pertenecen a sus titulares.
        </p>
      </template>
      <RouterLink to="/"><FjButton variant="secondary">Volver</FjButton></RouterLink>
    </article>
  </main>
</template>

<style scoped>
.legal-page {
  display: grid;
  min-height: 100vh;
  place-items: start center;
  padding: clamp(2rem, 7vw, 7rem) 1rem;
}

.legal-page article {
  width: min(46rem, 100%);
}

.legal-page__eyebrow {
  color: var(--color-accent-strong);
  font-size: 0.68rem;
  font-weight: 850;
  letter-spacing: 0.14em;
}

.legal-page h1 {
  margin: 0 0 2rem;
  font-size: clamp(2.5rem, 7vw, 5rem);
  line-height: 1;
  letter-spacing: -0.06em;
}

.legal-page h2 {
  margin-top: 2rem;
}

.legal-page p {
  color: var(--color-text-muted);
  line-height: 1.7;
}

.legal-page :deep(.fj-button) {
  margin-top: 1.5rem;
}
</style>
