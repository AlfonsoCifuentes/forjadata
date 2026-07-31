<script setup lang="ts">
import type { MaterialSummary } from '@forjadata/contracts'
import type { ICellRendererParams } from 'ag-grid-community'
import { computed } from 'vue'

const props = defineProps<{ params: ICellRendererParams<MaterialSummary, number> }>()
const percentage = computed(() => Math.round((props.params.value ?? 0) * 100))
</script>

<template>
  <div class="confidence-cell" :aria-label="`Confianza ${percentage}%`">
    <span><i :style="{ width: `${percentage}%` }"></i></span>
    <b>{{ percentage }}%</b>
  </div>
</template>

<style scoped>
.confidence-cell {
  display: flex;
  height: 100%;
  align-items: center;
  gap: 0.45rem;
}

.confidence-cell > span {
  width: 3.2rem;
  height: 0.36rem;
  overflow: hidden;
  border-radius: 999px;
  background: var(--color-surface-muted);
}

.confidence-cell i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--color-warning), var(--color-success));
}

.confidence-cell b {
  font-size: 0.68rem;
}
</style>
