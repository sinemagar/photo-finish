import { describe, expect, it } from 'vitest'

import { formatDistance, formatOrdinal, formatRaceTime, formatRoundHeading } from './format'

describe('formatDistance', () => {
  it('appends the unit', () => {
    expect(formatDistance(1200)).toBe('1200 m')
  })
})

describe('formatRoundHeading', () => {
  it('names the round and its distance', () => {
    expect(formatRoundHeading({ number: 2, distance: 1400 })).toBe('Round 2 · 1400 m')
  })
})

describe('formatRaceTime', () => {
  it.each([
    [75.321, '1:15.32'],
    [59.5, '0:59.50'],
    [60, '1:00.00'],
    [125.059, '2:05.06'],
    [59.999, '1:00.00'],
  ])('formats %f seconds as %s', (seconds, expected) => {
    expect(formatRaceTime(seconds)).toBe(expected)
  })
})

describe('formatOrdinal', () => {
  it.each([
    [1, '1st'],
    [2, '2nd'],
    [3, '3rd'],
    [4, '4th'],
    [10, '10th'],
    [11, '11th'],
    [12, '12th'],
    [13, '13th'],
    [21, '21st'],
  ])('formats %i as %s', (value, expected) => {
    expect(formatOrdinal(value)).toBe(expected)
  })
})
