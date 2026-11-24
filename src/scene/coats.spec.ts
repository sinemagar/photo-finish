import { describe, expect, it } from 'vitest'

import { COATS, coatFor } from './coats'

describe('coats', () => {
  it('offers several distinct natural colours', () => {
    expect(COATS.length).toBeGreaterThanOrEqual(6)
    expect(new Set(COATS.map((coat) => coat.body)).size).toBe(COATS.length)
    expect(COATS.map((coat) => coat.name)).toEqual(
      expect.arrayContaining(['Bay', 'Chestnut', 'Black', 'Grey', 'White']),
    )
  })

  it('gives a horse the same coat every time', () => {
    expect(coatFor({ id: 7 })).toBe(coatFor({ id: 7 }))
  })

  it('spreads the coats across the stable', () => {
    const coats = Array.from({ length: 20 }, (_, index) => coatFor({ id: index + 1 }).name)

    expect(new Set(coats).size).toBe(COATS.length)
  })
})
