import { describe, expect, it } from 'vitest'

import { mountWithStores } from '@/test/mountWithStores'

import StablePanel from './StablePanel.vue'

describe('StablePanel', () => {
  it('draws a condition meter in proportion to the score', () => {
    const { wrapper, stable } = mountWithStores(StablePanel)
    const fills = wrapper.findAll('.stable-grid__meter-fill')

    stable.horses.forEach((horse, index) => {
      expect(fills[index]?.attributes('style')).toBe(`width: ${horse.condition}%;`)
    })
  })

  it('lists all 20 horses with name, colour and condition', () => {
    const { wrapper, stable } = mountWithStores(StablePanel)
    const rows = wrapper.findAll('[data-testid="stable-row"]')

    expect(wrapper.get('h2').text()).toBe('Stable (20 horses)')
    expect(rows).toHaveLength(20)

    stable.horses.forEach((horse, index) => {
      const text = rows[index]?.text() ?? ''

      expect(text).toContain(horse.name)
      expect(text).toContain(horse.color.name)
      expect(text).toContain(String(horse.condition))
    })
  })
})
