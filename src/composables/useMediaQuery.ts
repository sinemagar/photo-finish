import { onScopeDispose, readonly, ref, type Ref } from 'vue'

/**
 * Tracks whether a CSS media query currently matches. Where `matchMedia` is unavailable,
 * as in the unit-test environment, it reports `false`.
 */
export function useMediaQuery(query: string): Readonly<Ref<boolean>> {
  const matches = ref(false)

  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    const list = window.matchMedia(query)
    const update = () => {
      matches.value = list.matches
    }

    update()
    list.addEventListener('change', update)
    onScopeDispose(() => list.removeEventListener('change', update))
  }

  return readonly(matches)
}
