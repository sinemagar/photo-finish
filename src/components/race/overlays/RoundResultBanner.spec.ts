import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import RoundResultBanner, { type PodiumEntry } from './RoundResultBanner.vue'

const entry = (position: number, name: string, time: string): PodiumEntry => ({
  position,
  horse: { id: position, name, color: { name: 'Lime', hex: '#84cc16' }, condition: 50 },
  time,
})

const podium = [
  entry(1, 'Kestrel Song', '1:09.79'),
  entry(2, 'Rustic Arrow', '1:10.62'),
  entry(3, 'Quiet Riot', '1:12.17'),
]

describe('RoundResultBanner', () => {
  it('names the round and lists the podium with times', () => {
    const wrapper = mount(RoundResultBanner, { props: { roundNumber: 1, podium } })

    expect(wrapper.get('h3').text()).toBe('Round 1 result')
    expect(wrapper.findAll('li').map((item) => item.text())).toEqual([
      '1Kestrel Song1:09.79',
      '2Rustic Arrow1:10.62',
      '3Quiet Riot1:12.17',
    ])
    expect(wrapper.findAll('.result-banner__entry--winner')).toHaveLength(1)
  })

  it('announces the next round with a countdown', () => {
    const wrapper = mount(RoundResultBanner, {
      props: { roundNumber: 1, podium, nextHeading: 'Round 2 · 1400 m', countdown: 3 },
    })

    expect(wrapper.get('[data-testid="next-round"]').text()).toContain('Next: Round 2 · 1400 m')
    expect(wrapper.get('[data-testid="countdown"]').text()).toBe('3')
  })

  it('leaves the next round out when there is none', () => {
    const wrapper = mount(RoundResultBanner, { props: { roundNumber: 6, podium } })

    expect(wrapper.find('[data-testid="next-round"]').exists()).toBe(false)
  })

  it('hides the countdown once it reaches zero', () => {
    const wrapper = mount(RoundResultBanner, {
      props: { roundNumber: 1, podium, nextHeading: 'Round 2 · 1400 m', countdown: 0 },
    })

    expect(wrapper.find('[data-testid="countdown"]').exists()).toBe(false)
  })
})
