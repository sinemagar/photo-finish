import { ref } from 'vue'
import { defineStore } from 'pinia'

import { createRng, type Rng } from '@/domain'

export interface SessionOptions {
  /** Fixes every random decision of the session. Defaults to a clock-based seed. */
  seed?: number
  /** Playback speed multiplier; values above 1 make the meeting run faster. */
  speed?: number
}

const clockSeed = () => Date.now() >>> 0

/**
 * Session-wide settings and the single random source shared by the other stores.
 * Knowing the seed is enough to replay a whole session.
 */
export const useSessionStore = defineStore('session', () => {
  const seed = ref(clockSeed())
  const speed = ref(1)

  // The generator is deliberately kept out of reactive state: it is a stateful function.
  let rng = createRng(seed.value)

  function configure(options: SessionOptions = {}) {
    seed.value = options.seed ?? clockSeed()
    speed.value = options.speed !== undefined && options.speed > 0 ? options.speed : 1
    rng = createRng(seed.value)
  }

  /** Stable reference that always draws from the current generator. */
  const random: Rng = () => rng()

  return { seed, speed, configure, random }
})
