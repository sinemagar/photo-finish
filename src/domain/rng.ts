/** A source of pseudo-random numbers in the range [0, 1), like `Math.random`. */
export type Rng = () => number

/**
 * Creates a seeded generator (mulberry32). The same seed always yields the same sequence,
 * which makes every random decision in the game reproducible.
 */
export function createRng(seed: number): Rng {
  let state = seed >>> 0

  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Returns an integer between `min` and `max`, both inclusive. */
export function randomInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min
}

/** Returns a number in the range [min, max). */
export function randomFloat(rng: Rng, min: number, max: number): number {
  return rng() * (max - min) + min
}

/** Returns a shuffled copy of `items` (Fisher–Yates). The input is left untouched. */
export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const result = [...items]

  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(rng, 0, i)
    const current = result[i] as T
    result[i] = result[j] as T
    result[j] = current
  }

  return result
}

/** Picks `count` distinct items in random order. */
export function sample<T>(rng: Rng, items: readonly T[], count: number): T[] {
  if (count > items.length) {
    throw new RangeError(`Cannot sample ${count} items from a list of ${items.length}`)
  }

  return shuffle(rng, items).slice(0, count)
}
