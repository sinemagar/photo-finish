import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import HorseSprite from './HorseSprite.vue'

describe('HorseSprite', () => {
  it('passes the coat colour to the drawing', () => {
    const wrapper = mount(HorseSprite, { props: { color: '#dc2626' } })

    expect(wrapper.attributes('style')).toContain('--horse-color: #dc2626')
  })

  it('is decorative for assistive technology', () => {
    const wrapper = mount(HorseSprite, { props: { color: '#dc2626' } })

    expect(wrapper.attributes('aria-hidden')).toBe('true')
  })

  it('gallops only when told to', async () => {
    const wrapper = mount(HorseSprite, { props: { color: '#dc2626' } })
    expect(wrapper.classes()).not.toContain('horse-sprite--galloping')

    await wrapper.setProps({ galloping: true })
    expect(wrapper.classes()).toContain('horse-sprite--galloping')
  })
})
