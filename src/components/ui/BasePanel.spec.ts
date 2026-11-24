import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import BasePanel from './BasePanel.vue'

describe('BasePanel', () => {
  it('renders the title and the content', () => {
    const wrapper = mount(BasePanel, {
      props: { title: 'Results' },
      slots: { default: '<p>Content</p>' },
    })

    expect(wrapper.get('h2').text()).toBe('Results')
    expect(wrapper.get('.base-panel__body').text()).toBe('Content')
  })

  it('labels the section with its heading', () => {
    const wrapper = mount(BasePanel, { props: { title: 'Results' } })

    expect(wrapper.attributes('aria-labelledby')).toBe(wrapper.get('h2').attributes('id'))
  })

  it('lets keyboard users focus its scrolling body', () => {
    const wrapper = mount(BasePanel, { props: { title: 'Results' } })

    expect(wrapper.get('.base-panel__body').attributes('tabindex')).toBe('0')
  })
})
