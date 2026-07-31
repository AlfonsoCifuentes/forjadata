<script setup lang="ts">
import { AlertTriangle, Braces, CheckCircle2, RefreshCcw, ServerCog } from '@lucide/vue'
import type { RequestDetail, SapSyncJob } from '@forjadata/contracts'
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import FjBadge from '@/components/base/FjBadge.vue'
import FjButton from '@/components/base/FjButton.vue'
import StatusBadge from '@/components/data-display/StatusBadge.vue'
import StatePanel from '@/components/feedback/StatePanel.vue'
import { forjadataApi } from '@/services/forjadata-api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const jobs = ref<SapSyncJob[]>([])
const ready = ref<RequestDetail[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const notice = ref<string | null>(null)

onMounted(load)

async function load(): Promise<void> {
  loading.value = true
  try {
    const [jobItems, requestPage] = await Promise.all([
      forjadataApi.listSapJobs(),
      forjadataApi.listRequests({
        page: 1,
        pageSize: 100,
        search: '',
        status: '',
        sortBy: 'updatedAt',
        sortDirection: 'desc',
      }),
    ])
    jobs.value = jobItems
    ready.value = requestPage.data.filter((item) =>
      ['READY_FOR_SAP', 'SYNC_FAILED'].includes(item.status),
    )
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'No se pudo cargar SAP.'
  } finally {
    loading.value = false
  }
}

async function useSapRole(): Promise<void> {
  await auth.switchRole('sap_specialist')
  notice.value = 'Rol demo cambiado a Especialista SAP.'
}

async function sync(request: RequestDetail): Promise<void> {
  try {
    const job = await forjadataApi.syncRequest(request.id, request.version)
    notice.value =
      job.status === 'SUCCEEDED'
        ? `SAP Simulator creó ${job.sapProductId}.`
        : 'Fallo reintentable creado por el simulador.'
    await load()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'No se pudo sincronizar.'
  }
}

async function retry(job: SapSyncJob): Promise<void> {
  await forjadataApi.retrySapJob(job.id)
  notice.value = 'Reintento completado por SAP Simulator.'
  await load()
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Centro de sincronización SAP</h1>
        <p>Payloads, reintentos y errores normalizados mediante un simulador explícito.</p>
      </div>
      <FjBadge tone="warning"><ServerCog :size="13" /> SAP Simulator</FjBadge>
    </header>

    <div class="sap-disclaimer">
      <AlertTriangle :size="18" />
      <div>
        <strong>No conectado a SAP.</strong
        ><span
          >Las credenciales OData solo existirían en backend y los adaptadores reales están
          desactivados.</span
        >
      </div>
      <FjButton
        v-if="auth.isDemoMode && !auth.can('sap:sync')"
        variant="secondary"
        @click="useSapRole"
        >Cambiar rol</FjButton
      >
    </div>
    <p v-if="notice" class="sap-notice" role="status"><CheckCircle2 :size="16" /> {{ notice }}</p>

    <StatePanel v-if="loading" kind="loading" title="Consultando cola SAP" />
    <StatePanel
      v-else-if="error"
      kind="error"
      title="Centro SAP no disponible"
      :description="error"
    />
    <template v-else>
      <section class="sap-summary">
        <article class="panel">
          <span>Pendientes</span><strong>{{ ready.length }}</strong
          ><small>READY_FOR_SAP / SYNC_FAILED</small>
        </article>
        <article class="panel">
          <span>Completadas</span
          ><strong>{{ jobs.filter((job) => job.status === 'SUCCEEDED').length }}</strong
          ><small>Idempotencia por solicitud</small>
        </article>
        <article class="panel">
          <span>Reintentables</span
          ><strong>{{ jobs.filter((job) => job.status === 'FAILED_RETRYABLE').length }}</strong
          ><small>Máximo 3 intentos</small>
        </article>
      </section>

      <section class="panel">
        <div class="panel__header">
          <h2>Solicitudes listas</h2>
          <FjBadge>{{ ready.length }}</FjBadge>
        </div>
        <div v-if="ready.length" class="sap-list">
          <div v-for="request in ready" :key="request.id" class="sap-row">
            <div>
              <strong>{{ request.title }}</strong
              ><small class="mono">{{ request.id }} · {{ request.category }}</small>
            </div>
            <StatusBadge :status="request.status" />
            <RouterLink :to="`/app/requests/${request.id}`">Revisar</RouterLink>
            <FjButton :disabled="!auth.can('sap:sync')" @click="sync(request)"
              ><RefreshCcw :size="15" /> Sincronizar</FjButton
            >
          </div>
        </div>
        <div v-else class="empty-inline">No hay solicitudes listas en este dataset.</div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <h2>Historial de trabajos</h2>
          <FjBadge tone="info">{{ jobs.length }}</FjBadge>
        </div>
        <div v-if="jobs.length" class="job-list">
          <article v-for="job in jobs" :key="job.id" class="job-row">
            <span class="job-row__icon"><Braces :size="18" /></span>
            <div>
              <strong class="mono">{{ job.id }}</strong
              ><small>{{ job.operation }} · {{ job.adapter }} · {{ job.durationMs }} ms</small>
            </div>
            <StatusBadge :status="job.status" />
            <div class="job-row__meta">
              <span>HTTP {{ job.httpStatus }}</span
              ><span class="mono">{{ job.sapProductId ?? job.errorCode }}</span>
            </div>
            <FjButton
              v-if="job.status === 'FAILED_RETRYABLE'"
              variant="secondary"
              :disabled="!auth.can('sap:retry')"
              @click="retry(job)"
              >Reintentar</FjButton
            >
          </article>
        </div>
        <div v-else class="empty-inline">
          Todavía no se ha ejecutado ninguna sincronización en esta sesión.
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.sap-disclaimer,
.sap-notice {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.8rem 1rem;
  border: 1px solid color-mix(in srgb, var(--color-warning) 30%, var(--color-border));
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-warning) 9%, var(--color-surface));
}

