import { ref } from 'vue'
import { defineStore } from 'pinia'

import { createRng, type Rng } from '@/domain'
import type { Renderer } from '@/renderers/types'

export type { Renderer }

export interface SessionOptions {
  /** Fixes every random decision of the session. Defaults to a clock-based seed. */
  seed?: number
  /** Playback speed multiplier; values above 1 make the meeting run faster. */
  speed?: number
  /** How the track is drawn. Defaults to the 2D track. */
  renderer?: Renderer
}

const clockSeed = () => Date.now() >>> 0

/**
 * Session-wide settings and the single random source shared by the other stores.
 * Knowing the seed is enough to replay a whole session.
 */
export const useSessionStore = defineStore('session', () => {
  const seed = ref(clockSeed())
  const speed = ref(1)
  const renderer = ref<Renderer>('2d')

  // The generator is deliberately kept out of reactive state: it is a stateful function.
  let rng = createRng(seed.value)

  /** Changes the playback speed; a value that is not a positive number is ignored. */
  function setSpeed(value: number) {
    if (Number.isFinite(value) && value > 0) speed.value = value
  }

  function setRenderer(value: Renderer) {
    renderer.value = value
  }

  function configure(options: SessionOptions = {}) {
    seed.value = options.seed ?? clockSeed()
    speed.value = 1
    if (options.speed !== undefined) setSpeed(options.speed)
    renderer.value = options.renderer ?? '2d'
    rng = createRng(seed.value)
  }

  /** Stable reference that always draws from the current generator. */
  const random: Rng = () => rng()

  return { seed, speed, renderer, configure, setSpeed, setRenderer, random }
})
