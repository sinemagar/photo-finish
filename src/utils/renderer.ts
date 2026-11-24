import type { Renderer } from '@/stores/session'

/** Whether this browser can draw the 3D track. */
export function supportsWebGL(): boolean {
  if (typeof window === 'undefined' || !('WebGL2RenderingContext' in window)) return false

  try {
    return document.createElement('canvas').getContext('webgl2') !== null
  } catch {
    return false
  }
}

/**
 * The renderer to start with: the one asked for in the URL if the browser can draw it,
 * otherwise 3D when the browser supports it and the player has not asked for less motion.
 */
export function chooseRenderer(
  requested: Renderer | undefined,
  { webgl, reducedMotion }: { webgl: boolean; reducedMotion: boolean },
): Renderer {
  if (!webgl) return '2d'
  if (requested) return requested
  return reducedMotion ? '2d' : '3d'
}
