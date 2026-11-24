import { describe, expect, it, vi } from 'vitest'
import { effectScope, ref } from 'vue'

import { useFrameLoop, type FrameScheduler } from './useFrameLoop'

/** A scheduler whose frames are fired by hand. */
function createManualScheduler() {
  let queued: ((timestamp: number) => void) | null = null
  let nextHandle = 1

  const scheduler: FrameScheduler = {
    request: vi.fn<FrameScheduler['request']>((callback) => {
      queued = callback
      return nextHandle++
    }),
    cancel: vi.fn<FrameScheduler['cancel']>(() => {
      queued = null
    }),
  }

  return {
    scheduler,
    hasQueuedFrame: () => queued !== null,
    fire(timestamp: number) {
      const callback = queued
      queued = null
      callback?.(timestamp)
    },
  }
}

function setup(initiallyActive: boolean, maxFrameMs?: number) {
  const manual = createManualScheduler()
  const active = ref(initiallyActive)
  const onFrame = vi.fn<(elapsedMs: number) => void>()
  const scope = effectScope()

  scope.run(() => useFrameLoop(onFrame, active, { scheduler: manual.scheduler, maxFrameMs }))

  return { ...manual, active, onFrame, scope }
}

describe('useFrameLoop', () => {
  it('does not request frames while inactive', () => {
    const { hasQueuedFrame, onFrame } = setup(false)

    expect(hasQueuedFrame()).toBe(false)
    expect(onFrame).not.toHaveBeenCalled()
  })

  it('reports the time elapsed between frames', () => {
    const { fire, onFrame } = setup(true)

    fire(1000)
    expect(onFrame).not.toHaveBeenCalled()

    fire(1016)
    fire(1049)

    expect(onFrame.mock.calls).toEqual([[16], [33]])
  })

  it('clamps a frame that arrives late', () => {
    const { fire, onFrame } = setup(true, 100)

    fire(0)
    fire(60_000)

    expect(onFrame).toHaveBeenCalledWith(100)
  })

  it('stops when deactivated and does not count the idle time on restart', () => {
    const { active, fire, hasQueuedFrame, onFrame, scheduler } = setup(true)

    fire(0)
    fire(16)
    active.value = false

    expect(scheduler.cancel).toHaveBeenCalledOnce()
    expect(hasQueuedFrame()).toBe(false)

    active.value = true
    fire(90_000)
    fire(90_016)

    expect(onFrame.mock.calls).toEqual([[16], [16]])
  })

  it('does not queue another frame when the callback deactivates the loop', () => {
    const { active, fire, hasQueuedFrame, onFrame } = setup(true)
    onFrame.mockImplementation(() => {
      active.value = false
    })

    fire(0)
    fire(16)

    expect(hasQueuedFrame()).toBe(false)
  })

  it('does not start twice', () => {
    const { active, scheduler } = setup(true)

    active.value = true

    expect(scheduler.request).toHaveBeenCalledOnce()
  })

  it('stops when its scope is disposed', () => {
    const { hasQueuedFrame, scope } = setup(true)

    scope.stop()

    expect(hasQueuedFrame()).toBe(false)
  })
})
