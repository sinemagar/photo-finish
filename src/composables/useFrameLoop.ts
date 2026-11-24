import { onScopeDispose, toValue, watch, type MaybeRefOrGetter } from 'vue'

/** The part of the browser's animation-frame API the loop depends on. */
export interface FrameScheduler {
  request: (callback: (timestamp: number) => void) => number
  cancel: (handle: number) => void
}

export interface FrameLoopOptions {
  /**
   * Longest time a single frame may report, in milliseconds. A frame that arrives late,
   * for instance after the tab was in the background, is treated as this long at most.
   */
  maxFrameMs?: number
  /** Replaces `requestAnimationFrame`; used by tests to step frames by hand. */
  scheduler?: FrameScheduler
}

const browserScheduler: FrameScheduler = {
  request: (callback) => requestAnimationFrame(callback),
  cancel: (handle) => cancelAnimationFrame(handle),
}

/**
 * Calls `onFrame` once per animation frame with the milliseconds elapsed since the previous
 * frame, for as long as `active` is true. The loop stops by itself when the owning
 * component or effect scope is disposed.
 */
export function useFrameLoop(
  onFrame: (elapsedMs: number) => void,
  active: MaybeRefOrGetter<boolean>,
  { maxFrameMs = 100, scheduler = browserScheduler }: FrameLoopOptions = {},
) {
  let handle: number | null = null
  let previous: number | null = null

  function frame(timestamp: number) {
    handle = null
    const elapsed = previous === null ? null : Math.min(timestamp - previous, maxFrameMs)
    previous = timestamp

    if (elapsed !== null) onFrame(elapsed)

    // `onFrame` may have switched the loop off, or off and on again, in which case a frame
    // is already queued.
    if (toValue(active) && handle === null) {
      handle = scheduler.request(frame)
    }
  }

  function start() {
    if (handle !== null) return
    previous = null
    handle = scheduler.request(frame)
  }

  function stop() {
    if (handle === null) return
    scheduler.cancel(handle)
    handle = null
  }

  watch(
    () => toValue(active),
    (isActive) => (isActive ? start() : stop()),
    { immediate: true, flush: 'sync' },
  )

  onScopeDispose(stop)
}
