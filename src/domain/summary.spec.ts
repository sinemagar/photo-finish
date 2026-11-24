import { describe, expect, it } from 'vitest'

import { summariseMeeting } from './summary'
import type { RoundResult } from './types'

/** Builds a result from horse ids listed in finishing order. */
const result = (roundNumber: number, ...finishers: number[]): RoundResult => ({
  roundNumber,
  distance: 1200,
  placings: finishers.map((horseId, index) => ({
    horseId,
    position: index + 1,
    lane: index + 1,
    time: 70 + index,
  })),
})

describe('summariseMeeting', () => {
  it('returns nothing for a meeting without results', () => {
    expect(summariseMeeting([])).toEqual([])
  })

  it('counts races, wins, podiums and the best finish of every horse', () => {
    const records = summariseMeeting([result(1, 5, 2, 9, 7), result(2, 2, 7, 5, 9)])

    expect(records.find((record) => record.horseId === 5)).toEqual({
      horseId: 5,
      races: 2,
      wins: 1,
      podiums: 2,
      bestPosition: 1,
    })
    expect(records.find((record) => record.horseId === 7)).toEqual({
      horseId: 7,
      races: 2,
      wins: 0,
      podiums: 1,
      bestPosition: 2,
    })
  })

  it('ranks by wins, then podiums, then best finish, then id', () => {
    const records = summariseMeeting([
      result(1, 1, 2, 3, 4),
      result(2, 1, 5, 6, 2),
      result(3, 2, 6, 7, 8),
    ])

    // 1: two wins. 2: one win, two podiums. 6: no win, two podiums. 5: one podium, best 2nd.
    // 3 and 7: one podium, best 3rd, ordered by id. 4 and 8: no podium, ordered by id.
    expect(records.map((record) => record.horseId)).toEqual([1, 2, 6, 5, 3, 7, 4, 8])
  })

  it('does not change the results it is given', () => {
    const results = [result(1, 3, 1, 2)]
    const snapshot = structuredClone(results)

    summariseMeeting(results)

    expect(results).toEqual(snapshot)
  })
})
