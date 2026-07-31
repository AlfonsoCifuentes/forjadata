<script setup lang="ts">
import { RouterLink } from 'vue-router'

import FjButton from '@/components/base/FjButton.vue'
import StatePanel from '@/components/feedback/StatePanel.vue'
</script>

<template>
  <main id="main-content" class="page">
    <StatePanel
      kind="empty"
      title="Esta ruta no existe"
      description="El enlace puede estar incompleto o pertenecer a otro entorno."
    >
      <RouterLink to="/"><FjButton>Volver a Forjadata</FjButton></RouterLink>
    </StatePanel>
  </main>
</template>
