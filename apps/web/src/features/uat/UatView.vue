<script setup lang="ts">
import {
  BadgeCheck,
  CheckCircle2,
  CircleDashed,
  FlaskConical,
  ImagePlus,
  Play,
  XCircle,
} from '@lucide/vue'
import type { UatExecution, UatRelease, UatResult, UatScenario } from '@forjadata/contracts'
import { computed, onMounted, reactive, ref } from 'vue'

import FjBadge from '@/components/base/FjBadge.vue'
import FjButton from '@/components/base/FjButton.vue'
import StatePanel from '@/components/feedback/StatePanel.vue'
import { forjadataApi } from '@/services/forjadata-api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const release = ref<UatRelease | null>(null)
const loading = ref(true)
const savingId = ref<string | null>(null)
const error = ref<string | null>(null)
const comments = reactive<Record<string, string>>({})

const scenarios = computed(() =>
  (release.value?.scenarios ?? []).map((scenario) => ({
    ...scenario,
    execution: release.value?.executions.find((item) => item.scenarioId === scenario.id),
  })),
)

const completed = computed(
  () => scenarios.value.filter((scenario) => resultOf(scenario.execution) !== 'NOT_RUN').length,
)
const passed = computed(
  () => scenarios.value.filter((scenario) => resultOf(scenario.execution) === 'PASSED').length,
)

onMounted(load)

async function load(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    release.value = (await forjadataApi.listUatReleases())[0] ?? null
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'No se pudo cargar el plan UAT.'
  } finally {
    loading.value = false
  }
}

function resultOf(execution: UatExecution | undefined): UatResult {
  return execution?.status ?? 'NOT_RUN'
}

async function cycle(scenario: UatScenario & { execution?: UatExecution }): Promise<void> {
  if (!auth.can('uat:execute')) return
  savingId.value = scenario.id
  try {
    const execution = await ensureExecution(scenario)
    const order: UatResult[] = ['NOT_RUN', 'PASSED', 'FAILED', 'BLOCKED']
    const current = order.indexOf(execution.status)
    const status = order[(current + 1) % order.length] ?? 'NOT_RUN'
    const comment =
      comments[scenario.id] ??
      (status === 'NOT_RUN' ? '' : `Resultado ${status} registrado en modo demo.`)
    const updated = await forjadataApi.updateUatExecution(execution.id, {
      status,
      comment,
      stepResults:
        status === 'NOT_RUN'
          ? []
          : scenario.steps.map((step) => ({
              stepId: step.id,
              result: status,
              comment: comment || 'Paso UAT ejecutado.',
            })),
      ...(status === 'FAILED'
        ? {
            issue: {
              title: `Incidencia demo: ${scenario.title}`,
              severity: 'MEDIUM' as const,
            },
          }
        : {}),
    })
    replaceExecution(updated)
  } finally {
    savingId.value = null
  }
}

