import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'

import { useAutoExpand } from './useAutoExpand'

describe('useAutoExpand', () => {
  it('opens the current item from the start', () => {
    const { isExpanded } = useAutoExpand(ref<number | null>(2))

    expect(isExpanded(2)).toBe(true)
    expect(isExpanded(1)).toBe(false)
  })

  it('opens nothing while there is no current item', () => {
    const { isExpanded } = useAutoExpand(ref<number | null>(null))

    expect(isExpanded(1)).toBe(false)
  })

  it('lets the user open and close items by hand', () => {
    const { isExpanded, toggle } = useAutoExpand(ref<number | null>(1))

    toggle(3)
    expect(isExpanded(1)).toBe(true)
    expect(isExpanded(3)).toBe(true)

    toggle(1)
    expect(isExpanded(1)).toBe(false)
  })

  it('moves on with the current item, closing what was open', async () => {
    const current = ref<number | null>(1)
    const { isExpanded, toggle } = useAutoExpand(current)
    toggle(4)

    current.value = 2
    await nextTick()

    expect(isExpanded(2)).toBe(true)
    expect(isExpanded(1)).toBe(false)
    expect(isExpanded(4)).toBe(false)
  })
})
