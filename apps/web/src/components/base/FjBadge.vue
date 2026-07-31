<script setup lang="ts">
withDefaults(
  defineProps<{
    tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'ai'
  }>(),
  { tone: 'neutral' },
)
</script>

<template>
  <span class="fj-badge" :class="`fj-badge--${tone}`"><slot /></span>
</template>
