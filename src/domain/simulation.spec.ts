import { describe, expect, it } from 'vitest'

import { SIMULATION } from './config'
import { createProgramme } from './programme'
import { createRng } from './rng'
import {
  advanceRound,
  baseSpeed,
  completeRound,
  createRoundState,
  getRoundResult,
  isRoundFinished,
  runnerProgress,
} from './simulation'
import { createStable } from './stable'
import type { Horse, Round, RoundState } from './types'

const horses = createStable(createRng(1))
const programme = createProgramme(horses, createRng(2))
const firstRound = programme[0] as Round

/** Runs a round to the end, feeding it time in slices of the given length. */
function runInSlices(round: Round, seed: number, slice: number): RoundState {
  const rng = createRng(seed)
  let state = createRoundState(round, horses, rng)

  while (!isRoundFinished(state)) {
    state = advanceRound(state, slice, rng)
  }

  return state
}

describe('baseSpeed', () => {
  it('maps the condition range onto the configured speed band', () => {
    expect(baseSpeed(1)).toBe(SIMULATION.minSpeed)
    expect(baseSpeed(100)).toBe(SIMULATION.maxSpeed)
    expect(baseSpeed(60)).toBeGreaterThan(baseSpeed(40))
  })
})

describe('createRoundState', () => {
  it('puts every runner on the starting line', () => {
    const state = createRoundState(firstRound, horses, createRng(3))

    expect(state.elapsed).toBe(0)
    expect(state.runners).toHaveLength(10)
    expect(state.runners.every((runner) => runner.covered === 0)).toBe(true)
    expect(state.runners.every((runner) => runner.finishTime === null)).toBe(true)
    expect(isRoundFinished(state)).toBe(false)
  })

  it('keeps form within the configured spread of the base speed', () => {
    const state = createRoundState(firstRound, horses, createRng(3))

    for (const runner of state.runners) {
      const horse = horses.find((candidate) => candidate.id === runner.horseId) as Horse
      const form = runner.cruisingSpeed / baseSpeed(horse.condition)

      expect(Math.abs(form - 1)).toBeLessThanOrEqual(SIMULATION.formSpread)
    }
  })

  it('rejects a round that refers to a horse outside the stable', () => {
    const round: Round = { number: 1, distance: 1200, runners: [{ horseId: 999, lane: 1 }] }

    expect(() => createRoundState(round, horses, createRng(3))).toThrow(/unknown horse 999/)
  })
})

describe('advanceRound', () => {
  it('does not mutate the state it is given', () => {
    const state = createRoundState(firstRound, horses, createRng(3))
    const snapshot = structuredClone(state)

    advanceRound(state, 1, createRng(4))

    expect(state).toEqual(snapshot)
  })

  it('moves every runner forward', () => {
    const rng = createRng(3)
    const state = advanceRound(createRoundState(firstRound, horses, rng), 2, rng)

    expect(state.elapsed).toBeCloseTo(2)
    for (const runner of state.runners) {
      expect(runner.covered).toBeGreaterThan(0)
      expect(runnerProgress(state, runner)).toBeLessThan(1)
    }
  })

  it('keeps time shorter than one step for the next call', () => {
    const rng = createRng(3)
    const initial = createRoundState(firstRound, horses, rng)
    const waiting = advanceRound(initial, SIMULATION.step * 0.6, rng)

    expect(waiting.elapsed).toBe(0)
    expect(waiting.runners).toEqual(initial.runners)

    const stepped = advanceRound(waiting, SIMULATION.step * 0.6, rng)

    expect(stepped.elapsed).toBeCloseTo(SIMULATION.step)
    expect(stepped.pending).toBeCloseTo(SIMULATION.step * 0.2)
  })

  it('ignores negative time', () => {
    const rng = createRng(3)
    const initial = createRoundState(firstRound, horses, rng)

    expect(advanceRound(initial, -5, rng)).toEqual(initial)
  })

  it('finishes every runner and never lets one pass the finish line', () => {
    for (const round of programme) {
      const state = runInSlices(round, 7, 1)

      expect(isRoundFinished(state)).toBe(true)
      for (const runner of state.runners) {
        expect(runner.covered).toBe(round.distance)
        expect(runnerProgress(state, runner)).toBe(1)
      }
    }
  })

  it('stops the clock once the round is over', () => {
    const rng = createRng(7)
    const finished = completeRound(createRoundState(firstRound, horses, rng), rng)

    expect(advanceRound(finished, 60, rng)).toEqual(finished)
  })

  it('is reproducible from a seed', () => {
    expect(runInSlices(firstRound, 21, 0.1)).toEqual(runInSlices(firstRound, 21, 0.1))
  })

  it('gives the same result however the time is sliced', () => {
    const reference = getRoundResult(runInSlices(firstRound, 21, SIMULATION.step))

    // Roughly a 60 fps frame, a slow frame, and a long stall such as a background tab.
    for (const slice of [0.15, 0.4, 0.7, 30]) {
      expect(getRoundResult(runInSlices(firstRound, 21, slice))).toEqual(reference)
    }
  })

  it('takes longer over a longer distance', () => {
    const durations = programme.map((round) => runInSlices(round, 7, 1).elapsed)

    expect(durations).toEqual([...durations].sort((a, b) => a - b))
  })
})

