import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'

import { useMediaQuery } from './useMediaQuery'

/** A stand-in for `MediaQueryList` whose result can be changed by the test. */
function stubMatchMedia(initial: boolean) {
  const listeners = new Set<() => void>()
  const list = {
    matches: initial,
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
  }

  vi.stubGlobal('matchMedia', () => list)

  return {
    listeners,
    set(matches: boolean) {
      list.matches = matches
      listeners.forEach((listener) => listener())
    },
  }
}

describe('useMediaQuery', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('reports false where matchMedia does not exist', () => {
    expect(useMediaQuery('(max-width: 10px)').value).toBe(false)
  })

  it('starts with the current result of the query', () => {
    stubMatchMedia(true)

    expect(effectScope().run(() => useMediaQuery('(max-width: 10px)'))?.value).toBe(true)
  })

  it('follows changes and stops listening when its scope ends', () => {
    const media = stubMatchMedia(false)
    const scope = effectScope()
    const matches = scope.run(() => useMediaQuery('(max-width: 10px)'))

    media.set(true)
    expect(matches?.value).toBe(true)

    scope.stop()
    expect(media.listeners.size).toBe(0)
  })
})
