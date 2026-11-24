import { describe, expect, it } from 'vitest'

import { createProgramme } from './programme'
import { createRng } from './rng'
import { createStable } from './stable'

const horses = createStable(createRng(1))

describe('createProgramme', () => {
  it('creates 6 rounds numbered in order', () => {
    const programme = createProgramme(horses, createRng(2))

    expect(programme.map((round) => round.number)).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('uses the required distances in the required sequence', () => {
    const programme = createProgramme(horses, createRng(2))

    expect(programme.map((round) => round.distance)).toEqual([1200, 1400, 1600, 1800, 2000, 2200])
  })

  it('enters 10 distinct horses from the stable in every round', () => {
    const ids = new Set(horses.map((horse) => horse.id))

    for (let seed = 0; seed < 25; seed++) {
      for (const round of createProgramme(horses, createRng(seed))) {
        const entered = round.runners.map((runner) => runner.horseId)

        expect(entered).toHaveLength(10)
        expect(new Set(entered).size).toBe(10)
        expect(entered.every((id) => ids.has(id))).toBe(true)
      }
    }
  })

  it('assigns lanes 1 to 10 once each', () => {
    for (const round of createProgramme(horses, createRng(2))) {
      expect(round.runners.map((runner) => runner.lane)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    }
  })

  it('draws a different field for different rounds', () => {
    const [first, second] = createProgramme(horses, createRng(2))

    expect(first?.runners).not.toEqual(second?.runners)
  })

  it('is reproducible from a seed', () => {
    expect(createProgramme(horses, createRng(5))).toEqual(createProgramme(horses, createRng(5)))
  })

  it('rejects a stable that cannot fill a round', () => {
    expect(() => createProgramme(horses.slice(0, 9), createRng(2))).toThrow(RangeError)
  })
})