.sap-disclaimer > div {
  display: grid;
  flex: 1;
  gap: 0.15rem;
}

.sap-disclaimer strong {
  font-size: 0.76rem;
}

.sap-disclaimer span,
.sap-notice {
  color: var(--color-warning-text);
  font-size: 0.68rem;
}

.sap-notice {
  margin: 0;
  border-color: color-mix(in srgb, var(--color-success) 30%, var(--color-border));
  background: color-mix(in srgb, var(--color-success) 8%, var(--color-surface));
  color: var(--color-success-text);
}

.sap-summary {
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(3, 1fr);
}

.sap-summary article {
  display: grid;
  gap: 0.35rem;
  padding: 1rem;
}

.sap-summary span,
.sap-summary small {
  color: var(--color-text-muted);
  font-size: 0.68rem;
}

.sap-summary strong {
  font-size: 1.8rem;
}

.sap-list,
.job-list {
  display: grid;
}

.sap-row,
.job-row {
  display: grid;
  align-items: center;
  gap: 0.8rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border);
}

.sap-row {
  grid-template-columns: 1fr auto auto auto;
}

.job-row {
  grid-template-columns: auto 1fr auto 0.7fr auto;
}

.sap-row:last-child,
.job-row:last-child {
  border-bottom: 0;
}

.sap-row > div:first-child,
.job-row > div:nth-child(2),
.job-row__meta {
  display: grid;
  gap: 0.2rem;
}

.sap-row strong,
.job-row strong {
  font-size: 0.76rem;
}

.sap-row small,
.job-row small,
.job-row__meta span {
  color: var(--color-text-muted);
  font-size: 0.64rem;
}

.sap-row > a {
  color: var(--color-info-text);
  font-size: 0.68rem;
  font-weight: 700;
}

.job-row__icon {
  display: grid;
  width: 2.2rem;
  height: 2.2rem;
  place-items: center;
  border-radius: 0.6rem;
  background: var(--color-surface-muted);
  color: var(--color-ai-text);
}

.empty-inline {
  padding: 2rem;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  text-align: center;
}

@media (max-width: 800px) {
  .sap-summary {
    grid-template-columns: 1fr;
  }

  .sap-row,
  .job-row {
    grid-template-columns: 1fr auto;
  }

  .job-row__icon {
    display: none;
  }
}
</style>
