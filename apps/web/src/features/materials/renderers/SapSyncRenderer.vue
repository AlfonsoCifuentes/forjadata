<script setup lang="ts">
import type { MaterialSummary } from '@forjadata/contracts'
import type { ICellRendererParams } from 'ag-grid-community'
import { CheckCircle2, CircleDashed } from '@lucide/vue'

defineProps<{ params: ICellRendererParams<MaterialSummary, string | null> }>()
</script>

<template>
  <div class="sap-cell" :class="{ 'sap-cell--synced': Boolean(params.value) }">
    <CheckCircle2 v-if="params.value" :size="14" />
    <CircleDashed v-else :size="14" />
    <span class="mono">{{ params.value ?? 'Pendiente' }}</span>
  </div>
</template>

<style scoped>
.sap-cell {
  display: flex;
  height: 100%;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-text-muted);
}

.sap-cell--synced {
  color: var(--color-success-text);
}

.sap-cell span {
  overflow: hidden;
  font-size: 0.62rem;
  text-overflow: ellipsis;
}
</style>
