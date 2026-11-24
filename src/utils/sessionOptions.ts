import type { SessionOptions } from '@/stores/session'

const positiveNumber = (value: string | null): number | undefined => {
  if (value === null || value.trim() === '') return undefined

  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

/**
 * Reads session options from a URL query string.
 *
 * - `seed`: fixes all randomness, which makes a session reproducible
 * - `speed`: playback speed multiplier, used by the browser tests to finish quickly
 */
export function readSessionOptions(search: string): SessionOptions {
  const params = new URLSearchParams(search)
  const seed = positiveNumber(params.get('seed'))

  return {
    seed: seed === undefined ? undefined : Math.floor(seed),
    speed: positiveNumber(params.get('speed')),
  }
}
