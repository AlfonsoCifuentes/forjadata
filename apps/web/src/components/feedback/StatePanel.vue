<script setup lang="ts">
withDefaults(
  defineProps<{
    kind: 'loading' | 'empty' | 'error' | 'forbidden'
    title: string
    description?: string
  }>(),
  { description: '' },
)
</script>

<template>
  <section class="state-panel" :data-kind="kind" :aria-live="kind === 'loading' ? 'polite' : 'off'">
    <span v-if="kind === 'loading'" class="state-panel__loader" aria-hidden="true"></span>
    <span v-else class="state-panel__icon" aria-hidden="true">
      {{ kind === 'error' ? '!' : kind === 'forbidden' ? '×' : '◇' }}
    </span>
    <h2>{{ title }}</h2>
    <p v-if="description">{{ description }}</p>
    <slot />
  </section>
</template>
