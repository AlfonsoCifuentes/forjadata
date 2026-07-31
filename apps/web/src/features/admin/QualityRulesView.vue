<script setup lang="ts">
import type {
  CreateQualityRuleInput,
  QualityResult,
  QualityRule,
  QualityRuleCondition,
  QualityRuleOperator,
} from '@forjadata/contracts'
import { FlaskConical, Plus, Save, ShieldCheck, Trash2 } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'

import FjBadge from '@/components/base/FjBadge.vue'
import FjButton from '@/components/base/FjButton.vue'
import StatePanel from '@/components/feedback/StatePanel.vue'
import { forjadataApi } from '@/services/forjadata-api'

const rules = ref<QualityRule[]>([])
const selectedId = ref<string | null>(null)
const form = ref<CreateQualityRuleInput>(emptyRule())
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const testResult = ref<QualityResult | null>(null)

const selectedRule = computed(
  () => rules.value.find((rule) => rule.id === selectedId.value) ?? null,
)
const operators: Array<{ value: QualityRuleOperator; label: string }> = [
  { value: 'required', label: 'Es obligatorio' },
  { value: 'equals', label: 'Es igual a' },
  { value: 'notEquals', label: 'No es igual a' },
  { value: 'contains', label: 'Contiene' },
  { value: 'gte', label: 'Es mayor o igual que' },
  { value: 'lte', label: 'Es menor o igual que' },
  { value: 'between', label: 'Está entre' },
  { value: 'matches', label: 'Coincide con patrón' },
]
const fields = [
  ['manufacturer', 'Fabricante'],
  ['manufacturerPartNumber', 'Referencia de fabricante'],
  ['shortDescription', 'Descripción corta'],
  ['category', 'Categoría'],
  ['baseUnit', 'Unidad base'],
  ['completenessScore', 'Completitud'],
  ['confidenceScore', 'Confianza'],
  ['attributes.POWER', 'Atributo · Potencia'],
  ['attributes.VOLTAGE', 'Atributo · Tensión'],
  ['attributes.IP_RATING', 'Atributo · Protección IP'],
] as const

onMounted(load)

async function load(): Promise<void> {
  try {
    rules.value = await forjadataApi.listQualityRules()
    if (rules.value[0]) selectRule(rules.value[0])
  } catch (cause) {
    error.value = message(cause)
  } finally {
    loading.value = false
  }
}

function selectRule(rule: QualityRule): void {
  selectedId.value = rule.id
  form.value = {
    category: rule.category,
    code: rule.code,
    name: rule.name,
    description: rule.description,
    severity: rule.severity,
    expression: {
      combinator: rule.expression.combinator,
      conditions: rule.expression.conditions.map((condition) => ({ ...condition })),
    },
    message: rule.message,
    status: rule.status,
  }
  testResult.value = null
}

function startNew(): void {
  selectedId.value = null
  form.value = emptyRule()
  testResult.value = null
}

function addCondition(): void {
  form.value.expression.conditions.push({
    field: 'manufacturer',
    operator: 'required',
  })
}

function removeCondition(index: number): void {
  if (form.value.expression.conditions.length === 1) return
  form.value.expression.conditions.splice(index, 1)
}

async function save(): Promise<void> {
  saving.value = true
  error.value = null
  try {
    const current = selectedRule.value
    const input = currentFormInput()
    const saved = current
      ? await forjadataApi.updateQualityRule(current.id, {
          ...input,
          expectedVersion: current.version,
        })
      : await forjadataApi.createQualityRule(input)
    const index = rules.value.findIndex((rule) => rule.id === saved.id)
    if (index >= 0) rules.value[index] = saved
    else rules.value.unshift(saved)
    selectRule(saved)
  } catch (cause) {
    error.value = message(cause)
  } finally {
    saving.value = false
  }
}

async function testRule(): Promise<void> {
  if (!selectedRule.value) return
  error.value = null
  try {
    testResult.value = await forjadataApi.testQualityRule(selectedRule.value.id, 'mat-motor-review')
  } catch (cause) {
    error.value = message(cause)
  }
}

function emptyRule(): CreateQualityRuleInput {
  return {
    category: null,
    code: 'NEW_QUALITY_RULE',
    name: 'Nueva regla de calidad',
    description: '',
    severity: 'WARNING',
    expression: {
      combinator: 'ALL',
      conditions: [{ field: 'manufacturer', operator: 'required' }],
    },
    message: 'Revisa los datos antes de continuar.',
    status: 'ACTIVE',
  }
}

function currentFormInput(): CreateQualityRuleInput {
  return {
    category: form.value.category,
    code: form.value.code,
    name: form.value.name,
    description: form.value.description,
    severity: form.value.severity,
    expression: {
      combinator: form.value.expression.combinator,
      conditions: form.value.expression.conditions.map((condition) => ({ ...condition })),
    },
    message: form.value.message,
    status: form.value.status,
  }
}

