import type { Renderer, TrackRunner } from '@/stores/types'

/**
 * The contract between the game and the ways of drawing it.
 *
 * The meeting store turns the live round into a list of `TrackRunner`s; a renderer only
 * draws them. The 2D track (`renderers/2d`) and the 3D racecourse (`renderers/3d`) take the
 * same input, so either can be shown without the game knowing which.
 */
export type { Renderer, TrackRunner }

/** Props every renderer accepts. Each may add its own, such as a camera in 3D. */
export interface TrackRendererProps {
  runners: TrackRunner[]
  /** Distance of the round on the track, in metres. */
  distance?: number
}
