import { mount, type ComponentMountingOptions } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { Component } from 'vue'

import { useMeetingStore } from '@/stores/meeting'
import { useSessionStore, type SessionOptions } from '@/stores/session'
import { useStableStore } from '@/stores/stable'

/**
 * Mounts a component with real stores, a fixed seed and a ready stable, and returns the
 * stores so that a test can drive the meeting directly.
 */
export function mountWithStores<C extends Component>(
  component: C,
  session: SessionOptions = {},
  options: ComponentMountingOptions<C> = {},
) {
  const pinia = createPinia()
  setActivePinia(pinia)

  useSessionStore().configure({ seed: 1, speed: 40, ...session })
  const stable = useStableStore()
  stable.generate()
  const meeting = useMeetingStore()

  const wrapper = mount(component, {
    ...options,
    global: { ...options.global, plugins: [pinia] },
  } as ComponentMountingOptions<C>)

  return { wrapper, meeting, stable }
}

type MeetingStore = ReturnType<typeof useMeetingStore>

/** Ticks until the meeting leaves its current status. */
export function tickUntilStatusChanges(meeting: MeetingStore) {
  const status = meeting.status
  let frames = 0

  while (meeting.status === status) {
    meeting.tick(16)
    if (++frames > 100_000) throw new Error(`Meeting is stuck in "${status}"`)
  }
}

export function runWholeMeeting(meeting: MeetingStore) {
  meeting.generateProgramme()
  meeting.start()

  while (meeting.status !== 'finished') {
    tickUntilStatusChanges(meeting)
  }
}