describe('getRoundResult', () => {
  it('refuses to rank a round that is still running', () => {
    const state = createRoundState(firstRound, horses, createRng(3))

    expect(() => getRoundResult(state)).toThrow(/not finished/)
  })

  it('ranks all runners from 1 to 10 by finish time', () => {
    const result = getRoundResult(runInSlices(firstRound, 7, 1))
    const times = result.placings.map((placing) => placing.time)

    expect(result.roundNumber).toBe(firstRound.number)
    expect(result.distance).toBe(firstRound.distance)
    expect(result.placings.map((placing) => placing.position)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ])
    expect(times).toEqual([...times].sort((a, b) => a - b))
    expect(new Set(result.placings.map((placing) => placing.horseId))).toEqual(
      new Set(firstRound.runners.map((runner) => runner.horseId)),
    )
  })

  it('breaks an exact tie in favour of the lower lane', () => {
    const runner = { cruisingSpeed: 16, surge: 0, covered: 1200 }
    const state: RoundState = {
      roundNumber: 1,
      distance: 1200,
      elapsed: 80,
      pending: 0,
      runners: [
        { ...runner, horseId: 5, lane: 3, finishTime: 75 },
        { ...runner, horseId: 8, lane: 1, finishTime: 75 },
        { ...runner, horseId: 2, lane: 2, finishTime: 74 },
      ],
    }

    expect(getRoundResult(state).placings.map((placing) => placing.horseId)).toEqual([2, 8, 5])
  })

  it('produces plausible race times', () => {
    const [winner] = getRoundResult(runInSlices(firstRound, 7, 1)).placings

    // 1200 m at 15 to 17 m/s, allowing for form and surges.
    expect(winner?.time).toBeGreaterThan(60)
    expect(winner?.time).toBeLessThan(90)
  })
})

describe('the effect of condition', () => {
  const field: Horse[] = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((condition, index) => ({
    id: index + 1,
    name: `Horse ${index + 1}`,
    color: { name: `Colour ${index + 1}`, hex: '#000000' },
    condition,
  }))
  const round: Round = {
    number: 1,
    distance: 1600,
    runners: field.map((horse) => ({ horseId: horse.id, lane: horse.id })),
  }

  const races = 300
  const wins = new Map<number, number>()
  const positionTotals = new Map<number, number>()
  const rng = createRng(2026)

  for (let race = 0; race < races; race++) {
    const result = getRoundResult(completeRound(createRoundState(round, field, rng), rng))

    for (const placing of result.placings) {
      positionTotals.set(
        placing.horseId,
        (positionTotals.get(placing.horseId) ?? 0) + placing.position,
      )
      if (placing.position === 1) wins.set(placing.horseId, (wins.get(placing.horseId) ?? 0) + 1)
    }
  }

  const averagePosition = (horseId: number) => (positionTotals.get(horseId) ?? 0) / races
  const fittest = 10
  const weakest = 1

  it('makes the fittest horse the most frequent winner', () => {
    const mostWins = [...wins.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]

    expect(mostWins).toBe(fittest)
  })

  it('still leaves room for upsets', () => {
    expect(wins.get(fittest) ?? 0).toBeLessThan(races * 0.7)
    expect(wins.size).toBeGreaterThan(2)
  })

  it('places fitter horses better on average', () => {
    expect(averagePosition(fittest)).toBeLessThan(averagePosition(5))
    expect(averagePosition(5)).toBeLessThan(averagePosition(weakest))
  })
})
