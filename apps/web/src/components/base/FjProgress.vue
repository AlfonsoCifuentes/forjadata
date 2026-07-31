<script setup lang="ts">
defineProps<{
  value: number
  label: string
}>()
</script>

<template>
  <div class="fj-progress">
    <div class="fj-progress__meta">
      <span>{{ label }}</span>
      <strong>{{ Math.round(value) }}%</strong>
    </div>
    <div
      class="fj-progress__track"
      role="progressbar"
      :aria-label="label"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="Math.round(value)"
    >
      <span class="fj-progress__value" :style="{ width: `${Math.min(100, value)}%` }"></span>
    </div>
  </div>
</template>
