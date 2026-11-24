import { CONDITION_RANGE, SIMULATION } from './config'
import { randomFloat, type Rng } from './rng'
import type { Horse, Placing, Round, RoundResult, RoundState, RunnerState } from './types'

/** Cruising speed for a given condition, before form is applied. */
export function baseSpeed(condition: number): number {
  const { min, max } = CONDITION_RANGE
  const fitness = (condition - min) / (max - min)

  return SIMULATION.minSpeed + (SIMULATION.maxSpeed - SIMULATION.minSpeed) * fitness
}

/**
 * Puts the runners of a round on the starting line and draws each one's form for the day.
 */
export function createRoundState(round: Round, horses: readonly Horse[], rng: Rng): RoundState {
  const horsesById = new Map(horses.map((horse) => [horse.id, horse]))

  const runners = round.runners.map((runner): RunnerState => {
    const horse = horsesById.get(runner.horseId)
    if (!horse) {
      throw new Error(`Round ${round.number} refers to unknown horse ${runner.horseId}`)
    }

    const form = 1 + randomFloat(rng, -SIMULATION.formSpread, SIMULATION.formSpread)

    return {
      ...runner,
      cruisingSpeed: baseSpeed(horse.condition) * form,
      surge: 0,
      covered: 0,
      finishTime: null,
    }
  })

  return { roundNumber: round.number, distance: round.distance, elapsed: 0, pending: 0, runners }
}

export function isRoundFinished(state: RoundState): boolean {
  return state.runners.every((runner) => runner.finishTime !== null)
}

/** Share of the round distance a runner has covered, from 0 to 1. */
/**
 * Share of the round distance a runner has covered, from 0 to 1.
 *
 * The simulation moves in fixed steps, so a screen frame can fall between two of them.
 * The time still waiting in `pending` is used to place a running horse where it would be
 * by now, which keeps its movement smooth. This only affects display: the result of the
 * round is decided by the steps alone.
 */
export function runnerProgress(state: RoundState, runner: RunnerState): number {
  if (runner.finishTime !== null) return 1

  const ahead = runner.cruisingSpeed * (1 + runner.surge) * state.pending
  return Math.min(runner.covered + ahead, state.distance) / state.distance
}

function stepRunner(runner: RunnerState, state: RoundState, rng: Rng): RunnerState {
  if (runner.finishTime !== null) return runner

  const { step, surgeDecay, surgeNoise } = SIMULATION
  const surge = runner.surge * surgeDecay + randomFloat(rng, -surgeNoise, surgeNoise)
  const speed = runner.cruisingSpeed * (1 + surge)
  const remaining = state.distance - runner.covered
  const travelled = speed * step

  if (travelled >= remaining) {
    // Interpolate inside the step so the finish time does not depend on the step size.
    return {
      ...runner,
      surge,
      covered: state.distance,
      finishTime: state.elapsed + remaining / speed,
    }
  }

  return { ...runner, surge, covered: runner.covered + travelled }
}

/**
 * Advances a round by `seconds` of race time and returns the new state.
 *
 * The simulation always moves in fixed steps; time that does not fill a whole step is kept
 * in `pending` for the next call. The outcome therefore depends only on the total time
 * supplied, not on how it was sliced into calls, which keeps it independent of frame rate.
 */
export function advanceRound(state: RoundState, seconds: number, rng: Rng): RoundState {
  const { step } = SIMULATION
  const available = state.pending + Math.max(0, seconds)
  // The tolerance stops rounding errors from swallowing a step that is due.
  const stepsDue = Math.floor(available / step + 1e-9)

  let next = state
  let stepsTaken = 0

  while (stepsTaken < stepsDue && !isRoundFinished(next)) {
    const current = next
    next = {
      ...current,
      runners: current.runners.map((runner) => stepRunner(runner, current, rng)),
      elapsed: current.elapsed + step,
    }
    stepsTaken++
  }

  const pending = isRoundFinished(next) ? 0 : Math.max(0, available - stepsTaken * step)

  return { ...next, pending }
}

/** Simulates a round from its current state to the end, without waiting on real time. */
export function completeRound(state: RoundState, rng: Rng): RoundState {
  let next = state

  while (!isRoundFinished(next)) {
    next = advanceRound(next, SIMULATION.step, rng)
  }

  return next
}

/**
 * Builds the result of a finished round. Runners are ordered by finish time; an exact tie
 * goes to the lower lane, so the order is always deterministic.
 */
export function getRoundResult(state: RoundState): RoundResult {
  if (!isRoundFinished(state)) {
    throw new Error(`Round ${state.roundNumber} has not finished yet`)
  }

  const placings = state.runners
    .flatMap(({ horseId, lane, finishTime }) =>
      finishTime === null ? [] : [{ horseId, lane, time: finishTime }],
    )
    .sort((a, b) => a.time - b.time || a.lane - b.lane)
    .map((entry, index): Placing => ({ position: index + 1, ...entry }))

  return { roundNumber: state.roundNumber, distance: state.distance, placings }
}
