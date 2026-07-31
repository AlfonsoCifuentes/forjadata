<script setup lang="ts">
import { Clock3, ExternalLink, PlayCircle } from '@lucide/vue'
import { RouterLink } from 'vue-router'

import FjBadge from '@/components/base/FjBadge.vue'
import FjButton from '@/components/base/FjButton.vue'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()

const steps = [
  ['Dashboard', 'Comprueba KPIs sintéticos y abre una revisión prioritaria.'],
  ['Solicitud', 'Crea o usa el motor Siemens precargado.'],
  ['Sugerencias', 'Acepta valores y consulta su evidencia localizada.'],
  ['Duplicado', 'Enlaza la coincidencia antes de aprobar.'],
  ['Workflow', 'Aprueba con Data Steward y cambia a Especialista SAP.'],
  ['SAP', 'Sincroniza con el simulador y revisa auditoría.'],
]
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Ayuda y recorrido</h1>
        <p>Una demostración completa y defendible en menos de tres minutos.</p>
      </div>
      <FjBadge tone="success"><Clock3 :size="13" /> 90–180 segundos</FjBadge>
    </header>

    <section class="help-layout">
      <article class="panel">
        <div class="panel__header">
          <h2>Guion recomendado</h2>
          <FjButton type="button" variant="secondary" @click="ui.startTour">
            <PlayCircle :size="15" />
            {{ ui.tourPreference === 'not-started' ? 'Iniciar recorrido' : 'Reiniciar recorrido' }}
          </FjButton>
        </div>
        <ol class="demo-steps">
          <li v-for="([title, description], index) in steps" :key="title">
            <span>{{ index + 1 }}</span>
            <div>
              <strong>{{ title }}</strong>
              <p>{{ description }}</p>
            </div>
          </li>
        </ol>
      </article>

      <aside class="help-sidebar">
        <article class="panel">
          <div class="panel__body help-card">
            <h2>Atajos</h2>
            <span><kbd>Ctrl</kbd> + <kbd>K</kbd> Búsqueda global</span>
            <span><kbd>Tab</kbd> Navegar acciones</span>
            <span><kbd>Esc</kbd> Cerrar diálogos</span>
          </div>
        </article>
        <article class="panel">
          <div class="panel__body help-card">
            <h2>Profundidad técnica</h2>
            <p>La página de arquitectura explica decisiones, límites y proveedores.</p>
            <RouterLink to="/app/architecture"
              ><FjButton variant="secondary"
                >Abrir arquitectura <ExternalLink :size="15" /></FjButton
            ></RouterLink>
          </div>
        </article>
      </aside>
    </section>
  </div>
</template>

<style scoped>
.help-layout {
  display: grid;
  align-items: start;
  gap: 1rem;
  grid-template-columns: 1fr 0.4fr;
}

.demo-steps {
  display: grid;
  padding: 1rem;
  margin: 0;
  list-style: none;
}

.demo-steps li {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.8rem;
  border-bottom: 1px solid var(--color-border);
}

.demo-steps li:last-child {
  border-bottom: 0;
}

.demo-steps li > span {
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border-radius: 0.6rem;
  background: color-mix(in srgb, var(--color-accent) 15%, transparent);
  color: var(--color-accent-strong);
  font-size: 0.75rem;
  font-weight: 850;
}

.demo-steps div {
  display: grid;
  gap: 0.2rem;
}

.demo-steps strong {
  font-size: 0.78rem;
}

.demo-steps p,
.help-card p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.7rem;
  line-height: 1.5;
}

.help-sidebar {
  display: grid;
  gap: 0.8rem;
}

.help-card {
  display: grid;
  justify-items: start;
  gap: 0.7rem;
}

.help-card h2 {
  margin: 0;
  font-size: 0.9rem;
}

.help-card > span {
  color: var(--color-text-muted);
  font-size: 0.7rem;
}

kbd {
  padding: 0.14rem 0.32rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 0.3rem;
  background: var(--color-surface-muted);
  color: var(--color-text);
}

@media (max-width: 750px) {
  .help-layout {
    grid-template-columns: 1fr;
  }
}
</style>
