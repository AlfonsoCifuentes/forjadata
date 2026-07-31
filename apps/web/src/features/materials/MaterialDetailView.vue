<script setup lang="ts">
import { ArrowLeft, FileSearch, ShieldCheck } from '@lucide/vue'
import type { MaterialDetail } from '@forjadata/contracts'
import { defineAsyncComponent, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import FjBadge from '@/components/base/FjBadge.vue'
import FjProgress from '@/components/base/FjProgress.vue'
import StatusBadge from '@/components/data-display/StatusBadge.vue'
import StatePanel from '@/components/feedback/StatePanel.vue'
import { forjadataApi } from '@/services/forjadata-api'

const route = useRoute()
const IndustrialModelViewer = defineAsyncComponent(() => import('./IndustrialModelViewer.vue'))
const material = ref<MaterialDetail | null>(null)
const viewerEnabled = ref(false)
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    const [loadedMaterial, features] = await Promise.all([
      forjadataApi.getMaterial(String(route.params.materialId)),
      forjadataApi.features(),
    ])
    material.value = loadedMaterial
    viewerEnabled.value = features.enable3dViewer
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'No se pudo abrir el material.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page">
    <StatePanel v-if="loading" kind="loading" title="Cargando material" />
    <StatePanel
      v-else-if="error || !material"
      kind="error"
      title="Material no disponible"
      :description="error ?? ''"
    />
    <template v-else>
      <header class="material-header">
        <div>
          <RouterLink class="back-link" to="/app/materials"
            ><ArrowLeft :size="15" /> Material Explorer</RouterLink
          >
          <span class="mono">{{ material.internalCode }}</span>
          <h1>{{ material.shortDescription }}</h1>
          <p>{{ material.longDescription }}</p>
        </div>
        <StatusBadge :status="material.status" />
      </header>

      <section class="material-scores">
        <article class="panel">
          <span>Completitud</span
          ><strong>{{ Math.round(material.completenessScore * 100) }}%</strong
          ><FjProgress :value="material.completenessScore * 100" label="Completitud" />
        </article>
        <article class="panel">
          <span>Confianza producto</span
          ><strong>{{ Math.round(material.confidenceScore * 100) }}%</strong
          ><FjProgress :value="material.confidenceScore * 100" label="Confianza" />
        </article>
        <article class="panel">
          <span>SAP Product ID</span
          ><strong class="mono">{{ material.sapProductId ?? 'Pendiente' }}</strong
          ><FjBadge :tone="material.sapProductId ? 'success' : 'warning'">{{
            material.sapProductId ? 'Sincronizado' : 'Sin enviar'
          }}</FjBadge>
        </article>
      </section>

      <section class="material-detail-grid">
        <article class="panel">
          <div class="panel__header">
            <h2>Atributos gobernados</h2>
            <FjBadge tone="ai">{{ material.source }}</FjBadge>
          </div>
          <div class="attribute-table">
            <div class="attribute-table__header">
              <span>Atributo</span><span>Valor</span><span>Estado</span><span>Evidencia</span>
            </div>
            <div v-for="attribute in material.attributes" :key="attribute.id" class="attribute-row">
              <span
                ><strong>{{ attribute.label }}</strong
                ><small class="mono">{{ attribute.code }}</small></span
              >
              <span
                ><b>{{ attribute.normalizedValue }}</b> {{ attribute.unit }}</span
              >
              <StatusBadge :status="attribute.status" />
              <span class="evidence-cell"
                ><FileSearch :size="14" /> {{ attribute.evidenceText ?? 'Manual' }}</span
              >
            </div>
          </div>
        </article>

        <aside class="panel">
          <div class="panel__header">
            <h2>Gobierno</h2>
            <ShieldCheck :size="18" />
          </div>
          <div class="panel__body governance-list">
            <div>
              <span>Fabricante</span><strong>{{ material.manufacturer }}</strong>
            </div>
            <div>
              <span>Referencia</span
              ><strong class="mono">{{ material.manufacturerPartNumber ?? '—' }}</strong>
            </div>
            <div>
              <span>Categoría</span><strong>{{ material.category }}</strong>
            </div>
            <div>
              <span>Unidad base</span><strong>{{ material.baseUnit }}</strong>
            </div>
            <div>
              <span>Responsable</span><strong>{{ material.ownerName }}</strong>
            </div>
            <div>
              <span>Posibles duplicados</span><strong>{{ material.duplicateCount }}</strong>
            </div>
          </div>
        </aside>
      </section>

      <Suspense v-if="viewerEnabled">
        <IndustrialModelViewer :attributes="material.attributes" />
        <template #fallback>
          <StatePanel kind="loading" title="Preparando el visor 3D" />
        </template>
      </Suspense>
    </template>
  </div>
</template>

<style scoped>
.material-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.material-header > div {
  display: grid;
  justify-items: start;
  gap: 0.35rem;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-info-text);
  font-size: 0.72rem;
  font-weight: 700;
}

.material-header > div > span {
  color: var(--color-text-muted);
  font-size: 0.66rem;
}

.material-header h1 {
  margin: 0;
  font-size: clamp(1.7rem, 4vw, 2.8rem);
  letter-spacing: -0.05em;
}

.material-header p {
  max-width: 60rem;
  margin: 0;
  color: var(--color-text-muted);
}

.material-scores {
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(3, 1fr);
}

.material-scores article {
  display: grid;
  gap: 0.55rem;
  padding: 1rem;
}

.material-scores article > span {
  color: var(--color-text-muted);
  font-size: 0.7rem;
}

.material-scores article > strong {
  font-size: 1.5rem;
  letter-spacing: -0.04em;
}

.material-detail-grid {
  display: grid;
  align-items: start;
  gap: 1rem;
  grid-template-columns: minmax(0, 1fr) minmax(17rem, 0.32fr);
}

.attribute-table__header,
.attribute-row {
  display: grid;
  align-items: center;
  gap: 0.8rem;
  padding: 0.7rem 1rem;
  border-bottom: 1px solid var(--color-border);
  grid-template-columns: 1fr 0.8fr 0.65fr 1fr;
}

.attribute-table__header {
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.62rem;
  font-weight: 800;
  text-transform: uppercase;
}

.attribute-row:last-child {
  border-bottom: 0;
}

.attribute-row > span:first-child {
  display: grid;
  gap: 0.15rem;
}

.attribute-row strong {
  font-size: 0.74rem;
}

.attribute-row small,
.attribute-row > span:nth-child(2),
.evidence-cell {
  color: var(--color-text-muted);
  font-size: 0.66rem;
}

.evidence-cell {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.governance-list {
  display: grid;
  gap: 0.7rem;
}

.governance-list div {
  display: grid;
  gap: 0.2rem;
  padding-bottom: 0.7rem;
  border-bottom: 1px solid var(--color-border);
}

.governance-list div:last-child {
  padding: 0;
  border: 0;
}

.governance-list span {
  color: var(--color-text-muted);
  font-size: 0.65rem;
}

.governance-list strong {
  font-size: 0.75rem;
}

@media (max-width: 850px) {
  .material-scores,
  .material-detail-grid {
    grid-template-columns: 1fr;
  }

  .attribute-table__header {
    display: none;
  }

  .attribute-row {
    grid-template-columns: 1fr auto;
  }

  .evidence-cell {
    grid-column: 1 / -1;
  }
}
</style>