async function addEvidence(scenario: UatScenario & { execution?: UatExecution }): Promise<void> {
  if (!auth.can('uat:execute')) return
  savingId.value = scenario.id
  try {
    const execution = await ensureExecution(scenario)
    const log = [
      `Forjadata UAT evidence`,
      `Scenario: ${scenario.code} - ${scenario.title}`,
      `Recorded at: ${new Date().toISOString()}`,
      `Comment: ${comments[scenario.id] ?? 'Sin comentario adicional.'}`,
    ].join('\n')
    const updated = await forjadataApi.addUatEvidence(execution.id, {
      fileName: `${scenario.code.toLocaleLowerCase('en')}-evidencia.txt`,
      mimeType: 'text/plain',
      kind: 'LOG',
      comment: comments[scenario.id] ?? 'Log verificable de la ejecución UAT.',
      contentBase64: bytesToBase64(new TextEncoder().encode(log)),
    })
    replaceExecution(updated)
  } finally {
    savingId.value = null
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

async function signOff(scenario: UatScenario & { execution?: UatExecution }): Promise<void> {
  if (!auth.can('uat:execute')) return
  savingId.value = scenario.id
  try {
    const execution = await ensureExecution(scenario)
    const decision =
      execution.status === 'PASSED'
        ? 'APPROVED'
        : execution.status === 'FAILED'
          ? 'REJECTED'
          : 'BLOCKED'
    const updated = await forjadataApi.signOffUatExecution(execution.id, {
      decision,
      comment: comments[scenario.id] ?? `Sign-off demo: ${decision}.`,
    })
    replaceExecution(updated)
    if (release.value) release.value.status = decision
  } finally {
    savingId.value = null
  }
}

async function ensureExecution(
  scenario: UatScenario & { execution?: UatExecution },
): Promise<UatExecution> {
  if (scenario.execution) return scenario.execution
  const currentRelease = release.value
  const plan = currentRelease?.plans[0]
  if (!currentRelease || !plan) throw new Error('El plan UAT demo no está disponible.')
  const execution = await forjadataApi.createUatExecution({
    releaseId: currentRelease.id,
    planId: plan.id,
    scenarioId: scenario.id,
  })
  replaceExecution(execution)
  return execution
}

function replaceExecution(execution: UatExecution): void {
  if (!release.value) return
  const index = release.value.executions.findIndex((item) => item.id === execution.id)
  if (index >= 0) release.value.executions[index] = execution
  else release.value.executions.push(execution)
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>UAT · Release {{ release?.version ?? '0.1.0' }}</h1>
        <p>Plan de aceptación ejecutable con datos sintéticos y evidencias demo.</p>
      </div>
      <FjBadge tone="info"><FlaskConical :size="13" /> {{ release?.status ?? 'CARGANDO' }}</FjBadge>
    </header>

    <StatePanel v-if="loading" kind="loading" title="Cargando plan UAT" />
    <StatePanel v-else-if="error" kind="error" title="No se pudo cargar UAT" :description="error">
      <FjButton variant="secondary" @click="load">Reintentar</FjButton>
    </StatePanel>
    <StatePanel
      v-else-if="!release"
      kind="empty"
      title="No hay una release UAT disponible"
      description="Restablece los datos demo para recuperar el plan sintético."
    />

    <template v-else>
      <section class="uat-summary">
        <article class="panel">
          <span>Cobertura</span><strong>{{ completed }}/{{ scenarios.length }}</strong
          ><small>escenarios ejecutados</small>
        </article>
        <article class="panel">
          <span>Aprobados</span><strong>{{ passed }}</strong
          ><small
            >{{ completed ? Math.round((passed / completed) * 100) : 0 }}% de los ejecutados</small
          >
        </article>
        <article class="panel">
          <span>Sign-off</span><strong>{{ release.status }}</strong
          ><small>Se firma por escenario y queda registrado en auditoría</small>
        </article>
      </section>

      <p v-if="!auth.can('uat:execute')" class="uat-permission panel" role="status">
        Cambia al rol Tester UAT o Administrador para ejecutar, adjuntar evidencia demo y firmar.
      </p>

      <section class="panel">
        <div class="panel__header">
          <div>
            <h2>Suite principal</h2>
            <p>Pulsa un resultado para recorrer sus estados demo.</p>
          </div>
          <FjBadge>{{ scenarios.length }} escenarios</FjBadge>
        </div>
        <div class="uat-list">
          <article v-for="scenario in scenarios" :key="scenario.id" class="uat-row">
            <span class="uat-row__icon" :data-result="resultOf(scenario.execution)">
              <CheckCircle2 v-if="resultOf(scenario.execution) === 'PASSED'" :size="18" />
              <XCircle v-else-if="resultOf(scenario.execution) === 'FAILED'" :size="18" />
              <CircleDashed v-else :size="18" />
            </span>
            <div>
              <strong>{{ scenario.title }}</strong
              ><small class="mono"
                >{{ scenario.code }} · {{ scenario.priority }} · Responsable: Tester UAT</small
              >
              <input
                v-model="comments[scenario.id]"
                class="uat-comment"
                :aria-label="`Comentario para ${scenario.code}`"
                placeholder="Comentario opcional para el resultado o sign-off"
              />
            </div>
            <FjBadge
              :tone="
                resultOf(scenario.execution) === 'PASSED'
                  ? 'success'
                  : resultOf(scenario.execution) === 'FAILED'
                    ? 'danger'
                    : 'neutral'
              "
              >{{ resultOf(scenario.execution) }}</FjBadge
            >
            <div class="uat-actions">
              <FjButton
                variant="ghost"
                :loading="savingId === scenario.id"
                :disabled="!auth.can('uat:execute')"
                @click="cycle(scenario)"
                ><Play :size="14" /> Ejecutar</FjButton
              >
              <FjButton
                variant="ghost"
                :disabled="!auth.can('uat:execute') || savingId === scenario.id"
                @click="addEvidence(scenario)"
                ><ImagePlus :size="14" /> Evidencia</FjButton
              >
              <FjButton
                variant="ghost"
                :disabled="!auth.can('uat:execute') || savingId === scenario.id"
                @click="signOff(scenario)"
                ><BadgeCheck :size="14" /> Firmar</FjButton
              >
            </div>
          </article>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.uat-summary {
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(3, 1fr);
}

.uat-summary article {
  display: grid;
  gap: 0.35rem;
  padding: 1rem;
}

.uat-summary span,
.uat-summary small {
  color: var(--color-text-muted);
  font-size: 0.68rem;
}

.uat-summary strong {
  font-size: 1.55rem;
  letter-spacing: -0.04em;
}

.uat-list {
  display: grid;
}

.uat-row {
  display: grid;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border);
  grid-template-columns: auto 1fr auto minmax(18rem, auto);
}

.uat-row:last-child {
  border-bottom: 0;
}

.uat-row__icon {
  display: grid;
  width: 2.2rem;
  height: 2.2rem;
  place-items: center;
  border-radius: 0.65rem;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
}

.uat-row__icon[data-result='PASSED'] {
  color: var(--color-success-text);
}

.uat-row__icon[data-result='FAILED'] {
  color: var(--color-danger-text);
}

.uat-row > div {
  display: grid;
  gap: 0.2rem;
}

.uat-row strong {
  font-size: 0.76rem;
}

.uat-row small {
  color: var(--color-text-muted);
  font-size: 0.62rem;
}

.uat-comment {
  width: min(30rem, 100%);
  min-height: 1.8rem;
  padding: 0.25rem 0.45rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface-muted);
  color: var(--color-text);
  font-size: 0.68rem;
}

.uat-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.25rem;
}

.uat-permission {
  padding: 0.8rem 1rem;
  color: var(--color-warning-text);
  font-size: 0.75rem;
}

@media (max-width: 700px) {
  .uat-summary {
    grid-template-columns: 1fr;
  }

  .uat-row {
    grid-template-columns: auto 1fr auto;
  }

  .uat-actions {
    grid-column: 2 / -1;
    flex-wrap: wrap;
    justify-content: flex-start;
  }
}
</style>
