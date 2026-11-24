import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import { mountWithStores, tickUntilStatusChanges } from '@/test/mountWithStores'

import TrackPanel from './TrackPanel.vue'

const lane = '[data-testid="track-lane"]'
const status = '[data-testid="track-status"]'

describe('TrackPanel', () => {
  it('asks for a programme first', () => {
    const { wrapper } = mountWithStores(TrackPanel)

    expect(wrapper.get('h2').text()).toBe('Track')
    expect(wrapper.get(status).text()).toContain('Generate a programme')
    expect(wrapper.findAll(lane)).toHaveLength(0)
  })

  it('names the upcoming round once a programme is ready', async () => {
    const { wrapper, meeting } = mountWithStores(TrackPanel)

    meeting.generateProgramme()
    await nextTick()

    expect(wrapper.get('h2').text()).toBe('Round 1 · 1200 m')
    expect(wrapper.get(status).text()).toContain('Press Start')
  })

  it('shows ten lanes whose progress follows the race', async () => {
    const { wrapper, meeting } = mountWithStores(TrackPanel)
    const progressValues = () =>
      wrapper.findAll('progress').map((bar) => Number(bar.attributes('value')))

    meeting.generateProgramme()
    meeting.start()
    await nextTick()

    expect(wrapper.findAll(lane)).toHaveLength(10)
    expect(progressValues().every((value) => value === 0)).toBe(true)

    meeting.tick(16)
    await nextTick()
    expect(progressValues().every((value) => value > 0 && value < 1)).toBe(true)

    tickUntilStatusChanges(meeting)
    await nextTick()
    expect(progressValues().every((value) => value === 1)).toBe(true)
    expect(wrapper.get(status).text()).toContain('next round starts shortly')
  })

  it('reports a pause', async () => {
    const { wrapper, meeting } = mountWithStores(TrackPanel)

    meeting.generateProgramme()
    meeting.start()
    meeting.pause()
    await nextTick()

    expect(wrapper.get(status).text()).toBe('Paused.')
  })
})
