<script setup lang="ts">
import { Download, Info } from '@lucide/vue'
import type { DashboardSummary } from '@forjadata/contracts'
import { onMounted, ref } from 'vue'

import FjBadge from '@/components/base/FjBadge.vue'
import FjButton from '@/components/base/FjButton.vue'
import FjProgress from '@/components/base/FjProgress.vue'
import StatePanel from '@/components/feedback/StatePanel.vue'
import { forjadataApi } from '@/services/forjadata-api'

const data = ref<DashboardSummary | null>(null)
onMounted(async () => {
  data.value = await forjadataApi.dashboard()
})
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Analítica de calidad</h1>
        <p>Storytelling sobre un escenario estrictamente sintético.</p>
      </div>
      <FjButton variant="secondary"><Download :size="16" /> Exportar CSV</FjButton>
    </header>
    <div class="analytics-note">
      <Info :size="17" /><span
        >Estas métricas demuestran interacción y visualización; no son resultados de una empresa
        real.</span
      >
    </div>
    <StatePanel v-if="!data" kind="loading" title="Calculando métricas demo" />
    <template v-else>
      <section class="analytics-hero panel">
        <div>
          <FjBadge tone="success">Tendencia positiva demo</FjBadge>
          <h2>{{ Math.round(data.aiAcceptanceRate * 100) }}%</h2>
          <strong>Aceptación de sugerencias mock</strong>
          <p>El valor combina decisiones sintéticas del seed y no mide un modelo real.</p>
        </div>
        <div class="quality-bars">
          <FjProgress :value="94" label="Potencia" />
          <FjProgress :value="91" label="Fabricante" />
          <FjProgress :value="88" label="Unidad base" />
          <FjProgress :value="76" label="Modelo" />
        </div>
      </section>
      <section class="category-quality">
        <article v-for="category in data.categoryBreakdown" :key="category.category" class="panel">
          <span>{{ category.category }}</span
          ><strong>{{ category.count }}</strong
          ><small>solicitudes demo</small>
        </article>
      </section>
    </template>
  </div>
</template>

<style scoped>
.analytics-note {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.75rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.72rem;
}

.analytics-hero {
  display: grid;
  align-items: center;
  gap: 3rem;
  padding: clamp(1.5rem, 4vw, 3rem);
  grid-template-columns: 0.8fr 1.2fr;
}

.analytics-hero > div:first-child {
  display: grid;
  justify-items: start;
  gap: 0.6rem;
}

.analytics-hero h2 {
  margin: 0;
  font-size: 4rem;
  letter-spacing: -0.08em;
}

.analytics-hero p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.74rem;
}

.quality-bars {
  display: grid;
  gap: 1.2rem;
}

.category-quality {
  display: grid;
  gap: 0.7rem;
  grid-template-columns: repeat(3, 1fr);
}

.category-quality article {
  display: grid;
  gap: 0.3rem;
  padding: 1rem;
}

.category-quality span,
.category-quality small {
  color: var(--color-text-muted);
  font-size: 0.7rem;
}

.category-quality strong {
  font-size: 1.6rem;
}

@media (max-width: 750px) {
  .analytics-hero,
  .category-quality {
    grid-template-columns: 1fr;
  }
}
</style>
