import { afterEach, describe, expect, it } from 'vitest'
import type { VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'

import { mountWithStores, tickUntilStatusChanges } from '@/test/mountWithStores'

import App from './App.vue'

const generateButton = '[data-testid="generate-button"]'
const toggleButton = '[data-testid="toggle-button"]'

describe('App', () => {
  let wrapper: VueWrapper

  afterEach(() => wrapper.unmount())

  it('opens with the stable listed and Start disabled', () => {
    ;({ wrapper } = mountWithStores(App))

    expect(wrapper.get('h1').text()).toBe('Photo Finish')
    expect(wrapper.findAll('[data-testid="stable-row"]')).toHaveLength(20)
    expect(wrapper.get(toggleButton).attributes('disabled')).toBeDefined()
  })

  it('plays a meeting from the header controls', async () => {
    const mounted = mountWithStores(App)
    wrapper = mounted.wrapper
    const { meeting } = mounted

    await wrapper.get(generateButton).trigger('click')
    expect(wrapper.findAll('[data-testid="programme-round"]')).toHaveLength(6)
    expect(wrapper.get(toggleButton).attributes('disabled')).toBeUndefined()

    await wrapper.get(toggleButton).trigger('click')
    expect(meeting.status).toBe('running')
    expect(wrapper.get(toggleButton).text()).toBe('Pause')
    expect(wrapper.get(generateButton).attributes('disabled')).toBeDefined()

    await wrapper.get(toggleButton).trigger('click')
    expect(meeting.status).toBe('paused')
    expect(wrapper.get(toggleButton).text()).toBe('Resume')

    await wrapper.get(toggleButton).trigger('click')
    tickUntilStatusChanges(meeting)
    await nextTick()

    expect(wrapper.findAll('[data-testid="result-round"]')).toHaveLength(1)
  })

  it('opens the explanation from the header and from the welcome card, and closes it', async () => {
    ;({ wrapper } = mountWithStores(App, {}, { attachTo: document.body }))
    const dialog = () => wrapper.get('[data-testid="help-dialog"]').element as HTMLDialogElement

    expect(dialog().hasAttribute('open')).toBe(false)

    await wrapper.get('[data-testid="help-button"]').trigger('click')
    await nextTick()
    expect(dialog().hasAttribute('open')).toBe(true)

    await wrapper.get('[data-testid="dialog-close"]').trigger('click')
    await nextTick()
    expect(dialog().hasAttribute('open')).toBe(false)

    await wrapper.get('[data-testid="welcome-help"]').trigger('click')
    await nextTick()
    expect(dialog().hasAttribute('open')).toBe(true)
  })
})
