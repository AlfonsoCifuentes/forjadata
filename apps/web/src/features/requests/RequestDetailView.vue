<script setup lang="ts">
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileText,
  RefreshCcw,
  Send,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  X,
} from '@lucide/vue'
import type { RequestDetail, SapSyncJob, SuggestionDecisionInput } from '@forjadata/contracts'
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import FjBadge from '@/components/base/FjBadge.vue'
import FjButton from '@/components/base/FjButton.vue'
import FjProgress from '@/components/base/FjProgress.vue'
import StatusBadge from '@/components/data-display/StatusBadge.vue'
import StatePanel from '@/components/feedback/StatePanel.vue'
import { forjadataApi } from '@/services/forjadata-api'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const request = ref<RequestDetail | null>(null)
const loading = ref(true)
const actionLoading = ref(false)
const error = ref<string | null>(null)
const notice = ref<string | null>(null)
const activeTab = ref<'summary' | 'suggestions' | 'duplicates' | 'workflow' | 'documents'>(
  route.query.created ? 'summary' : 'suggestions',
)
const syncJob = ref<SapSyncJob | null>(null)

const pendingSuggestions = computed(
  () => request.value?.suggestions.filter((item) => item.status === 'PENDING').length ?? 0,
)
const pendingDuplicates = computed(
  () => request.value?.duplicateCases.filter((item) => item.resolution === 'PENDING').length ?? 0,
)
const canApprove = computed(
  () =>
    request.value?.status === 'NEEDS_REVIEW' &&
    auth.can('request:approve') &&
    pendingSuggestions.value === 0 &&
    pendingDuplicates.value === 0,
)

onMounted(load)
watch(() => route.params.requestId, load)

async function load(): Promise<void> {
  const id = String(route.params.requestId)
  loading.value = true
  error.value = null
  try {
    request.value = await forjadataApi.getRequest(id)
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'No se pudo cargar la solicitud.'
  } finally {
    loading.value = false
  }
}

async function perform(action: () => Promise<void>): Promise<void> {
  actionLoading.value = true
  error.value = null
  notice.value = null
  try {
    await action()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'La operación no se pudo completar.'
  } finally {
    actionLoading.value = false
  }
}

async function submitProcessing(): Promise<void> {
  if (!request.value) return
  await perform(async () => {
    request.value = await forjadataApi.submitRequest(request.value!.id, request.value!.version)
    activeTab.value = 'suggestions'
    notice.value = 'Pipeline mock completado: sugerencias y duplicados listos para revisión.'
  })
}

async function decide(
  suggestionId: string,
  decision: SuggestionDecisionInput['decision'],
): Promise<void> {
  if (!request.value) return
  await perform(async () => {
    request.value = await forjadataApi.decideSuggestion(request.value!.id, suggestionId, {
      decision,
      reason: `Decisión humana: ${decision}.`,
    })
    notice.value = 'Decisión registrada en auditoría.'
  })
}

async function acceptAll(): Promise<void> {
  if (!request.value) return
  await perform(async () => {
    request.value = await forjadataApi.acceptAllSuggestions(request.value!.id)
    notice.value = 'Sugerencias aceptadas. Revisa ahora los duplicados.'
    if (pendingDuplicates.value > 0) activeTab.value = 'duplicates'
  })
}

async function resolveDuplicate(
  duplicateId: string,
  resolution: 'LINKED' | 'NOT_DUPLICATE',
): Promise<void> {
  if (!request.value) return
  await perform(async () => {
    request.value = await forjadataApi.resolveDuplicate(
      request.value!.id,
      duplicateId,
      resolution,
      'Coincidencia confirmada por fabricante y referencia; se enlaza sin fusionar.',
    )
    notice.value = 'Duplicado enlazado y auditado. La solicitud ya puede aprobarse.'
    activeTab.value = 'summary'
  })
}

async function approve(): Promise<void> {
  if (!request.value) return
  await perform(async () => {
    request.value = await forjadataApi.approveRequest(
      request.value!.id,
      request.value!.version,
      'Atributos, evidencia y duplicados revisados por Data Steward.',
    )
    notice.value = 'Solicitud aprobada y payload preparado para SAP Simulator.'
  })
}

