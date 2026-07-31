<script setup lang="ts">
import type { MaterialSummary } from '@forjadata/contracts'
import type { ICellRendererParams } from 'ag-grid-community'
import { computed } from 'vue'

const props = defineProps<{ params: ICellRendererParams<MaterialSummary, number> }>()
const percentage = computed(() => Math.round((props.params.value ?? 0) * 100))
</script>

<template>
  <div class="ring-cell" :aria-label="`Completitud ${percentage}%`">
    <span :style="{ '--progress': `${percentage * 3.6}deg` }"></span><b>{{ percentage }}%</b>
  </div>
</template>

<style scoped>
.ring-cell {
  display: flex;
  height: 100%;
  align-items: center;
  gap: 0.4rem;
}

.ring-cell span {
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 999px;
  background: conic-gradient(var(--color-info) var(--progress), var(--color-surface-muted) 0);
  box-shadow: inset 0 0 0 0.23rem var(--color-surface);
}

.ring-cell b {
  font-size: 0.68rem;
}
</style>
