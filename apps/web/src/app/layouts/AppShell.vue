<script setup lang="ts">
import {
  Bell,
  Boxes,
  ChartNoAxesCombined,
  CheckSquare,
  ClipboardList,
  Copy,
  FlaskConical,
  Gauge,
  HelpCircle,
  Languages,
  ListChecks,
  LogOut,
  Menu,
  MoonStar,
  PackageSearch,
  RefreshCcw,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  Workflow,
  X,
} from '@lucide/vue'
import type { Component } from 'vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'

import FjBadge from '@/components/base/FjBadge.vue'
import GuidedTour from '@/components/feedback/GuidedTour.vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const mobileOpen = ref(false)

interface NavItem {
  label: string
  to: string
  icon: Component
  permission?: Parameters<typeof auth.can>[0]
}

const primaryNav = computed<NavItem[]>(() => [
  { label: t('navigation.dashboard'), to: '/app/dashboard', icon: Gauge },
  { label: t('navigation.requests'), to: '/app/requests', icon: ClipboardList },
  { label: t('navigation.materials'), to: '/app/materials', icon: PackageSearch },
  {
    label: t('navigation.review'),
    to: '/app/review',
    icon: CheckSquare,
    permission: 'request:review',
  },
  { label: t('navigation.duplicates'), to: '/app/duplicates', icon: Copy },
  { label: t('navigation.sap'), to: '/app/sap', icon: RefreshCcw },
  { label: t('navigation.analytics'), to: '/app/analytics', icon: ChartNoAxesCombined },
  {
    label: t('navigation.audit'),
    to: '/app/audit',
    icon: ShieldCheck,
    permission: 'audit:read',
  },
  { label: t('navigation.uat'), to: '/app/uat', icon: FlaskConical },
])

const secondaryNav = computed<NavItem[]>(() => [
  { label: t('navigation.admin'), to: '/app/admin/integrations', icon: Settings },
  {
    label: t('navigation.rules'),
    to: '/app/admin/rules',
    icon: ListChecks,
    permission: 'admin:manage',
  },
  { label: t('navigation.architecture'), to: '/app/architecture', icon: Boxes },
  { label: t('navigation.help'), to: '/app/help', icon: HelpCircle },
])

function visible(items: NavItem[]): NavItem[] {
  return items.filter((item) => !item.permission || auth.can(item.permission))
}

async function changeRole(event: Event): Promise<void> {
  const target = event.target as HTMLSelectElement
  await auth.switchRole(target.value as NonNullable<typeof auth.role>)
  if (route.meta.permission && !auth.can(route.meta.permission as never)) {
    await router.push('/app/dashboard')
  }
}

async function logout(): Promise<void> {
  const returnLocally = auth.isDemoMode
  await auth.logout()
  if (returnLocally) await router.push('/')
}
</script>