async function requestChanges(): Promise<void> {
  if (!request.value) return
  await perform(async () => {
    request.value = await forjadataApi.requestChanges(
      request.value!.id,
      request.value!.version,
      'Falta confirmar el uso previsto del material.',
    )
    notice.value = 'Cambios solicitados con motivo obligatorio.'
  })
}

async function switchToSap(): Promise<void> {
  await auth.switchRole('sap_specialist')
  notice.value = 'Rol cambiado a Especialista SAP. Ya puedes ejecutar la sincronización.'
}

async function synchronize(): Promise<void> {
  if (!request.value) return
  await perform(async () => {
    syncJob.value = await forjadataApi.syncRequest(request.value!.id, request.value!.version)
    request.value = await forjadataApi.getRequest(request.value!.id)
    notice.value =
      syncJob.value.status === 'SUCCEEDED'
        ? `SAP Simulator creó ${syncJob.value.sapProductId}.`
        : 'SAP Simulator devolvió un error reintentable.'
  })
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
</script>

<template>
  <div class="page request-detail">
    <StatePanel v-if="loading" kind="loading" title="Cargando solicitud" />
    <StatePanel
      v-else-if="error && !request"
      kind="error"
      title="No se pudo abrir"
      :description="error"
    >
      <FjButton variant="secondary" @click="router.push('/app/requests')">Volver</FjButton>
    </StatePanel>

    <template v-else-if="request">
      <header class="detail-header">
        <div class="detail-header__main">
          <RouterLink class="back-link" to="/app/requests"
            ><ArrowLeft :size="15" /> Solicitudes</RouterLink
          >
          <div class="detail-header__title">
            <div>
              <span class="mono detail-id">{{ request.id }}</span>
              <h1>{{ request.title }}</h1>
            </div>
            <StatusBadge :status="request.status" />
          </div>
          <p>{{ request.description }}</p>
          <div class="detail-meta">
            <span>{{ request.category ?? 'Sin categoría' }}</span>
            <span>Responsable: {{ request.assigneeName ?? request.requesterName }}</span>
            <span>v{{ request.version }}</span>
          </div>
        </div>

        <div class="detail-actions">
          <FjButton
            v-if="request.status === 'DRAFT' && auth.can('request:submit')"
            :loading="actionLoading"
            @click="submitProcessing"
          >
            <Send :size="16" /> Enviar y procesar
          </FjButton>
          <FjButton v-if="canApprove" :loading="actionLoading" @click="approve">
            <CheckCircle2 :size="16" /> Aprobar
          </FjButton>
          <FjButton
            v-if="request.status === 'NEEDS_REVIEW' && auth.can('request:reject')"
            variant="secondary"
            :loading="actionLoading"
            @click="requestChanges"
          >
            Solicitar cambios
          </FjButton>
          <FjButton
            v-if="request.status === 'READY_FOR_SAP' && auth.can('sap:sync')"
            :loading="actionLoading"
            @click="synchronize"
          >
            <RefreshCcw :size="16" /> Sincronizar
          </FjButton>
          <FjButton
            v-else-if="request.status === 'READY_FOR_SAP' && auth.isDemoMode"
            variant="secondary"
            @click="switchToSap"
          >
            <UserRoundCheck :size="16" /> Cambiar a Especialista SAP
          </FjButton>
        </div>
      </header>

      <div v-if="route.query.created" class="notice notice--info">
        <Sparkles :size="17" />
        Borrador creado. Envíalo para ejecutar extracción, clasificación, reglas y duplicados mock.
      </div>
      <div v-if="notice" class="notice notice--success" role="status">
        <CheckCircle2 :size="17" /> {{ notice }}
      </div>
      <div v-if="error" class="notice notice--error" role="alert">
        <AlertTriangle :size="17" /> {{ error }}
      </div>

      <section v-if="request.processingStage" class="pipeline-card panel">
        <div class="pipeline-card__top">
          <div>
            <FjBadge tone="ai"><Bot :size="13" /> Proveedor mock</FjBadge>
            <strong>{{ request.processingStage.replaceAll('_', ' ') }}</strong>
          </div>
          <span class="mono">corr-demo · {{ request.processingProgress }}%</span>
        </div>
        <FjProgress :value="request.processingProgress" label="Progreso del pipeline" />
        <div class="pipeline-steps" aria-label="Etapas de procesamiento">
          <span data-complete="true">Extraer</span>
          <span data-complete="true">Clasificar</span>
          <span data-complete="true">Normalizar</span>
          <span data-complete="true">Reglas</span>
          <span data-complete="true">Duplicados</span>
          <span data-complete="true">Confianza</span>
        </div>
      </section>

      <nav class="detail-tabs" aria-label="Secciones de solicitud">
        <button
          :aria-current="activeTab === 'summary' ? 'page' : undefined"
          @click="activeTab = 'summary'"
        >
          Resumen
        </button>
        <button
          :aria-current="activeTab === 'suggestions' ? 'page' : undefined"
          @click="activeTab = 'suggestions'"
        >
          Sugerencias <span>{{ request.suggestions.length }}</span>
        </button>
        <button
          :aria-current="activeTab === 'duplicates' ? 'page' : undefined"
          @click="activeTab = 'duplicates'"
        >
          Duplicados <span>{{ request.duplicateCases.length }}</span>
        </button>
        <button
          :aria-current="activeTab === 'workflow' ? 'page' : undefined"
          @click="activeTab = 'workflow'"
        >
          Workflow
        </button>
        <button
          :aria-current="activeTab === 'documents' ? 'page' : undefined"
          @click="activeTab = 'documents'"
        >
          Documentos
        </button>
      </nav>

      <section v-if="activeTab === 'summary'" class="detail-grid">
        <article class="panel">
          <div class="panel__header">
            <h2>Preparación de la solicitud</h2>
            <FjBadge :tone="canApprove ? 'success' : 'warning'">{{
              canApprove ? 'Lista para aprobar' : 'Acciones pendientes'
            }}</FjBadge>
          </div>
          <div class="panel__body checklist">
            <div>
              <span :data-ok="request.documents.length > 0"><Check :size="14" /></span>
              <p>
                <strong>Documento fuente</strong
                ><small>{{
                  request.documents.length ? 'Procesado por mock' : 'Opcional en esta solicitud'
                }}</small>
              </p>
            </div>
            <div>
              <span :data-ok="pendingSuggestions === 0"><Check :size="14" /></span>
              <p>
                <strong>Sugerencias revisadas</strong
                ><small>{{ pendingSuggestions }} pendientes</small>
              </p>
            </div>
            <div>
              <span :data-ok="pendingDuplicates === 0"><Check :size="14" /></span>
              <p>
                <strong>Duplicados resueltos</strong
                ><small>{{ pendingDuplicates }} pendientes</small>
              </p>
            </div>
            <div>
              <span :data-ok="Boolean(request.confidenceScore)"><Check :size="14" /></span>
              <p>
                <strong>Confianza de producto</strong
                ><small>{{
                  request.confidenceScore
                    ? `${Math.round(request.confidenceScore * 100)}%`
                    : 'Sin calcular'
                }}</small>
              </p>
            </div>
          </div>
        </article>

        <aside class="panel">
          <div class="panel__header"><h2>Próxima acción</h2></div>
          <div class="panel__body next-action">
            <template v-if="request.status === 'DRAFT'">
              <Send :size="25" /><strong>Enviar a procesamiento</strong>
              <p>La ejecución mock tarda menos de un segundo y conserva eventos intermedios.</p>
            </template>
            <template v-else-if="pendingSuggestions > 0">
              <Bot :size="25" /><strong>Revisar sugerencias</strong>
              <p>Una persona debe aceptar, modificar o rechazar cada valor.</p>
              <FjButton variant="secondary" @click="activeTab = 'suggestions'"
                >Abrir sugerencias</FjButton
              >
            </template>
            <template v-else-if="pendingDuplicates > 0">
              <Copy :size="25" /><strong>Resolver coincidencia</strong>
              <p>La aprobación queda bloqueada hasta decidir.</p>
              <FjButton variant="secondary" @click="activeTab = 'duplicates'">Comparar</FjButton>
            </template>
            <template v-else-if="request.status === 'NEEDS_REVIEW'">
              <ShieldCheck :size="25" /><strong>Aprobar solicitud</strong>
              <p>La transición queda registrada con actor, razón y versión.</p>
            </template>
            <template v-else-if="request.status === 'READY_FOR_SAP'">
              <RefreshCcw :size="25" /><strong>Sincronizar con SAP Simulator</strong>
              <p>Requiere rol Especialista SAP o Administrador.</p>
            </template>
            <template v-else>
              <CheckCircle2 :size="25" /><strong>Flujo completado</strong>
              <p>Consulta workflow y auditoría para la trazabilidad.</p>
            </template>
          </div>
        </aside>
      </section>

      <section v-else-if="activeTab === 'suggestions'" class="suggestion-layout">
        <div class="panel">
          <div class="panel__header">
            <div>
              <h2>Sugerencias de atributos</h2>
              <p>{{ pendingSuggestions }} pendientes · proveedor mock 1.0</p>
            </div>
            <FjButton
              v-if="pendingSuggestions > 0 && auth.can('request:review')"
              variant="secondary"
              :loading="actionLoading"
              @click="acceptAll"
            >
              <Check :size="16" /> Aceptar todas
            </FjButton>
          </div>
          <div v-if="request.suggestions.length" class="suggestion-list">
            <article
              v-for="suggestion in request.suggestions"
              :key="suggestion.id"
              class="suggestion-item"
            >
              <div class="suggestion-item__main">
                <span
                  ><strong>{{ suggestion.label }}</strong
                  ><FjBadge tone="ai">{{ Math.round(suggestion.confidence * 100) }}%</FjBadge></span
                >
                <p>
                  <span>{{ suggestion.normalizedValue }}</span
                  ><small v-if="suggestion.unit">{{ suggestion.unit }}</small>
                </p>
                <small>{{ suggestion.reasoningSummary }}</small>
              </div>
              <div class="suggestion-item__status">
                <StatusBadge :status="suggestion.status" />
                <div v-if="suggestion.status === 'PENDING' && auth.can('request:review')">
                  <button
                    type="button"
                    aria-label="Aceptar sugerencia"
                    @click="decide(suggestion.id, 'accept')"
                  >
                    <Check :size="15" />
                  </button>
                  <button
                    type="button"
                    aria-label="Rechazar sugerencia"
                    @click="decide(suggestion.id, 'reject')"
                  >
                    <X :size="15" />
                  </button>
                </div>
              </div>
            </article>
          </div>
          <StatePanel
            v-else
            kind="empty"
            title="Todavía no hay sugerencias"
            description="Envía la solicitud para ejecutar el proveedor mock."
          />
        </div>

        <aside class="panel evidence-panel">
          <div class="panel__header">
            <h2>Evidencia localizada</h2>
            <FjBadge>Página 1</FjBadge>
          </div>
          <div class="panel__body">
            <div class="fake-document">
              <span>FICHA TÉCNICA · DOCUMENTO SINTÉTICO</span>
              <h3>Motor trifásico serie DEMO</h3>
              <p>Potencia nominal <mark>7,5 kW</mark> · Tensión <mark>400 V</mark></p>
              <p>Eficiencia <mark>IE3</mark> · Grado de protección <mark>IP55</mark></p>
              <small>No reproduce una ficha comercial real.</small>
            </div>
            <div class="evidence-meta">
              <span><b>Fuente</b> ficha-motor-demo.pdf</span>
              <span><b>Proveedor</b> mock</span>
              <span><b>Regla</b> coincidencia + normalización SI</span>
            </div>
          </div>
        </aside>
      </section>

      <section v-else-if="activeTab === 'duplicates'">
        <StatePanel
          v-if="request.duplicateCases.length === 0"
          kind="empty"
          title="No se detectaron duplicados"
          description="Las reglas exactas y difusas no superaron el umbral."
        />
        <div v-else class="duplicate-list">
          <article
            v-for="duplicate in request.duplicateCases"
            :key="duplicate.id"
            class="panel duplicate-card"
          >
            <div class="panel__header">
              <div>
                <h2>Posible coincidencia · {{ Math.round(duplicate.score * 100) }}%</h2>
                <p>{{ duplicate.explanation }}</p>
              </div>
              <StatusBadge :status="duplicate.resolution" />
            </div>
            <div class="panel__body duplicate-compare">
              <div>
                <span>SOLICITUD</span><strong>{{ duplicate.sourceDescription }}</strong
                ><small class="mono">{{ duplicate.sourceMaterialId }}</small>
              </div>
              <div class="duplicate-score">
                <Copy :size="21" /><strong>{{ Math.round(duplicate.score * 100) }}%</strong
                ><span>similitud</span>
              </div>
              <div>
                <span>CATÁLOGO</span><strong>{{ duplicate.candidateDescription }}</strong
                ><small class="mono">{{ duplicate.candidateMaterialId }}</small>
              </div>
            </div>
            <div class="duplicate-breakdown">
              <span
                >Fabricante
                <b>{{ Math.round(duplicate.scoreBreakdown.manufacturer * 100) }}%</b></span
              >
              <span
                >Modelo <b>{{ Math.round(duplicate.scoreBreakdown.model * 100) }}%</b></span
              >
              <span
                >Descripción
                <b>{{ Math.round(duplicate.scoreBreakdown.description * 100) }}%</b></span
              >
              <span
                >Atributos <b>{{ Math.round(duplicate.scoreBreakdown.attributes * 100) }}%</b></span
              >
            </div>
            <div
              v-if="duplicate.resolution === 'PENDING' && auth.can('duplicate:resolve')"
              class="duplicate-actions"
            >
              <FjButton :loading="actionLoading" @click="resolveDuplicate(duplicate.id, 'LINKED')"
                ><ExternalLink :size="15" /> Enlazar al existente</FjButton
              >
              <FjButton variant="secondary" @click="resolveDuplicate(duplicate.id, 'NOT_DUPLICATE')"
                >No es duplicado</FjButton
              >
            </div>
          </article>
        </div>
      </section>

      <section v-else-if="activeTab === 'workflow'" class="panel">
        <div class="panel__header">
          <h2>Historial de workflow</h2>
          <FjBadge>{{ request.workflow.length }} eventos</FjBadge>
        </div>
        <ol class="timeline">
          <li v-for="event in [...request.workflow].reverse()" :key="event.id">
            <span class="timeline__node"></span>
            <div>
              <span
                ><StatusBadge :status="event.toState" /><small>{{
                  formatDate(event.createdAt)
                }}</small></span
              >
              <strong>{{ event.reason }}</strong>
              <p>{{ event.actorName }} · {{ event.actorRole }} · {{ event.source }}</p>
              <code>{{ event.correlationId }}</code>
            </div>
          </li>
        </ol>
      </section>

      <section v-else-if="activeTab === 'documents'">
        <StatePanel
          v-if="request.documents.length === 0"
          kind="empty"
          title="No hay documentos"
          description="La solicitud fue creada manualmente."
        />
        <div v-else class="document-grid">
          <article
            v-for="document in request.documents"
            :key="document.id"
            class="panel document-card"
          >
            <span><FileText :size="23" /></span>
            <div>
              <strong>{{ document.fileName }}</strong
              ><small
                >{{ document.mimeType }} · {{ Math.round(document.size / 1024) }} KB ·
                {{ document.pageCount }} páginas</small
              >
            </div>
            <FjBadge tone="ai">{{ document.provider }}</FjBadge>
          </article>
        </div>
      </section>

      <section v-if="syncJob" class="panel sync-result">
        <div class="panel__header">
          <h2>Último resultado SAP</h2>
          <StatusBadge :status="syncJob.status" />
        </div>
        <div class="panel__body">
          <div>
            <span>Adaptador</span><strong>{{ syncJob.adapter }}</strong>
          </div>
          <div>
            <span>Correlation ID</span><strong class="mono">{{ syncJob.correlationId }}</strong>
          </div>
          <div>
            <span>HTTP</span><strong>{{ syncJob.httpStatus }}</strong>
          </div>
          <div>
            <span>SAP Product ID</span
            ><strong class="mono">{{ syncJob.sapProductId ?? '—' }}</strong>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.detail-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
}

