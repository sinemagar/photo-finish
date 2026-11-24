import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useSessionStore } from './session'

const draw = (random: () => number, count = 5) => Array.from({ length: count }, random)

describe('session store', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('replays the same random sequence for the same seed', () => {
    const session = useSessionStore()

    session.configure({ seed: 42 })
    const first = draw(session.random)
    session.configure({ seed: 42 })

    expect(draw(session.random)).toEqual(first)
    expect(session.seed).toBe(42)
  })

  it('keeps `random` usable as a reference across reconfiguration', () => {
    const session = useSessionStore()
    const { random } = session

    session.configure({ seed: 1 })
    const fromFirstSeed = draw(random)
    session.configure({ seed: 2 })

    expect(draw(random)).not.toEqual(fromFirstSeed)
  })

  it('falls back to a clock-based seed', () => {
    const session = useSessionStore()

    session.configure()

    expect(Number.isInteger(session.seed)).toBe(true)
    expect(session.seed).toBeGreaterThan(0)
  })

  it('defaults to normal speed and ignores a non-positive one', () => {
    const session = useSessionStore()
    expect(session.speed).toBe(1)

    session.configure({ speed: 20 })
    expect(session.speed).toBe(20)

    session.configure({ speed: 0 })
    expect(session.speed).toBe(1)
  })

  it('changes the speed on request and ignores values that make no sense', () => {
    const session = useSessionStore()

    session.setSpeed(4)
    expect(session.speed).toBe(4)

    session.setSpeed(0)
    session.setSpeed(-2)
    session.setSpeed(Number.NaN)
    expect(session.speed).toBe(4)
  })
})
