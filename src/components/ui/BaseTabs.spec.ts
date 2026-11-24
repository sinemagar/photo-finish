import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import BaseTabs from './BaseTabs.vue'

const tabs = [
  { id: 'results', label: 'Results', count: 2 },
  { id: 'programme', label: 'Programme', count: 0 },
  { id: 'stable', label: 'Stable' },
]

const mountTabs = (modelValue = 'programme') =>
  mount(BaseTabs, {
    props: { tabs, modelValue, idPrefix: 'section', label: 'Meeting details' },
    attachTo: document.body,
  })

describe('BaseTabs', () => {
  it('follows the ARIA tabs pattern', () => {
    const wrapper = mountTabs()
    const [results, programme] = wrapper.findAll('[role="tab"]')

    expect(wrapper.attributes('role')).toBe('tablist')
    expect(wrapper.attributes('aria-label')).toBe('Meeting details')
    expect(programme?.attributes('aria-selected')).toBe('true')
    expect(programme?.attributes('tabindex')).toBe('0')
    expect(programme?.attributes('aria-controls')).toBe('section-panel-programme')
    expect(programme?.attributes('id')).toBe('section-tab-programme')
    expect(results?.attributes('aria-selected')).toBe('false')
    expect(results?.attributes('tabindex')).toBe('-1')

    wrapper.unmount()
  })

  it('shows a counter only when there is something to count', () => {
    const wrapper = mountTabs()

    expect(wrapper.findAll('[role="tab"]').map((tab) => tab.text())).toEqual([
      'Results 2',
      'Programme',
      'Stable',
    ])

    wrapper.unmount()
  })

  it('selects a tab on click', async () => {
    const wrapper = mountTabs()

    await wrapper.get('[data-testid="tab-stable"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['stable']])

    wrapper.unmount()
  })

  it('moves with the arrow keys and wraps around at both ends', async () => {
    const wrapper = mountTabs('stable')

    await wrapper.trigger('keydown', { key: 'ArrowRight' })
    await wrapper.setProps({ modelValue: 'results' })
    await wrapper.trigger('keydown', { key: 'ArrowLeft' })

    expect(wrapper.emitted('update:modelValue')).toEqual([['results'], ['stable']])

    wrapper.unmount()
  })
})
