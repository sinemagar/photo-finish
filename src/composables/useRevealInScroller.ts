import { nextTick, watch, type Ref, type WatchSource } from 'vue'

/** Finds the closest ancestor that actually scrolls its content vertically. */
function findScroller(element: HTMLElement): HTMLElement | null {
  let candidate = element.parentElement

  while (candidate && candidate !== document.body) {
    const { overflowY } = getComputedStyle(candidate)
    const scrolls = overflowY === 'auto' || overflowY === 'scroll'

    if (scrolls && candidate.scrollHeight > candidate.clientHeight) return candidate
    candidate = candidate.parentElement
  }

  return null
}

const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Whenever `source` changes, brings the element matching `selector()` inside `container`
 * to the top of its scrolling panel.
 *
 * Only a panel that scrolls on its own is moved. When the page itself is what scrolls, as
 * on a phone, nothing happens, so the reader is never pulled away from the track.
 */
export function useRevealInScroller(
  container: Readonly<Ref<HTMLElement | null>>,
  source: WatchSource,
  selector: () => string | null,
) {
  watch(source, async () => {
    await nextTick()

    const query = selector()
    const target = query ? container.value?.querySelector<HTMLElement>(query) : null
    const scroller = target ? findScroller(target) : null
    if (!target || !scroller) return

    const offset = target.getBoundingClientRect().top - scroller.getBoundingClientRect().top

    scroller.scrollTo({
      top: scroller.scrollTop + offset,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    })
  })
}
