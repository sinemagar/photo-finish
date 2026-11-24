import { describe, expect, it } from 'vitest'

import { createRng, randomFloat, randomInt, sample, shuffle } from './rng'

const draw = (seed: number, count: number) => {
  const rng = createRng(seed)
  return Array.from({ length: count }, () => rng())
}

describe('createRng', () => {
  it('yields the same sequence for the same seed', () => {
    expect(draw(42, 20)).toEqual(draw(42, 20))
  })

  it('yields different sequences for different seeds', () => {
    expect(draw(1, 20)).not.toEqual(draw(2, 20))
  })

  it('stays within [0, 1)', () => {
    for (const value of draw(7, 1000)) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
})

describe('randomInt', () => {
  it('covers the whole inclusive range and never leaves it', () => {
    const rng = createRng(3)
    const seen = new Set(Array.from({ length: 500 }, () => randomInt(rng, 1, 6)))

    expect([...seen].sort()).toEqual([1, 2, 3, 4, 5, 6])
  })
})

describe('randomFloat', () => {
  it('stays within [min, max)', () => {
    const rng = createRng(5)

    for (let i = 0; i < 500; i++) {
      const value = randomFloat(rng, -0.5, 0.5)
      expect(value).toBeGreaterThanOrEqual(-0.5)
      expect(value).toBeLessThan(0.5)
    }
  })
})

describe('shuffle', () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  it('keeps every item exactly once', () => {
    const result = shuffle(createRng(11), items)

    expect([...result].sort((a, b) => a - b)).toEqual(items)
  })

  it('does not mutate its input', () => {
    const copy = [...items]
    shuffle(createRng(11), items)

    expect(items).toEqual(copy)
  })

  it('changes the order', () => {
    expect(shuffle(createRng(11), items)).not.toEqual(items)
  })
})

describe('sample', () => {
  it('picks the requested number of distinct items', () => {
    const result = sample(createRng(13), [1, 2, 3, 4, 5, 6], 4)

    expect(result).toHaveLength(4)
    expect(new Set(result).size).toBe(4)
  })

  it('rejects a sample larger than the list', () => {
    expect(() => sample(createRng(13), [1, 2], 3)).toThrow(RangeError)
  })
})
