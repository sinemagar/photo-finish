import { ROUND_DISTANCES, RUNNERS_PER_ROUND } from './config'
import { sample, type Rng } from './rng'
import type { Horse, Round } from './types'

/**
 * Creates the race programme: one round per configured distance, each with a fresh random
 * selection of runners. Lanes are assigned in the order the runners are drawn.
 */
export function createProgramme(horses: readonly Horse[], rng: Rng): Round[] {
  if (horses.length < RUNNERS_PER_ROUND) {
    throw new RangeError(
      `A round needs ${RUNNERS_PER_ROUND} runners but the stable has ${horses.length}`,
    )
  }

  return ROUND_DISTANCES.map((distance, index) => ({
    number: index + 1,
    distance,
    runners: sample(rng, horses, RUNNERS_PER_ROUND).map((horse, laneIndex) => ({
      horseId: horse.id,
      lane: laneIndex + 1,
    })),
  }))
}
