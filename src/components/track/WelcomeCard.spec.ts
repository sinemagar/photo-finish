import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import WelcomeCard from './WelcomeCard.vue'

describe('WelcomeCard', () => {
  it('introduces the game in three steps', () => {
    const wrapper = mount(WelcomeCard)

    expect(wrapper.get('h3').text()).toBe('Race night')
    expect(wrapper.findAll('li strong').map((action) => action.text())).toEqual([
      'Generate',
      'Start',
      'Watch',
    ])
    expect(wrapper.get('ol').text()).toContain('a programme of six rounds')
  })

  it('offers the main action right where the player is looking', async () => {
    const wrapper = mount(WelcomeCard)

    await wrapper.get('[data-testid="welcome-generate"]').trigger('click')

    expect(wrapper.emitted('generate')).toHaveLength(1)
  })

  it('offers an explanation of how the game works', async () => {
    const wrapper = mount(WelcomeCard)

    await wrapper.get('[data-testid="welcome-help"]').trigger('click')

    expect(wrapper.emitted('help')).toHaveLength(1)
  })
})
