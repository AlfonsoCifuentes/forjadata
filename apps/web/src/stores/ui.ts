import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

import { i18n, type AppLocale } from '@/i18n'

export type Theme = 'light' | 'dark' | 'system'
export type TourPreference = 'not-started' | 'in-progress' | 'dismissed' | 'skipped' | 'completed'

export const useUiStore = defineStore('ui', () => {
  const sidebarCollapsed = ref(false)
  const theme = ref<Theme>((localStorage.getItem('forjadata-theme') as Theme | null) ?? 'system')
  const locale = ref<AppLocale>(
    (localStorage.getItem('forjadata-locale') as AppLocale | null) ?? 'es',
  )
  const commandPaletteOpen = ref(false)
  const tourActive = ref(false)
  const tourStep = ref(0)
  const tourPreference = ref<TourPreference>(
    (localStorage.getItem('forjadata-tour-status') as TourPreference | null) ?? 'not-started',
  )

  function initialize(): void {
    applyTheme(theme.value)
    document.documentElement.lang = locale.value
    i18n.global.locale.value = locale.value
  }

  function toggleSidebar(): void {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setTheme(value: Theme): void {
    theme.value = value
  }

  function toggleTheme(): void {
    theme.value = resolvedTheme() === 'dark' ? 'light' : 'dark'
  }

  function setLocale(value: AppLocale): void {
    locale.value = value
  }

  function startTour(): void {
    tourStep.value = 0
    tourActive.value = true
    setTourPreference('in-progress')
  }

  function setTourStep(value: number): void {
    tourStep.value = Math.max(0, Math.min(7, value))
  }

  function closeTour(preference: Extract<TourPreference, 'dismissed' | 'skipped' | 'completed'>) {
    tourActive.value = false
    setTourPreference(preference)
  }

  function setTourPreference(value: TourPreference): void {
    tourPreference.value = value
    localStorage.setItem('forjadata-tour-status', value)
  }

  watch(theme, (value) => {
    localStorage.setItem('forjadata-theme', value)
    applyTheme(value)
  })
  watch(locale, (value) => {
    localStorage.setItem('forjadata-locale', value)
    document.documentElement.lang = value
    i18n.global.locale.value = value
  })

  return {
    sidebarCollapsed,
    theme,
    locale,
    commandPaletteOpen,
    tourActive,
    tourStep,
    tourPreference,
    initialize,
    toggleSidebar,
    setTheme,
    toggleTheme,
    setLocale,
    startTour,
    setTourStep,
    closeTour,
  }
})

function resolvedTheme(): 'light' | 'dark' {
  const stored = localStorage.getItem('forjadata-theme') as Theme | null
  if (stored === 'dark' || stored === 'light') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme): void {
  const value =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme
  document.documentElement.dataset.theme = value
  document.documentElement.style.colorScheme = value
}
