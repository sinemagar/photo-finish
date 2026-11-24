import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import AppHeader from './AppHeader.vue'

const mountHeader = (props: Partial<InstanceType<typeof AppHeader>['$props']> = {}) =>
  mount(AppHeader, {
    props: { canGenerate: true, canToggle: true, toggleLabel: 'Start', ...props },
  })

const generateButton = '[data-testid="generate-button"]'
const toggleButton = '[data-testid="toggle-button"]'

describe('AppHeader', () => {
  it('shows the title', () => {
    expect(mountHeader().get('h1').text()).toBe('Photo Finish')
  })

  it('emits generate and toggle when the buttons are clicked', async () => {
    const wrapper = mountHeader()

    await wrapper.get(generateButton).trigger('click')
    await wrapper.get(toggleButton).trigger('click')

    expect(wrapper.emitted('generate')).toHaveLength(1)
    expect(wrapper.emitted('toggle')).toHaveLength(1)
  })

  it('emits help from a button that is labelled for assistive technology', async () => {
    const wrapper = mountHeader()
    const help = wrapper.get('[data-testid="help-button"]')

    await help.trigger('click')

    expect(help.attributes('aria-label')).toBe('How it works')
    expect(wrapper.emitted('help')).toHaveLength(1)
  })

  it('offers a theme switch that says what it will do', async () => {
    const light = mountHeader({ theme: 'light' })
    const dark = mountHeader({ theme: 'dark' })

    expect(light.get('[data-testid="theme-toggle"]').attributes('aria-label')).toBe(
      'Switch to dark mode',
    )
    expect(dark.get('[data-testid="theme-toggle"]').attributes('aria-label')).toBe(
      'Switch to light mode',
    )

    await light.get('[data-testid="theme-toggle"]').trigger('click')
    expect(light.emitted('toggleTheme')).toHaveLength(1)
  })

  it.each(['Start', 'Pause', 'Resume'] as const)('labels the toggle "%s"', (toggleLabel) => {
    expect(mountHeader({ toggleLabel }).get(toggleButton).text()).toBe(toggleLabel)
  })

  it('disables each button independently and emits nothing from a disabled one', async () => {
    const wrapper = mountHeader({ canGenerate: false, canToggle: false })

    await wrapper.get(generateButton).trigger('click')
    await wrapper.get(toggleButton).trigger('click')

    expect(wrapper.get(generateButton).attributes('disabled')).toBeDefined()
    expect(wrapper.get(toggleButton).attributes('disabled')).toBeDefined()
    expect(wrapper.emitted()).not.toHaveProperty('generate')
    expect(wrapper.emitted()).not.toHaveProperty('toggle')
  })
})
