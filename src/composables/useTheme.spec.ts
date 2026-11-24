import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { THEME_STORAGE_KEY, readSavedTheme, useTheme } from './useTheme'

const prefersDark = (dark: boolean) =>
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: dark && query.includes('dark') }))

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.theme
  })

  afterEach(() => vi.unstubAllGlobals())

  it('follows the device setting when the player has not chosen', () => {
    prefersDark(true)
    expect(useTheme().theme.value).toBe('dark')

    prefersDark(false)
    expect(useTheme().theme.value).toBe('light')
  })

  it('prefers the theme the player chose before', () => {
    prefersDark(false)
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')

    expect(useTheme().theme.value).toBe('dark')
  })

  it('applies the theme to the document', () => {
    prefersDark(true)
    useTheme()

    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('switches theme, applies it and remembers the choice', async () => {
    prefersDark(false)
    const { theme, toggle } = useTheme()

    toggle()
    await nextTick()

    expect(theme.value).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })

  it('ignores a saved value it does not know', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'sepia')

    expect(readSavedTheme()).toBeNull()
  })

  it('still works when storage cannot be used', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    prefersDark(false)

    const { theme, toggle } = useTheme()
    toggle()

    expect(theme.value).toBe('dark')
    vi.restoreAllMocks()
  })
})
