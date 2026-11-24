import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useSessionStore } from './session'
import { useStableStore } from './stable'

describe('stable store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    useSessionStore().configure({ seed: 1 })
  })

  it('starts empty', () => {
    expect(useStableStore().horses).toEqual([])
  })

  it('generates 20 horses', () => {
    const stable = useStableStore()

    stable.generate()

    expect(stable.horses).toHaveLength(20)
  })

  it('finds a horse by id', () => {
    const stable = useStableStore()
    stable.generate()

    expect(stable.getHorse(7)).toBe(stable.horses[6])
    expect(stable.getHorse(999)).toBeUndefined()
  })

  it('generates the same stable for the same seed', () => {
    const stable = useStableStore()
    stable.generate()
    const first = stable.horses

    useSessionStore().configure({ seed: 1 })
    stable.generate()

    expect(stable.horses).toEqual(first)
  })
})
