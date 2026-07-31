<script setup lang="ts">
import {
  ArrowRight,
  Boxes,
  Cloud,
  Database,
  FileCode2,
  MonitorSmartphone,
  Network,
  ShieldCheck,
  TestTube2,
} from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import FjBadge from '@/components/base/FjBadge.vue'
import FjButton from '@/components/base/FjButton.vue'

const route = useRoute()
const isPublic = computed(() => !route.path.startsWith('/app'))

const decisions = [
  ['Vue SPA con Vite', 'Carga por rutas, TypeScript estricto y Composition API.'],
  ['Monolito modular', 'Transacciones sencillas y límites de dominio extraíbles.'],
  ['Puertos y adaptadores', 'Mocks y proveedores reales comparten contrato.'],
  ['Polling abortable', 'Progreso de 2–10 s sin infraestructura realtime prematura.'],
  ['AG Grid Community', 'Catálogo profesional sin capacidades con licencia Enterprise.'],
  ['Bicep', 'Infraestructura Azure validable sin desplegar ni generar costes.'],
]
</script>

<template>
  <div :class="['architecture-page', { 'architecture-page--public': isPublic }]">
    <header v-if="isPublic" class="architecture-public-header">
      <RouterLink to="/" class="architecture-brand">forjadata</RouterLink>
      <RouterLink to="/demo"><FjButton variant="secondary">Abrir demo</FjButton></RouterLink>
    </header>

    <main id="main-content" class="architecture-content">
      <section class="architecture-hero">
        <div>
          <FjBadge tone="ai"><Boxes :size="13" /> Arquitectura explicada</FjBadge>
          <h1>Una demo sin dependencias falsas. Una arquitectura preparada para crecer.</h1>
          <p>
            Forjadata separa dominio, aplicación e infraestructura. El modo demo recorre exactamente
            los mismos casos de uso y contratos que la API, cambiando únicamente adaptadores y
            persistencia.
          </p>
        </div>
        <div class="architecture-stats">
          <span><strong>24</strong> módulos funcionales trazados</span>
          <span><strong>3</strong> aplicaciones en el monorepo</span>
          <span><strong>0</strong> credenciales dentro del código</span>
        </div>
      </section>

      <section class="system-map panel">
        <div class="panel__header">
          <div>
            <p class="eyebrow">VISTA DE CONTEXTO</p>
            <h2>Frontend, dominio y proveedores intercambiables</h2>
          </div>
          <FjBadge tone="success">Modo demo activo</FjBadge>
        </div>
        <div class="panel__body architecture-flow">
          <div class="flow-node flow-node--actor">
            <MonitorSmartphone :size="24" />
            <strong>Vue 3 SPA</strong>
            <span>Router · Pinia · AG Grid</span>
          </div>
          <ArrowRight class="flow-arrow" :size="24" />
          <div class="flow-node flow-node--core">
            <Network :size="24" />
            <strong>API / Casos de uso</strong>
            <span>Azure Functions v4</span>
          </div>
          <ArrowRight class="flow-arrow" :size="24" />
          <div class="flow-providers">
            <div>
              <Database :size="18" /><span><b>Persistencia</b> Memoria / PostgreSQL</span>
            </div>
            <div>
              <Cloud :size="18" /><span><b>Azure</b> Inline / Servicios reales</span>
            </div>
            <div>
              <FileCode2 :size="18" /><span><b>SAP</b> Simulator / OData</span>
            </div>
          </div>
        </div>
      </section>

      <section class="architecture-grid">
        <article class="panel">
          <div class="panel__body architecture-card">
            <ShieldCheck :size="24" />
            <h2>Seguridad por frontera</h2>
            <p>
              RBAC frontend y backend, Zod, optimistic concurrency, correlation IDs, redacción de
              logs y modo real denegado por defecto.
            </p>
            <span>Modelo STRIDE documentado</span>
          </div>
        </article>
        <article class="panel">
          <div class="panel__body architecture-card">
            <TestTube2 :size="24" />
            <h2>Pruebas conectadas al riesgo</h2>
            <p>
              Reglas críticas de workflow, contratos SAP/IA, integración REST, componentes,
              accesibilidad y recorrido E2E.
            </p>
            <span>Vitest · MSW · Playwright · axe</span>
          </div>
        </article>
      </section>

      <section>
        <div class="section-heading">
          <p class="eyebrow">DECISIONES REGISTRADAS</p>
          <h2>El porqué importa tanto como el stack</h2>
        </div>
        <div class="decision-grid">
          <article v-for="([title, description], index) in decisions" :key="title">
            <span class="mono">ADR-{{ String(index + 1).padStart(3, '0') }}</span>
            <h3>{{ title }}</h3>
            <p>{{ description }}</p>
          </article>
        </div>
      </section>

      <section class="limitations">
        <div>
          <p class="eyebrow">LIMITACIONES HONESTAS</p>
          <h2>Qué está simulado y qué falta para producción</h2>
        </div>
        <ul>
          <li><b>Autenticación:</b> Entra requiere registros SPA/API, scopes y roles.</li>
          <li><b>IA:</b> el proveedor mock es determinista; no llama a Azure AI.</li>
          <li>
            <b>SAP:</b> el simulador implementa contrato; OData requiere host y credenciales
            backend.
          </li>
          <li>
            <b>Cloud:</b> Bicep describe recursos; no se despliegan servicios con coste
            automáticamente.
          </li>
        </ul>
      </section>
    </main>
  </div>
