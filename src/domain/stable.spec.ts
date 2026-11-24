import { describe, expect, it } from 'vitest'

import { CONDITION_RANGE, STABLE_SIZE } from './config'
import { createRng } from './rng'
import { createStable } from './stable'

describe('createStable', () => {
  it('creates 20 horses by default', () => {
    expect(STABLE_SIZE).toBe(20)
    expect(createStable(createRng(1))).toHaveLength(20)
  })

  it('gives every horse a unique id, name and colour', () => {
    const horses = createStable(createRng(1))

    expect(new Set(horses.map((horse) => horse.id)).size).toBe(horses.length)
    expect(new Set(horses.map((horse) => horse.name)).size).toBe(horses.length)
    expect(new Set(horses.map((horse) => horse.color.hex)).size).toBe(horses.length)
    expect(new Set(horses.map((horse) => horse.color.name)).size).toBe(horses.length)
  })

  it('keeps every condition an integer between 1 and 100', () => {
    for (let seed = 0; seed < 50; seed++) {
      for (const horse of createStable(createRng(seed))) {
        expect(Number.isInteger(horse.condition)).toBe(true)
        expect(horse.condition).toBeGreaterThanOrEqual(CONDITION_RANGE.min)
        expect(horse.condition).toBeLessThanOrEqual(CONDITION_RANGE.max)
      }
    }
  })

  it('is reproducible from a seed', () => {
    expect(createStable(createRng(99))).toEqual(createStable(createRng(99)))
  })

  it('varies between seeds', () => {
    expect(createStable(createRng(1))).not.toEqual(createStable(createRng(2)))
  })

  it('rejects a size it has no unique names and colours for', () => {
    expect(() => createStable(createRng(1), 21)).toThrow(RangeError)
  })
})