<template>
  <div class="app-shell">
    <div class="demo-banner" :class="{ 'demo-banner--azure': !auth.isDemoMode }" role="status">
      <span class="demo-banner__pulse" aria-hidden="true"></span>
      <strong>{{ t(auth.isDemoMode ? 'shell.demoMode' : 'shell.azureMode') }}</strong>
      <span>{{ t(auth.isDemoMode ? 'shell.demoDetail' : 'shell.azureDetail') }}</span>
    </div>

    <aside
      class="sidebar"
      :class="{ 'sidebar--open': mobileOpen, 'sidebar--collapsed': ui.sidebarCollapsed }"
    >
      <div class="sidebar__brand">
        <RouterLink class="brand" to="/app/dashboard" :aria-label="t('shell.homeLabel')">
          <span class="brand__mark" aria-hidden="true">
            <span></span><span></span><span></span>
          </span>
          <span v-if="!ui.sidebarCollapsed" class="brand__word">forjadata</span>
        </RouterLink>
        <button
          class="icon-button sidebar__close"
          type="button"
          :aria-label="t('shell.closeNavigation')"
          @click="mobileOpen = false"
        >
          <X :size="18" />
        </button>
      </div>

      <nav class="sidebar__nav" :aria-label="t('shell.primaryNavigation')">
        <p v-if="!ui.sidebarCollapsed" class="sidebar__label">{{ t('shell.operations') }}</p>
        <RouterLink
          v-for="item in visible(primaryNav)"
          :key="item.to"
          class="nav-link"
          :to="item.to"
          :title="ui.sidebarCollapsed ? item.label : undefined"
          @click="mobileOpen = false"
        >
          <component :is="item.icon" :size="18" stroke-width="1.8" />
          <span v-if="!ui.sidebarCollapsed">{{ item.label }}</span>
        </RouterLink>
        <p v-if="!ui.sidebarCollapsed" class="sidebar__label sidebar__label--second">
          {{ t('shell.system') }}
        </p>
        <RouterLink
          v-for="item in visible(secondaryNav)"
          :key="item.to"
          class="nav-link"
          :to="item.to"
          :title="ui.sidebarCollapsed ? item.label : undefined"
          @click="mobileOpen = false"
        >
          <component :is="item.icon" :size="18" stroke-width="1.8" />
          <span v-if="!ui.sidebarCollapsed">{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div v-if="!ui.sidebarCollapsed" class="sidebar__mode">
        <div>
          <Workflow :size="16" />
          <strong>{{ t('shell.services') }}</strong>
        </div>
        <span>
          <i class="status-dot status-dot--ok"></i>
          {{ t(auth.isDemoMode ? 'shell.demoApi' : 'shell.azureApi') }}
        </span>
        <span>
          <i class="status-dot" :class="{ 'status-dot--ok': !auth.isDemoMode }"></i>
          {{ t(auth.isDemoMode ? 'shell.sapSimulator' : 'shell.sapOData') }}
        </span>
        <span>
          <i class="status-dot" :class="{ 'status-dot--ok': !auth.isDemoMode }"></i>
          {{ t(auth.isDemoMode ? 'shell.azureUnconfigured' : 'shell.azureConnected') }}
        </span>
      </div>
    </aside>

    <button
      v-if="mobileOpen"
      class="sidebar-backdrop"
      type="button"
      :aria-label="t('shell.closeNavigation')"
      @click="mobileOpen = false"
    ></button>

    <div class="app-shell__main">
      <header class="topbar">
        <div class="topbar__left">
          <button
            class="icon-button mobile-menu"
            type="button"
            :aria-label="t('shell.openNavigation')"
            @click="mobileOpen = true"
          >
            <Menu :size="20" />
          </button>
          <button
            class="icon-button desktop-collapse"
            type="button"
            :aria-label="
              ui.sidebarCollapsed ? t('shell.expandNavigation') : t('shell.collapseNavigation')
            "
            @click="ui.toggleSidebar"
          >
            <Menu :size="20" />
          </button>
          <button class="global-search" type="button" @click="ui.commandPaletteOpen = true">
            <Search :size="17" />
            <span>{{ t('shell.search') }}</span>
            <kbd>Ctrl K</kbd>
          </button>
        </div>

        <div class="topbar__actions">
          <button
            class="icon-button"
            type="button"
            :aria-label="
              ui.locale === 'es' ? t('language.switchToEnglish') : t('language.switchToSpanish')
            "
            @click="ui.setLocale(ui.locale === 'es' ? 'en' : 'es')"
          >
            <Languages :size="18" />
            <span class="topbar__text">{{ ui.locale.toUpperCase() }}</span>
          </button>
          <button
            class="icon-button"
            type="button"
            :aria-label="t('shell.switchTheme')"
            @click="ui.toggleTheme"
          >
            <MoonStar v-if="ui.theme !== 'dark'" :size="18" />
            <Sun v-else :size="18" />
          </button>
          <RouterLink
            class="icon-button notification-button"
            to="/app/notifications"
            :aria-label="t('shell.notifications')"
          >
            <Bell :size="18" />
            <span class="notification-button__dot" aria-hidden="true"></span>
          </RouterLink>

          <div class="user-control">
            <span class="user-control__avatar">{{ auth.session?.user.avatarInitials }}</span>
            <div class="user-control__identity">
              <strong>{{ auth.session?.user.displayName }}</strong>
              <label>
                <span class="visually-hidden">
                  {{ t(auth.isDemoMode ? 'shell.demoRole' : 'shell.enterpriseRole') }}
                </span>
                <select
                  v-if="auth.isDemoMode"
                  :value="auth.role ?? 'reviewer'"
                  @change="changeRole"
                >
                  <option value="requester">{{ t('roles.requester.name') }}</option>
                  <option value="reviewer">{{ t('roles.reviewer.name') }}</option>
                  <option value="sap_specialist">{{ t('roles.sap_specialist.name') }}</option>
                  <option value="business_analyst">
                    {{ t('roles.business_analyst.name') }}
                  </option>
                  <option value="uat_tester">{{ t('roles.uat_tester.name') }}</option>
                  <option value="admin">{{ t('roles.admin.name') }}</option>
                </select>
                <span v-else class="enterprise-role">
                  {{ auth.role ? t(`roles.${auth.role}.name`) : t('common.loading') }}
                </span>
              </label>
            </div>
            <button
              class="icon-button"
              type="button"
              :aria-label="t('shell.logout')"
              @click="logout"
            >
              <LogOut :size="17" />
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" class="content">
        <RouterView />
      </main>
    </div>

    <div
      v-if="ui.commandPaletteOpen"
      class="command-overlay"
      role="presentation"
      @click.self="ui.commandPaletteOpen = false"
    >
      <section
        class="command-palette"
        role="dialog"
        aria-modal="true"
        :aria-label="t('shell.globalSearch')"
      >
        <div class="command-palette__input">
          <Search :size="18" />
          <input autofocus :placeholder="t('shell.searchPlaceholder')" />
          <button
            class="icon-button"
            type="button"
            :aria-label="t('shell.close')"
            @click="ui.commandPaletteOpen = false"
          >
            <X :size="18" />
          </button>
        </div>
        <div class="command-palette__body">
          <FjBadge tone="info">{{ t('common.demo') }}</FjBadge>
          <p>{{ t('shell.searchHelp') }}</p>
        </div>
      </section>
    </div>
    <GuidedTour />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
}

