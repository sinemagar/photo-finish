import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import BaseButton from './BaseButton.vue'

describe('BaseButton', () => {
  it('renders its slot in a button that does not submit forms', () => {
    const wrapper = mount(BaseButton, { slots: { default: 'Start' } })

    expect(wrapper.text()).toBe('Start')
    expect(wrapper.attributes('type')).toBe('button')
  })

  it('defaults to the secondary variant', () => {
    expect(mount(BaseButton).classes()).toContain('base-button--secondary')
  })

  it('applies the requested variant', () => {
    const wrapper = mount(BaseButton, { props: { variant: 'primary' } })

    expect(wrapper.classes()).toContain('base-button--primary')
  })

  it('cannot be clicked while disabled', async () => {
    let clicks = 0
    const wrapper = mount(BaseButton, {
      props: { disabled: true },
      attrs: { onClick: () => clicks++ },
    })

    await wrapper.trigger('click')

    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(clicks).toBe(0)
  })
})
