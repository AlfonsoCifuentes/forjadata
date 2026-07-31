<script setup lang="ts">
import { Columns3, Download, RefreshCcw, Search } from '@lucide/vue'
import type { MaterialSummary } from '@forjadata/contracts'
import {
  ClientSideRowModelModule,
  CellStyleModule,
  ColumnAutoSizeModule,
  CsvExportModule,
  ModuleRegistry,
  PaginationModule,
  QuickFilterModule,
  RowSelectionModule,
  TextFilterModule,
  ValidationModule,
  themeQuartz,
  type ColDef,
  type GridApi,
  type GridReadyEvent,
} from 'ag-grid-community'
import { AgGridVue } from 'ag-grid-vue3'
import { computed, onMounted, ref, watch } from 'vue'

import FjBadge from '@/components/base/FjBadge.vue'
import FjButton from '@/components/base/FjButton.vue'
import StatePanel from '@/components/feedback/StatePanel.vue'
import { forjadataApi } from '@/services/forjadata-api'

import ActionMenuRenderer from './renderers/ActionMenuRenderer.vue'
import CompletenessRingRenderer from './renderers/CompletenessRingRenderer.vue'
import ConfidenceBarRenderer from './renderers/ConfidenceBarRenderer.vue'
import DuplicateCountRenderer from './renderers/DuplicateCountRenderer.vue'
import OwnerAvatarRenderer from './renderers/OwnerAvatarRenderer.vue'
import SapSyncRenderer from './renderers/SapSyncRenderer.vue'
import SlaRenderer from './renderers/SlaRenderer.vue'
import StatusBadgeRenderer from './renderers/StatusBadgeRenderer.vue'

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  CellStyleModule,
  ColumnAutoSizeModule,
  CsvExportModule,
  PaginationModule,
  QuickFilterModule,
  RowSelectionModule,
  TextFilterModule,
  ValidationModule,
])

const rows = ref<MaterialSummary[]>([])
const total = ref(0)
const loading = ref(true)
const error = ref<string | null>(null)
const search = ref('')
const status = ref('')
const gridApi = ref<GridApi<MaterialSummary> | null>(null)
let timer: number | undefined

const gridTheme = themeQuartz.withParams({
  accentColor: '#f59e0b',
  backgroundColor: 'var(--color-surface)',
  foregroundColor: 'var(--color-text)',
  borderColor: 'var(--color-border)',
  headerBackgroundColor: 'var(--color-surface-muted)',
  oddRowBackgroundColor: 'color-mix(in srgb, var(--color-surface-muted) 40%, var(--color-surface))',
  rowHoverColor: 'var(--color-surface-muted)',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 12,
  rowHeight: 48,
  headerHeight: 42,
  wrapperBorderRadius: '12px',
})

const columnDefs = computed<ColDef<MaterialSummary>[]>(() => [
  {
    field: 'internalCode',
    headerName: 'Identificador',
    pinned: 'left',
    minWidth: 125,
    cellClass: 'mono-cell',
  },
  {
    field: 'shortDescription',
    headerName: 'Descripción',
    minWidth: 260,
    flex: 1,
    filter: 'agTextColumnFilter',
  },
  { field: 'category', headerName: 'Categoría', minWidth: 150, filter: true },
  { field: 'manufacturer', headerName: 'Fabricante', minWidth: 125, filter: true },
  {
    field: 'status',
    headerName: 'Estado',
    minWidth: 145,
    cellRenderer: StatusBadgeRenderer,
  },
  {
    field: 'completenessScore',
    headerName: 'Completitud',
    minWidth: 125,
    cellRenderer: CompletenessRingRenderer,
  },
  {
    field: 'confidenceScore',
    headerName: 'Confianza',
    minWidth: 125,
    cellRenderer: ConfidenceBarRenderer,
  },
  {
    field: 'duplicateCount',
    headerName: 'Duplicados',
    minWidth: 100,
    cellRenderer: DuplicateCountRenderer,
  },
  {
    field: 'ownerName',
    headerName: 'Responsable',
    minWidth: 150,
    cellRenderer: OwnerAvatarRenderer,
  },
  {
    field: 'sapProductId',
    headerName: 'SAP ID',
    minWidth: 150,
    cellRenderer: SapSyncRenderer,
  },
  {
    field: 'slaStatus',
    headerName: 'SLA',
    minWidth: 90,
    cellRenderer: SlaRenderer,
  },
  {
    headerName: '',
    width: 54,
    pinned: 'right',
    sortable: false,
    filter: false,
    cellRenderer: ActionMenuRenderer,
  },
])

