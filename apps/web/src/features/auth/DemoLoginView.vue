<script setup lang="ts">
import { ArrowLeft, Check, ShieldCheck, Sparkles, UserRound } from '@lucide/vue'
import type { Role } from '@forjadata/contracts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import FjBadge from '@/components/base/FjBadge.vue'
import FjButton from '@/components/base/FjButton.vue'
import { activeApiMode } from '@/services/forjadata-api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const selectedRole = ref<Role>('reviewer')

const roles = computed<
  Array<{
    id: Role
    name: string
    description: string
    recommended?: boolean
  }>
>(() => [
  {
    id: 'reviewer',
    name: t('roles.reviewer.name'),
    description: t('roles.reviewer.description'),
    recommended: true,
  },
  {
    id: 'requester',
    name: t('roles.requester.name'),
    description: t('roles.requester.description'),
  },
  {
    id: 'sap_specialist',
    name: t('roles.sap_specialist.name'),
    description: t('roles.sap_specialist.description'),
  },
  {
    id: 'business_analyst',
    name: t('roles.business_analyst.name'),
    description: t('roles.business_analyst.description'),
  },
  {
    id: 'uat_tester',
    name: t('roles.uat_tester.name'),
    description: t('roles.uat_tester.description'),
  },
  {
    id: 'admin',
    name: t('roles.admin.name'),
    description: t('roles.admin.description'),
  },
])

async function enterDemo(): Promise<void> {
  await auth.login(selectedRole.value)
  const returnTo =
    typeof route.query.returnTo === 'string' ? route.query.returnTo : '/app/dashboard'
  await router.push(returnTo)
}
</script>

<template>
  <main id="main-content" class="demo-login">
    <section class="demo-login__intro">
      <RouterLink class="back-link" to="/"
        ><ArrowLeft :size="16" /> {{ t('login.back') }}</RouterLink
      >
      <div class="intro__content">
        <FjBadge tone="ai"><Sparkles :size="13" /> {{ t('login.badge') }}</FjBadge>
        <h1>{{ t('login.title') }}</h1>
        <p>{{ t('login.description') }}</p>
        <ul>
          <li><Check :size="17" /> {{ t('login.noCredentials') }}</li>
          <li><Check :size="17" /> {{ t('login.resettableDataset') }}</li>
          <li><Check :size="17" /> {{ t('login.labelledSimulators') }}</li>
        </ul>
      </div>
      <div class="intro__architecture">
        <ShieldCheck :size="19" />
        <div>
          <strong>{{
            activeApiMode === 'http' ? t('login.apiMode') : t('login.embeddedMode')
          }}</strong>
          <span>{{ t('login.contractNote') }}</span>
        </div>
      </div>
    </section>

    <section class="demo-login__roles" aria-labelledby="role-heading">
      <div class="roles__heading">
        <span class="roles__icon"><UserRound :size="20" /></span>
        <div>
          <p>{{ t('login.step') }}</p>
          <h2 id="role-heading">{{ t('login.roleQuestion') }}</h2>
        </div>
      </div>

      <div class="role-list" role="radiogroup" :aria-label="t('login.roleGroup')">
        <label
          v-for="role in roles"
          :key="role.id"
          class="role-card"
          :class="{ 'role-card--selected': selectedRole === role.id }"
        >
          <input v-model="selectedRole" type="radio" name="demo-role" :value="role.id" />
          <span class="role-card__avatar">{{
            role.name
              .split(' ')
              .map((word) => word[0])
              .join('')
              .slice(0, 2)
          }}</span>
          <span class="role-card__text">
            <span
              ><strong>{{ role.name }}</strong
              ><FjBadge v-if="role.recommended" tone="success">{{
                t('common.recommended')
              }}</FjBadge></span
            >
            <small>{{ role.description }}</small>
          </span>
          <span class="role-card__check"><Check :size="15" /></span>
        </label>
      </div>

      <p v-if="auth.error" class="login-error" role="alert">{{ auth.error }}</p>
      <FjButton block :loading="auth.loading" @click="enterDemo">
        {{
          t('login.enterAs', {
            role: roles.find((role) => role.id === selectedRole)?.name,
          })
        }}
      </FjButton>
      <p class="roles__notice">{{ t('login.syntheticConsent') }}</p>
    </section>
  </main>
</template>

<style scoped>
.demo-login {
  display: grid;
  min-height: 100vh;
  background: var(--color-canvas);
  grid-template-columns: 1.05fr 0.95fr;
}

