<script setup lang="ts">
import { Building2, KeyRound, LogIn } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import FjBadge from '@/components/base/FjBadge.vue'
import FjButton from '@/components/base/FjButton.vue'
import { isEntraConfigured } from '@/services/entra-auth'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const returnTo = computed(() =>
  typeof route.query.returnTo === 'string' ? route.query.returnTo : '/app/dashboard',
)

async function login(): Promise<void> {
  await auth.loginWithEntra(returnTo.value)
}
</script>

<template>
  <main id="main-content" class="public-card-page">
    <section class="public-card">
      <span class="public-card__icon"><Building2 :size="24" /></span>
      <FjBadge :tone="isEntraConfigured ? 'success' : 'warning'">
        {{ isEntraConfigured ? 'Microsoft Entra configurado' : 'Microsoft Entra no configurado' }}
      </FjBadge>
      <h1>Acceso corporativo</h1>
      <p v-if="isEntraConfigured">
        Inicio de sesión single-tenant mediante Authorization Code con PKCE. La API valida firma,
        issuer, audience, tenant, expiración, scope y app role.
      </p>
      <p v-else>
        Faltan el client ID, tenant o scope de la aplicación SPA. No se intentará un flujo parcial
        ni se aceptarán tokens sin validar.
      </p>
      <div v-if="!isEntraConfigured" class="config-list mono">
        <span><KeyRound :size="14" /> VITE_ENTRA_CLIENT_ID</span>
        <span><KeyRound :size="14" /> VITE_ENTRA_TENANT_ID</span>
        <span><KeyRound :size="14" /> VITE_ENTRA_API_SCOPE</span>
      </div>
      <p v-if="auth.error" class="login-error" role="alert">{{ auth.error }}</p>
      <FjButton v-if="isEntraConfigured" :disabled="auth.loading" @click="login">
        <LogIn :size="17" />
        {{ auth.loading ? 'Redirigiendo…' : 'Continuar con Microsoft' }}
      </FjButton>
      <RouterLink v-if="auth.isDemoMode" to="/demo">
        <FjButton>Usar acceso demo</FjButton>
      </RouterLink>
      <RouterLink class="text-link" to="/">Volver a la landing</RouterLink>
    </section>
  </main>
</template>

<style scoped>
.public-card-page {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 1rem;
}

.public-card {
  display: grid;
  width: min(34rem, 100%);
  justify-items: start;
  gap: 1rem;
  padding: clamp(1.5rem, 5vw, 3rem);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-lg);
}

.public-card h1,
.public-card p {
  margin: 0;
}

.public-card p {
  color: var(--color-text-muted);
  line-height: 1.6;
}

.public-card__icon {
  display: grid;
  width: 3rem;
  height: 3rem;
  place-items: center;
  border-radius: 0.8rem;
  background: var(--color-surface-muted);
}

.config-list {
  display: grid;
  width: 100%;
  gap: 0.45rem;
  padding: 0.85rem;
  border-radius: var(--radius-md);
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.72rem;
}

.config-list span {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.login-error {
  color: var(--color-danger);
  font-weight: 700;
}

.text-link {
  color: var(--color-info-text);
  font-size: 0.8rem;
  font-weight: 700;
}
</style>
