<script setup lang="ts">
import type { MaterialSummary } from '@forjadata/contracts'
import type { ICellRendererParams } from 'ag-grid-community'
import { computed } from 'vue'

const props = defineProps<{ params: ICellRendererParams<MaterialSummary, string> }>()
const initials = computed(() =>
  (props.params.value ?? 'Sin responsable')
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(),
)
</script>

<template>
  <div class="owner-cell" :title="params.value ?? undefined">
    <span>{{ initials }}</span
    ><b>{{ params.value }}</b>
  </div>
</template>

<style scoped>
.owner-cell {
  display: flex;
  height: 100%;
  align-items: center;
  gap: 0.45rem;
}

.owner-cell span {
  display: grid;
  width: 1.55rem;
  height: 1.55rem;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 0.45rem;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.53rem;
  font-weight: 850;
}

.owner-cell b {
  overflow: hidden;
  font-size: 0.67rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
