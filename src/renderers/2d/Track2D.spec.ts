import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import type { TrackRunner } from '@/renderers/types'

import Track2D from './Track2D.vue'
import TrackLane from './TrackLane.vue'

const runnerIn = (lane: number): TrackRunner => ({
  lane,
  horse: {
    id: lane,
    name: `Horse ${lane}`,
    color: { name: 'Lime', hex: '#84cc16' },
    condition: 50,
  },
  progress: 0.25,
  position: null,
  rank: null,
})

describe('Track2D', () => {
  it('draws the requested number of lanes even without runners', () => {
    const wrapper = mount(Track2D, { props: { runners: [], lanes: 10 } })
    const lanes = wrapper.findAllComponents(TrackLane)

    expect(lanes.map((lane) => lane.props('lane'))).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(lanes.every((lane) => lane.props('runner') === undefined)).toBe(true)
  })

  it('puts each runner in its own lane, whatever order they arrive in', () => {
    const runners = [runnerIn(3), runnerIn(1)]
    const wrapper = mount(Track2D, { props: { runners, lanes: 4 } })
    const lanes = wrapper.findAllComponents(TrackLane)

    expect(lanes.map((lane) => lane.props('runner')?.horse.name)).toEqual([
      'Horse 1',
      undefined,
      'Horse 3',
      undefined,
    ])
  })

  it('tells every lane whether the race is moving', async () => {
    const wrapper = mount(Track2D, { props: { runners: [runnerIn(1)], lanes: 2 } })
    const racing = () => wrapper.findAllComponents(TrackLane).map((lane) => lane.props('racing'))

    expect(racing()).toEqual([false, false])

    await wrapper.setProps({ racing: true })
    expect(racing()).toEqual([true, true])
  })

  it('labels the quarter markers with the distance of the round', () => {
    const wrapper = mount(Track2D, { props: { runners: [], lanes: 10, distance: 2200 } })
    const labels = wrapper.findAll('.race-track__marker-label').map((label) => label.text())

    expect(labels).toEqual(['', '550 m', '1100 m', '1650 m'])
  })

  it('places the markers on the scale the horses move along', () => {
    const wrapper = mount(Track2D, { props: { runners: [], lanes: 10 } })
    const shares = wrapper
      .findAll('.race-track__marker')
      .map((marker) => marker.attributes('style'))

    expect(shares).toEqual(['--share: 0;', '--share: 0.25;', '--share: 0.5;', '--share: 0.75;'])
  })

  it('marks the finish line', () => {
    const wrapper = mount(Track2D, { props: { runners: [], lanes: 10 } })

    expect(wrapper.find('.race-track__finish').exists()).toBe(true)
  })
})