function requiresValue(condition: QualityRuleCondition): boolean {
  return condition.operator !== 'required'
}

function message(cause: unknown): string {
  return cause instanceof Error ? cause.message : 'No se pudo completar la operación.'
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <span class="eyebrow"><ShieldCheck :size="14" /> Administración · P2</span>
        <h1>Reglas de calidad</h1>
        <p>
          Construye condiciones seguras, versionadas y auditables sin ejecutar código arbitrario.
        </p>
      </div>
      <FjButton @click="startNew"><Plus :size="15" /> Nueva regla</FjButton>
    </header>

    <StatePanel v-if="loading" kind="loading" title="Cargando reglas" />
    <StatePanel
      v-else-if="error && rules.length === 0"
      kind="error"
      title="Reglas no disponibles"
      :description="error"
    />

    <section v-else class="rules-layout">
      <aside class="panel rule-list" aria-label="Reglas configuradas">
        <div class="panel__header">
          <h2>Catálogo</h2>
          <FjBadge>{{ rules.length }}</FjBadge>
        </div>
        <button
          v-for="rule in rules"
          :key="rule.id"
          type="button"
          class="rule-card"
          :class="{ 'rule-card--active': selectedId === rule.id }"
          @click="selectRule(rule)"
        >
          <span
            ><strong>{{ rule.name }}</strong
            ><code>{{ rule.code }} · v{{ rule.version }}</code></span
          >
          <FjBadge
            :tone="
              rule.severity === 'ERROR'
                ? 'danger'
                : rule.severity === 'WARNING'
                  ? 'warning'
                  : 'info'
            "
          >
            {{ rule.severity }}
          </FjBadge>
        </button>
      </aside>

      <form class="panel builder" @submit.prevent="save">
        <div class="panel__header">
          <div>
            <span class="eyebrow">Constructor visual</span>
            <h2>{{ selectedRule ? selectedRule.name : 'Nueva regla' }}</h2>
          </div>
          <FjBadge :tone="form.status === 'ACTIVE' ? 'success' : 'neutral'">{{
            form.status
          }}</FjBadge>
        </div>

        <p v-if="error" class="form-error" role="alert">{{ error }}</p>

        <div class="form-grid">
          <label
            >Código<input v-model.trim="form.code" required pattern="[A-Z][A-Z0-9_]{2,39}"
          /></label>
          <label
            >Nombre<input v-model.trim="form.name" required minlength="3" maxlength="100"
          /></label>
          <label>
            Categoría
            <select v-model="form.category">
              <option :value="null">Todas</option>
              <option>Motores eléctricos</option>
              <option>Rodamientos</option>
              <option>Cables</option>
            </select>
          </label>
          <label>
            Severidad
            <select v-model="form.severity">
              <option value="INFO">Informativa</option>
              <option value="WARNING">Advertencia</option>
              <option value="ERROR">Bloqueante</option>
            </select>
          </label>
          <label class="span-2"
            >Descripción<textarea v-model.trim="form.description" maxlength="500"></textarea>
          </label>
          <label class="span-2"
            >Mensaje al usuario<input v-model.trim="form.message" required maxlength="240"
          /></label>
        </div>

        <fieldset class="condition-builder">
          <legend>La regla se supera cuando</legend>
          <label class="combinator">
            Combinar
            <select v-model="form.expression.combinator">
              <option value="ALL">todas las condiciones se cumplen</option>
              <option value="ANY">alguna condición se cumple</option>
            </select>
          </label>

          <div
            v-for="(condition, index) in form.expression.conditions"
            :key="index"
            class="condition-row"
          >
            <span class="condition-index">{{ index + 1 }}</span>
            <label>
              Campo
              <select v-model="condition.field">
                <option v-for="[value, label] in fields" :key="value" :value="value">
                  {{ label }}
                </option>
              </select>
            </label>
            <label>
              Operador
              <select v-model="condition.operator">
                <option v-for="operator in operators" :key="operator.value" :value="operator.value">
                  {{ operator.label }}
                </option>
              </select>
            </label>
            <label v-if="requiresValue(condition)">
              Valor
              <input
                v-model="condition.value"
                :type="['gte', 'lte', 'between'].includes(condition.operator) ? 'number' : 'text'"
                :step="['gte', 'lte', 'between'].includes(condition.operator) ? 'any' : undefined"
              />
            </label>
            <label v-if="condition.operator === 'between'">
              Valor máximo
              <input v-model.number="condition.secondValue" type="number" step="any" />
            </label>
            <button
              type="button"
              class="icon-button"
              :disabled="form.expression.conditions.length === 1"
              :aria-label="`Eliminar condición ${index + 1}`"
              @click="removeCondition(index)"
            >
              <Trash2 :size="16" />
            </button>
          </div>
          <FjButton type="button" variant="secondary" @click="addCondition"
            ><Plus :size="14" /> Añadir condición</FjButton
          >
        </fieldset>

        <div class="builder-actions">
          <label class="status-toggle">
            <input
              v-model="form.status"
              type="checkbox"
              true-value="ACTIVE"
              false-value="INACTIVE"
            />
            Regla activa
          </label>
          <div>
            <FjButton v-if="selectedRule" type="button" variant="secondary" @click="testRule">
              <FlaskConical :size="15" /> Probar con FJ-000241
            </FjButton>
            <FjButton type="submit" :loading="saving"><Save :size="15" /> Guardar versión</FjButton>
          </div>
        </div>

        <article
          v-if="testResult"
          class="test-result"
          :data-status="testResult.status"
          aria-live="polite"
        >
          <div>
            <strong>Resultado: {{ testResult.status }}</strong
            ><span>{{ testResult.message }}</span>
          </div>
          <ul>
            <li v-for="detail in testResult.details" :key="`${detail.field}-${detail.operator}`">
              {{ detail.field }} · {{ detail.operator }} · observado: {{ detail.actual ?? 'vacío' }}
              <b>{{ detail.passed ? 'PASS' : 'FAIL' }}</b>
            </li>
          </ul>
        </article>
      </form>
    </section>
  </div>
</template>

<style scoped>
.eyebrow {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-text-muted);
  font-size: 0.66rem;
  font-weight: 750;
}