.demo-banner {
  position: fixed;
  z-index: 80;
  top: 0;
  right: 0;
  left: 0;
  display: flex;
  height: 2rem;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  background: #1a1208;
  color: #fed7aa;
  font-size: 0.75rem;
}

.demo-banner__pulse {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 999px;
  background: var(--color-accent);
  box-shadow: 0 0 0 4px rgb(245 158 11 / 0.16);
}

.demo-banner--azure {
  background: #052e24;
  color: #a7f3d0;
}

.demo-banner--azure .demo-banner__pulse {
  background: var(--color-success);
}

.sidebar {
  position: fixed;
  z-index: 60;
  top: 2rem;
  bottom: 0;
  left: 0;
  display: flex;
  width: 16.5rem;
  flex-direction: column;
  border-right: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-surface) 96%, transparent);
  transition: width 180ms ease;
}

.sidebar--collapsed {
  width: 4.5rem;
}

.sidebar__brand {
  display: flex;
  min-height: 4rem;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 0.9rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.brand__mark {
  position: relative;
  display: grid;
  width: 2.1rem;
  height: 2.1rem;
  place-items: center;
  border-radius: 0.62rem;
  background: linear-gradient(145deg, var(--color-accent), var(--color-accent-strong));
  box-shadow: 0 8px 24px rgb(249 115 22 / 0.2);
}

.brand__mark span {
  position: absolute;
  width: 0.32rem;
  height: 0.32rem;
  border: 2px solid #241407;
  border-radius: 999px;
}

.brand__mark span:nth-child(1) {
  transform: translate(-0.48rem, -0.35rem);
}

.brand__mark span:nth-child(2) {
  transform: translate(0.44rem, -0.35rem);
}

.brand__mark span:nth-child(3) {
  transform: translate(0, 0.48rem);
}

.brand__word {
  color: var(--color-text);
  font-size: 1.18rem;
  font-weight: 850;
  letter-spacing: -0.045em;
}

.sidebar__nav {
  display: grid;
  gap: 0.15rem;
  overflow-y: auto;
  padding: 0.4rem 0.65rem 1rem;
}

.sidebar__label {
  padding: 0 0.55rem;
  margin: 0.45rem 0 0.35rem;
  color: var(--color-text-muted);
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.sidebar__label--second {
  margin-top: 1rem;
}

.nav-link {
  display: flex;
  min-height: 2.55rem;
  align-items: center;
  gap: 0.7rem;
  padding: 0.55rem 0.68rem;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-size: 0.88rem;
  font-weight: 650;
}

.nav-link:hover {
  background: var(--color-surface-muted);
  color: var(--color-text);
}

.nav-link.router-link-active {
  border-color: color-mix(in srgb, var(--color-accent) 25%, var(--color-border));
  background: color-mix(in srgb, var(--color-accent) 10%, var(--color-surface));
  color: var(--color-text);
}

.nav-link.router-link-active :deep(svg) {
  color: var(--color-accent-strong);
}

.sidebar__mode {
  display: grid;
  gap: 0.45rem;
  padding: 0.85rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  margin: auto 0.7rem 0.8rem;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.72rem;
}

.sidebar__mode div,
.sidebar__mode span {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.sidebar__mode div {
  color: var(--color-text);
}

.status-dot {
  width: 0.42rem;
  height: 0.42rem;
  border-radius: 999px;
  background: var(--color-text-muted);
}

.status-dot--ok {
  background: var(--color-success);
}

.app-shell__main {
  min-height: 100vh;
  padding-top: 2rem;
  margin-left: 16.5rem;
  transition: margin-left 180ms ease;
}

.sidebar--collapsed + .sidebar-backdrop + .app-shell__main,
.sidebar--collapsed ~ .app-shell__main {
  margin-left: 4.5rem;
}

.topbar {
  position: sticky;
  z-index: 40;
  top: 2rem;
  display: flex;
  min-height: 4rem;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.65rem 1rem;
  border-bottom: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-canvas) 88%, transparent);
  backdrop-filter: blur(18px);
}

.topbar__left,
.topbar__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.icon-button {
  display: inline-grid;
  min-width: 2.5rem;
  min-height: 2.5rem;
  place-items: center;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  cursor: pointer;
}

.icon-button:hover {
  border-color: var(--color-border);
  background: var(--color-surface);
}

.global-search {
  display: flex;
  width: min(28rem, 35vw);
  min-height: 2.5rem;
  align-items: center;
  gap: 0.55rem;
  padding: 0.45rem 0.65rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-muted);
  cursor: pointer;
  text-align: left;
}

