<script setup lang="ts">
import { Bell, CheckCheck } from '@lucide/vue'
import type { Notification } from '@forjadata/contracts'
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import FjBadge from '@/components/base/FjBadge.vue'
import FjButton from '@/components/base/FjButton.vue'
import StatePanel from '@/components/feedback/StatePanel.vue'
import { forjadataApi } from '@/services/forjadata-api'

const items = ref<Notification[]>([])
const loading = ref(true)

onMounted(load)

async function load(): Promise<void> {
  items.value = await forjadataApi.listNotifications()
  loading.value = false
}

async function markAll(): Promise<void> {
  items.value = await forjadataApi.markAllNotificationsRead()
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Notificaciones</h1>
        <p>Eventos relevantes del workflow y las integraciones.</p>
      </div>
      <FjButton variant="secondary" @click="markAll"
        ><CheckCheck :size="16" /> Marcar todas</FjButton
      >
    </header>
    <StatePanel v-if="loading" kind="loading" title="Cargando notificaciones" />
    <StatePanel v-else-if="items.length === 0" kind="empty" title="No tienes notificaciones" />
    <section v-else class="panel notification-list">
      <RouterLink
        v-for="item in items"
        :key="item.id"
        :to="item.link"
        class="notification-row"
        :data-read="Boolean(item.readAt)"
      >
        <span><Bell :size="17" /></span>
        <div>
          <strong>{{ item.title }}</strong>
          <p>{{ item.body }}</p>
        </div>
        <FjBadge :tone="item.readAt ? 'neutral' : 'info'">{{
          item.readAt ? 'Leída' : 'Nueva'
        }}</FjBadge>
      </RouterLink>
    </section>
  </div>
</template>

<style scoped>
.notification-list {
  overflow: hidden;
}

.notification-row {
  display: grid;
  align-items: center;
  gap: 0.7rem;
  padding: 0.9rem 1rem;
  border-bottom: 1px solid var(--color-border);
  grid-template-columns: auto 1fr auto;
}

.notification-row:last-child {
  border-bottom: 0;
}

.notification-row[data-read='false'] {
  background: color-mix(in srgb, var(--color-info) 5%, var(--color-surface));
}

.notification-row > span {
  display: grid;
  width: 2.3rem;
  height: 2.3rem;
  place-items: center;
  border-radius: 0.65rem;
  background: var(--color-surface-muted);
  color: var(--color-info-text);
}

.notification-row div {
  display: grid;
  gap: 0.2rem;
}

.notification-row strong {
  font-size: 0.78rem;
}

.notification-row p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.68rem;
}
</style>
