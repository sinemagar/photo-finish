import { ref, watch, type WatchSource } from 'vue'

/**
 * Keeps track of which items of a list are expanded. Whenever `current` changes, that
 * item opens and the others close, so the list follows what is happening; in between the
 * user is free to open and close items by hand.
 */
export function useAutoExpand<Key>(current: WatchSource<Key | null>) {
  const expanded = ref(new Set<Key>())

  watch(
    current,
    (key) => {
      expanded.value = new Set(key === null ? [] : [key])
    },
    { immediate: true },
  )

  function isExpanded(key: Key): boolean {
    return (expanded.value as Set<Key>).has(key)
  }

  function toggle(key: Key) {
    const next = new Set(expanded.value as Set<Key>)
    if (!next.delete(key)) next.add(key)
    expanded.value = next
  }

  return { isExpanded, toggle }
}
