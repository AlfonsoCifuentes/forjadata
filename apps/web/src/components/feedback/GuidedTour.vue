<script setup lang="ts">
import { ArrowLeft, ArrowRight, Check, Compass, X } from '@lucide/vue'
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'

import FjButton from '@/components/base/FjButton.vue'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const router = useRouter()

const steps = computed(() =>
  ui.locale === 'es'
    ? [
        {
          title: 'Dashboard',
          description: 'Sitúa el escenario sintético con KPIs, carga y alertas.',
          to: '/app/dashboard',
        },
        {
          title: 'Catálogo',
          description: 'Explora el grid gobernado, filtros y estado de sincronización.',
          to: '/app/materials',
        },
        {
          title: 'Nueva solicitud',
          description: 'Crea un borrador validado y adjunta evidencia sintética.',
          to: '/app/requests/new',
        },
        {
          title: 'Sugerencias',
          description: 'Revisa valores propuestos, confianza y evidencia localizada.',
          to: '/app/requests/req-motor-001',
        },
        {
          title: 'Duplicados',
          description: 'Compara candidatos y exige una resolución humana.',
          to: '/app/duplicates',
        },
        {
          title: 'Workflow',
          description: 'Observa estados, permisos, versión y decisiones auditadas.',
          to: '/app/review',
        },
        {
          title: 'SAP',
          description: 'Comprueba validación, sincronización y reintentos del simulador.',
          to: '/app/sap',
        },
        {
          title: 'Arquitectura',
          description: 'Cierra con decisiones, modos reales y límites honestos.',
          to: '/app/architecture',
        },
      ]
    : [
        {
          title: 'Dashboard',
          description: 'Frame the synthetic scenario through KPIs, workload, and alerts.',
          to: '/app/dashboard',
        },
        {
          title: 'Catalog',
          description: 'Explore the governed grid, filters, and synchronization status.',
          to: '/app/materials',
        },
        {
          title: 'New request',
          description: 'Create a validated draft and attach synthetic evidence.',
          to: '/app/requests/new',
        },
        {
          title: 'Suggestions',
          description: 'Review proposed values, confidence, and localized evidence.',
          to: '/app/requests/req-motor-001',
        },
        {
          title: 'Duplicates',
          description: 'Compare candidates and require a human resolution.',
          to: '/app/duplicates',
        },
        {
          title: 'Workflow',
          description: 'Inspect states, permissions, versions, and audited decisions.',
          to: '/app/review',
        },
        {
          title: 'SAP',
          description: 'Inspect validation, synchronization, and simulator retries.',
          to: '/app/sap',
        },
        {
          title: 'Architecture',
          description: 'Finish with decisions, real modes, and honest limitations.',
          to: '/app/architecture',
        },
      ],
)

const current = computed(() => steps.value[ui.tourStep] ?? steps.value[0]!)
const copy = computed(() =>
  ui.locale === 'es'
    ? {
        label: 'Recorrido guiado',
        step: 'Paso',
        of: 'de',
        skip: 'Saltar recorrido',
        close: 'Cerrar recorrido',
        previous: 'Anterior',
        next: 'Siguiente',
        finish: 'Finalizar',
      }
    : {
        label: 'Guided tour',
        step: 'Step',
        of: 'of',
        skip: 'Skip tour',
        close: 'Close tour',
        previous: 'Previous',
        next: 'Next',
        finish: 'Finish',
      },
)

watch(
  () => [ui.tourActive, ui.tourStep] as const,
  async ([active]) => {
    if (active) await router.push(current.value.to)
  },
)

function previous(): void {
  ui.setTourStep(ui.tourStep - 1)
}

function next(): void {
  if (ui.tourStep === steps.value.length - 1) {
    ui.closeTour('completed')
    return
  }
  ui.setTourStep(ui.tourStep + 1)
}
</script>

<template>
  <div
    v-if="ui.tourActive"
    class="tour-layer"
    role="presentation"
    @keydown.esc="ui.closeTour('dismissed')"
  >
    <section
      class="tour-card"
      role="dialog"
      aria-modal="true"
      :aria-label="copy.label"
      aria-live="polite"
    >
      <header>
        <span><Compass :size="15" /> {{ copy.label }}</span>
        <button
          type="button"
          class="icon-button"
          :aria-label="copy.close"
          @click="ui.closeTour('dismissed')"
        >
          <X :size="17" />
        </button>
      </header>

      <div class="tour-progress" aria-hidden="true">
        <i
          v-for="(_, index) in steps"
          :key="index"
          :class="{ 'tour-progress--done': index <= ui.tourStep }"
        ></i>
      </div>

      <div class="tour-copy">
        <small>{{ copy.step }} {{ ui.tourStep + 1 }} {{ copy.of }} {{ steps.length }}</small>
        <h2>{{ current.title }}</h2>
        <p>{{ current.description }}</p>
      </div>

      <footer>
        <button type="button" class="tour-skip" @click="ui.closeTour('skipped')">
          {{ copy.skip }}
        </button>
        <div>
          <FjButton v-if="ui.tourStep > 0" type="button" variant="secondary" @click="previous">
            <ArrowLeft :size="14" /> {{ copy.previous }}
          </FjButton>
          <FjButton type="button" @click="next">
            <Check v-if="ui.tourStep === steps.length - 1" :size="14" />
            <ArrowRight v-else :size="14" />
            {{ ui.tourStep === steps.length - 1 ? copy.finish : copy.next }}
          </FjButton>
        </div>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.tour-layer {
  position: fixed;
  z-index: 120;
  inset: 0;
  pointer-events: none;
}

.tour-card {
  position: absolute;
  right: 1.25rem;
  bottom: 1.25rem;
  width: min(27rem, calc(100vw - 2rem));
  overflow: hidden;
  border: 1px solid var(--color-border-strong);
  border-radius: 0.9rem;
  background: var(--color-surface);
  box-shadow: 0 1.2rem 3rem rgb(2 12 23 / 0.28);
  color: var(--color-text);
  pointer-events: auto;
}

.tour-card header,
.tour-card footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
}

.tour-card header {
  border-bottom: 1px solid var(--color-border);
}

.tour-card header > span {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-accent-strong);
  font-size: 0.68rem;
  font-weight: 850;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.tour-progress {
  display: grid;
  gap: 0.25rem;
  padding: 0.8rem 1rem 0;
  grid-template-columns: repeat(8, 1fr);
}

.tour-progress i {
  height: 0.2rem;
  border-radius: 999px;
  background: var(--color-border);
}

.tour-progress .tour-progress--done {
  background: var(--color-accent);
}

.tour-copy {
  padding: 1rem;
}

.tour-copy small {
  color: var(--color-text-muted);
  font-size: 0.65rem;
  font-weight: 750;
}

.tour-copy h2 {
  margin: 0.28rem 0 0.4rem;
  font-size: 1.1rem;
}

.tour-copy p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.74rem;
  line-height: 1.6;
}

.tour-card footer {
  border-top: 1px solid var(--color-border);
}

.tour-card footer > div {
  display: flex;
  gap: 0.45rem;
}

.tour-skip {
  padding: 0.35rem 0;
  border: 0;
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: 0.67rem;
  text-decoration: underline;
  cursor: pointer;
}

@media (max-width: 550px) {
  .tour-card {
    right: 0.75rem;
    bottom: 0.75rem;
    left: 0.75rem;
    width: auto;
  }

  .tour-card footer {
    align-items: stretch;
    flex-direction: column;
  }

  .tour-card footer > div {
    justify-content: flex-end;
  }
}
</style>