.detail-header__main {
  display: grid;
  max-width: 58rem;
  justify-items: start;
  gap: 0.55rem;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-info-text);
  font-size: 0.72rem;
  font-weight: 700;
}

.detail-header__title {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.detail-header__title h1 {
  margin: 0.15rem 0 0;
  font-size: clamp(1.7rem, 4vw, 2.6rem);
  letter-spacing: -0.045em;
}

.detail-id {
  color: var(--color-text-muted);
  font-size: 0.66rem;
}

.detail-header__main > p {
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.detail-meta,
.detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.detail-meta span {
  padding-right: 0.55rem;
  border-right: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 0.7rem;
}

.detail-meta span:last-child {
  border: 0;
}

.notice {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.75rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.76rem;
}

.notice--info {
  background: color-mix(in srgb, var(--color-info) 8%, var(--color-surface));
  color: var(--color-info-text);
}

.notice--success {
  background: color-mix(in srgb, var(--color-success) 8%, var(--color-surface));
  color: var(--color-success-text);
}

.notice--error {
  background: color-mix(in srgb, var(--color-danger) 8%, var(--color-surface));
  color: var(--color-danger-text);
}

.pipeline-card {
  display: grid;
  gap: 0.8rem;
  padding: 0.9rem 1rem;
}

.pipeline-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.pipeline-card__top > div {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.pipeline-card__top > span {
  color: var(--color-text-muted);
  font-size: 0.65rem;
}

.pipeline-steps {
  display: grid;
  gap: 0.4rem;
  grid-template-columns: repeat(6, 1fr);
}

.pipeline-steps span {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-text-muted);
  font-size: 0.64rem;
}

.pipeline-steps span::before {
  display: grid;
  width: 1rem;
  height: 1rem;
  place-items: center;
  border-radius: 999px;
  background: var(--color-surface-muted);
  content: '·';
}

.pipeline-steps span[data-complete='true']::before {
  background: var(--color-success);
  color: white;
  content: '✓';
}

.detail-tabs {
  display: flex;
  overflow-x: auto;
  gap: 0.25rem;
  padding: 0.3rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.detail-tabs button {
  display: flex;
  min-height: 2.35rem;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.75rem;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.73rem;
  font-weight: 700;
  white-space: nowrap;
}

.detail-tabs button[aria-current='page'] {
  background: var(--color-surface-muted);
  color: var(--color-text);
}

.detail-tabs button span {
  padding: 0.1rem 0.33rem;
  border-radius: 999px;
  background: var(--color-surface-muted);
  font-size: 0.62rem;
}

.detail-grid,
.suggestion-layout {
  display: grid;
  align-items: start;
  gap: 1rem;
  grid-template-columns: minmax(0, 1fr) minmax(18rem, 0.4fr);
}

.checklist {
  display: grid;
  gap: 0.75rem;
}

.checklist > div {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.checklist > div > span {
  display: grid;
  width: 1.7rem;
  height: 1.7rem;
  place-items: center;
  border-radius: 999px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
}

.checklist > div > span[data-ok='true'] {
  background: color-mix(in srgb, var(--color-success) 16%, transparent);
  color: var(--color-success-text);
}

.checklist p {
  display: grid;
  gap: 0.15rem;
  margin: 0;
}

.checklist strong {
  font-size: 0.78rem;
}

.checklist small {
  color: var(--color-text-muted);
  font-size: 0.68rem;
}

.next-action {
  display: grid;
  justify-items: start;
  gap: 0.65rem;
}

.next-action > svg {
  color: var(--color-accent-strong);
}

.next-action p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  line-height: 1.5;
}

.panel__header p {
  margin: 0.2rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.68rem;
}

.suggestion-list {
  display: grid;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem 1rem;
  border-bottom: 1px solid var(--color-border);
}

.suggestion-item:last-child {
  border-bottom: 0;
}

.suggestion-item__main {
  display: grid;
  flex: 1;
  gap: 0.35rem;
}

.suggestion-item__main > span {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.suggestion-item__main strong {
  font-size: 0.78rem;
}

.suggestion-item__main p {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
  margin: 0;
}

.suggestion-item__main p span {
  font-size: 1.05rem;
  font-weight: 800;
}

.suggestion-item__main p small {
  color: var(--color-text-muted);
}

.suggestion-item__main > small {
  color: var(--color-text-muted);
  font-size: 0.66rem;
}

.suggestion-item__status {
  display: grid;
  justify-items: end;
  gap: 0.45rem;
}

.suggestion-item__status > div {
  display: flex;
  gap: 0.3rem;
}

.suggestion-item__status button {
  display: grid;
  width: 1.9rem;
  height: 1.9rem;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background: var(--color-surface);
  cursor: pointer;
}

.suggestion-item__status button:first-child {
  color: var(--color-success-text);
}

.suggestion-item__status button:last-child {
  color: var(--color-danger-text);
}

.fake-document {
  position: relative;
  min-height: 17rem;
  padding: 1.4rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: #fffef9;
  color: #273142;
  box-shadow: 0 7px 25px rgb(15 23 42 / 0.07);
}

.fake-document > span {
  color: #64748b;
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.fake-document h3 {
  margin: 1.6rem 0;
}

.fake-document p {
  font-size: 0.75rem;
  line-height: 1.8;
}

.fake-document mark {
  padding: 0.15rem 0.25rem;
  border-radius: 0.25rem;
  background: #fde68a;
  color: #5b3506;
}

.fake-document small {
  position: absolute;
  right: 1.4rem;
  bottom: 1.1rem;
  color: #94a3b8;
  font-size: 0.6rem;
}

.evidence-meta {
  display: grid;
  gap: 0.4rem;
  padding-top: 0.8rem;
  color: var(--color-text-muted);
  font-size: 0.67rem;
}

.duplicate-list {
  display: grid;
  gap: 1rem;
}

.duplicate-card .panel__header p {
  max-width: 48rem;
}

.duplicate-compare {
  display: grid;
  align-items: center;
  gap: 1rem;
  grid-template-columns: 1fr auto 1fr;
}

.duplicate-compare > div:not(.duplicate-score) {
  display: grid;
  min-height: 8rem;
  align-content: center;
  gap: 0.5rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-muted);
}

.duplicate-compare span {
  color: var(--color-text-muted);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.1em;
}

.duplicate-compare small {
  color: var(--color-text-muted);
  font-size: 0.65rem;
}

.duplicate-score {
  display: grid;
  justify-items: center;
  gap: 0.15rem;
  color: var(--color-accent-strong);
}

.duplicate-score strong {
  font-size: 1.4rem;
}

.duplicate-breakdown,
.duplicate-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  padding: 0 1rem 1rem;
}

.duplicate-breakdown span {
  padding: 0.4rem 0.55rem;
  border-radius: var(--radius-sm);
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.66rem;
}

.timeline {
  display: grid;
  padding: 1rem 1.2rem;
  margin: 0;
  list-style: none;
}

.timeline li {
  position: relative;
  display: grid;
  gap: 0.8rem;
  padding: 0 0 1.4rem 1.7rem;
  grid-template-columns: auto 1fr;
}

.timeline li::before {
  position: absolute;
  top: 0.8rem;
  bottom: -0.5rem;
  left: 0.37rem;
  width: 1px;
  background: var(--color-border-strong);
  content: '';
}

.timeline li:last-child::before {
  display: none;
}

.timeline__node {
  position: absolute;
  top: 0.35rem;
  left: 0;
  width: 0.8rem;
  height: 0.8rem;
  border: 2px solid var(--color-surface);
  border-radius: 999px;
  background: var(--color-accent);
  box-shadow: 0 0 0 1px var(--color-border-strong);
}

.timeline li > div {
  display: grid;
  gap: 0.35rem;
}

.timeline li > div > span {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.timeline small,
.timeline p,
.timeline code {
  color: var(--color-text-muted);
  font-size: 0.65rem;
}

.timeline p {
  margin: 0;
}

.document-grid {
  display: grid;
  gap: 0.8rem;
}

.document-card {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.9rem;
}

.document-card > span:first-child {
  display: grid;
  width: 2.6rem;
  height: 2.6rem;
  place-items: center;
  border-radius: 0.7rem;
  background: var(--color-surface-muted);
  color: var(--color-ai-text);
}

.document-card > div {
  display: grid;
  flex: 1;
  gap: 0.2rem;
}

.document-card small {
  color: var(--color-text-muted);
  font-size: 0.67rem;
}

.sync-result .panel__body {
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(4, 1fr);
}

.sync-result .panel__body > div {
  display: grid;
  gap: 0.25rem;
}

.sync-result .panel__body span {
  color: var(--color-text-muted);
  font-size: 0.65rem;
}

.sync-result .panel__body strong {
  font-size: 0.75rem;
}

@media (max-width: 900px) {
  .detail-header {
    align-items: stretch;
    flex-direction: column;
  }

  .detail-grid,
  .suggestion-layout {
    grid-template-columns: 1fr;
  }

  .pipeline-steps {
    grid-template-columns: repeat(3, 1fr);
  }

  .sync-result .panel__body {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 620px) {
  .duplicate-compare {
    grid-template-columns: 1fr;
  }

  .pipeline-steps,
  .sync-result .panel__body {
    grid-template-columns: 1fr;
  }
}
</style>
