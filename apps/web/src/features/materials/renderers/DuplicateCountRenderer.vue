<script setup lang="ts">
import { Copy } from '@lucide/vue'
import type { MaterialSummary } from '@forjadata/contracts'
import type { ICellRendererParams } from 'ag-grid-community'

defineProps<{ params: ICellRendererParams<MaterialSummary, number> }>()
</script>

<template>
  <span class="duplicate-cell" :data-has-duplicates="(params.value ?? 0) > 0">
    <Copy :size="13" /> {{ params.value ?? 0 }}
  </span>
</template>

<style scoped>
.duplicate-cell {
  display: flex;
  height: 100%;
  align-items: center;
  gap: 0.3rem;
  color: var(--color-text-muted);
  font-size: 0.68rem;
}

.duplicate-cell[data-has-duplicates='true'] {
  color: var(--color-warning-text);
  font-weight: 800;
}
</style>
