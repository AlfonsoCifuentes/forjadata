<script setup lang="ts">
defineProps<{
  label: string
  value: string
  trend?: string
  tone?: 'neutral' | 'success' | 'warning' | 'danger'
}>()
</script>

<template>
  <article class="kpi-card" :data-tone="tone ?? 'neutral'">
    <div class="kpi-card__top">
      <span>{{ label }}</span>
      <slot name="icon" />
    </div>
    <strong>{{ value }}</strong>
    <small v-if="trend">{{ trend }}</small>
  </article>
</template>

<style scoped>
.kpi-card {
  display: grid;
  gap: 0.55rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.kpi-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--color-text-muted);
  font-size: 0.74rem;
  font-weight: 650;
}

.kpi-card strong {
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  letter-spacing: -0.05em;
}

.kpi-card small {
  color: var(--color-text-muted);
  font-size: 0.68rem;
}

.kpi-card[data-tone='success'] small {
  color: var(--color-success-text);
}

.kpi-card[data-tone='warning'] small {
  color: var(--color-warning-text);
}

.kpi-card[data-tone='danger'] small {
  color: var(--color-danger-text);
}
</style>
