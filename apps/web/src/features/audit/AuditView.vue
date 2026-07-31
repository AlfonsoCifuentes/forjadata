<script setup lang="ts">
import { Download, Search, ShieldCheck } from '@lucide/vue'
import type { AuditEvent } from '@forjadata/contracts'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import FjBadge from '@/components/base/FjBadge.vue'
import FjButton from '@/components/base/FjButton.vue'
import StatePanel from '@/components/feedback/StatePanel.vue'
import { forjadataApi } from '@/services/forjadata-api'

const events = ref<AuditEvent[]>([])
const loading = ref(true)
const exporting = ref(false)
const search = ref('')
const { locale } = useI18n()
const filtered = computed(() => {
  const query = search.value.toLocaleLowerCase('es')
  return events.value.filter((event) =>
    `${event.action} ${event.entity} ${event.entityId} ${event.actorName} ${event.summary}`
      .toLocaleLowerCase('es')
      .includes(query),
  )
})

onMounted(async () => {
  events.value = await forjadataApi.listAuditEvents()
  loading.value = false
})

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(locale.value === 'es' ? 'es-ES' : 'en-GB', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(value))
}

async function exportAudit(): Promise<void> {
  exporting.value = true
  try {
    const exported = await forjadataApi.exportAuditEvents()
    const url = URL.createObjectURL(
      new Blob([exported.content], { type: 'text/csv;charset=utf-8' }),
    )
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = exported.fileName
    anchor.click()
    URL.revokeObjectURL(url)
    events.value = await forjadataApi.listAuditEvents()
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Auditoría</h1>
        <p>Eventos inmutables sin tokens, secretos ni documentos completos.</p>
      </div>
      <FjButton variant="secondary" :loading="exporting" @click="exportAudit"
        ><Download :size="16" /> Exportar</FjButton
      >
    </header>
    <label class="audit-search panel"
      ><Search :size="17" /><span class="visually-hidden">Buscar eventos</span
      ><input v-model="search" placeholder="Acción, entidad, actor o correlation ID…"
    /></label>
    <StatePanel v-if="loading" kind="loading" title="Cargando auditoría" />
    <StatePanel
      v-else-if="filtered.length === 0"
      kind="empty"
      title="No hay eventos para la búsqueda"
    />
    <section v-else class="panel audit-list">
      <article v-for="event in filtered" :key="event.id" class="audit-row">
        <span class="audit-row__icon"><ShieldCheck :size="17" /></span>
        <div>
          <strong>{{ event.summary }}</strong
          ><small
            >{{ event.actorName }} · {{ event.actorRole }} ·
            {{ formatDate(event.timestamp) }}</small
          >
        </div>
        <FjBadge :tone="event.outcome === 'SUCCESS' ? 'success' : 'danger'">{{
          event.action
        }}</FjBadge>
        <div class="audit-row__meta">
          <span class="mono">{{ event.entity }}/{{ event.entityId }}</span
          ><code>{{ event.correlationId }}</code>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped>
.audit-search {
  display: flex;
  min-height: 2.7rem;
  align-items: center;
  gap: 0.55rem;
  padding: 0 0.8rem;
  color: var(--color-text-muted);
}

.audit-search input {
  width: 100%;
  border: 0;
  background: transparent;
  color: var(--color-text);
  outline: 0;
}

.audit-list {
  overflow: hidden;
}

.audit-row {
  display: grid;
  align-items: center;
  gap: 0.7rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border);
  grid-template-columns: auto 1fr auto minmax(12rem, 0.6fr);
}

.audit-row:last-child {
  border-bottom: 0;
}

.audit-row__icon {
  display: grid;
  width: 2.2rem;
  height: 2.2rem;
  place-items: center;
  border-radius: 0.6rem;
  background: var(--color-surface-muted);
  color: var(--color-success-text);
}

.audit-row > div {
  display: grid;
  gap: 0.2rem;
}

.audit-row strong {
  font-size: 0.75rem;
}

.audit-row small,
.audit-row__meta span,
.audit-row__meta code {
  color: var(--color-text-muted);
  font-size: 0.62rem;
}

@media (max-width: 750px) {
  .audit-row {
    grid-template-columns: auto 1fr;
  }

  .audit-row__meta {
    grid-column: 2;
  }
}
</style>
