import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import type { Horse } from '@/domain'

import RoundCard from './RoundCard.vue'

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

const base = { heading: 'Round 1 · 1200 m', rankLabel: 'Pos', rows }
const heading = '[data-testid="round-heading"]'
const summary = '[data-testid="round-summary"]'

describe('RoundCard', () => {
  it('renders the heading and one row per entry, in the given order', () => {
    const wrapper = mount(RoundCard, { props: base })

    expect(wrapper.get(heading).text()).toBe('Round 1 · 1200 m')
    expect(wrapper.findAll('tbody tr').map((row) => row.text())).toEqual([
      '1Dusty Monarch',
      '2Iron Willow',
    ])
  })

  it('shows the detail column only when it has a label', () => {
    const wrapper = mount(RoundCard, { props: { ...base, detailLabel: 'Time' } })

    expect(wrapper.findAll('th').map((cell) => cell.text())).toEqual(['Pos', 'Horse', 'Time'])
    expect(wrapper.get('tbody tr').text()).toContain('1:15.32')
  })

  it('shows a one-line summary next to the heading when given one', () => {
    const without = mount(RoundCard, { props: base })
    const withSummary = mount(RoundCard, { props: { ...base, summary: 'Won by Dusty Monarch' } })

    expect(without.find(summary).exists()).toBe(false)
    expect(withSummary.get(summary).text()).toBe('Won by Dusty Monarch')
  })

  it('reflects its state in a class', () => {
    expect(mount(RoundCard, { props: base }).classes()).toContain('round-card--upcoming')
    expect(mount(RoundCard, { props: { ...base, state: 'active' } }).classes()).toContain(
      'round-card--active',
    )
  })

  it('decorates the podium only when asked to', () => {
    const plain = mount(RoundCard, { props: base })
    const podium = mount(RoundCard, { props: { ...base, podium: true } })

    expect(plain.classes()).not.toContain('round-card--podium')
    expect(podium.classes()).toContain('round-card--podium')
    expect(
      podium.findAll('.round-card__rank-mark').map((mark) => mark.attributes('data-rank')),
    ).toEqual(['1', '2'])
  })

  it('paints each horse in its own colour', () => {
    const wrapper = mount(RoundCard, { props: base })

    expect(wrapper.get('.horse-badge__swatch').attributes('style')).toContain('background-color')
  })

  describe('collapsing', () => {
    it('is open by default and tells assistive technology so', () => {
      const wrapper = mount(RoundCard, { props: base })
      const toggle = wrapper.get('button')

      expect(toggle.attributes('aria-expanded')).toBe('true')
      expect(toggle.attributes('aria-controls')).toBe(wrapper.get('table').attributes('id'))
      expect(wrapper.get('table').isVisible()).toBe(true)
    })

    it('hides the table when collapsed but keeps the heading and summary', () => {
      const wrapper = mount(RoundCard, {
        props: { ...base, summary: 'Won by Dusty Monarch', expanded: false },
        attachTo: document.body,
      })

      expect(wrapper.get('button').attributes('aria-expanded')).toBe('false')
      expect(wrapper.get('table').isVisible()).toBe(false)
      expect(wrapper.get(heading).isVisible()).toBe(true)
      expect(wrapper.get(summary).isVisible()).toBe(true)

      wrapper.unmount()
    })

    it('asks to be toggled when its header is clicked', async () => {
      const wrapper = mount(RoundCard, { props: base })

      await wrapper.get('button').trigger('click')

      expect(wrapper.emitted('toggle')).toHaveLength(1)
    })
  })
})
