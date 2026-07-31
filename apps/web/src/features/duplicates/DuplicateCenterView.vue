<script setup lang="ts">
import { ArrowRight, Copy, Scale } from '@lucide/vue'
import type { DuplicateCase, RequestDetail } from '@forjadata/contracts'
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import FjBadge from '@/components/base/FjBadge.vue'
import StatusBadge from '@/components/data-display/StatusBadge.vue'
import StatePanel from '@/components/feedback/StatePanel.vue'
import { forjadataApi } from '@/services/forjadata-api'

const cases = ref<DuplicateCase[]>([])
const requests = ref<RequestDetail[]>([])
const loading = ref(true)

onMounted(async () => {
  const [duplicateCases, requestPage] = await Promise.all([
    forjadataApi.listDuplicateCases(),
    forjadataApi.listRequests({
      page: 1,
      pageSize: 100,
      search: '',
      status: '',
      sortBy: 'updatedAt',
      sortDirection: 'desc',
    }),
  ])
  cases.value = duplicateCases
  requests.value = requestPage.data
  loading.value = false
})

function requestFor(caseItem: DuplicateCase): RequestDetail | undefined {
  return requests.value.find((request) => request.materialId === caseItem.sourceMaterialId)
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Centro de duplicados</h1>
        <p>Comparación explicable antes de crear registros redundantes.</p>
      </div>
      <FjBadge tone="warning"
        >{{ cases.filter((item) => item.resolution === 'PENDING').length }} pendientes</FjBadge
      >
    </header>

    <StatePanel v-if="loading" kind="loading" title="Calculando coincidencias" />
    <StatePanel v-else-if="cases.length === 0" kind="empty" title="No hay casos de duplicado" />
    <section v-else class="duplicate-center-list">
      <article v-for="caseItem in cases" :key="caseItem.id" class="panel center-card">
        <div class="center-card__score">
          <Copy :size="20" /><strong>{{ Math.round(caseItem.score * 100) }}%</strong
          ><span>similitud</span>
        </div>
        <div class="center-card__comparison">
          <div>
            <small>SOLICITUD</small><strong>{{ caseItem.sourceDescription }}</strong
            ><span class="mono">{{ caseItem.sourceMaterialId }}</span>
          </div>
          <Scale :size="18" />
          <div>
            <small>CATÁLOGO</small><strong>{{ caseItem.candidateDescription }}</strong
            ><span class="mono">{{ caseItem.candidateMaterialId }}</span>
          </div>
        </div>
        <div class="center-card__action">
          <StatusBadge :status="caseItem.resolution" />
          <RouterLink
            v-if="requestFor(caseItem)"
            :to="`/app/requests/${requestFor(caseItem)?.id}`"
            aria-label="Abrir comparación"
          >
            <ArrowRight :size="17" />
          </RouterLink>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped>
.duplicate-center-list {
  display: grid;
  gap: 0.8rem;
}

.center-card {
  display: grid;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem 1rem;
  grid-template-columns: 6rem 1fr auto;
}

.center-card__score {
  display: grid;
  justify-items: center;
  gap: 0.2rem;
  color: var(--color-accent-strong);
}

.center-card__score strong {
  font-size: 1.35rem;
}

.center-card__score span {
  color: var(--color-text-muted);
  font-size: 0.6rem;
}

.center-card__comparison {
  display: grid;
  align-items: center;
  gap: 0.8rem;
  grid-template-columns: 1fr auto 1fr;
}

.center-card__comparison > div {
  display: grid;
  gap: 0.25rem;
}

.center-card__comparison small,
.center-card__comparison span {
  color: var(--color-text-muted);
  font-size: 0.62rem;
}

.center-card__comparison strong {
  font-size: 0.76rem;
}

.center-card__action {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.center-card__action a {
  display: grid;
  width: 2.1rem;
  height: 2.1rem;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 0.55rem;
}

@media (max-width: 750px) {
  .center-card {
    grid-template-columns: auto 1fr;
  }

  .center-card__comparison {
    grid-column: 1 / -1;
    grid-template-columns: 1fr;
  }

  .center-card__comparison > svg {
    transform: rotate(90deg);
  }
}
</style>