</template>

<style scoped>
.architecture-page--public {
  min-height: 100vh;
}

.architecture-public-header {
  display: flex;
  width: min(74rem, calc(100% - 2rem));
  min-height: 4.5rem;
  align-items: center;
  justify-content: space-between;
  margin: 0 auto;
}

.architecture-brand {
  font-size: 1.15rem;
  font-weight: 850;
  letter-spacing: -0.04em;
}

.architecture-content {
  display: grid;
  width: min(74rem, calc(100% - 2rem));
  gap: 4rem;
  padding: 3rem 0 6rem;
  margin: 0 auto;
}

.architecture-hero {
  display: grid;
  align-items: end;
  gap: 3rem;
  grid-template-columns: 1.2fr 0.8fr;
}

.architecture-hero > div:first-child {
  display: grid;
  justify-items: start;
  gap: 1rem;
}

.architecture-hero h1 {
  max-width: 18ch;
  margin: 0;
  font-size: clamp(2.8rem, 6vw, 5.2rem);
  line-height: 1;
  letter-spacing: -0.065em;
}

.architecture-hero p {
  max-width: 48rem;
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.65;
}

.architecture-stats {
  display: grid;
  gap: 0.55rem;
  padding: 1rem;
  border-left: 2px solid var(--color-accent);
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.architecture-stats strong {
  color: var(--color-text);
  font-size: 1.3rem;
}

.eyebrow {
  margin: 0 0 0.25rem;
  color: var(--color-text-muted);
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.13em;
}

.architecture-flow {
  display: grid;
  align-items: center;
  gap: 1rem;
  grid-template-columns: 1fr auto 1fr auto 1.25fr;
}

.flow-node,
.flow-providers > div {
  display: grid;
  justify-items: start;
  gap: 0.45rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-muted);
}

.flow-node span,
.flow-providers span {
  color: var(--color-text-muted);
  font-size: 0.72rem;
}

.flow-node--core {
  border-color: color-mix(in srgb, var(--color-accent) 35%, var(--color-border));
  background: color-mix(in srgb, var(--color-accent) 8%, var(--color-surface));
}

.flow-providers {
  display: grid;
  gap: 0.5rem;
}

.flow-providers > div {
  display: flex;
  align-items: center;
  padding: 0.65rem;
}

.flow-arrow {
  color: var(--color-text-muted);
}

.architecture-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, 1fr);
}

.architecture-card {
  display: grid;
  justify-items: start;
  gap: 0.75rem;
}

.architecture-card :deep(svg) {
  color: var(--color-accent-strong);
}

.architecture-card h2,
.architecture-card p {
  margin: 0;
}

.architecture-card p {
  color: var(--color-text-muted);
  line-height: 1.55;
}

.architecture-card span {
  color: var(--color-info-text);
  font-size: 0.75rem;
  font-weight: 700;
}

.section-heading h2 {
  margin: 0;
  font-size: clamp(1.8rem, 4vw, 3rem);
  letter-spacing: -0.05em;
}

.decision-grid {
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(3, 1fr);
  margin-top: 1.5rem;
}

.decision-grid article {
  padding: 1.1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.decision-grid span {
  color: var(--color-accent-strong);
  font-size: 0.68rem;
}

.decision-grid h3 {
  margin: 0.7rem 0 0.35rem;
  font-size: 0.95rem;
}

.decision-grid p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
  line-height: 1.5;
}

.limitations {
  display: grid;
  gap: 2rem;
  padding: clamp(1.5rem, 5vw, 3rem);
  border-radius: var(--radius-xl);
  background: var(--graphite-950);
  color: white;
  grid-template-columns: 0.8fr 1.2fr;
}

.limitations h2 {
  margin: 0;
  font-size: 2rem;
  letter-spacing: -0.04em;
}

.limitations ul {
  display: grid;
  gap: 0.7rem;
  padding-left: 1.2rem;
  margin: 0;
  color: #b8c3d3;
  font-size: 0.82rem;
  line-height: 1.5;
}

@media (max-width: 850px) {
  .architecture-hero,
  .limitations {
    grid-template-columns: 1fr;
  }

  .architecture-flow {
    grid-template-columns: 1fr;
  }

  .flow-arrow {
    justify-self: center;
    transform: rotate(90deg);
  }

  .decision-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .architecture-grid,
  .decision-grid {
    grid-template-columns: 1fr;
  }
}
</style>