onMounted(load)
watch([search, status], () => {
  window.clearTimeout(timer)
  timer = window.setTimeout(load, 220)
})

async function load(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    const result = await forjadataApi.listMaterials({
      page: 1,
      pageSize: 100,
      search: search.value,
      status: status.value,
      sortBy: 'updatedAt',
      sortDirection: 'desc',
    })
    rows.value = result.data
    total.value = result.pagination.total
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'No se pudo cargar el catálogo.'
  } finally {
    loading.value = false
  }
}

function onGridReady(event: GridReadyEvent<MaterialSummary>): void {
  gridApi.value = event.api
}

function exportCsv(): void {
  gridApi.value?.exportDataAsCsv({
    fileName: 'forjadata-materiales-demo.csv',
    columnSeparator: ';',
  })
}

function autoSize(): void {
  gridApi.value?.autoSizeAllColumns()
}
</script>

<template>
  <div class="page materials">
    <header class="page-header">
      <div>
        <h1>Material Explorer</h1>
        <p>Catálogo operativo con AG Grid Community y paginación contractual.</p>
      </div>
      <div class="materials__actions">
        <FjBadge tone="info">{{ total }} resultados demo</FjBadge>
        <FjButton variant="secondary" @click="exportCsv"><Download :size="16" /> CSV</FjButton>
      </div>
    </header>

    <section class="materials-toolbar panel">
      <label class="materials-search">
        <Search :size="17" /><span class="visually-hidden">Buscar materiales</span>
        <input v-model="search" placeholder="Código, descripción, fabricante o referencia…" />
      </label>
      <label>
        <span class="visually-hidden">Estado</span>
        <select v-model="status">
          <option value="">Todos los estados</option>
          <option value="IN_REVIEW">En revisión</option>
          <option value="APPROVED">Aprobado</option>
          <option value="SYNCED">Sincronizado</option>
          <option value="SYNC_FAILED">Error SAP</option>
        </select>
      </label>
      <FjButton variant="ghost" @click="autoSize"><Columns3 :size="16" /> Ajustar</FjButton>
      <FjButton variant="ghost" :loading="loading" @click="load"
        ><RefreshCcw :size="16"
      /></FjButton>
    </section>

    <StatePanel v-if="loading && rows.length === 0" kind="loading" title="Preparando AG Grid" />
    <StatePanel
      v-else-if="error"
      kind="error"
      title="No se pudo cargar el catálogo"
      :description="error"
    >
      <FjButton variant="secondary" @click="load">Reintentar</FjButton>
    </StatePanel>
    <StatePanel
      v-else-if="rows.length === 0"
      kind="empty"
      title="No hay materiales para estos filtros"
    />
    <section v-else class="grid-shell" :aria-busy="loading">
      <AgGridVue
        class="materials-grid"
        :theme="gridTheme"
        :row-data="rows"
        :column-defs="columnDefs"
        :default-col-def="{ sortable: true, resizable: true, filter: false }"
        :pagination="true"
        :pagination-page-size="25"
        :pagination-page-size-selector="[25, 50, 100]"
        :animate-rows="false"
        :row-selection="{ mode: 'multiRow', enableClickSelection: false }"
        :suppress-cell-focus="false"
        :ensure-dom-order="true"
        @grid-ready="onGridReady"
      />
    </section>
  </div>
</template>

<style scoped>
.materials__actions,
.materials-toolbar {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.materials-toolbar {
  padding: 0.65rem;
}

.materials-search,
.materials-toolbar label:nth-child(2) {
  display: flex;
  min-height: 2.55rem;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.7rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
}

.materials-search {
  flex: 1;
}

.materials-search input,
.materials-toolbar select {
  width: 100%;
  border: 0;
  background: transparent;
  color: var(--color-text);
  outline: 0;
}

.grid-shell {
  overflow: hidden;
  height: calc(100vh - 16.5rem);
  min-height: 32rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
}

.materials-grid {
  width: 100%;
  height: 100%;
}

.materials-grid :deep(.mono-cell) {
  font-family: 'Geist Mono', 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.68rem;
  font-weight: 750;
}

@media (max-width: 700px) {
  .materials-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .grid-shell {
    height: 38rem;
  }
}
</style>
