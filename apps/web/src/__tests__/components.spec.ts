import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'

import FjButton from '@/components/base/FjButton.vue'
import StatusBadge from '@/components/data-display/StatusBadge.vue'
import { i18n, messages } from '@/i18n'

beforeEach(() => {
  i18n.global.locale.value = 'es'
})

describe('componentes de estado', () => {
  it('expone el estado de carga de un botón a tecnologías de asistencia', () => {
    const wrapper = mount(FjButton, {
      props: { loading: true },
      slots: { default: 'Procesar' },
    })

    const button = wrapper.get('button')
    expect(button.attributes('aria-busy')).toBe('true')
    expect(button.attributes()).toHaveProperty('disabled')
    expect(button.text()).toContain('Procesar')
  })

  it.each([
    ['NEEDS_REVIEW', 'Necesita revisión'],
    ['READY_FOR_SAP', 'Lista para SAP'],
    ['SYNCED', 'Sincronizada'],
  ])('traduce %s a una etiqueta de negocio', (status, label) => {
    const wrapper = mount(StatusBadge, {
      props: { status },
      global: { plugins: [i18n] },
    })

    expect(wrapper.text()).toBe(label)
  })

  it('cambia las etiquetas del recorrido principal a inglés', () => {
    i18n.global.locale.value = 'en'
    const wrapper = mount(StatusBadge, {
      props: { status: 'NEEDS_REVIEW' },
      global: { plugins: [i18n] },
    })

    expect(i18n.global.t('dashboard.greeting', { name: 'Alex' })).toBe('Good morning, Alex')
    expect(wrapper.text()).toBe('Needs review')
  })

  it('mantiene paridad de claves entre español e inglés', () => {
    expect(messageKeys(messages.en)).toEqual(messageKeys(messages.es))
  })
})

function messageKeys(value: object, prefix = ''): string[] {
  return Object.entries(value)
    .flatMap(([key, item]) => {
      const path = prefix ? `${prefix}.${key}` : key
      return typeof item === 'object' && item !== null ? messageKeys(item, path) : [path]
    })
    .sort()
}
