import type { Horse } from '@/domain'

/**
 * The contract between the game and the ways of drawing it.
 *
 * The meeting store turns the live round into a list of `TrackRunner`s; a renderer only
 * draws them. The 2D track (`renderers/2d`) and the 3D racecourse (`renderers/3d`) take the
 * same input, so either can be shown without the game knowing which.
 */

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

/** Props every renderer accepts. Each may add its own, such as a camera in 3D. */
export interface TrackRendererProps {
  runners: TrackRunner[]
  /** Distance of the round on the track, in metres. */
  distance?: number
}

/** The available ways of drawing the track. */
export type Renderer = '2d' | '3d'
