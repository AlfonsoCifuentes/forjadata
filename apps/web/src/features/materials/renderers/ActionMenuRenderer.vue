<script setup lang="ts">
import { ArrowUpRight } from '@lucide/vue'
import type { MaterialSummary } from '@forjadata/contracts'
import type { ICellRendererParams } from 'ag-grid-community'

defineProps<{ params: ICellRendererParams<MaterialSummary> }>()
</script>

<template>
  <RouterLink
    v-if="params.data"
    class="action-cell"
    :to="`/app/materials/${params.data.id}`"
    :aria-label="`Abrir ${params.data.shortDescription}`"
  >
    <ArrowUpRight :size="15" />
  </RouterLink>
</template>

<style scoped>
.action-cell {
  display: grid;
  width: 1.85rem;
  height: 1.85rem;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  margin-top: 0.42rem;
  color: var(--color-text-muted);
}

.action-cell:hover {
  background: var(--color-surface-muted);
  color: var(--color-text);
}
</style>
