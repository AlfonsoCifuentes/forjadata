<script setup lang="ts">
import { Activity, Cloud, Database, RefreshCcw, ShieldCheck } from '@lucide/vue'
import type { IntegrationHealth } from '@forjadata/contracts'
import { onMounted, ref } from 'vue'

import FjBadge from '@/components/base/FjBadge.vue'
import FjButton from '@/components/base/FjButton.vue'
import StatePanel from '@/components/feedback/StatePanel.vue'
import { forjadataApi } from '@/services/forjadata-api'

const items = ref<IntegrationHealth[]>([])
const loading = ref(true)

onMounted(load)

async function load(): Promise<void> {
  loading.value = true
  items.value = await forjadataApi.integrationHealth()
  loading.value = false
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Integraciones</h1>
        <p>Modo, health check y pasos pendientes sin exponer secretos.</p>
      </div>
      <FjButton variant="secondary" :loading="loading" @click="load"
        ><RefreshCcw :size="16" /> Probar todas</FjButton
      >
    </header>
    <StatePanel v-if="loading" kind="loading" title="Comprobando adaptadores" />
    <section v-else class="integration-grid">
      <article v-for="item in items" :key="item.name" class="panel integration-card">
        <div class="integration-card__top">
          <span class="integration-card__icon">
            <Database v-if="item.name.includes('SAP')" :size="20" />
            <ShieldCheck v-else-if="item.name.includes('Autenticación')" :size="20" />
            <Cloud v-else :size="20" />
          </span>
          <FjBadge
            :tone="
              item.status === 'healthy'
                ? 'success'
                : item.status === 'degraded'
                  ? 'warning'
                  : 'neutral'
            "
            >{{ item.status }}</FjBadge
          >
        </div>
        <div>
          <h2>{{ item.name }}</h2>
          <p>{{ item.message }}</p>
        </div>
        <div class="integration-card__meta">
          <span
            ><Activity :size="14" /> Modo <b>{{ item.mode }}</b></span
          ><time :datetime="item.checkedAt">{{
            new Date(item.checkedAt).toLocaleTimeString('es-ES')
          }}</time>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped>
.integration-grid {
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(3, 1fr);
}

.integration-card {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.integration-card__top,
.integration-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
}

.integration-card__icon {
  display: grid;
  width: 2.6rem;
  height: 2.6rem;
  place-items: center;
  border-radius: 0.7rem;
  background: var(--color-surface-muted);
  color: var(--color-info-text);
}

.integration-card h2 {
  margin: 0 0 0.35rem;
  font-size: 0.95rem;
}

.integration-card p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.72rem;
  line-height: 1.5;
}

.integration-card__meta {
  padding-top: 0.7rem;
  border-top: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 0.64rem;
}

.integration-card__meta span {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

@media (max-width: 900px) {
  .integration-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .integration-grid {
    grid-template-columns: 1fr;
  }
}
</style>
