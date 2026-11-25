import type { Renderer, SessionOptions } from '@/stores/types'

const positiveNumber = (value: string | null): number | undefined => {
  if (value === null || value.trim() === '') return undefined

  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

const readRenderer = (value: string | null): Renderer | undefined =>
  value === '2d' || value === '3d' ? value : undefined

/**
 * Reads session options from a URL query string.
 *
 * - `seed`: fixes all randomness, which makes a session reproducible
 * - `speed`: playback speed multiplier, used by the browser tests to finish quickly
 * - `renderer`: `2d` or `3d`, to ask for one way of drawing the track
 */
export function readSessionOptions(search: string): SessionOptions {
  const params = new URLSearchParams(search)
  const seed = positiveNumber(params.get('seed'))

  return {
    seed: seed === undefined ? undefined : Math.floor(seed),
    speed: positiveNumber(params.get('speed')),
    renderer: readRenderer(params.get('renderer')),
  }
}
