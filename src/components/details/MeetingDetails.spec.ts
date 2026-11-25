import { afterEach, describe, expect, it } from 'vitest'
import type { VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'

import { mountWithStores, tickUntilStatusChanges } from '@/test/mountWithStores'

import MeetingDetails from './MeetingDetails.vue'

describe('MeetingDetails', () => {
  let wrapper: VueWrapper

  afterEach(() => wrapper.unmount())

  const tab = (id: string) => `[data-testid="tab-${id}"]`
  const visiblePanels = () =>
    wrapper.findAll('[role="tabpanel"]').filter((panel) => panel.isVisible())

  it('shows one list at a time behind tabs, starting with the programme', () => {
    ;({ wrapper } = mountWithStores(MeetingDetails, {}, { attachTo: document.body }))

    expect(wrapper.find('[role="tablist"]').exists()).toBe(true)
    expect(visiblePanels().map((panel) => panel.attributes('id'))).toEqual([
      'section-panel-programme',
    ])
    expect(visiblePanels()[0]?.attributes('aria-labelledby')).toBe('section-tab-programme')
  })

  it('switches list when a tab is chosen', async () => {
    ;({ wrapper } = mountWithStores(MeetingDetails, {}, { attachTo: document.body }))

    await wrapper.get(tab('stable')).trigger('click')

    expect(visiblePanels().map((panel) => panel.attributes('id'))).toEqual(['section-panel-stable'])
    expect(wrapper.get(tab('stable')).attributes('aria-selected')).toBe('true')
  })

  it('turns to the results when the first one arrives and counts them on the tab', async () => {
    const mounted = mountWithStores(MeetingDetails, {}, { attachTo: document.body })
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
    const mounted = mountWithStores(MeetingDetails, {}, { attachTo: document.body })
    wrapper = mounted.wrapper

    await wrapper.get(tab('stable')).trigger('click')
    mounted.meeting.generateProgramme()
    mounted.meeting.start()
    tickUntilStatusChanges(mounted.meeting)
    await nextTick()

    expect(visiblePanels().map((panel) => panel.attributes('id'))).toEqual(['section-panel-stable'])
  })
})