.global-search span {
  overflow: hidden;
  flex: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.global-search kbd {
  padding: 0.15rem 0.35rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 0.3rem;
  background: var(--color-surface-muted);
  font-size: 0.68rem;
}

.notification-button {
  position: relative;
}

.notification-button__dot {
  position: absolute;
  top: 0.45rem;
  right: 0.45rem;
  width: 0.42rem;
  height: 0.42rem;
  border: 2px solid var(--color-canvas);
  border-radius: 999px;
  background: var(--color-accent-strong);
}

.user-control {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding-left: 0.5rem;
  border-left: 1px solid var(--color-border);
}

.user-control__avatar {
  display: grid;
  width: 2.2rem;
  height: 2.2rem;
  place-items: center;
  border-radius: 0.7rem;
  background: linear-gradient(145deg, var(--steel-700), var(--graphite-900));
  color: white;
  font-size: 0.72rem;
  font-weight: 800;
}

.user-control__identity {
  display: grid;
  min-width: 8rem;
  gap: 0.05rem;
}

.user-control__identity strong {
  font-size: 0.78rem;
}

.user-control__identity select {
  max-width: 9.5rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.7rem;
}

.enterprise-role {
  color: var(--color-text-muted);
  font-size: 0.7rem;
}

.content {
  min-height: calc(100vh - 6rem);
}

.command-overlay {
  position: fixed;
  z-index: 100;
  inset: 0;
  display: grid;
  place-items: start center;
  padding: 12vh 1rem 1rem;
  background: rgb(3 7 18 / 0.55);
  backdrop-filter: blur(5px);
}

.command-palette {
  width: min(42rem, 100%);
  overflow: hidden;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-lg);
}

.command-palette__input {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.command-palette__input input {
  min-height: 2.5rem;
  flex: 1;
  border: 0;
  background: transparent;
  color: var(--color-text);
  outline: 0;
}

.command-palette__body {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.2rem;
  color: var(--color-text-muted);
}

.sidebar__close,
.mobile-menu,
.sidebar-backdrop {
  display: none;
}

@media (max-width: 1050px) {
  .topbar__text,
  .global-search kbd {
    display: none;
  }

  .global-search {
    width: 3rem;
  }

  .global-search span {
    display: none;
  }
}

@media (max-width: 820px) {
  .demo-banner span:last-child {
    display: none;
  }

  .sidebar {
    width: min(18rem, 86vw);
    transform: translateX(-105%);
    transition: transform 180ms ease;
  }

  .sidebar--open {
    transform: translateX(0);
  }

  .sidebar--collapsed {
    width: min(18rem, 86vw);
  }

  .sidebar--collapsed .brand__word,
  .sidebar--collapsed .nav-link span,
  .sidebar--collapsed .sidebar__label,
  .sidebar--collapsed .sidebar__mode {
    display: initial;
  }

  .sidebar__close,
  .mobile-menu {
    display: inline-grid;
  }

  .desktop-collapse {
    display: none;
  }

  .sidebar-backdrop {
    position: fixed;
    z-index: 50;
    inset: 2rem 0 0;
    display: block;
    border: 0;
    background: rgb(3 7 18 / 0.48);
  }

  .app-shell__main,
  .sidebar--collapsed ~ .app-shell__main {
    margin-left: 0;
  }

  .user-control__identity,
  .topbar__actions > .icon-button:first-child {
    display: none;
  }
}
</style>
