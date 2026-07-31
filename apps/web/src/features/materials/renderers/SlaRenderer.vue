<script setup lang="ts">
import type { MaterialSummary } from '@forjadata/contracts'
import type { ICellRendererParams } from 'ag-grid-community'

defineProps<{ params: ICellRendererParams<MaterialSummary, MaterialSummary['slaStatus']> }>()

const labels = {
  ON_TRACK: 'En plazo',
  AT_RISK: 'En riesgo',
  OVERDUE: 'Vencido',
}
</script>

<template>
  <span class="sla-cell" :data-status="params.value">{{ labels[params.value ?? 'ON_TRACK'] }}</span>
</template>

<style scoped>
.sla-cell {
  font-size: 0.65rem;
  font-weight: 700;
}

.sla-cell[data-status='ON_TRACK'] {
  color: var(--color-success-text);
}

.sla-cell[data-status='AT_RISK'] {
  color: var(--color-warning-text);
}

.sla-cell[data-status='OVERDUE'] {
  color: var(--color-danger-text);
}
</style>
