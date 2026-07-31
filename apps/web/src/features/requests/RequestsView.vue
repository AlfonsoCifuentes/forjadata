<script setup lang="ts">
import { FilePlus2, Filter, RefreshCcw, Search } from '@lucide/vue'
import type { RequestDetail } from '@forjadata/contracts'
import { onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

import FjButton from '@/components/base/FjButton.vue'
import FjProgress from '@/components/base/FjProgress.vue'
import StatusBadge from '@/components/data-display/StatusBadge.vue'
import StatePanel from '@/components/feedback/StatePanel.vue'
import { forjadataApi } from '@/services/forjadata-api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const requests = ref<RequestDetail[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const search = ref('')
const status = ref('')
let searchTimer: number | undefined

onMounted(load)

watch([search, status], () => {
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(load, 250)
})

async function load(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    const result = await forjadataApi.listRequests({
      page: 1,
      pageSize: 50,
      search: search.value,
      status: status.value,
      sortBy: 'updatedAt',
      sortDirection: 'desc',
    })
    requests.value = result.data
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'No se pudieron cargar las solicitudes.'
  } finally {
    loading.value = false
  }
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Solicitudes</h1>
        <p>Gestiona el ciclo completo desde la recepción hasta la sincronización.</p>
      </div>
      <RouterLink v-if="auth.can('request:create')" to="/app/requests/new">
        <FjButton><FilePlus2 :size="17" /> Nueva solicitud</FjButton>
      </RouterLink>
    </header>

    <section class="request-toolbar panel" aria-label="Filtros de solicitudes">
      <label class="toolbar-search">
        <Search :size="17" />
        <span class="visually-hidden">Buscar solicitudes</span>
        <input v-model="search" placeholder="Buscar por título, descripción o ID…" />
      </label>
      <label class="toolbar-filter">
        <Filter :size="16" />
        <span class="visually-hidden">Filtrar por estado</span>
        <select v-model="status">
          <option value="">Todos los estados</option>
          <option value="DRAFT">Borrador</option>
          <option value="PROCESSING">Procesando</option>
          <option value="NEEDS_REVIEW">Necesita revisión</option>
          <option value="CHANGES_REQUESTED">Cambios solicitados</option>
          <option value="READY_FOR_SAP">Lista para SAP</option>
          <option value="SYNCED">Sincronizada</option>
          <option value="SYNC_FAILED">Error SAP</option>
        </select>
      </label>
      <FjButton variant="ghost" :loading="loading" @click="load"
        ><RefreshCcw :size="16" /> Actualizar</FjButton
      >
    </section>

    <StatePanel
      v-if="loading && requests.length === 0"
      kind="loading"
      title="Cargando solicitudes"
    />
    <StatePanel v-else-if="error" kind="error" title="No se pudieron cargar" :description="error">
      <FjButton variant="secondary" @click="load">Reintentar</FjButton>
    </StatePanel>
    <StatePanel
      v-else-if="requests.length === 0"
      kind="empty"
      title="No hay solicitudes para estos filtros"
      description="Prueba a quitar filtros o crea una nueva solicitud sintética."
    >
      <RouterLink v-if="auth.can('request:create')" to="/app/requests/new">
        <FjButton>Crear solicitud</FjButton>
      </RouterLink>
    </StatePanel>

    <section v-else class="request-list panel" aria-label="Lista de solicitudes">
      <div class="request-list__header">
        <span>Solicitud</span><span>Estado</span><span>Progreso</span><span>Responsable</span
        ><span>Actualizada</span>
      </div>
      <RouterLink
        v-for="request in requests"
        :key="request.id"
        :to="`/app/requests/${request.id}`"
        class="request-row"
      >
        <span class="request-row__main">
          <strong>{{ request.title }}</strong>
          <small class="mono">{{ request.id }} · {{ request.category ?? 'Sin categoría' }}</small>
        </span>
        <StatusBadge :status="request.status" />
        <FjProgress
          :value="request.processingProgress"
          :label="
            request.processingStage ? request.processingStage.replaceAll('_', ' ') : 'Sin procesar'
          "
        />
        <span class="request-row__owner">{{ request.assigneeName ?? request.requesterName }}</span>
        <time :datetime="request.updatedAt">{{ formatDate(request.updatedAt) }}</time>
      </RouterLink>
    </section>
  </div>
</template>

<style scoped>
.request-toolbar {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.7rem;
}

.toolbar-search,
.toolbar-filter {
  display: flex;
  min-height: 2.55rem;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.7rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-raised);
  color: var(--color-text-muted);
}

.toolbar-search {
  flex: 1;
}

.toolbar-search input,
.toolbar-filter select {
  width: 100%;
  border: 0;
  background: transparent;
  color: var(--color-text);
  outline: 0;
}

.request-list {
  overflow: hidden;
}

.request-list__header,
.request-row {
  display: grid;
  align-items: center;
  gap: 1rem;
  grid-template-columns:
    minmax(16rem, 1.5fr) minmax(8rem, 0.65fr) minmax(9rem, 0.8fr) minmax(8rem, 0.7fr)
    7rem;
}

.request-list__header {
  padding: 0.7rem 1rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.request-row {
  min-height: 4.7rem;
  padding: 0.7rem 1rem;
  border-bottom: 1px solid var(--color-border);
}

.request-row:last-child {
  border-bottom: 0;
}

.request-row:hover {
  background: var(--color-surface-muted);
}

.request-row__main {
  display: grid;
  min-width: 0;
  gap: 0.3rem;
}

.request-row__main strong {
  overflow: hidden;
  font-size: 0.82rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.request-row__main small,
.request-row__owner,
.request-row time {
  color: var(--color-text-muted);
  font-size: 0.68rem;
}

@media (max-width: 1000px) {
  .request-list__header {
    display: none;
  }

  .request-row {
    align-items: start;
    grid-template-columns: 1fr auto;
  }

  .request-row :deep(.fj-progress) {
    grid-column: 1 / -1;
  }

  .request-row__owner,
  .request-row time {
    display: none;
  }
}

@media (max-width: 650px) {
  .request-toolbar {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
