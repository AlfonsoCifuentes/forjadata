import type { Role, Session } from '@forjadata/contracts'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { entraAuth, isEntraMode } from '@/services/entra-auth'
import { forjadataApi } from '@/services/forjadata-api'

const sessionKey = 'forjadata-demo-session'

export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(null)
  const initialized = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isAuthenticated = computed(() => session.value !== null)
  const role = computed(() => session.value?.user.role ?? null)
  const isDemoMode = computed(() => !isEntraMode)

  async function initialize(): Promise<void> {
    if (initialized.value) return
    initialized.value = true
    if (isEntraMode) {
      try {
        const account = await entraAuth.initialize()
        if (account) session.value = await forjadataApi.getSession()
      } catch (cause) {
        error.value = messageFor(cause, 'No se pudo restaurar la sesión corporativa.')
      }
      return
    }

    const savedRole = sessionStorage.getItem(sessionKey)
    if (!savedRole) return
    try {
      session.value = await forjadataApi.switchRole(savedRole as Role)
    } catch {
      sessionStorage.removeItem(sessionKey)
    }
  }

  async function login(roleToUse: Role): Promise<void> {
    if (isEntraMode) throw new Error('El selector de roles demo está deshabilitado en modo Entra.')
    loading.value = true
    error.value = null
    try {
      session.value = await forjadataApi.login(roleToUse)
      sessionStorage.setItem(sessionKey, roleToUse)
    } catch (cause) {
      error.value = messageFor(cause, 'No se pudo iniciar la demo.')
      throw cause
    } finally {
      loading.value = false
    }
  }

  async function loginWithEntra(returnTo?: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await entraAuth.login(returnTo)
    } catch (cause) {
      error.value = messageFor(cause, 'No se pudo iniciar Microsoft Entra.')
      loading.value = false
      throw cause
    }
  }

  async function completeEnterpriseLogin(): Promise<string> {
    loading.value = true
    error.value = null
    try {
      const result = await entraAuth.completeLogin()
      session.value = await forjadataApi.getSession()
      return result.returnTo
    } catch (cause) {
      error.value = messageFor(cause, 'No se pudo completar el acceso corporativo.')
      throw cause
    } finally {
      loading.value = false
    }
  }

  async function switchRole(roleToUse: Role): Promise<void> {
    if (isEntraMode) {
      throw new Error('Los roles corporativos se asignan en Microsoft Entra.')
    }
    session.value = await forjadataApi.switchRole(roleToUse)
    sessionStorage.setItem(sessionKey, roleToUse)
  }

  async function logout(): Promise<void> {
    session.value = null
    sessionStorage.removeItem(sessionKey)
    if (isEntraMode) await entraAuth.logout()
  }

  function can(permission: Session['permissions'][number]): boolean {
    return session.value?.permissions.includes(permission) ?? false
  }

  return {
    session,
    initialized,
    loading,
    error,
    isAuthenticated,
    isDemoMode,
    role,
    initialize,
    login,
    loginWithEntra,
    completeEnterpriseLogin,
    switchRole,
    logout,
    can,
  }
})

function messageFor(cause: unknown, fallback: string): string {
  return cause instanceof Error ? cause.message : fallback
}
