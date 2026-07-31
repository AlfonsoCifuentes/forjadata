<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import FjButton from '@/components/base/FjButton.vue'
import StatePanel from '@/components/feedback/StatePanel.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const failed = ref(false)

onMounted(async () => {
  try {
    const returnTo = await auth.completeEnterpriseLogin()
    await router.replace(returnTo)
  } catch {
    failed.value = true
  }
})
</script>

<template>
  <main id="main-content" class="page">
    <StatePanel
      :kind="failed ? 'error' : 'loading'"
      :title="failed ? 'No se pudo completar Microsoft Entra' : 'Validando sesión corporativa'"
      :description="
        failed
          ? (auth.error ?? 'Revisa la configuración y vuelve a intentarlo.')
          : 'Intercambiando el código PKCE y validando el access token con la API.'
      "
    >
      <RouterLink v-if="failed" to="/login"><FjButton>Volver a intentarlo</FjButton></RouterLink>
    </StatePanel>
  </main>
</template>
