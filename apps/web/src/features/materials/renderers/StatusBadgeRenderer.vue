<script setup lang="ts">
import type { ICellRendererParams } from 'ag-grid-community'
import type { MaterialSummary } from '@forjadata/contracts'

import StatusBadge from '@/components/data-display/StatusBadge.vue'

defineProps<{ params: ICellRendererParams<MaterialSummary, string> }>()
</script>

<template>
  <StatusBadge :status="params.value ?? 'DRAFT'" />
</template>