.demo-login__intro {
  position: relative;
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  padding: clamp(1.5rem, 5vw, 4rem);
  background:
    radial-gradient(circle at 70% 20%, rgb(245 158 11 / 0.14), transparent 28rem),
    var(--graphite-950);
  color: white;
}

.back-link {
  display: flex;
  width: max-content;
  align-items: center;
  gap: 0.4rem;
  color: #a8b3c4;
  font-size: 0.8rem;
}

.intro__content {
  display: grid;
  max-width: 34rem;
  align-content: center;
  flex: 1;
  justify-items: start;
  gap: 1.25rem;
}

.intro__content h1 {
  margin: 0;
  font-size: clamp(2.8rem, 6vw, 5rem);
  line-height: 0.98;
  letter-spacing: -0.065em;
}

.intro__content > p {
  margin: 0;
  color: #a8b3c4;
  font-size: 1.05rem;
  line-height: 1.65;
}

.intro__content ul {
  display: grid;
  gap: 0.7rem;
  padding: 0;
  margin: 0;
  color: #dbe5f3;
  font-size: 0.85rem;
  list-style: none;
}

.intro__content li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.intro__content li :deep(svg) {
  color: #4ade80;
}

.intro__architecture {
  display: flex;
  max-width: 32rem;
  align-items: center;
  gap: 0.8rem;
  padding: 0.9rem;
  border: 1px solid #263248;
  border-radius: var(--radius-lg);
  background: #111827;
}

.intro__architecture :deep(svg) {
  color: #fbbf24;
}

.intro__architecture div {
  display: grid;
  gap: 0.2rem;
}

.intro__architecture strong {
  font-size: 0.8rem;
}

.intro__architecture span {
  color: #94a3b8;
  font-size: 0.7rem;
}

.demo-login__roles {
  display: grid;
  width: min(36rem, 100%);
  align-content: center;
  gap: 1rem;
  padding: clamp(1.5rem, 6vw, 5rem);
  margin: auto;
}

.roles__heading {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 0.4rem;
}

.roles__icon {
  display: grid;
  width: 2.8rem;
  height: 2.8rem;
  place-items: center;
  border-radius: 0.8rem;
  background: color-mix(in srgb, var(--color-accent) 15%, var(--color-surface));
  color: var(--color-accent-strong);
}

.roles__heading p {
  margin: 0 0 0.2rem;
  color: var(--color-text-muted);
  font-size: 0.63rem;
  font-weight: 800;
  letter-spacing: 0.13em;
}

.roles__heading h2 {
  margin: 0;
  font-size: 1.45rem;
  letter-spacing: -0.035em;
}

.role-list {
  display: grid;
  gap: 0.6rem;
}

.role-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  cursor: pointer;
  transition:
    border-color 150ms ease,
    transform 150ms ease,
    background 150ms ease;
}

.role-card:hover {
  transform: translateY(-1px);
  border-color: var(--color-border-strong);
}

.role-card--selected {
  border-color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 7%, var(--color-surface));
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent) 12%, transparent);
}

.role-card input {
  position: absolute;
  opacity: 0;
}

.role-card__avatar {
  display: grid;
  width: 2.35rem;
  height: 2.35rem;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 0.7rem;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.68rem;
  font-weight: 800;
}

.role-card__text {
  display: grid;
  flex: 1;
  gap: 0.25rem;
}

.role-card__text > span {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
}

.role-card__text strong {
  font-size: 0.85rem;
}

.role-card__text small {
  color: var(--color-text-muted);
  font-size: 0.7rem;
  line-height: 1.35;
}

.role-card__check {
  display: grid;
  width: 1.35rem;
  height: 1.35rem;
  place-items: center;
  border: 1px solid var(--color-border-strong);
  border-radius: 999px;
  color: transparent;
}

.role-card--selected .role-card__check {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: #261505;
}

.roles__notice {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.68rem;
  text-align: center;
}

.login-error {
  padding: 0.7rem;
  border-radius: var(--radius-md);
  margin: 0;
  background: color-mix(in srgb, var(--color-danger) 12%, transparent);
  color: var(--color-danger-text);
  font-size: 0.8rem;
}

@media (max-width: 850px) {
  .demo-login {
    grid-template-columns: 1fr;
  }

  .demo-login__intro {
    min-height: auto;
  }

  .intro__content {
    padding: 5rem 0;
  }

  .demo-login__roles {
    padding-top: 3rem;
    padding-bottom: 4rem;
  }
}
</style>
