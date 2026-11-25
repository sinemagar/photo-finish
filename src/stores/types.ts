import type { Horse } from '@/domain'

/**
 * Types the stores hand to the rest of the application. They describe state and view
 * models, not rules: the rules and their types live in `@/domain`.
 */

/** The available ways of drawing the track. */
export type Renderer = '2d' | '3d'

/** Settings of a session, as read from the URL. */
export interface SessionOptions {
  /** Fixes every random decision of the session. Defaults to a clock-based seed. */
  seed?: number
  /** Playback speed multiplier; values above 1 make the meeting run faster. */
  speed?: number
  /** How the track is drawn. Defaults to the 2D track. */
  renderer?: Renderer
}

/** A runner as a renderer needs it: who it is, where it is and how it is doing. */
export interface TrackRunner {
  lane: number
  horse: Horse
  /** Share of the distance covered, from 0 to 1. */
  progress: number
  /** Finishing position, or null while the runner is still on its way. */
  position: number | null
  /** Current place in the field once the round is under way: live, then final. */
  rank: number | null
}
