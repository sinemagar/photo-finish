import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import type { TrackRunner } from '@/renderers/types'

import LiveLeaders from './LiveLeaders.vue'

const runner = (lane: number, rank: number | null): TrackRunner => ({
  lane,
  horse: {
    id: lane,
    name: `Horse ${lane}`,
    color: { name: 'Lime', hex: '#84cc16' },
    condition: 50,
  },
  progress: 0.5,
  position: null,
  rank,
})

const names = (runners: TrackRunner[], size?: number) =>
  mount(LiveLeaders, { props: { runners, size } })
    .findAll('li')
    .map((item) => item.text())

describe('LiveLeaders', () => {
  it('shows nothing before the field has an order', () => {
    const wrapper = mount(LiveLeaders, { props: { runners: [runner(1, null), runner(2, null)] } })

    expect(wrapper.find('[data-testid="live-leaders"]').exists()).toBe(false)
  })

  it('lists the first three in order of rank, whatever lane they run in', () => {
    const field = [runner(1, 4), runner(2, 2), runner(3, 1), runner(4, 3), runner(5, 5)]

    expect(names(field)).toEqual(['1Horse 3', '2Horse 2', '3Horse 4'])
  })

  it('can show a different number of leaders', () => {
    const field = [runner(1, 2), runner(2, 1), runner(3, 3)]

    expect(names(field, 1)).toEqual(['1Horse 2'])
  })
})