.rules-layout {
  display: grid;
  align-items: start;
  gap: 1rem;
  grid-template-columns: minmax(15rem, 0.3fr) minmax(0, 1fr);
}

.rule-list {
  overflow: hidden;
}

.rule-card {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.85rem 1rem;
  border: 0;
  border-top: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
}

.rule-card:hover,
.rule-card--active {
  background: var(--color-surface-muted);
}

.rule-card--active {
  box-shadow: inset 3px 0 var(--color-accent);
}

.rule-card > span {
  display: grid;
  gap: 0.2rem;
}

.rule-card strong {
  font-size: 0.74rem;
}

.rule-card code {
  color: var(--color-text-muted);
  font-size: 0.6rem;
}

.builder {
  padding-bottom: 1rem;
}

.form-grid {
  display: grid;
  gap: 0.85rem;
  padding: 1rem;
  grid-template-columns: repeat(2, 1fr);
}

.builder label {
  display: grid;
  gap: 0.35rem;
  color: var(--color-text-muted);
  font-size: 0.66rem;
  font-weight: 700;
}

.builder input,
.builder select,
.builder textarea {
  min-width: 0;
  padding: 0.62rem 0.7rem;
  border: 1px solid var(--color-border);
  border-radius: 0.55rem;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: 0.72rem;
}

.builder textarea {
  min-height: 4rem;
  resize: vertical;
}

.span-2 {
  grid-column: span 2;
}

.condition-builder {
  display: grid;
  gap: 0.8rem;
  margin: 0 1rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
}

.condition-builder legend {
  padding: 0 0.4rem;
  font-size: 0.75rem;
  font-weight: 800;
}

.combinator {
  max-width: 24rem;
}

.condition-row {
  display: grid;
  align-items: end;
  gap: 0.55rem;
  grid-template-columns: auto 1fr 1fr 0.8fr 0.8fr auto;
}

.condition-index {
  display: grid;
  width: 1.8rem;
  height: 1.8rem;
  margin-bottom: 0.35rem;
  place-items: center;
  border-radius: 50%;
  background: var(--color-surface-muted);
  font-size: 0.68rem;
  font-weight: 800;
}

.builder-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
}

.builder-actions > div {
  display: flex;
  gap: 0.55rem;
}

.status-toggle {
  display: flex !important;
  align-items: center;
  grid-auto-flow: column;
}

.status-toggle input {
  width: 1rem;
}

.form-error {
  margin: 0.75rem 1rem 0;
  padding: 0.7rem;
  border-radius: 0.55rem;
  background: color-mix(in srgb, var(--color-danger) 12%, transparent);
  color: var(--color-danger-text);
  font-size: 0.7rem;
}

.test-result {
  display: grid;
  gap: 0.65rem;
  margin: 0 1rem;
  padding: 0.85rem;
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--color-success);
  border-radius: 0.6rem;
}

.test-result[data-status='FAIL'] {
  border-left-color: var(--color-danger);
}

.test-result > div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.72rem;
}

.test-result ul {
  display: grid;
  gap: 0.3rem;
  margin: 0;
  padding-left: 1.1rem;
  color: var(--color-text-muted);
  font-size: 0.65rem;
}

.test-result li b {
  float: right;
}

@media (max-width: 950px) {
  .rules-layout,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .span-2 {
    grid-column: auto;
  }

  .condition-row {
    grid-template-columns: auto 1fr;
  }

  .condition-row label {
    grid-column: 2;
  }

  .builder-actions,
  .builder-actions > div {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
