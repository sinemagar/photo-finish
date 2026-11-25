import { describe, expect, it } from 'vitest'

import { chooseRenderer, supportsWebGL } from './choice'

describe('chooseRenderer', () => {
  it('starts in 3D when the browser can draw it', () => {
    expect(chooseRenderer(undefined, { webgl: true, reducedMotion: false })).toBe('3d')
  })

  it('falls back to 2D without WebGL, whatever was asked for', () => {
    expect(chooseRenderer('3d', { webgl: false, reducedMotion: false })).toBe('2d')
    expect(chooseRenderer(undefined, { webgl: false, reducedMotion: false })).toBe('2d')
  })

  it('starts in 2D for players who asked for less motion', () => {
    expect(chooseRenderer(undefined, { webgl: true, reducedMotion: true })).toBe('2d')
  })

  it('honours an explicit request when the browser can draw it', () => {
    expect(chooseRenderer('2d', { webgl: true, reducedMotion: false })).toBe('2d')
    expect(chooseRenderer('3d', { webgl: true, reducedMotion: true })).toBe('3d')
  })
})

describe('supportsWebGL', () => {
  it('reports false where WebGL does not exist, as in the test environment', () => {
    expect(supportsWebGL()).toBe(false)
  })
})
