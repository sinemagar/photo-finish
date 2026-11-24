import { readonly, ref, watch } from 'vue'

export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'photo-finish:theme'

/** The theme saved by the player, if any. Storage can be unavailable, e.g. in private mode. */
export function readSavedTheme(): Theme | null {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    return saved === 'light' || saved === 'dark' ? saved : null
  } catch {
    return null
  }
}

function deviceTheme(): Theme {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

/**
 * The colour theme. It starts from the player's saved choice, or from the device setting
 * when there is none, and is applied as `data-theme` on the document element. The same
 * rule runs in a small script in `index.html` before the app loads, so the page never
 * flashes in the wrong theme.
 */
export function useTheme() {
  const theme = ref<Theme>(readSavedTheme() ?? deviceTheme())

  watch(
    theme,
    (value) => {
      document.documentElement.dataset.theme = value
    },
    { immediate: true },
  )

  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme.value)
    } catch {
      // The choice still applies for this visit.
    }
  }

  return { theme: readonly(theme), toggle }
}
