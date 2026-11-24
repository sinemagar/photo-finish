import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import type { Horse } from '@/domain'

import RoundTable from './RoundTable.vue'

const horse = (id: number, name: string): Horse => ({
  id,
  name,
  color: { name: 'Crimson', hex: '#dc2626' },
  condition: 50,
})

const rows = [
  { rank: 1, horse: horse(4, 'Dusty Monarch'), detail: '1:15.32' },
  { rank: 2, horse: horse(9, 'Iron Willow'), detail: '1:16.01' },
]

describe('RoundTable', () => {
  it('renders the heading and one row per entry, in the given order', () => {
    const wrapper = mount(RoundTable, {
      props: { heading: 'Round 1 · 1200 m', rankLabel: 'Pos', rows },
    })

    expect(wrapper.get('caption').text()).toBe('Round 1 · 1200 m')
    expect(wrapper.findAll('tbody tr').map((row) => row.text())).toEqual([
      '1Dusty Monarch',
      '2Iron Willow',
    ])
  })

  it('shows the detail column only when it has a label', () => {
    const withDetail = mount(RoundTable, {
      props: { heading: 'Round 1', rankLabel: 'Pos', rows, detailLabel: 'Time' },
    })

    expect(withDetail.findAll('th').map((cell) => cell.text())).toEqual(['Pos', 'Horse', 'Time'])
    expect(withDetail.get('tbody tr').text()).toContain('1:15.32')
  })

  it('marks the active round visually and for screen readers', () => {
    const wrapper = mount(RoundTable, {
      props: { heading: 'Round 1', rankLabel: 'Lane', rows, active: true },
    })

    expect(wrapper.classes()).toContain('round-table--active')
    expect(wrapper.get('caption').text()).toContain('(current round)')
  })

  it('paints each horse in its own colour', () => {
    const wrapper = mount(RoundTable, {
      props: { heading: 'Round 1', rankLabel: 'Lane', rows },
    })

    expect(wrapper.get('.horse-badge__swatch').attributes('style')).toContain('background-color')
  })
})
