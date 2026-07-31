<script setup lang="ts">
import { ArrowRight, CheckSquare, RefreshCcw } from '@lucide/vue'
import type { RequestDetail } from '@forjadata/contracts'
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import FjBadge from '@/components/base/FjBadge.vue'
import FjButton from '@/components/base/FjButton.vue'
import FjProgress from '@/components/base/FjProgress.vue'
import StatePanel from '@/components/feedback/StatePanel.vue'
import { forjadataApi } from '@/services/forjadata-api'

const items = ref<RequestDetail[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(load)

async function load(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    items.value = (
      await forjadataApi.listRequests({
        page: 1,
        pageSize: 50,
        search: '',
        status: 'NEEDS_REVIEW',
        sortBy: 'dueAt',
        sortDirection: 'asc',
      })
    ).data
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'No se pudo cargar la cola.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Cola de revisión</h1>
        <p>Prioriza por riesgo, confianza y vencimiento.</p>
      </div>
      <FjButton variant="secondary" :loading="loading" @click="load"
        ><RefreshCcw :size="16" /> Actualizar</FjButton
      >
    </header>

    <StatePanel v-if="loading" kind="loading" title="Ordenando la cola" />
    <StatePanel v-else-if="error" kind="error" title="Cola no disponible" :description="error" />
    <StatePanel v-else-if="items.length === 0" kind="empty" title="No hay revisiones pendientes" />
    <section v-else class="review-grid">
      <RouterLink
        v-for="item in items"
        :key="item.id"
        :to="`/app/requests/${item.id}`"
        class="review-card panel"
      >
        <div class="review-card__top">
          <span class="review-card__icon"><CheckSquare :size="18" /></span>
          <FjBadge :tone="item.priority === 'HIGH' ? 'warning' : 'neutral'">{{
            item.priority
          }}</FjBadge>
        </div>
        <div>
          <small class="mono">{{ item.id }}</small>
          <h2>{{ item.title }}</h2>
          <p>{{ item.description }}</p>
        </div>
        <FjProgress :value="(item.confidenceScore ?? 0) * 100" label="Confianza producto" />
        <div class="review-card__bottom">
          <span
            >{{
              item.suggestions.filter((suggestion) => suggestion.status === 'PENDING').length
            }}
            sugerencias</span
          >
          <span
            >{{
              item.duplicateCases.filter((duplicate) => duplicate.resolution === 'PENDING').length
            }}
            duplicados</span
          >
          <ArrowRight :size="16" />
        </div>
      </RouterLink>
    </section>
  </div>
</template>

<style scoped>
.review-grid {
  display: grid;
  gap: 0.9rem;
  grid-template-columns: repeat(3, 1fr);
}

.review-card {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.review-card:hover {
  transform: translateY(-2px);
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-sm);
}

.review-card__top,
.review-card__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.review-card__icon {
  display: grid;
  width: 2.3rem;
  height: 2.3rem;
  place-items: center;
  border-radius: 0.65rem;
  background: color-mix(in srgb, var(--color-accent) 14%, transparent);
  color: var(--color-accent-strong);
}

.review-card small {
  color: var(--color-text-muted);
  font-size: 0.64rem;
}

.review-card h2 {
  margin: 0.3rem 0;
  font-size: 0.95rem;
}

.review-card p {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.72rem;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.review-card__bottom {
  justify-content: flex-start;
  padding-top: 0.7rem;
  border-top: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 0.65rem;
}

.review-card__bottom svg {
  margin-left: auto;
}

@media (max-width: 1000px) {
  .review-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .review-grid {
    grid-template-columns: 1fr;
  }
}
</style>
