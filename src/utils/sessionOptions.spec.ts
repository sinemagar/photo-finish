import { describe, expect, it } from 'vitest'

import { readSessionOptions } from './sessionOptions'

describe('readSessionOptions', () => {
  it('returns no options for an empty query', () => {
    expect(readSessionOptions('')).toEqual({ seed: undefined, speed: undefined })
  })

  it('reads the seed and the speed', () => {
    expect(readSessionOptions('?seed=42&speed=20')).toEqual({ seed: 42, speed: 20 })
  })

  it('truncates a fractional seed and keeps a fractional speed', () => {
    expect(readSessionOptions('?seed=42.9&speed=0.5')).toEqual({ seed: 42, speed: 0.5 })
  })

  it.each(['?seed=abc&speed=fast', '?seed=-3&speed=0', '?seed=&speed=', '?seed=Infinity'])(
    'ignores invalid values in %s',
    (search) => {
      expect(readSessionOptions(search)).toEqual({ seed: undefined, speed: undefined })
    },
  )
})
