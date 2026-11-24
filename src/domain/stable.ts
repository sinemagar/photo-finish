import { CONDITION_RANGE, HORSE_COLORS, HORSE_NAMES, STABLE_SIZE } from './config'
import { randomInt, shuffle, type Rng } from './rng'
import type { Horse, HorseColor } from './types'

/**
 * Creates the stable: every horse gets a unique name, a unique colour and a random condition.
 */
export function createStable(rng: Rng, size: number = STABLE_SIZE): Horse[] {
  if (size > HORSE_NAMES.length || size > HORSE_COLORS.length) {
    throw new RangeError(`A stable of ${size} needs as many unique names and colours`)
  }

  const colors = shuffle(rng, HORSE_COLORS)

  return HORSE_NAMES.slice(0, size).map((name, index) => ({
    id: index + 1,
    name,
    color: colors[index] as HorseColor,
    condition: randomInt(rng, CONDITION_RANGE.min, CONDITION_RANGE.max),
  }))
}
