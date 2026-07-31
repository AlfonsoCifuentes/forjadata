<script setup lang="ts">
import { AlertTriangle, RotateCcw, SlidersHorizontal } from '@lucide/vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import FjBadge from '@/components/base/FjBadge.vue'
import FjButton from '@/components/base/FjButton.vue'
import { forjadataApi } from '@/services/forjadata-api'

const router = useRouter()
const resetting = ref(false)
const latency = ref(180)
const errorRate = ref(0)

async function reset(): Promise<void> {
  resetting.value = true
  await forjadataApi.resetDemo()
  resetting.value = false
  await router.push('/app/dashboard')
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Configuración demo</h1>
        <p>Controla simuladores y restablece un estado determinista.</p>
      </div>
      <FjBadge tone="warning">Solo datos sintéticos</FjBadge>
    </header>

    <section class="settings-grid">
      <article class="panel">
        <div class="panel__header">
          <h2>Comportamiento simulado</h2>
          <SlidersHorizontal :size="18" />
        </div>
        <div class="panel__body sliders">
          <label
            ><span
              >Latencia visual <b>{{ latency }} ms</b></span
            ><input v-model="latency" type="range" min="0" max="1200" step="50"
          /></label>
          <label
            ><span
              >Tasa de error inyectada <b>{{ errorRate }}%</b></span
            ><input v-model="errorRate" type="range" min="0" max="50" step="5"
          /></label>
          <p>
            Estos controles son demostrativos; SAP usa un error transitorio determinista para el
            caso Cable.
          </p>
        </div>
      </article>

      <article class="panel reset-card">
        <div class="panel__header">
          <h2>Restablecer dataset</h2>
          <RotateCcw :size="18" />
        </div>
        <div class="panel__body">
          <span class="warning-icon"><AlertTriangle :size="22" /></span>
          <p>
            Elimina cambios locales de esta demo y recrea solicitudes, materiales, notificaciones,
            auditoría y casos de duplicado.
          </p>
          <FjButton variant="danger" :loading="resetting" @click="reset"
            >Restablecer datos demo</FjButton
          >
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped>
.settings-grid {
  display: grid;
  align-items: start;
  gap: 1rem;
  grid-template-columns: 1fr 0.7fr;
}

.sliders {
  display: grid;
  gap: 1.4rem;
}

.sliders label {
  display: grid;
  gap: 0.6rem;
}

.sliders label span {
  display: flex;
  justify-content: space-between;
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.sliders p,
.reset-card p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.72rem;
  line-height: 1.5;
}

.reset-card .panel__body {
  display: grid;
  justify-items: start;
  gap: 0.8rem;
}

.warning-icon {
  display: grid;
  width: 2.8rem;
  height: 2.8rem;
  place-items: center;
  border-radius: 0.8rem;
  background: color-mix(in srgb, var(--color-danger) 12%, transparent);
  color: var(--color-danger-text);
}

@media (max-width: 750px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}
</style>
