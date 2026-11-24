import type { HorseColor } from './types'

export const STABLE_SIZE = 20
export const RUNNERS_PER_ROUND = 10

export const CONDITION_RANGE = { min: 1, max: 100 } as const

/** Round distances in metres, in running order. Its length defines the number of rounds. */
export const ROUND_DISTANCES = [1200, 1400, 1600, 1800, 2000, 2200] as const

/**
 * Coefficients of the race model. Speeds are in metres per second of race time.
 *
 * Condition moves a horse's speed across a 2 m/s band, while form can shift it by up to
 * 6% either way. The favourite therefore wins often, but an upset is always possible.
 */
export const SIMULATION = {
  /** Cruising speed of a horse with the lowest condition. */
  minSpeed: 15,
  /** Cruising speed of a horse with the highest condition. */
  maxSpeed: 17,
  /** Maximum deviation of the per-round form multiplier from 1. */
  formSpread: 0.06,
  /** Share of the current surge kept at each step; lower values calm surges faster. */
  surgeDecay: 0.98,
  /** Maximum change of the surge per step. */
  surgeNoise: 0.008,
  /** Fixed simulation step in seconds of race time. */
  step: 0.05,
} as const

export const HORSE_NAMES = [
  'Amber Comet',
  'Bold Meridian',
  'Copper Lantern',
  'Dusty Monarch',
  'Echo Valley',
  'Feather Storm',
  'Golden Harbour',
  'Hazel Thunder',
  'Iron Willow',
  'Jade Whisper',
  'Kestrel Song',
  'Lunar Drift',
  'Midnight Atlas',
  'Northern Ember',
  'Opal Runner',
  'Paper Tiger',
  'Quiet Riot',
  'Rustic Arrow',
  'Silver Maple',
  'Tidal Grace',
] as const

/** Twenty colours chosen to stay distinguishable from one another on the track. */
export const HORSE_COLORS: readonly HorseColor[] = [
  { name: 'Crimson', hex: '#dc2626' },
  { name: 'Orange', hex: '#ea580c' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Yellow', hex: '#fde047' },
  { name: 'Lime', hex: '#84cc16' },
  { name: 'Green', hex: '#16a34a' },
  { name: 'Mint', hex: '#6ee7b7' },
  { name: 'Teal', hex: '#0d9488' },
  { name: 'Cyan', hex: '#22d3ee' },
  { name: 'Sky', hex: '#0284c7' },
  { name: 'Navy', hex: '#1e3a8a' },
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Violet', hex: '#7c3aed' },
  { name: 'Lavender', hex: '#c4b5fd' },
  { name: 'Magenta', hex: '#c026d3' },
  { name: 'Pink', hex: '#f472b6' },
  { name: 'Maroon', hex: '#7f1d1d' },
  { name: 'Brown', hex: '#92400e' },
  { name: 'Slate', hex: '#475569' },
  { name: 'Ivory', hex: '#f5f5dc' },
]
