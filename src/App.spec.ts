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

  describe('the meeting details', () => {
    const tab = (id: string) => `[data-testid="tab-${id}"]`
    const visiblePanels = () =>
      wrapper.findAll('[role="tabpanel"]').filter((panel) => panel.isVisible())

    it('shows one list at a time behind tabs, starting with the programme', () => {
      ;({ wrapper } = mountWithStores(App, {}, { attachTo: document.body }))

      expect(wrapper.find('[role="tablist"]').exists()).toBe(true)
      expect(visiblePanels().map((panel) => panel.attributes('id'))).toEqual([
        'section-panel-programme',
      ])
      expect(visiblePanels()[0]?.attributes('aria-labelledby')).toBe('section-tab-programme')
    })

    it('switches list when a tab is chosen', async () => {
      ;({ wrapper } = mountWithStores(App, {}, { attachTo: document.body }))

      await wrapper.get(tab('stable')).trigger('click')

      expect(visiblePanels().map((panel) => panel.attributes('id'))).toEqual([
        'section-panel-stable',
      ])
      expect(wrapper.get(tab('stable')).attributes('aria-selected')).toBe('true')
    })

    it('turns to the results when the first one arrives and counts them on the tab', async () => {
      const mounted = mountWithStores(App, {}, { attachTo: document.body })
      wrapper = mounted.wrapper

      mounted.meeting.generateProgramme()
      mounted.meeting.start()
      tickUntilStatusChanges(mounted.meeting)
      await nextTick()

      expect(visiblePanels().map((panel) => panel.attributes('id'))).toEqual([
        'section-panel-results',
      ])
      expect(wrapper.get(tab('results')).text()).toBe('Results 1')
    })

    it('leaves the reader on the tab they picked themselves', async () => {
      const mounted = mountWithStores(App, {}, { attachTo: document.body })
      wrapper = mounted.wrapper

      await wrapper.get(tab('stable')).trigger('click')
      mounted.meeting.generateProgramme()
      mounted.meeting.start()
      tickUntilStatusChanges(mounted.meeting)
      await nextTick()

      expect(visiblePanels().map((panel) => panel.attributes('id'))).toEqual([
        'section-panel-stable',
      ])
    })
  })
})
