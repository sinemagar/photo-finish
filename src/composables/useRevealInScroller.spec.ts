import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'

import { useRevealInScroller } from './useRevealInScroller'

const top = (value: number) => () => ({ top: value }) as DOMRect

/** Builds `scroller > container > item` and reports calls to the scroller's `scrollTo`. */
function setup({ scrollable }: { scrollable: boolean }) {
  const scroller = document.createElement('div')
  const container = document.createElement('div')
  const item = document.createElement('div')

  item.dataset.round = '2'
  container.append(item)
  scroller.append(container)
  document.body.append(scroller)

  scroller.style.overflowY = scrollable ? 'auto' : 'visible'
  Object.defineProperties(scroller, {
    scrollHeight: { value: 900 },
    clientHeight: { value: 300 },
    scrollTop: { value: 40 },
  })
  scroller.getBoundingClientRect = top(100)
  item.getBoundingClientRect = top(260)
  const scrollTo = vi.fn<(options: ScrollToOptions) => void>()
  scroller.scrollTo = scrollTo as typeof scroller.scrollTo

  const current = ref(1)
  const scope = effectScope()
  scope.run(() =>
    useRevealInScroller(ref(container), current, () => `[data-round="${current.value}"]`),
  )

  return { current, scrollTo, scope, scroller }
}

async function settle() {
  await nextTick()
  await nextTick()
}

describe('useRevealInScroller', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('scrolls the panel so that the matching element is at its top', async () => {
    const { current, scrollTo } = setup({ scrollable: true })

    current.value = 2
    await settle()

    // 40 already scrolled, plus the 160 px between the item and the top of the panel.
    expect(scrollTo).toHaveBeenCalledWith({ top: 200, behavior: 'smooth' })
  })

  it('does nothing until the source changes', async () => {
    const { scrollTo } = setup({ scrollable: true })

    await settle()

    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('does nothing when no element matches', async () => {
    const { current, scrollTo } = setup({ scrollable: true })

    current.value = 5
    await settle()

    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('leaves the page alone when the panel does not scroll by itself', async () => {
    const { current, scrollTo } = setup({ scrollable: false })

    current.value = 2
    await settle()

    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('jumps instead of gliding when reduced motion is requested', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    const { current, scrollTo } = setup({ scrollable: true })

    current.value = 2
    await settle()

    expect(scrollTo).toHaveBeenCalledWith({ top: 200, behavior: 'auto' })
    vi.unstubAllGlobals()
  })
})
