import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import type { TrackRunner } from '@/stores/meeting'

import HorseSprite from './HorseSprite.vue'
import TrackLane from './TrackLane.vue'

const runner = (overrides: Partial<TrackRunner> = {}): TrackRunner => ({
  lane: 3,
  horse: { id: 4, name: 'Dusty Monarch', color: { name: 'Lime', hex: '#84cc16' }, condition: 60 },
  progress: 0,
  position: null,
  ...overrides,
})

const mover = '[data-testid="track-runner"]'
const position = '[data-testid="track-position"]'

describe('TrackLane', () => {
  it('shows the lane number, also when the lane is empty', () => {
    const wrapper = mount(TrackLane, { props: { lane: 7 } })

    expect(wrapper.get('.track-lane__number').text()).toBe('Lane 7')
    expect(wrapper.find(mover).exists()).toBe(false)
  })

  it('names the horse and paints it in its colour', () => {
    const wrapper = mount(TrackLane, { props: { lane: 3, runner: runner() } })

    expect(wrapper.get('.track-lane__name').text()).toBe('Dusty Monarch')
    expect(wrapper.getComponent(HorseSprite).props('color')).toBe('#84cc16')
  })

  it('puts the lane number on the saddle cloth', () => {
    const wrapper = mount(TrackLane, { props: { lane: 3, runner: runner() } })

    expect(wrapper.getComponent(HorseSprite).props('number')).toBe(3)
  })

  it.each([
    [0, 'translateX(0.000%)'],
    [0.4567, 'translateX(45.670%)'],
    [1, 'translateX(100.000%)'],
  ])('moves the horse to %f of the course using transform only', (progress, transform) => {
    const wrapper = mount(TrackLane, { props: { lane: 3, runner: runner({ progress }) } })

    expect(wrapper.get(mover).attributes('style')).toBe(`transform: ${transform};`)
  })

  it('gallops only while the race is moving and the horse has not finished', async () => {
    const wrapper = mount(TrackLane, { props: { lane: 3, runner: runner({ progress: 0.5 }) } })
    const isGalloping = () => wrapper.getComponent(HorseSprite).props('galloping')

    expect(isGalloping()).toBe(false)

    await wrapper.setProps({ racing: true })
    expect(isGalloping()).toBe(true)

    await wrapper.setProps({ runner: runner({ progress: 1, position: 2 }) })
    expect(isGalloping()).toBe(false)
  })

  it('shows the finishing position once the horse is over the line', async () => {
    const wrapper = mount(TrackLane, { props: { lane: 3, runner: runner({ progress: 0.9 }) } })
    expect(wrapper.find(position).exists()).toBe(false)

    await wrapper.setProps({ runner: runner({ progress: 1, position: 2 }) })
    expect(wrapper.get(position).text()).toBe('2nd')
  })
})
