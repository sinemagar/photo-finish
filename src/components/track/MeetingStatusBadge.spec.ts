import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import type { MeetingStatus } from '@/domain'

import MeetingStatusBadge from './MeetingStatusBadge.vue'

describe('MeetingStatusBadge', () => {
  it.each<[MeetingStatus, string]>([
    ['idle', 'No programme'],
    ['ready', 'Ready'],
    ['running', 'Racing'],
    ['paused', 'Paused'],
    ['intermission', 'Next round soon'],
    ['finished', 'Finished'],
  ])('describes "%s" as "%s" in words, not only in colour', (status, label) => {
    const wrapper = mount(MeetingStatusBadge, { props: { status } })

    expect(wrapper.text()).toBe(label)
    expect(wrapper.classes()).toContain(`status-badge--${status}`)
  })
})
