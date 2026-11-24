import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import { useSessionStore } from '@/stores/session'
import { mountWithStores, tickUntilStatusChanges } from '@/test/mountWithStores'

import HorseSprite from './HorseSprite.vue'
import TrackPanel from './TrackPanel.vue'

const lane = '[data-testid="track-lane"]'
const runner = '[data-testid="track-runner"]'
const status = '[data-testid="track-status"]'

describe('TrackPanel', () => {
  it('shows ten empty lanes and asks for a programme first', () => {
    const { wrapper } = mountWithStores(TrackPanel)

    expect(wrapper.get('h2').text()).toBe('Track')
    expect(wrapper.get(status).text()).toContain('Generate a programme')
    expect(wrapper.findAll(lane)).toHaveLength(10)
    expect(wrapper.findAll(runner)).toHaveLength(0)
  })

  it('lines the first round up once a programme is ready', async () => {
    const { wrapper, meeting } = mountWithStores(TrackPanel)

    meeting.generateProgramme()
    await nextTick()

    expect(wrapper.get('h2').text()).toBe('Round 1 · 1200 m')
    expect(wrapper.get(status).text()).toContain('Press Start')
    expect(wrapper.findAll(runner)).toHaveLength(10)
    expect(
      wrapper.findAll(runner).every((el) => el.attributes('style')?.includes('(0.000%)')),
    ).toBe(true)
  })

  it('moves the horses with the race and stops them on the finish line', async () => {
    const { wrapper, meeting } = mountWithStores(TrackPanel)
    const offsets = () =>
      wrapper
        .findAll(runner)
        .map((el) => Number(/translateX\((.+)%\)/.exec(el.attributes('style') ?? '')?.[1]))

    meeting.generateProgramme()
    meeting.start()
    meeting.tick(16)
    await nextTick()

    expect(offsets().every((offset) => offset > 0 && offset < 100)).toBe(true)

    tickUntilStatusChanges(meeting)
    await nextTick()

    expect(offsets().every((offset) => offset === 100)).toBe(true)
    expect(wrapper.findAll('[data-testid="track-position"]')).toHaveLength(10)
    expect(wrapper.get(status).text()).toContain('next round starts shortly')
  })

  it('shows the status in words next to the title', async () => {
    const { wrapper, meeting } = mountWithStores(TrackPanel)
    const badge = () => wrapper.get('[data-testid="status-badge"]').text()

    expect(badge()).toBe('No programme')

    meeting.generateProgramme()
    meeting.start()
    await nextTick()
    expect(badge()).toBe('Racing')
  })

  it('puts the message over the track only while nothing is on it or it is paused', async () => {
    const { wrapper, meeting } = mountWithStores(TrackPanel)
    const isSpotlit = () => wrapper.get(status).classes('track-panel__spotlight')

    expect(isSpotlit()).toBe(true)

    meeting.generateProgramme()
    meeting.start()
    await nextTick()
    expect(isSpotlit()).toBe(false)

    meeting.pause()
    await nextTick()
    expect(isSpotlit()).toBe(true)

    meeting.resume()
    tickUntilStatusChanges(meeting)
    await nextTick()
    expect(isSpotlit()).toBe(false)
  })

  it('shows how far the meeting has got', async () => {
    const { wrapper, meeting } = mountWithStores(TrackPanel)
    const steps = () =>
      wrapper.findAll('.round-stepper__step').map((step) => step.classes()[1]?.split('--')[1])

    expect(steps()).toEqual(Array(6).fill('upcoming'))

    meeting.generateProgramme()
    meeting.start()
    tickUntilStatusChanges(meeting)
    tickUntilStatusChanges(meeting)
    await nextTick()

    expect(steps()).toEqual(['done', 'current', 'upcoming', 'upcoming', 'upcoming', 'upcoming'])
  })

  it('changes the playback speed from the speed control', async () => {
    const { wrapper } = mountWithStores(TrackPanel, { speed: 1 })

    await wrapper.get('[data-testid="speed-4"]').setValue(true)

    expect(useSessionStore().speed).toBe(4)
  })

  it('gallops while running and stands still while paused', async () => {
    const { wrapper, meeting } = mountWithStores(TrackPanel)
    const galloping = () =>
      wrapper.findAllComponents(HorseSprite).map((sprite) => sprite.props('galloping'))

    meeting.generateProgramme()
    await nextTick()
    expect(galloping().some(Boolean)).toBe(false)

    meeting.start()
    await nextTick()
    expect(galloping().every(Boolean)).toBe(true)

    meeting.pause()
    await nextTick()
    expect(galloping().some(Boolean)).toBe(false)
    expect(wrapper.get(status).text()).toBe('Paused.')
  })
})
